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

        // Si c'est du HTML, réécrire les URLs
        const contentType = webstudioResponse.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
            let html = await webstudioResponse.text();

            const webstudioDomain = new URL(WSTD_STAGING_URL).hostname;
            const workerDomain = url.hostname;

            // 1. Réécrire toutes les URLs absolues Webstudio
            html = html.replace(
                new RegExp(`https?://${webstudioDomain.replace(/\./g, '\\.')}`, 'g'),
                `https://${workerDomain}`
            );

            // 2. Réécrire les chemins relatifs dans src et href
            html = html.replace(
                /(\s(?:src|href)=["'])\/([^"']+)(["'])/gi,
                (match, prefix, path, suffix) => {
                    // Chemins spéciaux Webstudio (/cgi/, /assets/) → pointer vers Webstudio directement
                    if (path.startsWith('cgi/') || path.startsWith('assets/')) {
                        return `${prefix}${WSTD_STAGING_URL}/${path}${suffix}`;
                    }
                    // Chemins framework (_next/, _astro/) → garder relatifs pour proxy
                    if (path.startsWith('_next/') || path.startsWith('_astro/')) {
                        return match;
                    }
                    // Autres chemins → réécrire vers le worker
                    return `${prefix}https://${workerDomain}/${path}${suffix}`;
                }
            );

            // 3. Réécrire les srcset (format spécial avec virgules et descripteurs)
            // Format: srcset="/img1.jpg 480w, /img2.jpg 800w" OU srcset="/img.png 1x, /img@2x.png 2x"
            html = html.replace(
                /srcset=["']([^"']+)["']/gi,
                (match, srcsetContent) => {
                    // Séparer par virgule chaque entrée
                    const rewritten = srcsetContent
                        .split(',')
                        .map(part => {
                            const trimmed = part.trim();

                            // Format: "URL descripteur" où descripteur = "1x", "2x", "480w", etc.
                            // Utiliser regex pour séparer URL et descripteur
                            const urlMatch = trimmed.match(/^(\S+)(\s+.+)?$/);

                            if (!urlMatch) return trimmed;

                            const [, url, descriptor = ''] = urlMatch;

                            // Réécrire les chemins relatifs commençant par /
                            if (url.startsWith('/')) {
                                // Chemins spéciaux Webstudio (/cgi/, /assets/) → pointer vers Webstudio directement
                                if (url.startsWith('/cgi/') || url.startsWith('/assets/')) {
                                    const rewrittenUrl = `${WSTD_STAGING_URL}${url}`;
                                    return rewrittenUrl + descriptor;
                                }
                                // Chemins framework → garder relatifs
                                if (url.startsWith('/_next/') || url.startsWith('/_astro/')) {
                                    return trimmed;
                                }
                                // Autres chemins → réécrire vers le worker
                                const rewrittenUrl = `https://${workerDomain}${url}`;
                                return rewrittenUrl + descriptor;
                            }

                            return trimmed;
                        })
                        .join(', ');
                    return `srcset="${rewritten}"`;
                }
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