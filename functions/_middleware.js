// ====================================================================
// MIDDLEWARE GLOBAL - Cloudflare Pages avec Proxy Webstudio + SSR HTMX
// ====================================================================
// Routing :
// - /api/*    → Functions locales (API)
// - /admin/*  → Dashboard admin local
// - /*        → Proxy vers Webstudio OU SSR avec frontend/index.html
// ====================================================================

import { corsHeaders } from './shared/utils.js';
import {
    isHtmxRequest,
    htmlResponse,
    extractTemplate,
    injectContent,
    generateOOB,
    generateHomeContent,
    generatePublicationsContent,
    generateVideosContent,
    handleHtmxCatchAll
} from './shared/htmx-render.js';

export async function onRequest(context) {
    const { request, next, env } = context;
    const url = new URL(request.url);
    
    // Helper pour charger un fichier depuis les assets
    async function loadAsset(path) {
        try {
            // Construire l'URL complète en utilisant l'origin de la requête
            // Si path est relatif, utiliser l'origin de request.url
            let assetUrl;
            if (path.startsWith('/')) {
                // Chemin absolu : utiliser l'origin de la requête
                assetUrl = new URL(path, request.url);
            } else {
                // Chemin relatif : utiliser l'origin de la requête
                assetUrl = new URL('/' + path, request.url);
            }
            
            const assetRequest = new Request(assetUrl.toString(), {
                method: 'GET',
                headers: request.headers
            });
            
            let response = await env.ASSETS.fetch(assetRequest);
            
            // Suivre les redirections (308, 301, 302)
            let redirectCount = 0;
            while ((response.status === 308 || response.status === 301 || response.status === 302) && redirectCount < 5) {
                const location = response.headers.get('Location');
                if (location) {
                    // Construire l'URL de redirection (peut être relative ou absolue)
                    let redirectUrl;
                    if (location.startsWith('http://') || location.startsWith('https://')) {
                        redirectUrl = new URL(location);
                    } else {
                        // Si c'est une URL relative, utiliser l'origin de la requête originale
                        redirectUrl = new URL(location, request.url);
                    }
                    
                    // Créer une nouvelle requête pour la redirection
                    const redirectRequest = new Request(redirectUrl.toString(), {
                        method: 'GET',
                        headers: request.headers
                    });
                    
                    response = await env.ASSETS.fetch(redirectRequest);
                    redirectCount++;
                } else {
                    // Pas de header Location, peut-être que c'est une redirection vers le même chemin avec un slash
                    // Essayer d'ajouter un slash final si ce n'est pas déjà le cas
                    if (!path.endsWith('/')) {
                        const pathWithSlash = path + '/';
                        const retryUrl = new URL(pathWithSlash, request.url);
                        const retryRequest = new Request(retryUrl.toString(), {
                            method: 'GET',
                            headers: request.headers
                        });
                        response = await env.ASSETS.fetch(retryRequest);
                        redirectCount++;
                    } else {
                        break;
                    }
                }
            }
            
            if (response.status === 200) {
                return await response.text();
            }
            
            // Log pour débogage avec plus de détails
            console.log(`loadAsset failed for ${path}: Status ${response.status}`);
            if (response.status === 308) {
                const location = response.headers.get('Location');
                console.log(`  → Redirect Location: ${location}`);
            }
            return null;
        } catch (error) {
            console.error(`loadAsset error for ${path}:`, error);
            return null;
        }
    }

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
    // FRONTEND ROUTING - Priorité : Webstudio > SSR (frontend/index.html) > index.html racine
    // ====================================================================
    // Logique :
    // 1. Si WSTD_STAGING_URL défini → Proxy vers Webstudio
    // 2. Si WSTD_STAGING_URL non défini → SSR avec frontend/index.html comme template

    const WSTD_STAGING_URL = env.WSTD_STAGING_URL;

    // Si pas de WSTD_STAGING_URL, faire du SSR avec frontend/index.html
    if (!WSTD_STAGING_URL) {
        // IMPORTANT : Toujours charger frontend/index.html en priorité
        // Ne jamais servir directement index.html racine
        
        // Vérifier d'abord si c'est un asset statique (image, CSS, JS, etc.)
        // Si oui, servir directement sans SSR
        if (url.pathname.includes('.') && 
            !url.pathname.endsWith('.html') && 
            !url.pathname.startsWith('/frontend/')) {
            return env.ASSETS.fetch(request);
        }
        
        // Charger le template frontend/index.html (OBLIGATOIRE)
        // Ne jamais utiliser index.html racine comme fallback
        // Note: Cloudflare Pages peut rediriger (308), donc on suit les redirections
        let template = null;
        
        // Essayer plusieurs chemins possibles pour frontend/index.html
        // Note: Cloudflare Pages peut servir les fichiers différemment selon la configuration
        const possiblePaths = [
            '/frontend/index.html',
            '/frontend/index.html/',  // Avec slash final (peut être requis)
            'frontend/index.html',    // Sans slash initial (chemin relatif)
        ];
        
        for (const templatePath of possiblePaths) {
            template = await loadAsset(templatePath);
            if (template) {
                console.log(`✓ Template loaded successfully from: ${templatePath}`);
                break; // Template trouvé, sortir de la boucle
            } else {
                console.log(`✗ Failed to load from: ${templatePath}`);
            }
        }
        
        // Si aucun template trouvé après avoir essayé tous les chemins
        if (!template) {
            console.error('ERROR: frontend/index.html not found after trying all paths!');
            console.error('Tried paths:', possiblePaths);
            console.error('Current request URL:', request.url);
            console.error('Current pathname:', url.pathname);
            
            // Pour les routes HTML, retourner une erreur explicite avec plus de détails
            if (url.pathname === '/' || url.pathname.endsWith('.html') || !url.pathname.includes('.')) {
                return new Response(
                    `frontend/index.html not found.\n\n` +
                    `Tried paths: ${possiblePaths.join(', ')}\n` +
                    `Status 308 indicates a redirect - Cloudflare Pages may be redirecting the file.\n` +
                    `Please check:\n` +
                    `1. The file exists at /frontend/index.html in your repository\n` +
                    `2. Cloudflare Pages build settings include the frontend folder\n` +
                    `3. Check Cloudflare Pages logs for more details\n`,
                    { 
                        status: 500,
                        headers: { 'Content-Type': 'text/plain' }
                    }
                );
            }
            
            // Pour les assets statiques, servir normalement
            return env.ASSETS.fetch(request);
        }
        
        // Détecter si c'est une requête HTMX
        const isHtmx = isHtmxRequest(request);
        const path = url.pathname;
        
        // Configuration par défaut (peut être améliorée avec des variables d'env)
        const siteConfig = {
            site: { name: "iziWebCMS" },
            seo: {
                metaDescription: "",
                keywords: ""
            }
        };
        const siteName = siteConfig.site.name;
        const siteDescription = siteConfig.seo.metaDescription || "";
        const siteKeywords = siteConfig.seo.keywords || "";
        
        // Gérer la racine "/"
        if (path === '/' || path === '/index.html') {
            const metadata = {
                title: siteName,
                description: siteDescription,
                keywords: siteKeywords,
                siteName: siteName
            };
            const content = generateHomeContent(template, metadata);
            
            if (isHtmx) {
                return htmlResponse(content + generateOOB(metadata, request));
            }
            return htmlResponse(injectContent(template, content, metadata));
        }
        
        // Gérer les routes spéciales (annoucements, tutorials, etc.)
        if (path === '/annoucements' || path === '/publications') {
            // Pour l'instant, retourner juste le template (pas de données RSS)
            const tplContent = extractTemplate(template, 'tpl-annoucements');
            if (tplContent) {
                const metadata = {
                    title: `Announcements - ${siteName}`,
                    description: siteDescription,
                    keywords: siteKeywords
                };
                if (isHtmx) {
                    return htmlResponse(tplContent + generateOOB(metadata, request));
                }
                return htmlResponse(injectContent(template, tplContent, metadata));
            }
        }
        
        if (path === '/tutorials' || path === '/videos') {
            const tplContent = extractTemplate(template, 'tpl-tutorials');
            if (tplContent) {
                const metadata = {
                    title: `Video Tutorials - ${siteName}`,
                    description: siteDescription,
                    keywords: siteKeywords
                };
                if (isHtmx) {
                    return htmlResponse(tplContent + generateOOB(metadata, request));
                }
                return htmlResponse(injectContent(template, tplContent, metadata));
            }
        }
        
        // Catch-all pour les autres routes (serverless, get-started, etc.)
        // Fonctionne pour HTMX ET requêtes normales
        if (path.length > 1 && !path.startsWith('/api') && !path.startsWith('/admin') && !path.startsWith('/core')) {
            const slug = path.substring(1).replace(/\/$/, '');
            const tplId = `tpl-${slug}`;
            const tplContent = extractTemplate(template, tplId);
            
            if (tplContent) {
                // Template trouvé ! Générer les métadonnées
                const title = slug
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                
                const metadata = {
                    title: `${title} - ${siteName}`,
                    description: siteDescription,
                    keywords: siteKeywords,
                    siteName: siteName
                };
                
                if (isHtmx) {
                    // Requête HTMX : retourner juste le contenu + OOB
                    return htmlResponse(tplContent + generateOOB(metadata, request));
                } else {
                    // Requête normale : injecter dans le template complet
                    return htmlResponse(injectContent(template, tplContent, metadata));
                }
            }
        }
        
        // Si c'est une requête normale (pas HTMX) et qu'on a un template, 
        // injecter le contenu de la page d'accueil par défaut
        if (!isHtmx) {
            const metadata = {
                title: siteName,
                description: siteDescription,
                keywords: siteKeywords,
                siteName: siteName
            };
            // Injecter le contenu de la page d'accueil dans #main-content
            const homeContent = generateHomeContent(template, metadata);
            return htmlResponse(injectContent(template, homeContent, metadata));
        }
        
        // Fallback : servir les assets normaux (images, CSS, JS, etc.)
        // IMPORTANT : Ne JAMAIS servir index.html racine directement
        // Si c'est une route HTML, toujours utiliser le template avec SSR
        const isHtmlRoute = url.pathname === '/' || 
                           url.pathname.endsWith('.html') || 
                           (!url.pathname.includes('.') && url.pathname !== '/');
        
        if (isHtmlRoute) {
            // Route HTML : toujours utiliser le template avec SSR (jamais servir index.html racine directement)
            const metadata = {
                title: siteName,
                description: siteDescription,
                keywords: siteKeywords,
                siteName: siteName
            };
            const homeContent = generateHomeContent(template, metadata);
            return htmlResponse(injectContent(template, homeContent, metadata));
        }
        
        // Pour les autres assets (images, CSS, JS), servir normalement
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