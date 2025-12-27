// ====================================================================
// Agent Execute Endpoint
// ====================================================================
// Route: /api/agents/[id]/execute (POST ou GET)
// Sécurité: Auth admin OU token CronJob
// ====================================================================

import { jsonResponse, errorResponse } from '../../../shared/utils.js';
import { isAuthenticated } from '../../../shared/utils.js';
import { saveLogToGitHub, loadAgentFromGitHub, executeAgent } from '../../../shared/agent-executor.js';

/**
 * Vérifie le token CronJob depuis le header ou query param
 */
function isValidCronJobToken(request, env) {
  const cronToken = request.headers.get('X-Cron-Token') || 
                    new URL(request.url).searchParams.get('token');
  const expectedToken = env.CRONJOB_API_KEY;
  
  if (!expectedToken) {
    return false; // Si pas de token configuré, on accepte seulement l'auth admin
  }
  
  return cronToken === expectedToken;
}

export async function onRequestPost(context) {
  return handleExecute(context);
}

export async function onRequestGet(context) {
  return handleExecute(context);
}

async function handleExecute(context) {
  const { request, env, params } = context;
  const { id } = params;
  
  // Vérification de sécurité : Auth admin OU token CronJob
  const isAdmin = isAuthenticated(request, env);
  const isCronJob = isValidCronJobToken(request, env);
  
  if (!isAdmin && !isCronJob) {
    return errorResponse("Non autorisé. Token CronJob ou authentification admin requise.", 401);
  }
  
  try {
    const startTime = Date.now();
    let agentCode = null;
    let executionTime;
    
    // STRATÉGIE 1: Charger depuis le cache (comme HTMX preview)
    const CACHE_KEY_PREFIX = 'agent_';
    const cacheKey = `${CACHE_KEY_PREFIX}${id}`;
    
    if (env.FRONTEND_TEMPLATE_CACHE) {
      // Cloudflare KV
      const cached = await env.FRONTEND_TEMPLATE_CACHE.get(cacheKey);
      if (cached) {
        const agentData = JSON.parse(cached);
        agentCode = agentData.code;
      }
    } else {
      // Fallback: Cache API (local Bun ou Cloudflare sans KV)
      try {
        const cache = caches.default;
        const cacheRequest = new Request(`https://cache.local/${cacheKey}`);
        const cachedResponse = await cache.match(cacheRequest);
        if (cachedResponse) {
          const agentData = await cachedResponse.json();
          agentCode = agentData.code;
        }
      } catch (e) {
        // Cache API non disponible, continuer avec fallback GitHub
      }
    }
    
    // STRATÉGIE 2: Fallback vers GitHub si pas en cache
    if (!agentCode) {
      if (!env.GITHUB_TOKEN || !env.GITHUB_USER || !env.GITHUB_REPO) {
        return errorResponse("Agent non trouvé en cache et configuration GitHub manquante", 404);
      }
      
      try {
        agentCode = await loadAgentFromGitHub(id, env);
      } catch (error) {
        return errorResponse(`Agent non trouvé: ${error.message}`, 404);
      }
    }
    
    // Exécuter l'agent depuis le code (simple, comme avant)
    const result = await executeAgent(agentCode, env);
    executionTime = Date.now() - startTime;
    
    // Créer l'entrée de log
    const logEntry = {
      agentId: id,
      success: result.success !== false,
      executionTime,
      result: result,
      triggeredBy: isCronJob ? 'cronjob' : 'admin',
      timestamp: new Date().toISOString()
    };
    
    // Sauvegarder le log (en arrière-plan, ne bloque pas la réponse)
    // Seulement si GitHub est configuré
    if (env.GITHUB_TOKEN && env.GITHUB_USER && env.GITHUB_REPO) {
      saveLogToGitHub(id, logEntry, env).catch(err => {
        console.error(`Failed to save log for agent ${id}:`, err);
      });
    }
    
    // Retourner le résultat
    return jsonResponse({
      success: true,
      agentId: id,
      executionTime,
      result: result,
      logged: !!(env.GITHUB_TOKEN && env.GITHUB_USER && env.GITHUB_REPO)
    });
    
  } catch (error) {
    // Logger l'erreur
    const errorLog = {
      agentId: id,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    saveLogToGitHub(id, errorLog, env).catch(err => {
      console.error(`Failed to save error log for agent ${id}:`, err);
    });
    
    return errorResponse(`Erreur d'exécution: ${error.message}`, 500);
  }
}
