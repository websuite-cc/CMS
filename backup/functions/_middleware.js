// ====================================================================
// MIDDLEWARE GLOBAL - Cloudflare Pages avec Proxy Webstudio
// ====================================================================
// Routing :
// - /api/*    → Functions locales (API)
// - /admin/*  → Dashboard admin local
// - /*        → Proxy vers Webstudio (frontend)
// ====================================================================

import { corsHeaders } from './shared/utils.js';

export async function onRequest(context) {
    const { request, next, env } = context;
    const url = new URL(request.url);

    // Gérer les requêtes OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    // Routes locales : /api/*, /admin/*, /core/*
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin/') || url.pathname.startsWith('/core/')) {
        // Si /api/* → continuer vers les handlers Functions
        if (url.pathname.startsWith('/api/')) {
            return next();
        }

        // Si /admin/* ou /core/* → servir les fichiers statiques locaux
        return env.ASSETS.fetch(request);
    }

    // ====================================================================
    // PROXY WEBSTUDIO - Frontend (seulement si WSTD_STAGING_URL définie)
    // ====================================================================
    // Toutes les autres routes → proxy vers Webstudio

    const WSTD_STAGING_URL = env.WSTD_STAGING_URL;

    // Si pas de WSTD_STAGING_URL, servir les fichiers locaux (pas de proxy)
    if (!WSTD_STAGING_URL) {
        return env.ASSETS.fetch(request);
    }

    try {
        // Construire l'URL Webstudio
        const webstudioUrl = new URL(url.pathname + url.search, WSTD_STAGING_URL);

        // Créer de nouveaux headers sans Referer/Origin du worker
        const proxyHeaders = new Headers(request.headers);
        proxyHeaders.delete('referer');
        proxyHeaders.delete('origin');
        proxyHeaders.set('host', new URL(WSTD_STAGING_URL).hostname);

        // Créer une nouvelle requête vers Webstudio
        const webstudioRequest = new Request(webstudioUrl, {
            method: request.method,
            headers: proxyHeaders,
            body: request.body,
            redirect: 'follow'
        });

        // Fetch depuis Webstudio
        const webstudioResponse = await fetch(webstudioRequest);

        // Créer de nouveaux headers avec CORS ajoutés
        const newHeaders = new Headers(webstudioResponse.headers);

        // Ajouter les headers CORS pour permettre le chargement cross-origin
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Key');

        // Content Security Policy : autoriser images de TOUTES sources
        newHeaders.set('Content-Security-Policy',
            "default-src 'self'; " +
            "img-src * data: blob: 'unsafe-inline'; " +  // Toutes les images OK
            "media-src * data: blob:; " +                 // Toutes les vidéos OK
            "font-src * data:; " +                        // Toutes les polices OK
            "style-src 'self' 'unsafe-inline' *; " +     // Tous les styles OK
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' *; " + // Scripts OK
            "connect-src *; " +                           // Fetch/XHR vers toutes sources
            "frame-src *;"                                // iframes OK
        );

        // Supprimer le CSP restrictif existant si présent
        newHeaders.delete('X-Content-Security-Policy');
        newHeaders.delete('X-WebKit-CSP');


        // Pour TOUS les types de contenu (HTML, images, CSS, JS, etc.)
        // Retourner avec headers CORS
        return new Response(webstudioResponse.body, {
            status: webstudioResponse.status,
            statusText: webstudioResponse.statusText,
            headers: newHeaders
        });

    } catch (error) {
        console.error('Erreur proxy Webstudio:', error);

        // Fallback : servir index.html local si erreur
        return env.ASSETS.fetch(new Request(url.origin + '/index.html'));
    }
}