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
    generatePostContent,
    generateVideoDetailContent,
    generateEventDetailContent,
    detectAndRenderContentRoute,
    handleHtmxCatchAll
} from './shared/htmx-render.js';

export async function onRequest(context) {
    const { request, next, env } = context;
    const url = new URL(request.url);
    
    
    // Helper simple pour charger le template frontend/index.html
    async function loadFrontendTemplate() {
        try {
            // Requête directe vers frontend/index.html
            const templateUrl = new URL('/frontend/index.html', request.url);
            const templateRequest = new Request(templateUrl.toString(), {
                method: 'GET',
                headers: request.headers
            });
            
            let response = await env.ASSETS.fetch(templateRequest);
            
            // Suivre les redirections si nécessaire
            if (response.status === 308 || response.status === 301 || response.status === 302) {
                const location = response.headers.get('Location');
                if (location) {
                    const redirectUrl = location.startsWith('http') 
                        ? new URL(location) 
                        : new URL(location, request.url);
                    response = await env.ASSETS.fetch(new Request(redirectUrl.toString(), {
                        method: 'GET',
                        headers: request.headers
                    }));
                }
            }
            
            if (response.status === 200) {
                return await response.text();
            }
            
            return null;
        } catch (error) {
            console.error('Error loading frontend template:', error);
            return null;
        }
    }
    
    // Helper pour charger d'autres assets (moins critique)
    async function loadAsset(path) {
        try {
            let assetUrl;
            if (path.startsWith('/')) {
                assetUrl = new URL(path, request.url);
            } else {
                assetUrl = new URL('/' + path, request.url);
            }
            
            const assetRequest = new Request(assetUrl.toString(), {
                method: 'GET',
                headers: request.headers
            });
            
            let response = await env.ASSETS.fetch(assetRequest);
            
            // Suivre les redirections
            let redirectCount = 0;
            while ((response.status === 308 || response.status === 301 || response.status === 302) && redirectCount < 5) {
                const location = response.headers.get('Location');
                if (location) {
                    const redirectUrl = location.startsWith('http') 
                        ? new URL(location) 
                        : new URL(location, request.url);
                    response = await env.ASSETS.fetch(new Request(redirectUrl.toString(), {
                        method: 'GET',
                        headers: request.headers
                    }));
                    redirectCount++;
                } else {
                    break;
                }
            }
            
            if (response.status === 200) {
                return await response.text();
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
    
    // Route pour preview/ avec contenu dynamique
    // IMPORTANT : Cette route doit être AVANT la logique SSR
    if (url.pathname.startsWith('/preview')) {
        console.log(`[Preview Route] Intercepting preview request`);
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
                    const siteName = siteConfig.siteName || "WebSuite";
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
                const content = await handleHtmxCatchAll(request, path, templateHtml, siteConfig, null, env);
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
        
        // Sinon, servir preview/index.html normalement (chargement initial depuis localStorage)
        return env.ASSETS.fetch(request);
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
                const content = await handleHtmxCatchAll(request, url.pathname, templateHtml, {}, null, env);
                if (content) {
                    return htmlResponse(content);
                }
            }
        }
    }
    
    // Route explicite pour /admin/ide.html (doit être AVANT la logique générale)
    // IMPORTANT: Cette route doit retourner un 404 explicite si le fichier n'existe pas,
    // pour éviter de servir index.html de la racine
    if (url.pathname === '/admin/ide.html' || url.pathname === '/admin/IDE.html' || 
        url.pathname.toLowerCase() === '/admin/ide.html') {
        // Essayer plusieurs chemins possibles
        // IMPORTANT: Le fichier est commité comme IDE.html (majuscules), donc essayer celui-ci en premier
        const idePaths = ['admin/IDE.html', '/admin/IDE.html', 'admin/ide.html', '/admin/ide.html'];
        
        for (const idePath of idePaths) {
            const ideUrl = new URL(idePath, request.url);
            const ideRequest = new Request(ideUrl.toString(), {
                method: 'GET',
                headers: request.headers
            });
            
            let ideResponse = await env.ASSETS.fetch(ideRequest);
            
            // Suivre les redirections si nécessaire
            let redirectCount = 0;
            while ((ideResponse.status === 308 || ideResponse.status === 301 || ideResponse.status === 302) && redirectCount < 5) {
                const location = ideResponse.headers.get('Location');
                if (location) {
                    const redirectUrl = location.startsWith('http') 
                        ? new URL(location) 
                        : new URL(location, request.url);
                    ideResponse = await env.ASSETS.fetch(new Request(redirectUrl.toString(), {
                        method: 'GET',
                        headers: request.headers
                    }));
                    redirectCount++;
                    console.log(`[IDE Route] Following redirect to: ${redirectUrl.toString()}`);
                } else {
                    break;
                }
            }
            
            // Vérifier que la réponse est vraiment le fichier IDE et pas un fallback
            if (ideResponse.status === 200) {
                // Vérifier d'abord le contenu HTML pour être sûr que c'est bien l'IDE
                try {
                    const responseText = await ideResponse.clone().text();
                    // Vérifier que c'est bien l'IDE (contient des éléments spécifiques)
                    if (responseText.includes('Monaco Editor') || 
                        responseText.includes('switchMode') || 
                        responseText.includes('WebSuite IDE') ||
                        responseText.includes('mode-htmx-btn')) {
                        console.log(`[IDE Route] Found ide.html at: ${idePath} (verified by content)`);
                        // Re-créer la réponse car on a utilisé clone().text()
                        return new Response(responseText, {
                            status: 200,
                            headers: {
                                'Content-Type': 'text/html; charset=utf-8',
                                'Cache-Control': 'no-cache'
                            }
                        });
                    }
                    // Si le contenu ne correspond pas, c'est probablement index.html
                    console.log(`[IDE Route] Response at ${idePath} doesn't contain IDE-specific content. Response URL: ${ideResponse.url}`);
                } catch (e) {
                    console.error(`[IDE Route] Error checking content for ${idePath}:`, e);
                    // Si on ne peut pas lire le contenu, vérifier au moins l'URL
                    const responseUrl = ideResponse.url || ideUrl.toString();
                    if (responseUrl.toLowerCase().includes('ide.html')) {
                        console.log(`[IDE Route] Found ide.html at: ${idePath} (by URL)`);
                        return ideResponse;
                    }
                }
            } else {
                console.log(`[IDE Route] Path ${idePath} returned status ${ideResponse.status}`);
            }
        }
        
        // Si aucun chemin ne fonctionne, retourner un 404 explicite
        // Ne pas continuer vers la logique générale qui pourrait servir index.html
        console.log(`[IDE Route] ide.html not found, returning 404`);
        return new Response(
            `404 - IDE file not found\n\n` +
            `The file admin/ide.html does not exist in the repository.\n` +
            `Please ensure the file exists at: admin/ide.html or admin/IDE.html\n\n` +
            `Note: On Cloudflare Pages, file names are case-sensitive. Make sure the file is committed to git.`,
            { 
                status: 404,
                statusText: 'Not Found',
                headers: { 
                    'Content-Type': 'text/plain',
                    'Cache-Control': 'no-cache',
                    'X-Content-Type-Options': 'nosniff'
                }
            }
        );
    }
    
    // Route spéciale : /admin/dashboard/ide → servir admin/ide.html
    if (url.pathname === '/admin/dashboard/ide' || 
        url.pathname === '/admin/dashboard/ide/' ||
        url.pathname.startsWith('/admin/dashboard/ide?')) {
        // Rediriger vers admin/ide.html
        const ideUrl = new URL('/admin/ide.html', request.url);
        const ideRequest = new Request(ideUrl.toString(), {
            method: 'GET',
            headers: request.headers
        });
        return env.ASSETS.fetch(ideRequest);
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
        
        // Essayer plusieurs chemins pour les fichiers admin
        let assetResponse = await env.ASSETS.fetch(request);
        
        // Si 404, essayer avec des variations de chemin
        if (assetResponse.status === 404) {
            const altPaths = [];
            
            // Générer les variations de chemin
            // 1. Sans slash initial (admin/ide.html au lieu de /admin/ide.html)
            if (url.pathname.startsWith('/admin/')) {
                altPaths.push(url.pathname.replace(/^\/admin\//, 'admin/'));
            }
            if (url.pathname.startsWith('/core/')) {
                altPaths.push(url.pathname.replace(/^\/core\//, 'core/'));
            }
            
            // 2. Avec slash final
            altPaths.push(url.pathname + '/');
            
            // 3. Sans extension .html (pour les fichiers HTML)
            if (url.pathname.endsWith('.html')) {
                const withoutExt = url.pathname.replace(/\.html$/, '');
                altPaths.push(withoutExt);
                if (withoutExt.startsWith('/admin/')) {
                    altPaths.push(withoutExt.replace(/^\/admin\//, 'admin/'));
                }
                if (withoutExt.startsWith('/core/')) {
                    altPaths.push(withoutExt.replace(/^\/core\//, 'core/'));
                }
            }
            
            // 4. Essayer aussi avec la casse inversée pour ide.html
            if (url.pathname.toLowerCase().includes('ide.html')) {
                const lowerPath = url.pathname.toLowerCase();
                altPaths.push(lowerPath);
                altPaths.push(lowerPath.replace(/^\/admin\//, 'admin/'));
            }
            
            for (const altPath of altPaths) {
                if (altPath === url.pathname) continue; // Déjà essayé
                
                const altUrl = new URL(altPath, request.url);
                const altRequest = new Request(altUrl.toString(), request);
                const testResponse = await env.ASSETS.fetch(altRequest);
                
                if (testResponse.status === 200) {
                    console.log(`[Admin/Core Route] Found asset at alternative path: ${altPath}`);
                    assetResponse = testResponse;
                    break;
                }
            }
        }
        
        // Suivre les redirections si nécessaire
        let redirectCount = 0;
        while ((assetResponse.status === 308 || assetResponse.status === 301 || assetResponse.status === 302) && redirectCount < 5) {
            const location = assetResponse.headers.get('Location');
            if (location) {
                const redirectUrl = location.startsWith('http') ? new URL(location) : new URL(location, request.url);
                assetResponse = await env.ASSETS.fetch(new Request(redirectUrl.toString(), request));
                redirectCount++;
            } else {
                break;
            }
        }
        
        // IMPORTANT : Si c'est un 404, retourner un vrai 404 explicite
        // Ne pas laisser Cloudflare Pages servir l'index racine par défaut
        if (assetResponse.status === 404) {
            console.log(`[Admin/Core Route] 404 - File not found: ${url.pathname}`);
            // Vérifier que la réponse n'est pas l'index racine
            const responseText = await assetResponse.clone().text().catch(() => '');
            if (responseText.includes('<!DOCTYPE html') || responseText.includes('<html')) {
                console.log(`[Admin/Core Route] WARNING: 404 response contains HTML, likely index.html root`);
            }
            return new Response(
                `404 - File not found: ${url.pathname}\n\n` +
                `The requested file does not exist in the admin or core directory.`,
                { 
                    status: 404,
                    statusText: 'Not Found',
                    headers: { 
                        'Content-Type': 'text/plain',
                        'Cache-Control': 'no-cache',
                        'X-Content-Type-Options': 'nosniff'
                    }
                }
            );
        }
        
        // Vérifier aussi si le contenu est l'index racine (même si status 200)
        // Cela peut arriver si Cloudflare Pages redirige vers index.html
        if (assetResponse.status === 200) {
            const contentType = assetResponse.headers.get('Content-Type');
            if (contentType && contentType.includes('text/html')) {
                const responseUrl = assetResponse.url || request.url;
                // Si l'URL de la réponse pointe vers index.html racine, c'est suspect
                if (responseUrl.includes('/index.html') && 
                    !responseUrl.includes('/admin/') && 
                    !responseUrl.includes('/core/') &&
                    !responseUrl.includes('/frontend/')) {
                    console.log(`[Admin/Core Route] WARNING: Response URL points to root index.html: ${responseUrl}`);
                    
                    // Pour /admin/ide.html, vérifier aussi le contenu pour être sûr
                    if (url.pathname.toLowerCase().includes('ide.html')) {
                        try {
                            const responseText = await assetResponse.clone().text();
                            // Si le contenu contient "WebSuite Platform" (titre de index.html racine), c'est le mauvais fichier
                            if (responseText.includes('WebSuite Platform') && !responseText.includes('Monaco Editor') && !responseText.includes('switchMode')) {
                                console.log(`[Admin/Core Route] Detected root index.html content for ide.html request`);
                                return new Response(
                                    `404 - IDE file not found\n\n` +
                                    `The file admin/ide.html does not exist. Cloudflare Pages is serving the root index.html instead.\n` +
                                    `Please ensure admin/IDE.html exists in your repository.`,
                                    { 
                                        status: 404,
                                        statusText: 'Not Found',
                                        headers: { 
                                            'Content-Type': 'text/plain',
                                            'Cache-Control': 'no-cache',
                                            'X-Content-Type-Options': 'nosniff'
                                        }
                                    }
                                );
                            }
                        } catch (e) {
                            console.error('Error checking response content:', e);
                        }
                    }
                    
                    // Retourner un 404 au lieu de servir l'index racine
                    return new Response(
                        `404 - File not found: ${url.pathname}\n\n` +
                        `The requested file does not exist in the admin or core directory.`,
                        { 
                            status: 404,
                            statusText: 'Not Found',
                            headers: { 
                                'Content-Type': 'text/plain',
                                'Cache-Control': 'no-cache',
                                'X-Content-Type-Options': 'nosniff'
                            }
                        }
                    );
                }
            }
        }
        
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
        
        // Exclure preview/ et admin/ de la logique SSR
        if (url.pathname.startsWith('/preview') || 
            url.pathname.startsWith('/admin') || 
            url.pathname.startsWith('/core')) {
            return env.ASSETS.fetch(request);
        }
        
        // Vérifier d'abord si c'est un asset statique (image, CSS, JS, etc.)
        if (url.pathname.includes('.') && 
            !url.pathname.endsWith('.html') && 
            !url.pathname.startsWith('/frontend/')) {
        return env.ASSETS.fetch(request);
    }

        // Charger le template frontend/index.html
        const template = await loadFrontendTemplate();
        
        if (!template) {
            console.error('ERROR: frontend/index.html not found');
            return new Response(
                `frontend/index.html not found. Please ensure the file exists at /frontend/index.html`,
                { 
                    status: 500,
                    headers: { 'Content-Type': 'text/plain' }
                }
            );
        }
        
        // Détecter si c'est une requête HTMX
        const isHtmx = isHtmxRequest(request);
        const path = url.pathname;
        
        // Charger la configuration depuis config.json (GitHub) ou utiliser les valeurs par défaut
        let siteConfig = {
            site: { name: "WebSuite" },
            seo: {
                metaDescription: "",
                keywords: ""
            }
        };
        
        // Essayer de charger config.json depuis GitHub
        try {
            const { readConfigFromGitHub } = await import('./shared/github-config.js');
            const githubConfig = await readConfigFromGitHub(env);
            if (githubConfig) {
                siteConfig = {
                    site: { 
                        name: githubConfig.siteName || "WebSuite" 
                    },
                    seo: {
                        metaDescription: githubConfig.seo?.metaDescription || "",
                        keywords: githubConfig.seo?.metaKeywords || ""
                    }
                };
            }
        } catch (e) {
            console.log('Could not load config.json, using defaults');
        }
        
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
        const htmxCatchAll = await handleHtmxCatchAll(request, path, template, siteConfig, null, env);
        if (htmxCatchAll) {
            // handleHtmxCatchAll retourne déjà un 404 si la page n'existe pas
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
            
            // Détection automatique des routes de contenu (générique)
            // Utilise la même logique que handleHtmxCatchAll mais pour les requêtes non-HTMX
            const contentResult = await detectAndRenderContentRoute(request, path, template, {
                site: { name: siteName },
                seo: {
                    metaDescription: siteDescription,
                    keywords: siteKeywords
                }
            });
            
            if (contentResult) {
                // Requête normale : injecter dans le template complet
                return htmlResponse(injectContent(template, contentResult.content, contentResult.metadata));
            }
            
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
            } else {
                // Template non trouvé : retourner un 404
                console.log(`[SSR] 404 - Template not found: ${tplId}`);
                const notFoundHtml = injectContent(template, `
                    <div class="p-8 text-center">
                        <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">404 - Page non trouvée</h1>
                        <p class="text-slate-600 dark:text-slate-400 mb-4">La page <code class="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">${path}</code> n'existe pas.</p>
                        <p class="text-sm text-slate-500">Créez un template avec l'ID <code class="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">${tplId}</code> dans votre fichier de template.</p>
                    </div>
                `, {
                    title: `404 - Page non trouvée - ${siteName}`,
                    description: siteDescription,
                    keywords: siteKeywords,
                    siteName: siteName
                });
                return new Response(notFoundHtml, {
                    status: 404,
                    statusText: 'Not Found',
                    headers: { 
                        'Content-Type': 'text/html; charset=utf-8',
                        'Cache-Control': 'no-cache'
                    }
                });
            }
        }
        
        // Si on arrive ici, c'est qu'aucune route n'a été trouvée
        // Pour les routes HTML non trouvées, retourner un 404
        const isHtmlRoute = url.pathname === '/' || 
                           url.pathname.endsWith('.html') || 
                           (!url.pathname.includes('.') && url.pathname !== '/');
        
        if (isHtmlRoute && path !== '/' && path !== '/index.html') {
            // Route HTML non trouvée : retourner un 404
            console.log(`[SSR] 404 - Route not found: ${path}`);
            const notFoundHtml = injectContent(template, `
                <div class="p-8 text-center">
                    <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">404 - Page non trouvée</h1>
                    <p class="text-slate-600 dark:text-slate-400 mb-4">La page <code class="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">${path}</code> n'existe pas.</p>
                    <a href="/" class="text-purple-600 dark:text-purple-400 hover:underline">Retour à l'accueil</a>
                </div>
            `, {
                title: `404 - Page non trouvée - ${siteName}`,
                description: siteDescription,
                keywords: siteKeywords,
                siteName: siteName
            });
            return new Response(notFoundHtml, {
                status: 404,
                statusText: 'Not Found',
                headers: { 
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'no-cache'
                }
            });
        }
        
        // Si c'est la racine ou index.html, servir la page d'accueil
        if (path === '/' || path === '/index.html') {
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
        // Mais vérifier que ce n'est pas l'index racine
        const assetResponse = await env.ASSETS.fetch(request);
        
        // Vérifier si la réponse est l'index racine (même avec status 200)
        if (assetResponse.status === 200) {
            const contentType = assetResponse.headers.get('Content-Type');
            const responseUrl = assetResponse.url || request.url;
            
            // Si c'est du HTML et que l'URL pointe vers index.html racine, c'est suspect
            if (contentType && contentType.includes('text/html')) {
                if (responseUrl.includes('/index.html') && 
                    !responseUrl.includes('/admin/') && 
                    !responseUrl.includes('/core/') &&
                    !responseUrl.includes('/frontend/') &&
                    path !== '/' && 
                    path !== '/index.html') {
                    // C'est probablement l'index racine servi par défaut pour un 404
                    console.log(`[SSR] 404 - Asset response is root index.html: ${path}`);
                    const notFoundHtml = injectContent(template, `
                        <div class="p-8 text-center">
                            <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">404 - Page non trouvée</h1>
                            <p class="text-slate-600 dark:text-slate-400 mb-4">La page <code class="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">${path}</code> n'existe pas.</p>
                            <a href="/" class="text-purple-600 dark:text-purple-400 hover:underline">Retour à l'accueil</a>
                        </div>
                    `, {
                        title: `404 - Page non trouvée - ${siteName}`,
                        description: siteDescription,
                        keywords: siteKeywords,
                        siteName: siteName
                    });
                    return new Response(notFoundHtml, {
                        status: 404,
                        statusText: 'Not Found',
                        headers: { 
                            'Content-Type': 'text/html; charset=utf-8',
                            'Cache-Control': 'no-cache'
                        }
                    });
                }
            }
        }
        
        // Si c'est un 404, retourner un vrai 404
        if (assetResponse.status === 404) {
            console.log(`[SSR] 404 - Asset not found: ${path}`);
            // Pour les routes HTML, retourner un 404 avec le template
            if (isHtmlRoute) {
                const notFoundHtml = injectContent(template, `
                    <div class="p-8 text-center">
                        <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">404 - Page non trouvée</h1>
                        <p class="text-slate-600 dark:text-slate-400 mb-4">La page <code class="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">${path}</code> n'existe pas.</p>
                        <a href="/" class="text-purple-600 dark:text-purple-400 hover:underline">Retour à l'accueil</a>
                    </div>
                `, {
                    title: `404 - Page non trouvée - ${siteName}`,
                    description: siteDescription,
                    keywords: siteKeywords,
                    siteName: siteName
                });
                return new Response(notFoundHtml, {
                    status: 404,
                    statusText: 'Not Found',
                    headers: { 
                        'Content-Type': 'text/html; charset=utf-8',
                        'Cache-Control': 'no-cache'
                    }
                });
            }
            // Pour les autres assets, retourner le 404 tel quel
            return assetResponse;
        }
        
        return assetResponse;
    }

    // Si WSTD_STAGING_URL est défini, proxy vers Webstudio
    if (WSTD_STAGING_URL) {
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
            // En cas d'erreur avec Webstudio, retourner une erreur plutôt que de servir index.html racine
            return new Response(
                `Webstudio proxy error: ${error.message}\n` +
                `Unable to proxy request to ${WSTD_STAGING_URL}`,
                { status: 502, headers: { 'Content-Type': 'text/plain' } }
            );
        }
    }
    
    // Si on arrive ici sans WSTD_STAGING_URL et sans avoir servi de réponse,
    // c'est qu'il y a un problème dans la logique de routing
    // Ne JAMAIS servir index.html racine comme fallback
    console.error('[Middleware] Routing error - no response served');
    return new Response(
        `Routing error: Unable to serve request for ${url.pathname}.\n` +
        `Please check the middleware routing logic.`,
        { status: 500, headers: { 'Content-Type': 'text/plain' } }
    );
}