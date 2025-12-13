// ====================================================================
// API: Frontend Preview Route
// ====================================================================
// GET /api/frontend/preview - Servir le template depuis le cache pour prévisualisation
// ====================================================================

import { isAuthenticated, errorResponse } from '../../shared/utils.js';

const CACHE_KEY = 'frontend_template_preview';

export async function onRequestGet(context) {
    const { request, env } = context;

    if (!isAuthenticated(request, env)) {
        return errorResponse("Non autorisé", 401);
    }

    try {
        let templateData = null;

        // Récupérer depuis Cloudflare KV si disponible
        if (env.FRONTEND_TEMPLATE_CACHE) {
            const cached = await env.FRONTEND_TEMPLATE_CACHE.get(CACHE_KEY);
            if (cached) {
                templateData = JSON.parse(cached);
            }
        } else {
            // Fallback: utiliser Cache API
            const cache = caches.default;
            const cacheRequest = new Request(`https://cache.local/${CACHE_KEY}`);
            const cachedResponse = await cache.match(cacheRequest);
            if (cachedResponse) {
                templateData = await cachedResponse.json();
            }
        }

        if (!templateData || !templateData.html) {
            return new Response(
                '<html><body><h1>Aucun template en cache</h1><p>Sauvegardez d\'abord un template depuis l\'IDE.</p></body></html>',
                {
                    status: 404,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                }
            );
        }

        // Retourner le HTML directement pour prévisualisation
        return new Response(templateData.html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'X-Preview-Version': templateData.version || '1.0',
                'X-Preview-Saved-At': templateData.savedAt || ''
            }
        });

    } catch (error) {
        console.error('Preview route error:', error);
        return errorResponse("Erreur lors de la récupération", 500);
    }
}

