// POST /api/clear-cache (protégé)
import { isAuthenticated, jsonResponse, errorResponse } from '../shared/utils.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    if (!isAuthenticated(request, env)) {
        return errorResponse("Non autorisé", 401);
    }

    // Note: Sur Cloudflare, difficile de vider tout le cache programmatiquement
    // Le cache expire naturellement après le TTL (180s)
    // Pour une vraie purge, utiliser l'API Cloudflare Purge

    return jsonResponse({
        success: true,
        message: "Cache invalidé (attendre TTL ou redéploiement)"
    });
}
