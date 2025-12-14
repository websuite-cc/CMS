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
    // IMPORTANT : Cette vérification doit être AVANT toute autre logique
    
    // Route pour preview.html avec contenu dynamique
    // IMPORTANT : Cette route doit être AVANT la logique SSR
    if (url.pathname === '/preview.html' || url.pathname === '/preview/') {
        console.log(`[Preview Route] Intercepting preview.html request`);
        const slug = url.searchParams.get('slug');
        const path = url.searchParams.get('path') || '/';
        const isHtmx = request.headers.get('HX-Request') === 'true';
        
        // Si c'est une requête HTMX avec un path, générer le contenu dynamique
        if (isHtmx && path && slug) {
            console.log(`[Preview HTMX] Handling HTMX request for preview with slug: ${slug}, path: ${path}`);
            
            // Récupérer le template depuis le cache serveur (KV)
            const cacheKey = `frontend_template_${slug}`;
            let templateData = null;
            
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
            
            if (templateData && templateData.html) {
                const templateHtml = templateData.html;
                
                // Charger la config du site pour les métadonnées et données RSS
                let siteConfig = {};
                try {
                    const configUrl = new URL('/api/config', request.url);
                    const configRequest = new Request(configUrl.toString(), {
                        headers: { 'X-Auth-Key': request.headers.get('X-Auth-Key') || env.ADMIN_PASSWORD || 'admin' }
                    });
                    const configResponse = await fetch(configRequest);
                    if (configResponse.ok) {
                        siteConfig = await configResponse.json();
                    }
                } catch (e) {
                    console.error('Error loading config:', e);
                }
                
                // Gérer la racine "/"
                if (path === '/' || path === '/index.html') {
                    const siteName = siteConfig.siteName || "iziWebCMS";
                    const metadata = {
                        title: siteName,
                        description: siteConfig.seo?.metaDescription || "",
                        keywords: siteConfig.seo?.metaKeywords || "",
                        siteName: siteName
                    };
                    const content = generateHomeContent(templateHtml, metadata);
                    return htmlResponse(content + generateOOB(metadata, request));
                }
                
                // Utiliser handleHtmxCatchAll pour les autres routes
                const content = handleHtmxCatchAll(request, path, templateHtml, siteConfig);
                if (content) {
                    return content;
                }
            } else {
                // Template non trouvé dans le cache serveur
                return htmlResponse(`
                    <div class="p-8 text-center">
                        <h1 class="text-2xl font-bold mb-4">Template non trouvé</h1>
                        <p>Le template avec le slug <code>${slug}</code> n'a pas été trouvé dans le cache serveur.</p>
                        <p class="text-sm mt-2">Assurez-vous d'avoir sauvegardé le template depuis l'IDE.</p>
                    </div>
                `);
            }
        }
        
        // Sinon, servir preview.html normalement (chargement initial depuis localStorage)
        console.log(`[Preview Route] Serving preview.html static file`);
        
        // Essayer plusieurs méthodes pour charger le fichier
        // 1. Utiliser loadAsset qui gère mieux les redirections Cloudflare
        let previewContent = await loadAsset('/preview.html');
        
        if (!previewContent) {
            // 2. Essayer avec différents chemins
            const alternativePaths = ['preview.html', '/preview.html/', 'preview.html/'];
            for (const altPath of alternativePaths) {
                previewContent = await loadAsset(altPath);
                if (previewContent) {
                    console.log(`[Preview Route] Found preview.html at: ${altPath}`);
                    break;
                }
            }
        }
        
        // 3. Si toujours pas trouvé, essayer directement avec env.ASSETS.fetch
        if (!previewContent) {
            console.log(`[Preview Route] Trying direct ASSETS.fetch`);
            const directRequest = new Request(new URL('/preview.html', request.url), request);
            const directResponse = await env.ASSETS.fetch(directRequest);
            
            if (directResponse.status === 200) {
                previewContent = await directResponse.text();
                console.log(`[Preview Route] Found via direct ASSETS.fetch`);
            } else {
                // Suivre les redirections si nécessaire
                if (directResponse.status === 308 || directResponse.status === 301 || directResponse.status === 302) {
                    const location = directResponse.headers.get('Location');
                    if (location) {
                        const redirectUrl = location.startsWith('http') ? new URL(location) : new URL(location, request.url);
                        const redirectResponse = await env.ASSETS.fetch(new Request(redirectUrl.toString(), request));
                        if (redirectResponse.status === 200) {
                            previewContent = await redirectResponse.text();
                            console.log(`[Preview Route] Found via redirect: ${location}`);
                        }
                    }
                }
            }
        }
        
        if (previewContent) {
            return new Response(previewContent, {
                headers: {
                    'Content-Type': 'text/html; charset=utf-8'
                }
            });
        }
        
        // Si toujours pas trouvé, retourner une erreur explicite
        console.error(`[Preview Route] Failed to load preview.html from all methods`);
        return new Response(
            `preview.html not found. Please ensure the file exists at the root of the project and is committed to the repository.\n\n` +
            `The file should be at: /preview.html in your project root.`,
            { status: 404, headers: { 'Content-Type': 'text/plain' } }
        );
    }
    
    // Intercepter les requêtes HTMX depuis la prévisualisation API (ancien système)
    // Si c'est une requête HTMX et qu'elle vient de /api/admin/preview,
    // utiliser le template depuis le cache au lieu de frontend/index.html
    const isHtmx = request.headers.get('HX-Request') === 'true';
    const referer = request.headers.get('Referer');
    if (isHtmx && referer && referer.includes('/api/admin/preview')) {
        // Extraire le slug depuis le referer
        const refererUrl = new URL(referer);
        const previewSlug = refererUrl.searchParams.get('slug');
        
        if (previewSlug) {
            console.log(`[Preview HTMX] Handling HTMX request from API preview with slug: ${previewSlug}`);
            
            // Récupérer le template depuis le cache
            const cacheKey = `frontend_template_${previewSlug}`;
            let templateData = null;
            
            if (env.FRONTEND_TEMPLATE_CACHE) {
                const cached = await env.FRONTEND_TEMPLATE_CACHE.get(cacheKey);
                if (cached) {
                    templateData = JSON.parse(cached);
                }
            } else {
                const cache = caches.default;
                const cacheRequest = new Request(`https://cache.local/${cacheKey}`);
                const cachedResponse = await cache.match(cacheRequest);
                if (cachedResponse) {
                    templateData = await cachedResponse.json();
                }
            }
            
            if (templateData && templateData.html) {
                // Utiliser le template du cache comme base pour le SSR
                const templateHtml = templateData.html;
                
                // Utiliser handleHtmxCatchAll pour générer le contenu HTMX
                // avec le template du cache au lieu de frontend/index.html
                const content = handleHtmxCatchAll(request, url.pathname, templateHtml, {});
                if (content) {
                    return htmlResponse(content);
                }
            }
        }
    }
    
    // Route spéciale : /admin/dashboard/ide → servir admin/ide.html
    if (url.pathname === '/admin/dashboard/ide' || url.pathname === '/admin/dashboard/ide/') {
        console.log(`[IDE Route] Handling /admin/dashboard/ide request`);
        
        // Essayer plusieurs chemins possibles pour ide.html
        const idePaths = [
            '/admin/ide.html',
            '/admin/IDE.html',
            'admin/ide.html',
            'admin/IDE.html'
        ];
        
        for (const idePath of idePaths) {
            let ideUrl;
            if (idePath.startsWith('/')) {
                ideUrl = new URL(idePath, request.url);
            } else {
                ideUrl = new URL('/' + idePath, request.url);
            }
            
            const ideRequest = new Request(ideUrl.toString(), {
                method: 'GET',
                headers: request.headers
            });
            
            console.log(`[IDE Route] Trying to fetch: ${ideUrl.toString()}`);
            let ideResponse = await env.ASSETS.fetch(ideRequest);
            
            // Suivre les redirections si nécessaire
            let redirectCount = 0;
            while ((ideResponse.status === 308 || ideResponse.status === 301 || ideResponse.status === 302) && redirectCount < 5) {
                const location = ideResponse.headers.get('Location');
                if (location) {
                    const redirectUrl = location.startsWith('http') ? new URL(location) : new URL(location, request.url);
                    console.log(`[IDE Route] Following redirect to: ${redirectUrl.toString()}`);
                    ideResponse = await env.ASSETS.fetch(new Request(redirectUrl.toString(), {
                        method: 'GET',
                        headers: request.headers
                    }));
                    redirectCount++;
                } else {
                    break;
                }
            }
            
            if (ideResponse.status === 200) {
                console.log(`[IDE Route] ✓ Successfully loaded IDE from: ${idePath}`);
                return ideResponse;
            } else {
                console.log(`[IDE Route] ✗ Failed to load from ${idePath}, status: ${ideResponse.status}`);
            }
        }
        
        // Si aucun chemin n'a fonctionné, retourner une erreur explicite
        console.error(`[IDE Route] ERROR: Could not load IDE from any path. Tried: ${idePaths.join(', ')}`);
        return new Response(
            `IDE not found. Tried paths: ${idePaths.join(', ')}\n` +
            `Please ensure admin/ide.html exists in the project.`,
            { status: 404, headers: { 'Content-Type': 'text/plain' } }
        );
    }
    
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin/') || url.pathname.startsWith('/core/')) {
        // Si /api/* → continuer vers les handlers Functions
        if (url.pathname.startsWith('/api/')) {
            return next();
        }

        // Si /admin/* ou /core/* → servir les fichiers statiques locaux
        // Important : retourner directement la réponse, même si 404
        // Cela évite que ces routes passent par la logique SSR
        console.log(`[Admin/Core Route] Serving static asset: ${url.pathname}`);
        const assetResponse = await env.ASSETS.fetch(request);
        
        // Log pour débogage
        if (assetResponse.status !== 200) {
            console.log(`[Admin/Core Route] Asset fetch for ${url.pathname}: Status ${assetResponse.status}`);
        }
        
        return assetResponse;
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
        
        // Exclure preview.html de la logique SSR (déjà géré plus haut)
        if (url.pathname === '/preview.html' || url.pathname === '/preview/') {
            return env.ASSETS.fetch(request);
        }
        
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
        
        // Gérer la racine "/" - chercher le template "tpl-home" de manière générique
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
        
        // Utiliser handleHtmxCatchAll pour les requêtes HTMX (gère toutes les routes dynamiquement)
        const htmxCatchAll = handleHtmxCatchAll(request, path, template, siteConfig);
        if (htmxCatchAll) {
            return htmxCatchAll;
        }
        
        // Pour les requêtes non-HTMX, faire la même chose que handleHtmxCatchAll mais avec injection complète
        if (!isHtmx && path.length > 1 && 
            !path.startsWith('/api') && 
            !path.startsWith('/admin') && 
            !path.startsWith('/core') &&
            path !== '/' && 
            path !== '/index.html') {
            
            const slug = path.substring(1).replace(/\/$/, '');
            const tplId = `tpl-${slug}`;
            const tplContent = extractTemplate(template, tplId);
            
            if (tplContent) {
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
                
                // Requête normale : injecter dans le template complet
                return htmlResponse(injectContent(template, tplContent, metadata));
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