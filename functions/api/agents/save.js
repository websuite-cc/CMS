// ====================================================================
// Agent Save Endpoint
// ====================================================================
// Route: /api/agents/save (POST)
// Sauvegarde un agent sur GitHub
// ====================================================================

import { jsonResponse, errorResponse } from '../../shared/utils.js';
import { isAuthenticated } from '../../shared/utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  // Seulement admin peut sauvegarder
  if (!isAuthenticated(request, env)) {
    return errorResponse("Non autorisé", 401);
  }
  
  // Vérifier la configuration GitHub
  if (!env.GITHUB_TOKEN || !env.GITHUB_USER || !env.GITHUB_REPO) {
    return errorResponse("Configuration GitHub manquante", 500);
  }
  
  try {
    const body = await request.json();
    const { agentId, code, description } = body;
    
    if (!agentId || !code) {
      return errorResponse("agentId et code sont requis", 400);
    }
    
    // Valider que le code exporte bien des endpoints API
    if (!code.includes('onRequestPost') && !code.includes('onRequestGet')) {
      return errorResponse("Le code doit exporter 'onRequestPost' et/ou 'onRequestGet' (format endpoint API)", 400);
    }
    
    const repo = `${env.GITHUB_USER}/${env.GITHUB_REPO}`;
    
    // Sauvegarder dans deux endroits :
    // 1. functions/agents/[id].js (pour versioning GitHub)
    // 2. functions/api/agents/[id]/handler.js (pour exécution via Cloudflare Pages Functions)
    
    // Ajouter une description en commentaire si fournie
    let finalCode = code;
    if (description) {
      const comment = `/**
 * ${description}
 * Created: ${new Date().toISOString()}
 */

`;
      // Vérifier si le code a déjà des commentaires en haut
      if (!code.trim().startsWith('/**')) {
        finalCode = comment + code;
      }
    }
    
    const contentBase64 = btoa(unescape(encodeURIComponent(finalCode)));
    
    // 1. Sauvegarder sur GitHub dans functions/agents/[id].js (pour versioning)
    const archivePath = `functions/agents/${agentId}.js`;
    const archiveUrl = `https://api.github.com/repos/${repo}/contents/${archivePath}`;
    
    // Vérifier si le fichier archive existe pour obtenir le SHA
    let archiveSha = null;
    try {
      const checkRes = await fetch(`${archiveUrl}?ref=main`, {
        headers: {
          'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'WebSuite'
        }
      });
      
      if (checkRes.ok) {
        const data = await checkRes.json();
        archiveSha = data.sha;
      }
    } catch (e) {
      // Fichier n'existe pas, on le crée
    }
    
    // Sauvegarder l'archive sur GitHub
    const archiveBody = {
      message: archiveSha ? `Update agent archive ${agentId}` : `Create agent archive ${agentId}`,
      content: contentBase64,
      branch: 'main'
    };
    if (archiveSha) archiveBody.sha = archiveSha;
    
    const archiveRes = await fetch(archiveUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'WebSuite'
      },
      body: JSON.stringify(archiveBody)
    });
    
    if (!archiveRes.ok) {
      const errorText = await archiveRes.text();
      throw new Error(`GitHub API Error (archive): ${archiveRes.status} - ${errorText}`);
    }
    
    // 2. Sauvegarder sur GitHub dans functions/api/agents/[id]/handler.js (pour exécution)
    const handlerPath = `functions/api/agents/${agentId}/handler.js`;
    const handlerUrl = `https://api.github.com/repos/${repo}/contents/${handlerPath}`;
    
    // Vérifier si le fichier handler existe
    let handlerSha = null;
    try {
      const checkHandlerRes = await fetch(`${handlerUrl}?ref=main`, {
        headers: {
          'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'WebSuite'
        }
      });
      
      if (checkHandlerRes.ok) {
        const data = await checkHandlerRes.json();
        handlerSha = data.sha;
      }
    } catch (e) {
      // Fichier n'existe pas, on le crée
    }
    
    // Sauvegarder le handler sur GitHub
    const handlerBody = {
      message: handlerSha ? `Update agent handler ${agentId}` : `Create agent handler ${agentId}`,
      content: contentBase64,
      branch: 'main'
    };
    if (handlerSha) handlerBody.sha = handlerSha;
    
    const handlerRes = await fetch(handlerUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'WebSuite'
      },
      body: JSON.stringify(handlerBody)
    });
    
    if (!handlerRes.ok) {
      const errorText = await handlerRes.text();
      throw new Error(`GitHub API Error (handler): ${handlerRes.status} - ${errorText}`);
    }
    
    const archiveResult = await archiveRes.json();
    const handlerResult = await handlerRes.json();
    
    return jsonResponse({
      success: true,
      agentId,
      archivePath: archiveResult.content.path,
      handlerPath: handlerResult.content.path,
      sha: handlerResult.content.sha,
      message: handlerSha ? 'Agent mis à jour' : 'Agent créé'
    });
    
  } catch (error) {
    return errorResponse(`Erreur lors de la sauvegarde: ${error.message}`, 500);
  }
}
