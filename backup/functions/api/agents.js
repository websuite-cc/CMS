
import { isAuthenticated, jsonResponse, errorResponse } from '../shared/utils.js';

export async function onRequestGet(context) {
    const { request, env } = context;

    if (!isAuthenticated(request, env)) {
        return errorResponse("Non autorisé", 401);
    }

    if (!env.GITHUB_TOKEN || !env.GITHUB_USER || !env.GITHUB_REPO) {
        return jsonResponse([]); // No config = no agents visible yet
    }

    try {
        // 1. Fetch file list from GitHub API
        const repo = `${env.GITHUB_USER}/${env.GITHUB_REPO}`;
        const path = 'functions/agents';
        const url = `https://api.github.com/repos/${repo}/contents/${path}`;

        const ghResponse = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
                'User-Agent': 'StackPagesCMS'
            }
        });

        if (ghResponse.status === 404) {
            // Directory doesn't exist yet (no agents)
            return jsonResponse([]);
        }

        if (!ghResponse.ok) {
            throw new Error(`GitHub API Error: ${ghResponse.status}`);
        }

        const files = await ghResponse.json();

        // 2. Filter .js files and map to Agent objects
        const agents = files
            .filter(f => f.name.endsWith('.js') && f.type === 'file')
            .map(f => {
                return {
                    id: f.name.replace('.js', ''),
                    name: f.name.replace('.js', '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), // Basic Pretty Name
                    status: 'active', // Assumed active if file exists
                    path: f.path,
                    sha: f.sha,
                    download_url: f.download_url
                    // Note: We can't easily get the CronJob status here without N+1 requests or storing mapping.
                    // For V1, we list files.
                };
            });

        return jsonResponse(agents);

    } catch (e) {
        console.error("Error listing agents:", e);
        return errorResponse("Erreur lors de la récupération des agents: " + e.message);
    }
}
