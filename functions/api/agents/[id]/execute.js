// ====================================================================
// Agent Execute Endpoint
// ====================================================================
// Route: /api/agents/[id]/execute (POST ou GET)
// Sécurité: Auth admin OU token CronJob
// ====================================================================

import { jsonResponse, errorResponse } from '../../../shared/utils.js';
import { isAuthenticated } from '../../../shared/utils.js';
import { saveLogToGitHub } from '../../../shared/agent-executor.js';

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
  
  // Vérifier la configuration GitHub
  if (!env.GITHUB_TOKEN || !env.GITHUB_USER || !env.GITHUB_REPO) {
    return errorResponse("Configuration GitHub manquante", 500);
  }
  
  try {
    // Importer directement le handler de l'agent
    // Le handler est dans functions/api/agents/[id]/handler.js
    // Cloudflare Pages Functions route automatiquement ce fichier
    
    const startTime = Date.now();
    let response;
    let executionTime;
    
    // Pour l'import dynamique, on utilise une URL relative à la racine du projet
    // En production Cloudflare, le handler doit être déployé dans functions/api/agents/[id]/handler.js
    // En local Bun, on utilise un chemin relatif depuis server.js qui pointe vers le bon fichier
    
    // Construire le chemin du handler
    // Depuis functions/api/agents/[id]/execute.js, handler.js est dans le même dossier
    // Utiliser un chemin relatif pour compatibilité locale et production
    // En local Bun: le chemin est résolu depuis server.js qui importe execute.js
    // En production Cloudflare: le routing automatique gère les fichiers dans le même dossier
    
    // Essayer d'importer le handler directement
    // En production Cloudflare, le handler doit être dans functions/api/agents/[id]/handler.js
    // En local Bun, le chemin est résolu depuis server.js
    
    let handler;
    let importError = null;
    
    // Stratégie 1: Chemin relatif depuis le même dossier (pour Cloudflare Pages Functions)
    try {
      handler = await import(`./handler.js`);
    } catch (e1) {
      importError = e1;
      // Stratégie 2: Chemin relatif depuis shared (pour certains cas)
      try {
        handler = await import(`../../../api/agents/${id}/handler.js`);
      } catch (e2) {
        importError = e2;
        // Stratégie 3: Chemin absolu (pour Bun local)
        try {
          // En local Bun, server.js peut résoudre depuis la racine
          handler = await import(`../../../../functions/api/agents/${id}/handler.js`);
        } catch (e3) {
          throw new Error(`Could not import agent handler from any path. Please ensure the agent is saved and deployed. Errors: ${e1.message}, ${e2.message}, ${e3.message}`);
        }
      }
    }
    
    // Déterminer quelle méthode appeler
    if (request.method === 'POST' && handler.onRequestPost) {
      response = await handler.onRequestPost(context);
    } else if (request.method === 'GET' && handler.onRequestGet) {
      response = await handler.onRequestGet(context);
    } else {
      throw new Error(`Method ${request.method} not supported by agent handler`);
    }
    
    executionTime = Date.now() - startTime;
    
    // Extraire le résultat de la réponse JSON
    let result = null;
    if (response && response.ok) {
      try {
        result = await response.clone().json();
      } catch (e) {
        // Si ce n'est pas du JSON, prendre le texte
        result = { message: await response.clone().text() };
      }
    } else {
      // Si la réponse n'est pas OK, extraire l'erreur
      const errorText = await response.text();
      result = { error: errorText, success: false };
    }
    
    // Créer l'entrée de log
    const logEntry = {
      agentId: id,
      success: result.success !== false && response.ok,
      executionTime,
      result: result,
      triggeredBy: isCronJob ? 'cronjob' : 'admin',
      timestamp: new Date().toISOString()
    };
    
    // Sauvegarder le log (en arrière-plan, ne bloque pas la réponse)
    saveLogToGitHub(id, logEntry, env).catch(err => {
      console.error(`Failed to save log for agent ${id}:`, err);
    });
    
    // Retourner la réponse du handler
    return response;
    
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
