// ====================================================================
// API: Environment Variables List
// ====================================================================
// GET /api/env-vars - Liste les variables d'environnement disponibles (noms + descriptions)
// ====================================================================

import { isAuthenticated, jsonResponse, errorResponse } from '../shared/utils.js';

/**
 * Mappings des descriptions pour chaque variable d'environnement
 * Utilisé pour aider l'IA à comprendre comment utiliser chaque variable
 */
const ENV_VAR_DESCRIPTIONS = {
  // Authentification
  'ADMIN_PASSWORD': 'Mot de passe d\'administration pour accéder à l\'interface admin',
  'ADMIN_EMAIL': 'Email de l\'administrateur',
  
  // GitHub
  'GITHUB_TOKEN': 'Token d\'authentification GitHub pour les opérations API (création de fichiers, commits)',
  'GITHUB_USER': 'Nom d\'utilisateur GitHub ou organisation',
  'GITHUB_REPO': 'Nom du dépôt GitHub',
  
  // Blog / RSS
  // IMPORTANT: Ces variables sont utilisées par le système pour alimenter la route API interne /api/posts
  // Les agents DOIVENT utiliser fetch('/api/posts') pour récupérer les articles, PAS env.BLOG_FEED_URL directement
  'BLOG_FEED_URL': 'URL du flux RSS pour alimenter /api/posts (configurée par l\'admin) - Format: https://domain.com/feed ou https://username.substack.com/feed - Les agents doivent utiliser fetch(\'/api/posts\') pour récupérer les articles',
  'BLOG_API_URL': 'URL de l\'API pour récupérer les articles de blog (alternative au RSS, utilisé par le système)',
  'BLOG_API_KEY': 'Clé API optionnelle pour authentifier les requêtes vers BLOG_API_URL (utilisée par le système)',
  'BLOG_POST_COUNT': 'Nombre d\'articles à récupérer par défaut (optionnel, défaut: 10, utilisé par /api/posts)',
  'BLOG_RSS_URL': 'Alias pour BLOG_FEED_URL (pour compatibilité, utilisé par le système)',
  
  // YouTube
  // IMPORTANT: Cette variable est utilisée par le système pour alimenter la route API interne /api/videos
  // Les agents DOIVENT utiliser fetch('/api/videos') pour récupérer les vidéos, PAS env.YOUTUBE_FEED_URL directement
  'YOUTUBE_FEED_URL': 'URL du flux RSS YouTube pour alimenter /api/videos (configurée par l\'admin) - Format: https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID - Les agents doivent utiliser fetch(\'/api/videos\') pour récupérer les vidéos',
  'YOUTUBE_API_KEY': 'Clé API YouTube pour les opérations avancées (optionnel, nécessite YouTube Data API v3, utilisé par le système)',
  'YOUTUBE_CHANNEL_ID': 'ID de la chaîne YouTube (optionnel si YOUTUBE_FEED_URL contient déjà le channel_id, utilisé par le système)',
  
  // Podcast
  // IMPORTANT: Cette variable est utilisée par le système pour alimenter la route API interne /api/podcasts
  // Les agents DOIVENT utiliser fetch('/api/podcasts') pour récupérer les podcasts, PAS env.PODCAST_FEED_URL directement
  'PODCAST_FEED_URL': 'URL du flux RSS du podcast pour alimenter /api/podcasts (configurée par l\'admin) - Format: https://anchor.fm/s/PODCAST_ID/podcast/rss - Les agents doivent utiliser fetch(\'/api/podcasts\') pour récupérer les podcasts',
  
  // Événements
  // IMPORTANT: Cette variable est utilisée par le système pour alimenter la route API interne /api/events
  // Les agents DOIVENT utiliser fetch('/api/events') pour récupérer les événements, PAS env.EVENTS_FEED_URL directement
  'EVENTS_FEED_URL': 'URL du flux RSS des événements pour alimenter /api/events (configurée par l\'admin) - Format: https://www.meetup.com/GROUP_NAME/events/rss - Les agents doivent utiliser fetch(\'/api/events\') pour récupérer les événements',
  
  // Services externes
  'FRONTEND_BUILDER_URL': 'URL du service de build frontend (optionnel)',
  'WSTD_STAGING_URL': 'URL de staging pour le déploiement (optionnel)',
  'ANALYTICS_EMBED_URL': 'URL pour intégrer les analytics (optionnel)',
  
  // Meta / SEO
  'META_TITLE': 'Titre SEO par défaut du site',
  'META_DESCRIPTION': 'Description SEO par défaut du site',
  'META_KEYWORDS': 'Mots-clés SEO par défaut (séparés par des virgules)',
  
  // CronJob
  'CRONJOB_API_KEY': 'Token de sécurité pour authentifier les requêtes depuis CronJob.org vers /api/agents/[id]/execute',
  
  // Google AI / Gemini
  'GOOGLE_AI_KEY': 'Clé API Google AI (Gemini) pour la génération de code dans l\'IDE',
  
  // Pexels (Images)
  'PEXELS_API_KEY': 'Clé API Pexels pour récupérer des images libres de droits (https://www.pexels.com/api/)',
  
  // Google Apps Script
  'APPSCRIPT_URL': 'URL du webhook Google Apps Script pour le traitement des emails et autres intégrations - Format: https://script.google.com/macros/s/SCRIPT_ID/exec (doit être déployé en tant que Web App avec accès "Anyone")',
  
  // Services de génération PDF
  'PDF_GENERATION_SERVICE_URL': 'URL du service de génération de fichiers PDF (optionnel)',
  'PDF_GENERATION_SERVICE_KEY': 'Clé API pour authentifier les requêtes vers le service PDF (optionnel)',
  
  // Email / Notifications
  'EMAIL_API_KEY': 'Clé API pour envoyer des emails (optionnel)',
  'EMAIL_SERVICE_URL': 'URL du service d\'envoi d\'email (optionnel)',
  
  // Webhooks
  'WEBHOOK_URL': 'URL de webhook pour les notifications (optionnel)',
  'WEBHOOK_SECRET': 'Secret pour signer les requêtes webhook (optionnel)',
  
  // Cache / Storage
  'FRONTEND_TEMPLATE_CACHE': 'Nom du namespace KV Cloudflare pour le cache des templates (interne)',
  
  // Générique
  'API_KEY': 'Clé API générique (utiliser un nom plus spécifique si possible)',
  'API_URL': 'URL d\'API générique (utiliser un nom plus spécifique si possible)',
};

/**
 * Génère une description basée sur le nom de la variable si aucune description n'est trouvée
 */
function getDescription(varName) {
  // Vérifier d'abord dans le mapping
  if (ENV_VAR_DESCRIPTIONS[varName]) {
    return ENV_VAR_DESCRIPTIONS[varName];
  }
  
  // Générer une description basée sur le préfixe
  if (varName.startsWith('BLOG_')) {
    return 'Variable liée au blog ou aux articles';
  }
  if (varName.startsWith('YOUTUBE_')) {
    return 'Variable liée à YouTube';
  }
  if (varName.startsWith('PODCAST_')) {
    return 'Variable liée aux podcasts';
  }
  if (varName.startsWith('EVENTS_')) {
    return 'Variable liée aux événements';
  }
  if (varName.startsWith('GITHUB_')) {
    return 'Variable liée à GitHub';
  }
  if (varName.startsWith('META_')) {
    return 'Variable liée au SEO et métadonnées';
  }
  if (varName.includes('API_KEY') || varName.includes('_KEY')) {
    return 'Clé API pour authentifier les requêtes';
  }
  if (varName.includes('_URL')) {
    return 'URL d\'un service ou endpoint API';
  }
  if (varName.includes('PASSWORD') || varName.includes('SECRET') || varName.includes('TOKEN')) {
    return 'Information sensible (mot de passe, token, secret)';
  }
  
  // Description générique
  return 'Variable d\'environnement disponible';
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!isAuthenticated(request, env)) {
    return errorResponse("Non autorisé", 401);
  }

  try {
    // Récupérer tous les noms de variables d'environnement
    const envVarNames = Object.keys(env).sort();
    
    // Créer un tableau avec noms et descriptions
    const variables = envVarNames.map(varName => ({
      name: varName,
      description: getDescription(varName)
    }));

    return jsonResponse({
      success: true,
      variables: variables,
      count: variables.length
    });

  } catch (error) {
    console.error('Error fetching env vars:', error);
    return errorResponse("Erreur lors de la récupération des variables", 500);
  }
}

