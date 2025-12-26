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
 * @deprecated Cette fonction utilise new Function() qui n'est pas compatible avec Cloudflare Workers.
 * Les agents doivent maintenant être des endpoints API standards dans functions/api/agents/[id]/handler.js
 * Cette fonction est conservée uniquement comme fallback pour la migration des anciens agents.
 * 
 * Note: En production Cloudflare, on pourrait utiliser un Worker isolé pour plus de sécurité
 */
export async function executeAgent(agentCode, env) {
  // Créer un contexte similaire aux autres fonctions API
  const context = {
    env, // Les agents ont accès exclusif aux variables d'environnement
    request: null // Les agents n'ont pas besoin de request pour l'instant
  };
  
  // Vérifier que le code exporte bien une fonction par défaut
  if (!agentCode.includes('export default')) {
    throw new Error('Agent must export default async function agent(context)');
  }
  
  // Extraire la fonction export default
  // Pattern: export default async function agent(context) { ... }
  const exportMatch = agentCode.match(/export\s+default\s+async\s+function\s+agent\s*\([^)]*\)\s*\{[\s\S]*\}/);
  if (!exportMatch) {
    throw new Error('Agent must export default async function agent(context)');
  }
  
  // Créer la fonction dynamiquement
  // On remplace "export default" par une assignation locale
  const funcCode = agentCode
    .replace(/export\s+default\s+async\s+function\s+agent/, 'async function _agent');
  
  // Créer un contexte isolé avec seulement les objets nécessaires
  // Utiliser Function() qui est plus sûr que eval() car il crée un nouveau scope
  let agentFunction;
  try {
    agentFunction = new Function(
      'context',
      `
      ${funcCode}
      return _agent(context);
      `
    );
  } catch (error) {
    throw new Error(`Invalid agent code: ${error.message}`);
  }
  
  // Exécuter l'agent
  try {
    const result = await agentFunction(context);
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
