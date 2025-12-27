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
  'APPSCRIPT_URL': 'URL du webhook Google Apps Script pour le traitement des emails et autres intégrations Google (Gmail, Drive, Docs, Sheets, Calendar, Meet, Forms) - Format: https://script.google.com/macros/s/SCRIPT_ID/exec (doit être déployé en tant que Web App avec accès "Anyone")',
  
  // AI & LLM
  'MICROSOFT_COPILOT_API_KEY': 'Clé API Microsoft Copilot pour l\'intelligence artificielle',
  'DEEPSEEK_API_KEY': 'Clé API DeepSeek pour le modèle de langage AI',
  
  // Content & Media
  'WORDPRESS_URL': 'URL de votre site WordPress pour l\'API REST (ex: https://votresite.com)',
  'WORDPRESS_API_KEY': 'Clé API WordPress (Application Password) pour authentifier les requêtes REST',
  'SPOTIFY_CLIENT_ID': 'Client ID Spotify pour l\'API Spotify Web API',
  'SPOTIFY_CLIENT_SECRET': 'Client Secret Spotify pour l\'API Spotify Web API',
  'STREAMYARD_API_KEY': 'Clé API StreamYard pour le streaming et la diffusion en direct (optionnel)',
  
  // Social & Ads
  'FACEBOOK_ACCESS_TOKEN': 'Token d\'accès Facebook Graph API pour les posts et interactions (créer via https://developers.facebook.com/apps)',
  'TWITTER_API_KEY': 'Clé API Twitter (X) pour les tweets et interactions (créer via https://developer.twitter.com/en/portal/dashboard)',
  'TWITTER_API_SECRET': 'Secret API Twitter (X)',
  'TWITTER_BEARER_TOKEN': 'Token Bearer Twitter (X) pour l\'authentification OAuth 2.0',
  'INSTAGRAM_ACCESS_TOKEN': 'Token d\'accès Instagram Basic Display API pour les posts et stories',
  'LINKEDIN_CLIENT_ID': 'Client ID LinkedIn pour l\'API LinkedIn (créer via https://www.linkedin.com/developers/apps)',
  'LINKEDIN_CLIENT_SECRET': 'Client Secret LinkedIn pour l\'API LinkedIn',
  'TIKTOK_CLIENT_KEY': 'Client Key TikTok pour l\'API TikTok (créer via https://developers.tiktok.com/)',
  'TIKTOK_CLIENT_SECRET': 'Client Secret TikTok pour l\'API TikTok',
  'META_ADS_ACCESS_TOKEN': 'Token d\'accès Facebook Ads API pour les campagnes publicitaires Meta',
  
  // Business & E-commerce
  'STRIPE_SECRET_KEY': 'Clé secrète Stripe pour les paiements en ligne (commence par sk_live_ ou sk_test_, créer via https://dashboard.stripe.com/apikeys)',
  'STRIPE_PUBLISHABLE_KEY': 'Clé publique Stripe (commence par pk_live_ ou pk_test_)',
  'PAYPAL_CLIENT_ID': 'Client ID PayPal pour l\'API PayPal (créer via https://developer.paypal.com/)',
  'PAYPAL_CLIENT_SECRET': 'Client Secret PayPal pour l\'API PayPal',
  'SHOPIFY_API_KEY': 'Clé API Shopify pour accéder aux données de votre boutique (créer via Shopify Partners)',
  'SHOPIFY_API_SECRET': 'Secret API Shopify',
  'SHOPIFY_STORE_URL': 'URL de votre boutique Shopify (ex: votreboutique.myshopify.com)',
  'GOOGLE_ADS_API_KEY': 'Clé API Google Ads pour gérer les campagnes publicitaires (créer via https://ads.google.com/aw/apicenter)',
  'GOOGLE_ADS_CLIENT_ID': 'Client ID Google Ads pour l\'OAuth',
  'GOOGLE_ADS_CLIENT_SECRET': 'Client Secret Google Ads pour l\'OAuth',
  
  // Development & Data
  'SUPABASE_URL': 'URL de votre projet Supabase (ex: https://xxxxx.supabase.co, créer via https://app.supabase.com)',
  'SUPABASE_ANON_KEY': 'Clé anonyme Supabase (publique, pour les requêtes client-side)',
  'SUPABASE_SERVICE_ROLE_KEY': 'Clé service role Supabase (privée, pour les opérations admin côté serveur uniquement)',
  'GITLAB_TOKEN': 'Token d\'accès GitLab pour l\'API GitLab (créer via https://gitlab.com/-/user_settings/personal_access_tokens)',
  'GITLAB_URL': 'URL de votre instance GitLab (par défaut: https://gitlab.com)',
  'GOOGLE_ANALYTICS_API_KEY': 'Clé API Google Analytics pour accéder aux données Analytics',
  'GOOGLE_ANALYTICS_VIEW_ID': 'ID de vue Google Analytics (trouvable dans Admin > Vue > Paramètres de la vue)',
  'AIRTABLE_API_KEY': 'Clé API Airtable pour accéder aux bases de données (créer via https://airtable.com/create/tokens)',
  'AIRTABLE_BASE_ID': 'ID de la base Airtable (trouvable dans l\'URL de votre base: https://airtable.com/BASE_ID/...)',
  
  // Productivity & Collaboration
  'TRELLO_API_KEY': 'Clé API Trello pour accéder aux boards et cartes (créer via https://trello.com/app-key)',
  'TRELLO_TOKEN': 'Token Trello (généré après avoir autorisé l\'application avec la clé API)',
  'CANVA_API_KEY': 'Clé API Canva pour accéder aux designs et créer du contenu visuel (si disponible, créer via https://www.canva.com/developers/)',
  'SLACK_BOT_TOKEN': 'Token de bot Slack pour envoyer des messages et interagir (créer via https://api.slack.com/apps, format: xoxb-...)',
  'SLACK_WEBHOOK_URL': 'URL de webhook Slack pour envoyer des notifications (format: https://hooks.slack.com/services/...)',
  
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
  if (varName.startsWith('GITHUB_') || varName.startsWith('GITLAB_')) {
    return 'Variable liée à GitHub ou GitLab';
  }
  if (varName.startsWith('META_')) {
    return 'Variable liée au SEO, métadonnées ou Meta/Facebook Ads';
  }
  if (varName.includes('STRIPE_') || varName.includes('PAYPAL_') || varName.includes('SHOPIFY_')) {
    return 'Variable liée aux paiements ou e-commerce';
  }
  if (varName.includes('FACEBOOK_') || varName.includes('TWITTER_') || varName.includes('INSTAGRAM_') || varName.includes('LINKEDIN_') || varName.includes('TIKTOK_') || varName.includes('SLACK_')) {
    return 'Variable liée aux réseaux sociaux ou communication';
  }
  if (varName.includes('SUPABASE_') || varName.includes('AIRTABLE_')) {
    return 'Variable liée à une base de données ou stockage';
  }
  if (varName.includes('SPOTIFY_') || varName.includes('WORDPRESS_') || varName.includes('STREAMYARD_')) {
    return 'Variable liée au contenu ou média';
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

