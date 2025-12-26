// ====================================================================
// Agent Load Endpoint
// ====================================================================
// Route: /api/agents/load (GET)
// Charge un agent depuis GitHub
// ====================================================================

import { jsonResponse, errorResponse } from '../../shared/utils.js';
import { isAuthenticated } from '../../shared/utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  
  // Seulement admin peut charger
  if (!isAuthenticated(request, env)) {
    return errorResponse("Non autorisé", 401);
  }
  
  // Vérifier la configuration GitHub
  if (!env.GITHUB_TOKEN || !env.GITHUB_USER || !env.GITHUB_REPO) {
    return errorResponse("Configuration GitHub manquante", 500);
  }
  
  try {
    const url = new URL(request.url);
    const agentId = url.searchParams.get('id');
    
    if (!agentId) {
      return errorResponse("Paramètre 'id' requis", 400);
    }
    
    const repo = `${env.GITHUB_USER}/${env.GITHUB_REPO}`;
    
    // Essayer d'abord de charger depuis handler.js (nouveau format)
    let handlerPath = `functions/api/agents/${agentId}/handler.js`;
    let apiUrl = `https://api.github.com/repos/${repo}/contents/${handlerPath}`;
    
    let response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'WebSuite'
      }
    });
    
    // Si handler.js n'existe pas, essayer l'archive (ancien format)
    if (response.status === 404) {
      const archivePath = `functions/agents/${agentId}.js`;
      apiUrl = `https://api.github.com/repos/${repo}/contents/${archivePath}`;
      
      response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'WebSuite'
        }
      });
    }
    
    if (response.status === 404) {
      return errorResponse(`Agent not found: ${agentId}`, 404);
    }
    
    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status}`);
    }
    
    let code = await response.text();
    
    // Si c'est l'ancien format (export default async function agent), le convertir
    if (code.includes('export default async function agent')) {
      code = convertToEndpointFormat(code);
    }
    
    return jsonResponse({
      success: true,
      agentId,
      code
    });
    
  } catch (error) {
    return errorResponse(`Erreur lors du chargement: ${error.message}`, 500);
  }
}

/**
 * Convertit l'ancien format agent (export default) vers le nouveau format endpoint API
 */
function convertToEndpointFormat(oldCode) {
  // Ajouter les imports nécessaires
  if (!oldCode.includes("import { jsonResponse")) {
    oldCode = `import { jsonResponse, errorResponse } from '../../../shared/utils.js';\n\n${oldCode}`;
  }
  
  // Remplacer export default async function agent par handleAgent
  oldCode = oldCode.replace(/export default async function agent\(context\)/g, 'async function handleAgent(context)');
  
  // Ajouter les exports onRequestPost et onRequestGet
  const exportCode = `
/**
 * Exécute l'agent (POST)
 */
export async function onRequestPost(context) {
  return handleAgent(context);
}

/**
 * Exécute l'agent (GET)
 */
export async function onRequestGet(context) {
  return handleAgent(context);
}

`;
  
  // Insérer les exports avant la fonction handleAgent
  oldCode = oldCode.replace(/(async function handleAgent)/, `${exportCode}$1`);
  
  // Remplacer les return { success, ... } par jsonResponse() et errorResponse()
  // Simple replacement pour les cas courants
  oldCode = oldCode.replace(
    /return\s*\{\s*success:\s*true[^}]*\}/g,
    (match) => {
      // Extraire les propriétés du return
      const props = match.match(/\{([^}]+)\}/);
      if (props) {
        // Simplifier : retourner le résultat directement dans jsonResponse
        return `return jsonResponse(${props[0]});`;
      }
      return match;
    }
  );
  
  // Remplacer les return { success: false, ... } par errorResponse
  oldCode = oldCode.replace(
    /return\s*\{\s*success:\s*false[^}]*error[^}]*\}/g,
    (match) => {
      const errorMatch = match.match(/error:\s*([^,}]+)/);
      const messageMatch = match.match(/message:\s*([^,}]+)/);
      const errorText = errorMatch ? errorMatch[1].trim() : (messageMatch ? messageMatch[1].trim() : 'Unknown error');
      return `return errorResponse(${errorText}, 500);`;
    }
  );
  
  return oldCode;
}
