// ====================================================================
// API: Agent Deploy
// ====================================================================
// POST /api/agents/deploy - Déployer agent vers GitHub (functions/agents/[id].js)
// ====================================================================

import { isAuthenticated, jsonResponse, errorResponse } from '../../shared/utils.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    if (!isAuthenticated(request, env)) {
        return errorResponse("Non autorisé", 401);
    }

    try {
        const body = await request.json();
        const { agentId, code, description } = body;

        if (!agentId || !code) {
            return errorResponse("agentId et code sont requis", 400);
        }

        // Utiliser les variables d'environnement séparées
        const owner = env.GITHUB_USER;
        const repo = env.GITHUB_REPO;
        const token = env.GITHUB_TOKEN;
        
        // Fallback: essayer aussi GITHUB_CONFIG si les variables séparées ne sont pas définies
        let ghConfig = null;
        if (!owner || !repo || !token) {
            try {
                ghConfig = JSON.parse(env.GITHUB_CONFIG || '{}');
            } catch (e) {
                console.error('Error parsing GITHUB_CONFIG:', e);
            }
        }
        
        const finalOwner = owner || ghConfig?.owner;
        const finalRepo = repo || ghConfig?.repo;
        const finalToken = token || ghConfig?.token;
        const branch = ghConfig?.branch || 'main';
        
        if (!finalOwner || !finalRepo || !finalToken) {
            return errorResponse("Configuration GitHub manquante. Veuillez configurer GITHUB_USER, GITHUB_REPO et GITHUB_TOKEN dans les variables d'environnement.", 400);
        }

        // Ajouter une description en commentaire si fournie
        let finalCode = code;
        if (description) {
            const comment = `/**
 * ${description}
 * Created: ${new Date().toISOString()}
 */

`;
            // Vérifier si le code a déjà des commentaires en haut
            if (!code.trim().startsWith('/**')) {
                finalCode = comment + code;
            }
        }

        const path = `functions/agents/${agentId}.js`;
        const contentBase64 = btoa(unescape(encodeURIComponent(finalCode)));
        const url = `https://api.github.com/repos/${finalOwner}/${finalRepo}/contents/${path}`;

        // Vérifier si le fichier existe pour obtenir le SHA
        let sha = null;
        try {
            const checkRes = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${finalToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'WebSuite'
                }
            });

            if (checkRes.ok) {
                const data = await checkRes.json();
                sha = data.sha;
            }
        } catch (e) {
            console.log('File does not exist, will create new');
        }

        // Publier sur GitHub
        const githubBody = {
            message: sha ? `Update agent ${agentId}` : `Create agent ${agentId}`,
            content: contentBase64,
            branch: branch
        };
        if (sha) githubBody.sha = sha;

        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${finalToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'WebSuite'
            },
            body: JSON.stringify(githubBody)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
            console.error('GitHub API Error:', res.status, errorData);
            throw new Error(errorData.message || `Erreur GitHub API: ${res.status}`);
        }

        const result = await res.json();

        return jsonResponse({
            success: true,
            message: "Agent déployé avec succès sur GitHub",
            agentId,
            path: result.content.path,
            sha: result.content.sha,
            deployedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Agent deploy error:', error);
        return errorResponse(error.message || "Erreur lors du déploiement", 500);
    }
}

