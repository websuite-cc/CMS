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

        // Créer une nouvelle requête vers Webstudio
        const webstudioRequest = new Request(webstudioUrl, {
            method: request.method,
            headers: request.headers,
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

        // Si c'est du HTML, réécrire les URLs
        const contentType = webstudioResponse.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
            let html = await webstudioResponse.text();

            // Remplacer les URLs Webstudio par l'URL du worker
            // Pour que les liens internes fonctionnent
            const webstudioDomain = new URL(WSTD_STAGING_URL).hostname;
            const workerDomain = url.hostname;

            html = html.replace(
                new RegExp(`https?://${webstudioDomain.replace(/\./g, '\\.')}`, 'g'),
                `https://${workerDomain}`
            );

            // Retourner le HTML modifié avec headers CORS
            return new Response(html, {
                status: webstudioResponse.status,
                statusText: webstudioResponse.statusText,
                headers: newHeaders
            });
        }

        // Pour les autres types de contenu (CSS, JS, images), passer avec headers CORS
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