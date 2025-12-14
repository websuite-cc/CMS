// ====================================================================
// GitHub Config Helper
// ====================================================================
// Fonctions utilitaires pour lire/écrire config.json depuis GitHub
// ====================================================================

/**
 * Récupère la configuration GitHub depuis les variables d'environnement
 */
export function getGitHubConfig(env) {
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
    
    return {
        owner: finalOwner,
        repo: finalRepo,
        token: finalToken,
        branch
    };
}

/**
 * Lit config.json depuis GitHub
 */
export async function readConfigFromGitHub(env) {
    const { owner, repo, token, branch } = getGitHubConfig(env);
    
    if (!owner || !repo || !token) {
        return null; // Pas de config GitHub disponible
    }
    
    try {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/config.json?ref=${branch}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'WebSuite'
            }
        });
        
        if (response.status === 404) {
            return null; // Fichier n'existe pas encore
        }
        
        if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.status}`);
        }
        
        const data = await response.json();
        const content = atob(data.content.replace(/\s/g, ''));
        return JSON.parse(content);
    } catch (error) {
        console.error('Error reading config.json from GitHub:', error);
        return null;
    }
}

/**
 * Écrit config.json sur GitHub
 */
export async function writeConfigToGitHub(env, config) {
    const { owner, repo, token, branch } = getGitHubConfig(env);
    
    if (!owner || !repo || !token) {
        throw new Error("Configuration GitHub manquante. Veuillez configurer GITHUB_USER, GITHUB_REPO et GITHUB_TOKEN dans les variables d'environnement.");
    }
    
    const path = 'config.json';
    const content = JSON.stringify(config, null, 2);
    const contentBase64 = btoa(unescape(encodeURIComponent(content)));
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    // Vérifier si le fichier existe pour obtenir le SHA
    let sha = null;
    try {
        const checkRes = await fetch(`${url}?ref=${branch}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
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
    
    // Écrire sur GitHub
    const githubBody = {
        message: `Update config.json - ${new Date().toISOString()}`,
        content: contentBase64,
        branch: branch
    };
    if (sha) githubBody.sha = sha;
    
    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'WebSuite'
        },
        body: JSON.stringify(githubBody)
    });
    
    if (!res.ok) {
        const error = await res.text();
        throw new Error(`GitHub API Error: ${res.status} - ${error}`);
    }
    
    return await res.json();
}

