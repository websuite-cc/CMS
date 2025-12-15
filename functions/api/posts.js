// GET /api/posts
import { jsonResponse, errorResponse, htmlResponse } from '../shared/utils.js';
import { getCachedRSSData } from '../shared/cache.js';
import { readConfigFromGitHub } from '../shared/github-config.js';
import { generatePostCards } from '../shared/htmx-render.js';

/**
 * Charge le template frontend/index.html depuis les assets
 * Utilise la même logique que le middleware
 */
async function loadFrontendTemplate(env, requestUrl) {
    try {
        const paths = ['/frontend/index.html', 'frontend/index.html'];
        
        for (const templatePath of paths) {
            try {
                // Créer une requête pour le template en utilisant l'URL de la requête originale
                const templateUrl = new URL(templatePath, requestUrl);
                const templateRequest = new Request(templateUrl.toString(), {
                    method: 'GET'
                });
                
                // Utiliser ASSETS.fetch pour récupérer le fichier
                let templateResponse = await env.ASSETS.fetch(templateRequest);
                
                // Suivre les redirections si nécessaire
                if (templateResponse.status === 308 || templateResponse.status === 301 || templateResponse.status === 302) {
                    const location = templateResponse.headers.get('Location');
                    if (location) {
                        const redirectUrl = location.startsWith('http') 
                            ? new URL(location) 
                            : new URL(location, requestUrl);
                        templateResponse = await env.ASSETS.fetch(new Request(redirectUrl.toString(), {
                            method: 'GET'
                        }));
                    }
                }
                
                if (templateResponse && templateResponse.ok) {
                    const html = await templateResponse.text();
                    if (html && html.includes('<template')) {
                        return html;
                    }
                }
            } catch (e) {
                // Continuer avec le prochain chemin
                continue;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error loading frontend template:', error);
        return null;
    }
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    // Vérifier si c'est une requête HTMX (Load More)
    const isHtmxRequest = request.headers.get('HX-Request') === 'true';
    
    // Charger l'URL depuis config.json ou utiliser les variables d'environnement
    let feedUrl = env.BLOG_FEED_URL;
    try {
        const config = await readConfigFromGitHub(env);
        if (config && config.blogRssUrl) {
            feedUrl = config.blogRssUrl;
        }
    } catch (e) {
        console.log('Could not load config.json, using env vars');
    }

    if (!feedUrl) {
        return jsonResponse([]);
    }

    try {
        const blogData = await getCachedRSSData(feedUrl);
        let posts = blogData.posts;
        
        // Si c'est une requête HTMX (Load More), retourner du HTML
        if (isHtmxRequest) {
            // Gérer la pagination avec offset et limit
            const offset = parseInt(url.searchParams.get('offset') || '0');
            const limit = parseInt(url.searchParams.get('limit') || '6');
            
            // Extraire les posts pour cette page
            const paginatedPosts = posts.slice(offset, offset + limit);
            
            if (paginatedPosts.length === 0) {
                return new Response('', { status: 204 }); // No Content
            }
            
            // Charger le template pour générer les cards
            const template = await loadFrontendTemplate(env, request.url);
            if (template) {
                const cardsHtml = generatePostCards(template, paginatedPosts);
                return htmlResponse(cardsHtml);
            } else {
                // Fallback si le template n'est pas trouvé
                return htmlResponse(paginatedPosts.map(post => 
                    `<div class="p-4 border rounded">${post.title}</div>`
                ).join(''));
            }
        }
        
        // Sinon, retourner du JSON (comportement normal)
        return jsonResponse(posts);
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}
