// ====================================================================
// API: Agent Preview (Cache)
// ====================================================================
// POST /api/agents/preview - Sauvegarder agent en cache pour test
// GET /api/agents/preview?id=xxx - Récupérer agent depuis le cache
// ====================================================================

import { isAuthenticated, jsonResponse, errorResponse } from '../../shared/utils.js';

// Clé pour le cache Cloudflare KV (ou Cache API)
const CACHE_KEY_PREFIX = 'agent_';
const CACHE_TTL = 3600; // 1 heure

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

        const cacheKey = `${CACHE_KEY_PREFIX}${agentId}`;

        const agentData = {
            agentId,
            code,
            description: description || '',
            savedAt: new Date().toISOString(),
            version: '1.0'
        };

        // Sauvegarder dans Cloudflare KV si disponible
        if (env.FRONTEND_TEMPLATE_CACHE) {
            await env.FRONTEND_TEMPLATE_CACHE.put(
                cacheKey,
                JSON.stringify(agentData),
                { expirationTtl: CACHE_TTL }
            );
        } else {
            // Fallback: utiliser Cache API
            const cache = caches.default;
            const cacheRequest = new Request(`https://cache.local/${cacheKey}`);
            const cacheResponse = new Response(JSON.stringify(agentData), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': `public, max-age=${CACHE_TTL}`
                }
            });
            await cache.put(cacheRequest, cacheResponse);
        }

        return jsonResponse({
            success: true,
            message: "Agent sauvegardé en cache pour test",
            agentId,
            savedAt: agentData.savedAt
        });

    } catch (error) {
        console.error('Agent preview save error:', error);
        return errorResponse(`Erreur lors de la sauvegarde: ${error.message}`, 500);
    }
}

export async function onRequestGet(context) {
    const { request, env } = context;

    if (!isAuthenticated(request, env)) {
        return errorResponse("Non autorisé", 401);
    }

    try {
        const url = new URL(request.url);
        const agentId = url.searchParams.get('id');

        if (!agentId) {
            return errorResponse("Paramètre 'id' requis", 400);
        }

        const cacheKey = `${CACHE_KEY_PREFIX}${agentId}`;
        let agentData = null;

        // Récupérer depuis Cloudflare KV si disponible
        if (env.FRONTEND_TEMPLATE_CACHE) {
            const cached = await env.FRONTEND_TEMPLATE_CACHE.get(cacheKey);
            if (cached) {
                agentData = JSON.parse(cached);
            }
        } else {
            // Fallback: utiliser Cache API
            const cache = caches.default;
            const cacheRequest = new Request(`https://cache.local/${cacheKey}`);
            const cachedResponse = await cache.match(cacheRequest);
            if (cachedResponse) {
                agentData = await cachedResponse.json();
            }
        }

        if (!agentData) {
            return errorResponse("Aucun agent en cache", 404);
        }

        return jsonResponse({
            success: true,
            data: agentData
        });

    } catch (error) {
        console.error('Agent preview get error:', error);
        return errorResponse("Erreur lors de la récupération", 500);
    }
}

