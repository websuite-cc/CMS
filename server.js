// ====================================================================
// MIDDLEWARE BUN - Version locale du middleware Cloudflare
// ====================================================================
// Routing :
// - /api/*    → Functions locales (API)
// - /admin/*  → Dashboard admin local
// - /*        → SSR avec frontend/index.html
// ====================================================================

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = __dirname;

// Cache simple en mémoire pour remplacer caches.default (Cloudflare)
const memoryCache = new Map();
const CACHE_TTL = 180000; // 180 secondes en millisecondes

// Simuler caches.default pour les fonctions API
global.caches = {
  default: {
    match: async (request) => {
      const key = typeof request === 'string' ? request : request.url;
      const cached = memoryCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.response.clone();
      }
      return undefined;
    },
    put: async (request, response) => {
      const key = typeof request === 'string' ? request : request.url;
      memoryCache.set(key, {
        response: response.clone(),
        timestamp: Date.now()
      });
    }
  }
};

// Charger les variables d'environnement depuis .dev.vars
const env = loadEnvVars();

function loadEnvVars() {
  const envVars = {};
  
  // Charger depuis .dev.vars
  const devVarsPath = join(projectRoot, '.dev.vars');
  if (existsSync(devVarsPath)) {
    const content = readFileSync(devVarsPath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }
  
  // Ajouter les variables d'environnement système (prioritaires)
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('ADMIN_') || key.startsWith('BLOG_') || 
        key.startsWith('YOUTUBE_') || key.startsWith('PODCAST_') || 
        key.startsWith('EVENTS_') || key.startsWith('GITHUB_') ||
        key === 'WSTD_STAGING_URL' || key === 'FRONTEND_BUILDER_URL' ||
        key.startsWith('META_')) {
      envVars[key] = process.env[key];
    }
  });
  
  return envVars;
}

// Helper pour charger un fichier
async function loadFile(filePath) {
  try {
    const fullPath = join(projectRoot, filePath);
    if (existsSync(fullPath)) {
      const file = Bun.file(fullPath);
      if (await file.exists()) {
        return await file.text();
      }
    }
    return null;
  } catch (error) {
    console.error(`Error loading file ${filePath}:`, error);
    return null;
  }
}

// Helper pour servir un fichier
async function serveFile(filePath) {
  const fullPath = join(projectRoot, filePath);
  if (existsSync(fullPath)) {
    const file = Bun.file(fullPath);
    if (await file.exists()) {
      return new Response(file);
    }
  }
  return null;
}

// Helper pour servir un fichier avec gestion des dossiers
async function serveFileOrIndex(filePath) {
  // Essayer le fichier direct
  let response = await serveFile(filePath);
  if (response) return response;
  
  // Si le chemin se termine par /, chercher index.html
  if (filePath.endsWith('/')) {
    response = await serveFile(filePath + 'index.html');
    if (response) return response;
  }
  
  // Si pas d'extension ET que c'est dans /admin/ ou /core/, essayer .html d'abord
  if (!filePath.includes('.') && (filePath.startsWith('/admin/') || filePath.startsWith('/core/'))) {
    response = await serveFile(filePath + '.html');
    if (response) return response;
    // Si toujours pas trouvé, essayer index.html dans le dossier
    response = await serveFile(filePath + '/index.html');
    if (response) return response;
  }
  
  // Si pas d'extension (autres chemins), chercher index.html
  if (!filePath.includes('.')) {
    response = await serveFile(filePath + '/index.html');
    if (response) return response;
  }
  
  return null;
}

// Simuler env.ASSETS pour les fonctions API
const mockAssets = {
  fetch: async (request) => {
    const url = typeof request === 'string' ? new URL(request, 'http://localhost:8000') : new URL(request.url);
    const filePath = url.pathname;
    
    const response = await serveFileOrIndex(filePath);
    if (response) return response;
    
    return new Response('File not found', { status: 404 });
  }
};

// Ajouter ASSETS à env pour les fonctions API
env.ASSETS = mockAssets;

// Router pour les API
async function handleApiRoute(pathname, request) {
  const apiPath = pathname.replace('/api/', '');
  
  try {
    // Routes simples (posts, videos, etc.)
    const simpleRoutes = {
      'posts': './functions/api/posts.js',
      'videos': './functions/api/videos.js',
      'podcasts': './functions/api/podcasts.js',
      'events': './functions/api/events.js',
      'siteinfos': './functions/api/siteinfos.js',
      'config': './functions/api/config.js',
    };
    
    if (simpleRoutes[apiPath]) {
      const handler = await import(simpleRoutes[apiPath]);
      const context = { request, env };
      if (request.method === 'GET' && handler.onRequestGet) {
        return await handler.onRequestGet(context);
      }
      if (request.method === 'POST' && handler.onRequestPost) {
        return await handler.onRequestPost(context);
      }
    }
    
    // Routes POST spécifiques
    if (apiPath === 'login' && request.method === 'POST') {
      const handler = await import('./functions/api/login.js');
      return await handler.onRequestPost?.({ request, env });
    }
    if (apiPath === 'logout' && request.method === 'POST') {
      const handler = await import('./functions/api/logout.js');
      return await handler.onRequestPost?.({ request, env });
    }
    if (apiPath === 'clear-cache' && request.method === 'POST') {
      const handler = await import('./functions/api/clear-cache.js');
      return await handler.onRequestPost?.({ request, env });
    }
    
    // Routes avec paramètres (post/[slug], video/[id], etc.)
    const slugMatch = apiPath.match(/^post\/(.+)$/);
    if (slugMatch) {
      const handler = await import('./functions/api/post/[slug].js');
      const context = { request, env, params: { slug: slugMatch[1] } };
      return await handler.onRequestGet?.(context);
    }
    
    const videoMatch = apiPath.match(/^video\/(.+)$/);
    if (videoMatch) {
      const handler = await import('./functions/api/video/[id].js');
      const context = { request, env, params: { id: videoMatch[1] } };
      return await handler.onRequestGet?.(context);
    }
    
    const podcastMatch = apiPath.match(/^podcast\/(.+)$/);
    if (podcastMatch) {
      const handler = await import('./functions/api/podcast/[id].js');
      const context = { request, env, params: { id: podcastMatch[1] } };
      return await handler.onRequestGet?.(context);
    }
    
    const eventMatch = apiPath.match(/^event\/(.+)$/);
    if (eventMatch) {
      const handler = await import('./functions/api/event/[slug].js');
      const context = { request, env, params: { slug: eventMatch[1] } };
      return await handler.onRequestGet?.(context);
    }
    
    // Routes agents : /api/agents/[id]/execute
    const agentExecuteMatch = apiPath.match(/^agents\/(.+)\/execute$/);
    if (agentExecuteMatch) {
      const handler = await import('./functions/api/agents/[id]/execute.js');
      const context = { request, env, params: { id: agentExecuteMatch[1] } };
      if (request.method === 'POST' && handler.onRequestPost) {
        return await handler.onRequestPost(context);
      }
      if (request.method === 'GET' && handler.onRequestGet) {
        return await handler.onRequestGet(context);
      }
    }
    
    // Route agent info : /api/agents/[id] (sans /execute)
    const agentMatch = apiPath.match(/^agents\/(.+)$/);
    if (agentMatch) {
      // Vérifier si c'est pas une sous-route (logs, execute, etc.)
      const agentId = agentMatch[1];
      if (!agentId.includes('/')) {
        // C'est juste un ID, retourner les infos de l'agent
        const handler = await import('./functions/api/agents/[id].js');
        const context = { request, env, params: { id: agentId } };
        if (request.method === 'GET' && handler.onRequestGet) {
          return await handler.onRequestGet(context);
        }
      }
    }
    
    // Routes agents logs : /api/agents/[id]/logs
    const agentLogsMatch = apiPath.match(/^agents\/(.+)\/logs$/);
    if (agentLogsMatch) {
      const handler = await import('./functions/api/agents/[id]/logs.js');
      const context = { request, env, params: { id: agentLogsMatch[1] } };
      return await handler.onRequestGet?.(context);
    }
    
    // Route sauvegarde agent : /api/agents/save
    if (apiPath === 'agents/save' && request.method === 'POST') {
      const handler = await import('./functions/api/agents/save.js');
      return await handler.onRequestPost?.({ request, env });
    }
    
    // Route chargement agent : /api/agents/load?id=xxx
    if (apiPath === 'agents/load' && request.method === 'GET') {
      const handler = await import('./functions/api/agents/load.js');
      return await handler.onRequestGet?.({ request, env });
    }
    
  } catch (error) {
    console.error(`Error handling API route ${pathname}:`, error);
    return new Response(`API Error: ${error.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  return new Response('API endpoint not found', { status: 404 });
}

// Middleware principal
const server = Bun.serve({
    port: 8000,
  async fetch(req) {
      const url = new URL(req.url);
    let pathname = url.pathname;
    
    // Gérer OPTIONS pour CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Key',
        }
      });
    }
    
    // Route /api/* → Handlers API
    if (pathname.startsWith('/api/')) {
      return await handleApiRoute(pathname, req);
    }
    
    // Route /admin, /admin/*, /core/* → Fichiers statiques
    if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/core/')) {
      // Si c'est exactement /admin, rediriger vers /admin/
      if (pathname === '/admin') {
        pathname = '/admin/';
      }
      const response = await serveFileOrIndex(pathname);
      if (response) return response;
      return new Response(`File not found: ${pathname}`, { status: 404 });
    }
    
    // Route /preview/* → Fichiers statiques
    if (pathname.startsWith('/preview/')) {
      const response = await serveFileOrIndex(pathname);
      if (response) return response;
      return new Response(`File not found: ${pathname}`, { status: 404 });
    }
    
    // Assets statiques (CSS, JS, images, etc.) - mais pas les HTML
    if (pathname.includes('.') && 
        !pathname.endsWith('.html') && 
        !pathname.startsWith('/frontend/')) {
      const response = await serveFile(pathname);
      if (response) return response;
    }
    
    // SSR avec frontend/index.html et HTMX
    const template = await loadFile('frontend/index.html');
    if (!template) {
      return new Response('Template frontend/index.html not found', { status: 500 });
    }
    
    // Importer les fonctions HTMX
    const {
      isHtmxRequest,
      htmlResponse,
      generateHomeContent,
      generateOOB,
      injectContent,
      handleHtmxCatchAll,
      detectAndRenderContentRoute,
      extractTemplate
    } = await import('./functions/shared/htmx-render.js');
    
    // Charger la configuration depuis config.json local ou utiliser les valeurs par défaut
    let siteConfig = {
      site: { name: "WebSuite" },
      seo: {
        metaDescription: "",
        keywords: ""
      }
    };
    
    try {
      const configJson = await loadFile('config.json');
      if (configJson) {
        const config = JSON.parse(configJson);
        siteConfig = {
          site: { 
            name: config.site?.name || config.siteName || "WebSuite",
            author: config.author || config.site?.author || 'Admin'
          },
          seo: {
            metaDescription: config.seo?.metaDescription || config.metaDescription || "",
            keywords: config.seo?.metaKeywords || config.seo?.keywords || config.metaKeywords || ""
          }
        };
      }
      } catch (e) {
      console.log('Could not load config.json, using defaults:', e.message);
    }
    
    const siteName = siteConfig.site.name;
    const siteDescription = siteConfig.seo.metaDescription || "";
    const siteKeywords = siteConfig.seo.keywords || "";
    
    // Détecter si c'est une requête HTMX
    const isHtmx = isHtmxRequest(req);
    const path = pathname;
    
    // Gérer la racine "/" - chercher le template "tpl-home"
    if (path === '/' || path === '/index.html') {
      const metadata = {
        title: siteName,
        description: siteDescription,
        keywords: siteKeywords,
        siteName: siteName
      };
      const content = generateHomeContent(template, metadata);
      
      if (isHtmx) {
        return htmlResponse(content + generateOOB(metadata, req));
      }
      return htmlResponse(injectContent(template, content, metadata));
    }
    
    // Utiliser handleHtmxCatchAll pour les requêtes HTMX
    const htmxCatchAll = await handleHtmxCatchAll(req, path, template, siteConfig, null, env);
    if (htmxCatchAll) {
      return htmxCatchAll;
    }
    
    // Pour les requêtes non-HTMX, faire la même chose mais avec injection complète
    if (!isHtmx && path.length > 1 && 
        !path.startsWith('/api') && 
        !path.startsWith('/admin') && 
        !path.startsWith('/core') &&
        path !== '/' && 
        path !== '/index.html') {
      
      const slug = path.substring(1).replace(/\/$/, '');
      
      // Détection automatique des routes de contenu
      const contentResult = await detectAndRenderContentRoute(req, path, template, siteConfig);
      
      if (contentResult) {
        // Requête normale : injecter dans le template complet
        return htmlResponse(injectContent(template, contentResult.content, contentResult.metadata));
      }
      
      // Chercher le template correspondant
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
    
    // Si on arrive ici sans réponse, servir le template de base
    return htmlResponse(template);
    },
  });
  
  console.log(`🚀 Server running at http://localhost:${server.port}`);
console.log(`📁 Serving files from: ${projectRoot}`);
console.log(`🔧 Environment variables loaded: ${Object.keys(env).filter(k => !k.includes('PASSWORD')).length} vars`);
