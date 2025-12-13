// ====================================================================
// API: Frontend Template Deploy
// ====================================================================
// POST /api/frontend/template/deploy - Déployer template vers frontend/index.html
// ====================================================================

import { isAuthenticated, jsonResponse, errorResponse } from '../../../shared/utils.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    if (!isAuthenticated(request, env)) {
        return errorResponse("Non autorisé", 401);
    }

    try {
        const body = await request.json();
        const { html, deployToGitHub = false } = body;

        if (!html) {
            return errorResponse("Le contenu HTML est requis", 400);
        }

        // Option 1: Déployer via GitHub API (recommandé pour production)
        if (deployToGitHub) {
            const ghConfig = JSON.parse(env.GITHUB_CONFIG || '{}');
            
            if (!ghConfig.owner || !ghConfig.repo || !ghConfig.token) {
                return errorResponse("Configuration GitHub manquante", 400);
            }

            const path = 'frontend/index.html';
            const contentBase64 = btoa(unescape(encodeURIComponent(html)));
            const url = `https://api.github.com/repos/${ghConfig.owner}/${ghConfig.repo}/contents/${path}`;

            // Vérifier si le fichier existe pour obtenir le SHA
            let sha = null;
            try {
                const checkRes = await fetch(url, {
                    headers: {
                        'Authorization': `token ${ghConfig.token}`,
                        'Accept': 'application/vnd.github.v3+json'
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
                message: `Deploy frontend template - ${new Date().toISOString()}`,
                content: contentBase64,
                branch: ghConfig.branch || 'main'
            };
            if (sha) githubBody.sha = sha;

            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${ghConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(githubBody)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Erreur lors de la publication GitHub');
            }

            return jsonResponse({
                success: true,
                message: "Template déployé avec succès sur GitHub",
                path: path,
                deployedAt: new Date().toISOString()
            });
        }

        // Option 2: Sauvegarder localement (pour développement/test)
        // Note: Cloudflare Pages ne permet pas d'écrire directement dans les fichiers
        // Cette option sauvegarde dans KV pour référence
        if (env.FRONTEND_TEMPLATE_DEPLOY) {
            await env.FRONTEND_TEMPLATE_DEPLOY.put(
                'frontend/index.html',
                html,
                { expirationTtl: null } // Pas d'expiration pour les déploiements
            );
        }

        return jsonResponse({
            success: true,
            message: "Template sauvegardé (déploiement GitHub requis pour production)",
            note: "Pour déployer en production, utilisez deployToGitHub: true",
            savedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Deploy error:', error);
        return errorResponse(error.message || "Erreur lors du déploiement", 500);
    }
}

