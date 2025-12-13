// ====================================================================
// API: Frontend Template Preview (Cache)
// ====================================================================
// POST /api/frontend/template/preview - Sauvegarder template en cache pour prévisualisation
// GET /api/frontend/template/preview - Récupérer template depuis le cache
// ====================================================================

import { isAuthenticated, jsonResponse, errorResponse } from '../../shared/utils.js';

// Clé pour le cache Cloudflare KV (ou Cache API)
const CACHE_KEY = 'frontend_template_preview';
const CACHE_TTL = 3600; // 1 heure

export async function onRequestPost(context) {
    const { request, env } = context;

    if (!isAuthenticated(request, env)) {
        return errorResponse("Non autorisé", 401);
    }

    try {
        const body = await request.json();
        const { html, metadata = {} } = body;

        if (!html) {
            return errorResponse("Le contenu HTML est requis", 400);
        }

        const templateData = {
            html,
            metadata,
            savedAt: new Date().toISOString(),
            version: '1.0'
        };

        // Sauvegarder dans Cloudflare KV si disponible
        if (env.FRONTEND_TEMPLATE_CACHE) {
            await env.FRONTEND_TEMPLATE_CACHE.put(
                CACHE_KEY,
                JSON.stringify(templateData),
                { expirationTtl: CACHE_TTL }
            );
        } else {
            // Fallback: utiliser Cache API
            const cache = caches.default;
            const cacheRequest = new Request(`https://cache.local/${CACHE_KEY}`);
            const cacheResponse = new Response(JSON.stringify(templateData), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': `public, max-age=${CACHE_TTL}`
                }
            });
            await cache.put(cacheRequest, cacheResponse);
        }

        return jsonResponse({
            success: true,
            message: "Template sauvegardé en cache pour prévisualisation",
            savedAt: templateData.savedAt
        });

    } catch (error) {
        console.error('Preview save error:', error);
        return errorResponse("Erreur lors de la sauvegarde", 500);
    }
}

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

        if (!templateData) {
            return errorResponse("Aucun template en cache", 404);
        }

        return jsonResponse({
            success: true,
            data: templateData
        });

    } catch (error) {
        console.error('Preview get error:', error);
        return errorResponse("Erreur lors de la récupération", 500);
    }
}

