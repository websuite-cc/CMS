// ====================================================================
// API: Admin Preview Route (Simple avec slug)
// ====================================================================
// GET /api/admin/preview?slug=xxx - Afficher le template avec le slug
// ====================================================================

import { errorResponse } from '../../shared/utils.js';

const CACHE_KEY_PREFIX = 'frontend_template_';

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
        return errorResponse("Slug requis", 400);
    }

    try {
        let templateData = null;
        const cacheKey = `${CACHE_KEY_PREFIX}${slug}`;

        // Récupérer depuis Cloudflare KV si disponible
        if (env.FRONTEND_TEMPLATE_CACHE) {
            const cached = await env.FRONTEND_TEMPLATE_CACHE.get(cacheKey);
            if (cached) {
                templateData = JSON.parse(cached);
            }
        } else {
            // Fallback: utiliser Cache API
            const cache = caches.default;
            const cacheRequest = new Request(`https://cache.local/${cacheKey}`);
            const cachedResponse = await cache.match(cacheRequest);
            if (cachedResponse) {
                templateData = await cachedResponse.json();
            }
        }

        if (!templateData || !templateData.html) {
            return new Response(
                `<html><body><h1>Template non trouvé</h1><p>Aucun template trouvé pour le slug: ${slug}</p><p>Sauvegardez d'abord le template depuis l'IDE.</p></body></html>`,
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
                'X-Preview-Slug': slug,
                'X-Preview-Saved-At': templateData.savedAt || ''
            }
        });

    } catch (error) {
        console.error('Preview route error:', error);
        return errorResponse("Erreur lors de la récupération", 500);
    }
}

