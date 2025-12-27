// ====================================================================
// Agent Executor Helper
// ====================================================================
// Fonctions utilitaires pour charger et exécuter des agents depuis GitHub
// ====================================================================

/**
 * Charge un agent depuis GitHub
 */
export async function loadAgentFromGitHub(agentId, env) {
  const repo = `${env.GITHUB_USER}/${env.GITHUB_REPO}`;
  const path = `functions/agents/${agentId}.js`;
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'WebSuite'
    }
  });
  
  if (response.status === 404) {
    throw new Error(`Agent not found: ${agentId}`);
  }
  
  if (!response.ok) {
    throw new Error(`GitHub API Error: ${response.status} - ${await response.text()}`);
  }
  
  const code = await response.text();
  return code;
}

/**
 * Exécute le code de l'agent dans un contexte sécurisé
 * 
 * Note: Cette fonction utilise new Function() qui fonctionne en local (Bun) mais pas en production Cloudflare Workers.
 * Pour la production, les agents doivent être déployés vers GitHub et utilisent le routing automatique.
 * 
 * Supporte deux formats :
 * 1. Ancien format: export default async function agent(context) { ... }
 * 2. Nouveau format: export async function onRequestPost(context) { ... }
 */
export async function executeAgent(agentCode, env) {
  // Créer un contexte similaire aux autres fonctions API
  const context = {
    env, // Les agents ont accès exclusif aux variables d'environnement
    request: { method: 'POST', url: 'http://localhost' }, // Mock request
    params: {} // Pas de params pour l'exécution directe
  };
  
  // Vérifier le format du code
  const isOldFormat = agentCode.includes('export default') && agentCode.includes('function agent');
  const isNewFormat = agentCode.includes('onRequestPost') || agentCode.includes('onRequestGet');
  
  if (!isOldFormat && !isNewFormat) {
    throw new Error('Agent code must export either "export default async function agent(context)" or "onRequestPost/onRequestGet"');
  }
  
  let agentFunction;
  
  if (isNewFormat) {
    // Nouveau format : onRequestPost/onRequestGet
    // On doit extraire la fonction handleAgent ou wrapper onRequestPost
    // Chercher handleAgent d'abord (fonction interne)
    let funcCode = agentCode;
    
    // Si on a handleAgent, l'utiliser
    if (agentCode.includes('async function handleAgent')) {
      funcCode = funcCode.replace(/export\s+async\s+function\s+onRequestPost[^{]*\{[\s\S]*?return\s+handleAgent\(context\);[\s\S]*?\}/g, '');
      funcCode = funcCode.replace(/export\s+async\s+function\s+onRequestGet[^{]*\{[\s\S]*?return\s+handleAgent\(context\);[\s\S]*?\}/g, '');
      funcCode = funcCode.replace(/async function handleAgent/, 'async function _agent');
    } else {
      // Sinon, wrapper onRequestPost
      funcCode = agentCode.replace(/export\s+async\s+function\s+onRequestPost/g, 'async function _agent');
      // Supprimer onRequestGet si présent
      funcCode = funcCode.replace(/export\s+async\s+function\s+onRequestGet[^{]*\{[\s\S]*?\}/g, '');
    }
    
    try {
      // Ajouter les imports nécessaires (jsonResponse, errorResponse)
      const helperCode = `
        function jsonResponse(data) {
          return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        function errorResponse(message, status = 500) {
          return new Response(JSON.stringify({ error: message, success: false }), {
            status: status,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      `;
      
      agentFunction = new Function(
        'context',
        `
        ${helperCode}
        ${funcCode}
        return _agent(context);
        `
      );
    } catch (error) {
      throw new Error(`Invalid agent code (new format): ${error.message}`);
    }
  } else {
    // Ancien format : export default async function agent
    const funcCode = agentCode.replace(/export\s+default\s+async\s+function\s+agent/g, 'async function _agent');
    
    try {
      agentFunction = new Function(
        'context',
        `
        ${funcCode}
        return _agent(context);
        `
      );
    } catch (error) {
      throw new Error(`Invalid agent code (old format): ${error.message}`);
    }
  }
  
  // Exécuter l'agent
  try {
    const result = await agentFunction(context);
    
    // Si le résultat est une Response (nouveau format), extraire le JSON
    if (result instanceof Response) {
      if (result.ok) {
        const json = await result.json();
        return json;
      } else {
        const text = await result.text();
        return { success: false, error: text };
      }
    }
    
    // Sinon, retourner le résultat tel quel (ancien format)
    return result;
  } catch (error) {
    throw new Error(`Agent execution error: ${error.message}`);
  }
}

/**
 * Sauvegarde les logs sur GitHub
 */
export async function saveLogToGitHub(agentId, logEntry, env) {
  const repo = `${env.GITHUB_USER}/${env.GITHUB_REPO}`;
  const path = `functions/agents/logs/${agentId}.log`;
  const logLine = `[${new Date().toISOString()}] ${JSON.stringify(logEntry)}\n`;
  
  // Lire le fichier existant
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  let existingContent = '';
  let sha = null;
  
  try {
    const checkRes = await fetch(`${url}?ref=main`, {
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'WebSuite'
      }
    });
    
    if (checkRes.ok) {
      const data = await checkRes.json();
      existingContent = atob(data.content.replace(/\s/g, ''));
      sha = data.sha;
    }
  } catch (e) {
    // Fichier n'existe pas, on le crée
    console.log(`Log file doesn't exist yet, will create: ${path}`);
  }
  
  // Limiter la taille des logs (garder les 1000 dernières lignes)
  const lines = existingContent.split('\n').filter(l => l.trim());
  const maxLines = 1000;
  let contentToSave = '';
  
  if (lines.length >= maxLines) {
    // Garder les dernières lignes
    contentToSave = lines.slice(-maxLines + 1).join('\n') + '\n' + logLine;
  } else {
    contentToSave = existingContent + logLine;
  }
  
  const contentBase64 = btoa(unescape(encodeURIComponent(contentToSave)));
  
  // Sauvegarder sur GitHub
  const githubBody = {
    message: `Log execution agent ${agentId} - ${new Date().toISOString()}`,
    content: contentBase64,
    branch: 'main'
  };
  if (sha) githubBody.sha = sha;
  
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'WebSuite'
    },
    body: JSON.stringify(githubBody)
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to save log to GitHub: ${res.status} - ${errorText}`);
    // Ne pas faire échouer l'exécution si les logs échouent
  }
  
  return res.ok;
}

/**
 * Charge les logs depuis GitHub
 */
export async function loadLogsFromGitHub(agentId, env) {
  const repo = `${env.GITHUB_USER}/${env.GITHUB_REPO}`;
  const path = `functions/agents/logs/${agentId}.log`;
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'WebSuite'
    }
  });
  
  if (response.status === 404) {
    return null; // Pas de logs
  }
  
  if (!response.ok) {
    throw new Error(`GitHub API Error: ${response.status}`);
  }
  
  const logContent = await response.text();
  
  // Parser les lignes de log
  const logs = logContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try {
        const match = line.match(/^\[([^\]]+)\]\s*(.+)$/);
        if (match) {
          return {
            timestamp: match[1],
            data: JSON.parse(match[2])
          };
        }
      } catch (e) {
        // Ligne invalide, ignorer
        console.warn(`Invalid log line: ${line}`);
      }
      return null;
    })
    .filter(log => log !== null);
  
  return logs;
}
