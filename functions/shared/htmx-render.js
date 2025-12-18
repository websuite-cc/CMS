// ====================================================================
// HTMX & SSR RENDERING FUNCTIONS
// ====================================================================
// Fonctions pour le rendu Server-Side avec support HTMX
// Extrait de beta_worker.js pour modularité
// ====================================================================

/**
 * Détecte si la requête provient d'HTMX
 */
export function isHtmxRequest(request) {
    return request.headers.get("HX-Request") === "true";
}

/**
 * Crée une réponse HTML avec les headers appropriés
 */
export function htmlResponse(html) {
    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

/**
 * Extrait un template depuis le HTML complet
 * @param {string} html - HTML complet contenant les templates
 * @param {string} id - ID du template à extraire
 * @returns {string|null} - Contenu du template ou null si non trouvé
 */
export function extractTemplate(html, id) {
    if (!html) return "";
    // Regex to find <template id="id">content</template>
    // Note: This is a simple regex parser, assumes valid HTML structure.
    const regex = new RegExp(`<template[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/template>`, 'i');
    const match = html.match(regex);
    return match ? match[1].trim() : null;
}

/**
 * Remplace les placeholders {{variable}} dans un template
 * @param {string} template - Template avec placeholders
 * @param {object} data - Objet avec les valeurs à injecter
 * @returns {string} - Template avec placeholders remplacés
 */
export function replacePlaceholders(template, data) {
    if (!template) return "";
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : "";
    });
}

/**
 * Génère les cards HTML pour une liste de posts (pour Load More)
 * @param {string} fullTemplate - Template HTML complet
 * @param {Array} posts - Liste des posts
 * @returns {string} - HTML des cards
 */
export function generatePostCards(fullTemplate, posts) {
    // Cherche automatiquement le template de carte
    let cardTpl = extractTemplate(fullTemplate, 'tpl-blog-card') ||
                   extractTemplate(fullTemplate, 'tpl-post-card') ||
                   extractTemplate(fullTemplate, 'tpl-article-card');
    
    if (!cardTpl) {
        // Fallback si aucun template trouvé
        cardTpl = `
        <article class="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition">
            <a href="{{link}}" hx-get="{{link}}" hx-target="#main-content" hx-push-url="true" class="block h-48 overflow-hidden">
                <img src="{{image}}" alt="{{title}}" class="w-full h-full object-cover transform hover:scale-105 transition duration-500">
            </a>
            <div class="p-5">
                <div class="text-xs text-slate-500 mb-2">{{date}}</div>
                <h3 class="font-bold text-lg mb-2 leading-tight">
                    <a href="{{link}}" hx-get="{{link}}" hx-target="#main-content" hx-push-url="true" class="hover:text-blue-600 transition">
                        {{title}}
                    </a>
                </h3>
                <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{{description}}</p>
            </div>
        </article>`;
    }
    
    let cardsHtml = '';
    posts.forEach(post => {
        const postDate = new Date(post.pubDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
        cardsHtml += replacePlaceholders(cardTpl, {
            title: post.title,
            description: post.description ? post.description.substring(0, 120) + '...' : '',
            author: post.author || defaultAuthor,
            date: postDate,
            image: post.image || 'https://via.placeholder.com/600x400/edf2f7/4a5568?text=Image+Article',
            slug: post.slug,
            link: `/post/${post.slug}`
        });
    });
    
    return cardsHtml;
}

/**
 * Génère les cards HTML pour une liste de vidéos (pour Load More)
 * @param {string} fullTemplate - Template HTML complet
 * @param {Array} videos - Liste des vidéos
 * @returns {string} - HTML des cards
 */
export function generateVideoCards(fullTemplate, videos) {
    // Cherche automatiquement le template de carte
    let cardTpl = extractTemplate(fullTemplate, 'tpl-video-card') ||
                   extractTemplate(fullTemplate, 'tpl-videos-card');
    
    if (!cardTpl) {
        // Fallback si aucun template trouvé
        cardTpl = `
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden group">
            <div class="relative aspect-video">
                <img src="{{thumbnail}}" alt="{{title}}" class="w-full h-full object-cover">
                <a href="{{link}}" hx-get="{{link}}" hx-target="#main-content" hx-push-url="true" class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                        <i class="fas fa-play"></i>
                    </div>
                </a>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-sm mb-1 line-clamp-2">
                    <a href="{{link}}" hx-get="{{link}}" hx-target="#main-content" hx-push-url="true" class="hover:text-red-600 transition">
                        {{title}}
                    </a>
                </h3>
                <div class="text-xs text-slate-500">{{published}}</div>
            </div>
        </div>`;
    }
    
    let cardsHtml = '';
    videos.forEach(video => {
        const pubDate = new Date(video.published).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
        cardsHtml += replacePlaceholders(cardTpl, {
            title: video.title,
            thumbnail: video.thumbnail,
            published: pubDate,
            link: `/video/${video.id || video.link.split('v=')[1] || ''}`,
            slug: video.id || video.link.split('v=')[1] || ''
        });
    });
    
    return cardsHtml;
}

/**
 * Injecte le contenu et les métadonnées dans un template HTML complet
 * @param {string} template - Template HTML complet
 * @param {string} content - Contenu à injecter dans #main-content
 * @param {object} metadata - Métadonnées (title, description, keywords, siteName)
 * @returns {string} - HTML final avec contenu injecté
 */
export function injectContent(template, content, metadata) {
    if (!template) return content;

    let html = template;

    // 1. Inject Title
    if (metadata && metadata.title) {
        html = html.replace(/<title[^>]*>(.*?)<\/title>/i, `<title id="site-title">${metadata.title}</title>`);
    }

    // 2. Inject Meta Description
    if (metadata && metadata.description) {
        // Try to replace existing meta tag
        if (html.match(/<meta[^>]*name=["']description["'][^>]*>/i)) {
            html = html.replace(/(<meta[^>]*name=["']description["'][^>]*content=["'])(.*?)(["'][^>]*>)/i, `$1${metadata.description}$3`);
        } else {
            // Inject if missing (in head)
            html = html.replace(/<\/head>/i, `<meta name="description" id="meta-desc" content="${metadata.description}">\n</head>`);
        }
    }

    // 3. Inject Meta Keywords
    if (metadata && metadata.keywords) {
        if (html.match(/<meta[^>]*name=["']keywords["'][^>]*>/i)) {
            html = html.replace(/(<meta[^>]*name=["']keywords["'][^>]*content=["'])(.*?)(["'][^>]*>)/i, `$1${metadata.keywords}$3`);
        } else {
            html = html.replace(/<\/head>/i, `<meta name="keywords" id="meta-keywords" content="${metadata.keywords}">\n</head>`);
        }
    }

    // 4. Inject Site Name (Header & Footer)
    // We use a regex to be safe, but simple string replacement might work if IDs are unique
    if (metadata && metadata.siteName) {
        html = html.replace(/(<span[^>]*id=["']header-site-name["'][^>]*>)(.*?)(<\/span>)/i, `$1${metadata.siteName}$3`);
        html = html.replace(/(<span[^>]*id=["']footer-site-name-copyright["'][^>]*>)(.*?)(<\/span>)/i, `$1${metadata.siteName}$3`);
    }

    // 5. Inject Main Content
    const mainRegex = /(<main[^>]*id=["']main-content["'][^>]*>)([\s\S]*?)(<\/main>)/i;
    html = html.replace(mainRegex, `$1${content}$3`);

    return html;
}

/**
 * Génère le HTML pour les swaps Out-Of-Band HTMX (mise à jour SEO)
 * @param {object} metadata - Métadonnées (title, description, keywords)
 * @param {Request} request - Requête HTTP pour vérifier le target HTMX
 * @returns {string} - HTML avec attributs hx-swap-oob="true"
 */
export function generateOOB(metadata, request) {
    // Only update title/meta if we are targeting the main content
    // This prevents widgets (like latest articles on homepage) from overwriting the page title
    const hxTarget = request.headers.get("HX-Target");
    if (hxTarget && hxTarget !== "main-content") return "";

    const title = metadata.title || "WebSuite";
    const desc = metadata.description || "";
    const keywords = metadata.keywords || "";

    return `
    <title id="site-title" hx-swap-oob="true">${title}</title>
    <meta id="meta-desc" name="description" content="${desc}" hx-swap-oob="true">
    <meta id="meta-keywords" name="keywords" content="${keywords}" hx-swap-oob="true">
    `;
}

/**
 * Helper pour gérer les réponses HTMX vs JSON de manière uniforme
 * CATCH-ALL pour les endpoints API qui supportent HTMX
 * 
 * @param {Request} request - Requête HTTP
 * @param {Function} htmlGenerator - Fonction qui génère le HTML (reçoit les données)
 * @param {Function} jsonGenerator - Fonction qui génère le JSON (reçoit les données)
 * @param {*} data - Données à passer aux générateurs
 * @param {object} metadata - Métadonnées pour generateOOB (optionnel)
 * @returns {Response} - Réponse HTML si HTMX, JSON sinon
 */
export function htmxResponse(request, htmlGenerator, jsonGenerator, data, metadata = null) {
    const isHtmx = isHtmxRequest(request);
    
    if (isHtmx) {
        const html = htmlGenerator(data);
        const oob = metadata ? generateOOB(metadata, request) : "";
        return htmlResponse(html + oob);
    }
    
    // Fallback JSON
    const json = jsonGenerator(data);
    return new Response(JSON.stringify(json), {
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

/**
 * CATCH-ALL HTMX : Gère automatiquement les routes non définies pour HTMX
 * 
 * Cette fonction permet à HTMX de répondre même pour les routes qui ne sont pas
 * explicitement définies dans le worker. Elle cherche automatiquement un template
 * correspondant au chemin de la requête.
 * 
 * @param {Request} request - Requête HTTP
 * @param {string} path - Chemin de la requête (ex: "/ma-page")
 * @param {string} fullTemplate - Template HTML complet contenant les <template>
 * @param {object} siteConfig - Configuration du site (pour métadonnées)
 * @param {Function} fallbackHandler - Fonction de fallback si aucun template trouvé (optionnel)
 *                                     Si null, retourne une 404. Si fourni, appelle cette fonction.
 * @returns {Response|null} - Réponse HTML si HTMX et template trouvé, null sinon
 * 
 * @example
 * // Version simple (sans fallback GitHub) :
 * const htmxCatchAll = handleHtmxCatchAll(req, path, template, siteConfig);
 * if (htmxCatchAll) return htmxCatchAll;
 * 
 * @example
 * // Version avec fallback GitHub (optionnel) :
 * const htmxCatchAll = handleHtmxCatchAll(req, path, template, siteConfig, async (req, path, slug) => {
 *     const githubContent = await fetchGithubContent(config, slug);
 *     return githubContent ? htmlResponse(githubContent) : null;
 * });
 * if (htmxCatchAll) return htmxCatchAll;
 */
/**
 * Détecte automatiquement si une route correspond à une API de contenu et génère le contenu approprié
 * Système générique qui fonctionne avec n'importe quel nom de template
 * Ne nécessite pas de modification du middleware pour chaque nouveau type de contenu
 */
export async function detectAndRenderContentRoute(request, path, fullTemplate, siteConfig) {
    const slug = path.substring(1).replace(/\/$/, '');
    const siteName = siteConfig?.site?.name || "WebSuite";
    const siteDescription = siteConfig?.seo?.metaDescription || "";
    const siteKeywords = siteConfig?.seo?.keywords || "";
    
    // ====================================================================
    // DÉTECTION DES ROUTES DE DÉTAIL (item unique) - PRIORITAIRE
    // ====================================================================
    // Détecte automatiquement les patterns : /post/[slug], /video/[id], /podcast/[id]
    // Cette détection doit être AVANT la détection des routes de liste
    const detailPatterns = [
        {
            pattern: /^post\/(.+)$/,
            apiPath: (match) => `/api/post/${match[1]}`,
            generator: generatePostContent,
            type: 'post',
            notFoundMsg: 'Article non trouvé'
        },
        {
            pattern: /^video\/(.+)$/,
            apiPath: (match) => `/api/video/${match[1]}`,
            generator: generateVideoDetailContent,
            type: 'video',
            notFoundMsg: 'Vidéo non trouvée'
        },
        {
            pattern: /^podcast\/(.+)$/,
            apiPath: (match) => `/api/podcast/${match[1]}`,
            generator: null, // TODO: créer generatePodcastDetailContent si nécessaire
            type: 'podcast',
            notFoundMsg: 'Podcast non trouvé'
        },
        {
            pattern: /^event\/(.+)$/,
            apiPath: (match) => `/api/event/${match[1]}`,
            generator: generateEventDetailContent,
            type: 'event',
            notFoundMsg: 'Événement non trouvé'
        }
    ];
    
    for (const { pattern, apiPath, generator, type, notFoundMsg } of detailPatterns) {
        const match = slug.match(pattern);
        if (match && generator) {
            try {
                const apiUrl = new URL(apiPath(match), request.url);
                const response = await fetch(apiUrl.toString());
                
                if (response.ok) {
                    const item = await response.json();
                    // Passer siteConfig aux générateurs pour l'auteur par défaut
                    const content = type === 'post' 
                        ? generatePostContent(fullTemplate, item, path, siteConfig)
                        : type === 'video'
                        ? generateVideoDetailContent(fullTemplate, item, path)
                        : type === 'event'
                        ? generateEventDetailContent(fullTemplate, item, path)
                        : generator(fullTemplate, item, path);
                    
                    const metadata = {
                        title: `${item.title} - ${siteName}`,
                        description: item.description || siteDescription,
                        keywords: siteKeywords,
                        siteName: siteName
                    };
                    
                    return { content, metadata };
                } else if (response.status === 404) {
                    // Item non trouvé
                    return {
                        content: `<div class="p-8 text-center"><h1 class="text-2xl font-bold mb-4">${notFoundMsg}</h1><p>Le contenu demandé n'existe pas.</p></div>`,
                        metadata: {
                            title: `${notFoundMsg} - ${siteName}`,
                            description: siteDescription,
                            keywords: siteKeywords,
                            siteName: siteName
                        },
                        status: 404
                    };
                }
            } catch (error) {
                console.error(`Error loading ${type}:`, error);
                // En cas d'erreur, continuer pour essayer les autres patterns
            }
        }
    }
    
    // Si on arrive ici, aucune route de détail n'a été trouvée
    // Passer à la détection des routes de liste
    
    // ====================================================================
    // DÉTECTION DES ROUTES DE LISTE (collections)
    // ====================================================================
    // Détecter le type de contenu attendu en fonction du slug
    // STRICT : On n'utilise les APIs que si la route correspond explicitement à un type de contenu
    // Sinon, on retourne null pour laisser le catch-all gérer les pages statiques
    const slugLower = slug.toLowerCase();
    let contentType = null;
    
    // Routes explicites pour les vidéos
    if (slugLower === 'videos' || slugLower === 'tutorials' || slugLower === 'video' || slugLower === 'tutorial') {
        contentType = 'videos';
    }
    // Routes explicites pour les articles
    else if (slugLower === 'posts' || slugLower === 'articles' || slugLower === 'announcements' || 
             slugLower === 'publications' || slugLower === 'post' || slugLower === 'article' || 
             slugLower === 'announcement' || slugLower === 'publication') {
        contentType = 'posts';
    }
    // Routes explicites pour les podcasts
    else if (slugLower === 'podcasts' || slugLower === 'podcast') {
        contentType = 'podcasts';
    }
    // Routes explicites pour les événements
    else if (slugLower === 'events' || slugLower === 'event') {
        contentType = 'events';
    }
    
    // Si aucune route de contenu n'est détectée, retourner null pour laisser le catch-all gérer
    if (!contentType) {
        return null;
    }
    
    // On utilise SEULEMENT l'API correspondant au type détecté
    // Pas de test de toutes les APIs, on est strict
    const apiMap = {
        'posts': {
            api: '/api/posts',
            generator: generatePublicationsContent,
            title: 'Articles'
        },
        'videos': {
            api: '/api/videos',
            generator: generateVideosContent,
            title: 'Vidéos'
        },
        'podcasts': {
            api: '/api/podcasts',
            generator: null, // TODO: créer generatePodcastsContent si nécessaire
            title: 'Podcasts'
        },
        'events': {
            api: '/api/events',
            generator: generateEventsContent,
            title: 'Événements'
        }
    };
    
    // Récupérer la configuration de l'API pour le type détecté
    const apiConfig = apiMap[contentType];
    if (!apiConfig || !apiConfig.generator) {
        // Pas de générateur disponible pour ce type, retourner null
        return null;
    }
    
    // Appeler SEULEMENT l'API correspondante
    try {
        const apiUrl = new URL(apiConfig.api, request.url);
        const response = await fetch(apiUrl.toString());
        
        if (response.ok) {
            const items = await response.json();
            // Si l'API retourne un tableau (même vide), on génère le contenu
            if (Array.isArray(items)) {
                // Le générateur cherche automatiquement le bon template dans le HTML
                // Passer siteConfig pour l'auteur par défaut
                const content = contentType === 'posts'
                    ? generatePublicationsContent(fullTemplate, items, siteConfig)
                    : contentType === 'events'
                    ? generateEventsContent(fullTemplate, items)
                    : apiConfig.generator(fullTemplate, items, siteConfig);
                
                // Si le contenu généré contient encore {{items}}, c'est qu'aucun template n'a été trouvé
                // Dans ce cas, on retourne null pour laisser le catch-all gérer
                if (content && !content.includes('{{items}}')) {
                    const metadata = {
                        title: `${apiConfig.title} - ${siteName}`,
                        description: siteDescription,
                        keywords: siteKeywords,
                        siteName: siteName
                    };
                    
                    return { content, metadata };
                }
            }
        }
    } catch (error) {
        console.error(`Error loading ${contentType}:`, error);
        // En cas d'erreur, retourner null pour laisser le catch-all gérer
    }
    
    return null;
}

export async function handleHtmxCatchAll(request, path, fullTemplate, siteConfig = {}, fallbackHandler = null, env = null) {
    // Ne traite que les requêtes HTMX
    if (!isHtmxRequest(request)) {
        return null;
    }

    // Ignore les routes API, admin, core, etc.
    if (path.startsWith('/api/') || 
        path.startsWith('/admin') || 
        path.startsWith('/core/') ||
        path.startsWith('/dashboard')) {
        return null;
    }

    // Ignore la racine (déjà gérée ailleurs)
    if (path === '/' || path === '/index.html') {
        return null;
    }

    // Extraire le slug depuis le chemin
    const slug = path.substring(1).replace(/\/$/, '');
    
    // Détection automatique des routes de contenu (générique)
    const contentResult = await detectAndRenderContentRoute(request, path, fullTemplate, siteConfig);
    if (contentResult) {
        const oob = generateOOB(contentResult.metadata, request);
        return htmlResponse(contentResult.content + oob);
    }

    // Chercher le template correspondant pour les pages statiques
    const tplId = `tpl-${slug}`;
    const templateContent = extractTemplate(fullTemplate, tplId);

    if (templateContent) {
        // Template trouvé ! Générer les métadonnées
        const siteName = siteConfig?.site?.name || "WebSuite";
        const siteDescription = siteConfig?.seo?.metaDescription || "";
        const siteKeywords = siteConfig?.seo?.keywords || "";

        // Formater le titre : "ma-page" -> "Ma Page"
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

        // Retourner le contenu avec OOB pour SEO
        const oob = generateOOB(metadata, request);
        return htmlResponse(templateContent + oob);
    }

    // Aucun template trouvé : utiliser le fallback si fourni
    if (fallbackHandler) {
        const fallbackResult = fallbackHandler(request, path, slug);
        // Si le fallback retourne quelque chose, on l'utilise
        if (fallbackResult) {
            return fallbackResult;
        }
        // Sinon, on continue vers le 404 par défaut
    }

    // Par défaut : retourner une page 404 avec le bon status HTTP
    const notFoundHtml = `
        <div class="p-8 text-center">
            <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">404 - Page non trouvée</h1>
            <p class="text-slate-600 dark:text-slate-400 mb-4">Le template <code class="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">${tplId}</code> n'existe pas.</p>
            <p class="text-sm text-slate-500">Créez un template avec l'ID <code class="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">${tplId}</code> dans votre fichier de template.</p>
        </div>
    `;
    
    // Retourner un vrai 404 HTTP, même pour HTMX
    return new Response(notFoundHtml, {
        status: 404,
        statusText: 'Not Found',
        headers: { 
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache'
        }
    });
}

// ====================================================================
// CONTENT GENERATORS (USING TEMPLATES)
// ====================================================================

/**
 * Génère le contenu de la page d'accueil
 */
export function generateHomeContent(fullTemplate, metadata) {
    const tpl = extractTemplate(fullTemplate, 'tpl-home');
    if (!tpl) return "<p>Template 'tpl-home' not found.</p>";
    return tpl; // Static home content for now, or replace placeholders if needed
}

/**
 * Génère le contenu de la page des publications/articles
 */
export function generatePublicationsContent(fullTemplate, posts, siteConfig = {}) {
    const defaultAuthor = siteConfig?.author || siteConfig?.site?.author || 'Admin';
    // Cherche automatiquement un template de liste pour les articles
    // Essaie plusieurs noms possibles pour être générique
    let listTpl = extractTemplate(fullTemplate, 'tpl-announcements') || 
                   extractTemplate(fullTemplate, 'tpl-publications') ||
                   extractTemplate(fullTemplate, 'tpl-blog-list') ||
                   extractTemplate(fullTemplate, 'tpl-posts') ||
                   extractTemplate(fullTemplate, 'tpl-articles');
    
    // Cherche automatiquement un template de carte pour les articles
    let cardTpl = extractTemplate(fullTemplate, 'tpl-blog-card') ||
                   extractTemplate(fullTemplate, 'tpl-post-card') ||
                   extractTemplate(fullTemplate, 'tpl-article-card');

    // FALLBACKS for Modern/AI Themes
    if (!listTpl) {
        listTpl = '<div class="grid grid-cols-1 md:grid-cols-3 gap-8">{{items}}</div>';
    }
    if (!cardTpl) {
        cardTpl = `
        <article class="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition">
            <a href="{{link}}" hx-get="{{link}}" hx-target="#main-content" hx-push-url="true" class="block h-48 overflow-hidden">
                <img src="{{image}}" alt="{{title}}" class="w-full h-full object-cover transform hover:scale-105 transition duration-500">
            </a>
            <div class="p-5">
                <div class="text-xs text-slate-500 mb-2">{{date}}</div>
                <h3 class="font-bold text-lg mb-2 leading-tight">
                    <a href="{{link}}" hx-get="{{link}}" hx-target="#main-content" hx-push-url="true" class="hover:text-blue-600 transition">
                        {{title}}
                    </a>
                </h3>
                <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{{description}}</p>
            </div>
        </article>`;
    }

    // Envoyer TOUS les posts - le frontend gère l'affichage et la pagination
    let itemsHtml = '';
    if (posts.length === 0) {
        itemsHtml = `<p class="col-span-full text-center text-gray-600 p-8">Aucune publication trouvée.</p>`;
    } else {
        posts.forEach((post, index) => {
            const postDate = new Date(post.pubDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
            let cardHtml = replacePlaceholders(cardTpl, {
                title: post.title,
                description: post.description ? post.description.substring(0, 120) + '...' : '',
                author: post.author || defaultAuthor,
                date: postDate,
                image: post.image || 'https://via.placeholder.com/600x400/edf2f7/4a5568?text=Image+Article',
                slug: post.slug,
                link: `/post/${post.slug}`
            });
            
            // Ajouter une classe pour la pagination côté client (masquer après les 4 premiers)
            const itemClass = index >= 4 ? 'blog-item blog-item-hidden' : 'blog-item';
            // Ajouter la classe au premier élément (a, article, div, etc.)
            // Utiliser une approche qui détecte le premier tag, quel qu'il soit
            const firstTagMatch = cardHtml.match(/^<([a-zA-Z]+)([^>]*)>/);
            if (firstTagMatch) {
                const tag = firstTagMatch[1];
                const attrs = firstTagMatch[2];
                let newAttrs = attrs;
                
                if (attrs.includes('class=')) {
                    // Ajouter la classe à l'attribut class existant
                    newAttrs = attrs.replace(/class=["']([^"']*)["']/, `class="$1 ${itemClass}"`);
                } else {
                    // Ajouter un nouvel attribut class
                    newAttrs = attrs + ` class="${itemClass}"`;
                }
                
                cardHtml = cardHtml.replace(/^<([a-zA-Z]+)([^>]*)>/, `<${tag}${newAttrs}>`);
            }
            
            itemsHtml += cardHtml;
        });
    }

    let content = listTpl.replace('{{items}}', itemsHtml);
    return content;
}

/**
 * Génère le contenu de la page des vidéos
 */
export function generateVideosContent(fullTemplate, videos) {
    // Cherche automatiquement un template de liste pour les vidéos
    // Essaie plusieurs noms possibles pour être générique
    let listTpl = extractTemplate(fullTemplate, 'tpl-tutorials') || 
                   extractTemplate(fullTemplate, 'tpl-videos') ||
                   extractTemplate(fullTemplate, 'tpl-video-list');
    
    // Cherche automatiquement un template de carte pour les vidéos
    let cardTpl = extractTemplate(fullTemplate, 'tpl-video-card') ||
                   extractTemplate(fullTemplate, 'tpl-videos-card');

    // FALLBACKS
    if (!listTpl) {
        listTpl = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{{items}}</div>';
    }
    if (!cardTpl) {
        cardTpl = `
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden group">
            <div class="relative aspect-video">
                <img src="{{thumbnail}}" alt="{{title}}" class="w-full h-full object-cover">
                <a href="{{link}}" hx-get="{{link}}" hx-target="#main-content" hx-push-url="true" class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                        <i class="fas fa-play"></i>
                    </div>
                </a>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-sm mb-1 line-clamp-2">
                    <a href="{{link}}" hx-get="{{link}}" hx-target="#main-content" hx-push-url="true" class="hover:text-red-600 transition">
                        {{title}}
                    </a>
                </h3>
                <div class="text-xs text-slate-500">{{published}}</div>
            </div>
        </div>`;
    }

    // Envoyer TOUTES les vidéos - le frontend gère l'affichage et la pagination
    let itemsHtml = '';
    if (videos.length === 0) {
        itemsHtml = `<p class="col-span-full text-center text-gray-600 p-8">Aucune vidéo disponible.</p>`;
    } else {
        videos.forEach((video, index) => {
            const pubDate = new Date(video.published).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
            let cardHtml = replacePlaceholders(cardTpl, {
                title: video.title,
                thumbnail: video.thumbnail,
                published: pubDate,
                link: `/video/${video.id || video.link.split('v=')[1] || ''}`,
                slug: video.id || video.link.split('v=')[1] || ''
            });
            
            // Ajouter une classe pour la pagination côté client (masquer après les 4 premiers)
            const itemClass = index >= 4 ? 'video-item video-item-hidden' : 'video-item';
            // Ajouter la classe au premier élément (a, div, article, etc.)
            // Utiliser une approche qui détecte le premier tag, quel qu'il soit
            const firstTagMatch = cardHtml.match(/^<([a-zA-Z]+)([^>]*)>/);
            if (firstTagMatch) {
                const tag = firstTagMatch[1];
                const attrs = firstTagMatch[2];
                let newAttrs = attrs;
                
                if (attrs.includes('class=')) {
                    // Ajouter la classe à l'attribut class existant
                    newAttrs = attrs.replace(/class=["']([^"']*)["']/, `class="$1 ${itemClass}"`);
                } else {
                    // Ajouter un nouvel attribut class
                    newAttrs = attrs + ` class="${itemClass}"`;
                }
                
                cardHtml = cardHtml.replace(/^<([a-zA-Z]+)([^>]*)>/, `<${tag}${newAttrs}>`);
            }
            
            itemsHtml += cardHtml;
        });
    }

    let content = listTpl.replace('{{items}}', itemsHtml);
    return content;
}

/**
 * Génère le contenu de la page des événements
 */
export function generateEventsContent(fullTemplate, events) {
    // Cherche automatiquement un template de liste pour les événements
    let listTpl = extractTemplate(fullTemplate, 'tpl-events') || 
                   extractTemplate(fullTemplate, 'tpl-events-list');
    
    // Cherche automatiquement un template de carte pour les événements
    let cardTpl = extractTemplate(fullTemplate, 'tpl-event-card') ||
                   extractTemplate(fullTemplate, 'tpl-events-card');

    // FALLBACKS
    if (!listTpl) {
        listTpl = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{{items}}</div>';
    }
    if (!cardTpl) {
        cardTpl = `
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden group">
            <div class="relative aspect-video">
                <img src="{{image}}" alt="{{title}}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="w-full h-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center" style="display:none;">
                    <i class="fas fa-calendar-alt text-4xl text-purple-500 dark:text-purple-400"></i>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-sm mb-1 line-clamp-2">
                    <a href="/event/{{slug}}" hx-get="/event/{{slug}}" hx-target="#main-content" hx-push-url="true" class="hover:text-purple-600 transition">
                        {{title}}
                    </a>
                </h3>
                <div class="text-xs text-slate-500">{{date}}</div>
            </div>
        </div>`;
    }

    // Debug: Vérifier que les templates sont bien extraits
    if (!listTpl) {
        console.error('Warning: tpl-events template not found, using fallback');
    }
    if (!cardTpl) {
        console.error('Warning: tpl-event-card template not found, using fallback');
    }

    // Envoyer TOUS les événements - le frontend gère l'affichage et la pagination
    let itemsHtml = '';
    if (events.length === 0) {
        itemsHtml = `<p class="col-span-full text-center text-gray-600 dark:text-slate-400 p-8">Aucun événement disponible.</p>`;
    } else {
        events.forEach((event, index) => {
            const pubDate = new Date(event.pubDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
            let cardHtml = replacePlaceholders(cardTpl, {
                title: event.title,
                image: event.image || '',
                date: pubDate,
                location: event.location || '',
                fee: event.fee || '',
                link: `/event/${event.slug}`,
                slug: event.slug
            });
            
            // Masquer les éléments vides avec classe event-location
            if (!event.location || event.location.trim() === '') {
                cardHtml = cardHtml.replace(/<span class="event-location"[^>]*>[\s\S]*?<\/span>/g, '');
            } else {
                // Remplacer le placeholder location par la valeur réelle et afficher l'élément
                cardHtml = cardHtml.replace(/\{\{location\}\}/g, event.location);
                cardHtml = cardHtml.replace(/<span class="event-location"[^>]*style="display:none;"/g, 
                    '<span class="event-location"');
            }
            
            // Gérer l'image : si vide, masquer l'image et afficher le placeholder
            if (!event.image || event.image.trim() === '') {
                // Masquer l'image
                cardHtml = cardHtml.replace(/<img[^>]*class="[^"]*event-card-image[^"]*"[^>]*>/g, (match) => {
                    if (match.includes('style=')) {
                        return match.replace(/style="[^"]*"/, 'style="display:none;"');
                    } else {
                        return match.replace(/>/, ' style="display:none;">');
                    }
                });
                // Afficher le placeholder - remplacer style="display:none;" par style="display:flex;"
                cardHtml = cardHtml.replace(/<div[^>]*class="[^"]*event-card-placeholder[^"]*"[^>]*style="display:none;"/g, 
                    (match) => match.replace('style="display:none;"', 'style="display:flex;"'));
            } else {
                // Si l'image existe, s'assurer que le placeholder est masqué
                cardHtml = cardHtml.replace(/<div[^>]*class="[^"]*event-card-placeholder[^"]*"[^>]*>/g, 
                    (match) => {
                        if (!match.includes('style=')) {
                            return match.replace(/>/, ' style="display:none;">');
                        } else if (!match.includes('display:flex')) {
                            return match.replace(/style="[^"]*"/, 'style="display:none;"');
                        }
                        return match;
                    });
            }
            
            // Ajouter une classe pour la pagination côté client (masquer après les 4 premiers)
            const itemClass = index >= 4 ? 'event-item event-item-hidden' : 'event-item';
            // Ajouter la classe au premier élément (a, div, article, etc.)
            const firstTagMatch = cardHtml.match(/^<([a-zA-Z]+)([^>]*)>/);
            if (firstTagMatch) {
                const tag = firstTagMatch[1];
                const attrs = firstTagMatch[2];
                let newAttrs = attrs;
                
                if (attrs.includes('class=')) {
                    // Ajouter la classe à l'attribut class existant
                    newAttrs = attrs.replace(/class=["']([^"']*)["']/, `class="$1 ${itemClass}"`);
                } else {
                    // Ajouter un nouvel attribut class
                    newAttrs = attrs + ` class="${itemClass}"`;
                }
                
                cardHtml = cardHtml.replace(/^<([a-zA-Z]+)([^>]*)>/, `<${tag}${newAttrs}>`);
            }
            
            itemsHtml += cardHtml;
        });
    }

    // Remplacer le placeholder {{items}} dans le template de liste
    if (!listTpl) {
        console.error('Error: listTpl is null or undefined in generateEventsContent');
        return '<div class="p-8 text-center"><p class="text-red-500">Error: Events template not found</p></div>';
    }
    
    let content = listTpl.replace('{{items}}', itemsHtml);
    
    // Vérifier que le remplacement a fonctionné - utiliser replace global si nécessaire
    if (content.includes('{{items}}')) {
        console.error('Error: {{items}} placeholder was not replaced. Trying with global replace.');
        content = listTpl.replace(/\{\{items\}\}/g, itemsHtml);
    }
    
    return content;
}

/**
 * Génère le contenu de la page de contact
 */
export function generateContactContent(fullTemplate) {
    const tpl = extractTemplate(fullTemplate, 'tpl-contact');
    if (!tpl) return "<p>Template 'tpl-contact' not found.</p>";
    return tpl;
}

/**
 * Génère le contenu de la page de coaching
 */
export function generateCoachingContent(fullTemplate) {
    const tpl = extractTemplate(fullTemplate, 'tpl-coaching');
    if (!tpl) return "<p>Template 'tpl-coaching' not found.</p>";
    return tpl;
}

/**
 * Génère le contenu de la page bio
 */
export function generateBioContent(fullTemplate) {
    const bioTpl = extractTemplate(fullTemplate, 'tpl-bio');
    if (!bioTpl) return "<p>Template 'tpl-bio' not found.</p>";
    return bioTpl;
}

/**
 * Génère le contenu de détail d'une vidéo
 */
export function generateVideoDetailContent(fullTemplate, video, currentUrl = '') {
    const detailTpl = extractTemplate(fullTemplate, 'tpl-video-detail');

    if (!detailTpl) return "<p>Template 'tpl-video-detail' not found.</p>";

    const videoDate = new Date(video.published).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    // Convert YouTube link to embed URL (using youtube-nocookie for privacy)
    let embedUrl = video.link;
    if (video.link && video.link.includes('youtube.com/watch?v=')) {
        const videoId = video.link.split('v=')[1]?.split('&')[0];
        embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
    } else if (video.link && video.link.includes('youtu.be/')) {
        const videoId = video.link.split('youtu.be/')[1]?.split('?')[0];
        embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
    }

    return replacePlaceholders(detailTpl, {
        title: video.title,
        date: videoDate,  // Le template utilise {{date}} pas {{published}}
        published: videoDate,
        description: video.description || 'Aucune description disponible.',
        embedUrl: embedUrl,
        link: video.link,
        slug: video.slug,
        currentUrl: currentUrl
    });
}

/**
 * Génère le contenu de détail d'un événement
 */
export function generateEventDetailContent(fullTemplate, event, currentUrl = '') {
    let detailTpl = extractTemplate(fullTemplate, 'tpl-event-detail') ||
                     extractTemplate(fullTemplate, 'tpl-event-detail-page');
    
    if (!detailTpl) {
        // Fallback template
        detailTpl = `
        <article class="py-20 bg-white dark:bg-slate-950">
            <div class="container mx-auto px-6 max-w-5xl">
                <a href="/events" hx-get="/events" hx-target="#main-content" hx-push-url="true"
                    class="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 mb-6">
                    <i class="fas fa-arrow-left mr-2"></i> Back to Events
                </a>
                <h1 class="text-4xl md:text-5xl font-bold mb-6">{{title}}</h1>
                <div class="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-slate-400 mb-8">
                    <span><i class="far fa-calendar mr-2"></i>{{date}}</span>
                    <span class="event-location"><i class="fas fa-map-marker-alt mr-2"></i>{{location}}</span>
                    <span class="event-fee"><i class="fas fa-euro-sign mr-2"></i>{{fee}}</span>
                </div>
                <div class="w-full rounded-xl overflow-hidden shadow-lg mb-8 event-image-container">
                    <img src="{{image}}" alt="{{title}}" class="w-full h-96 object-cover">
                </div>
                <div class="prose prose-lg dark:prose-invert max-w-none">
                    <div class="event-content">{{content}}</div>
                </div>
                <div class="mt-8 pt-8 border-t">
                    <a href="{{link}}" target="_blank" rel="noopener noreferrer"
                        class="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        <i class="fas fa-external-link-alt"></i> View Event on Meetup
                    </a>
                </div>
            </div>
        </article>`;
    }
    
    const pubDate = new Date(event.pubDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    let content = replacePlaceholders(detailTpl, {
        title: event.title,
        date: pubDate,
        location: event.location || '',
        fee: event.fee || '',
        image: event.image || '',
        content: event.content || event.description || '',
        link: event.link
    });
    
    // Masquer les éléments vides
    if (!event.location) {
        content = content.replace(/<span class="event-location">[\s\S]*?<\/span>/g, '');
    }
    if (!event.fee) {
        content = content.replace(/<span class="event-fee">[\s\S]*?<\/span>/g, '');
    }
    if (!event.image) {
        content = content.replace(/<div class="[^"]*event-image-container[^"]*">[\s\S]*?<\/div>/g, '');
    }
    
    return content;
}

/**
 * Génère le contenu de détail d'un article
 */
export function generatePostContent(fullTemplate, post, currentUrl = '', siteConfig = {}) {
    const tpl = extractTemplate(fullTemplate, 'tpl-post-detail');
    if (!tpl) return "<p>Template 'tpl-post-detail' not found.</p>";

    const postDate = new Date(post.pubDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    const defaultAuthor = siteConfig?.author || siteConfig?.site?.author || 'Admin';

    return replacePlaceholders(tpl, {
        title: post.title,
        author: post.author || defaultAuthor,
        date: postDate,
        image: post.image || 'https://via.placeholder.com/800x400/edf2f7/4a5568?text=Image+de+Couverture',
        content: post.content,
        currentUrl: currentUrl
    });
}

