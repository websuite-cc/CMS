// GET /api/config (protégé)
// POST /api/config (protégé) - Sauvegarder config.json
import { isAuthenticated, jsonResponse, errorResponse } from '../shared/utils.js';
import { readConfigFromGitHub, writeConfigToGitHub } from '../shared/github-config.js';

/**
 * Configuration par défaut (fallback si config.json n'existe pas)
 */
function getDefaultConfig(env) {
    return {
        siteName: "WebSuite CMS",
        author: "Admin",
        blogRssUrl: env.BLOG_FEED_URL || "",
        youtubeRssUrl: env.YOUTUBE_FEED_URL || "",
        frontendBuilderUrl: env.FRONTEND_BUILDER_URL || "",
        podcastFeedUrl: env.PODCAST_FEED_URL || "",
        wstdStagingUrl: env.WSTD_STAGING_URL || "",
        analyticsEmbedUrl: env.ANALYTICS_EMBED_URL || "",
        seo: {
            metaTitle: env.META_TITLE || "",
            metaDescription: env.META_DESCRIPTION || "",
            metaKeywords: env.META_KEYWORDS || ""
        }
    };
}

/**
 * Fusionne la config depuis GitHub avec les valeurs par défaut et les variables d'env
 */
function mergeConfig(githubConfig, env) {
    const defaultConfig = getDefaultConfig(env);
    
    // Si config.json existe, l'utiliser comme base
    const baseConfig = githubConfig || {};
    
    // Fusionner avec les valeurs par défaut (les valeurs de config.json ont priorité)
    const merged = {
        siteName: baseConfig.siteName || defaultConfig.siteName,
        author: baseConfig.author || defaultConfig.author,
        blogRssUrl: baseConfig.blogRssUrl || defaultConfig.blogRssUrl,
        youtubeRssUrl: baseConfig.youtubeRssUrl || defaultConfig.youtubeRssUrl,
        frontendBuilderUrl: baseConfig.frontendBuilderUrl || defaultConfig.frontendBuilderUrl,
        podcastFeedUrl: baseConfig.podcastFeedUrl || defaultConfig.podcastFeedUrl,
        wstdStagingUrl: baseConfig.wstdStagingUrl || defaultConfig.wstdStagingUrl,
        analyticsEmbedUrl: baseConfig.analyticsEmbedUrl || defaultConfig.analyticsEmbedUrl,
        seo: {
            metaTitle: baseConfig.seo?.metaTitle || defaultConfig.seo.metaTitle,
            metaDescription: baseConfig.seo?.metaDescription || defaultConfig.seo.metaDescription,
            metaKeywords: baseConfig.seo?.metaKeywords || defaultConfig.seo.metaKeywords
        }
    };
    
    // Ajouter les flags de fonctionnalités (basés sur les variables d'env uniquement)
    merged.hasGithub = !!env.GITHUB_TOKEN && !!env.GITHUB_USER && !!env.GITHUB_REPO;
    merged.hasCronJob = !!env.CRONJOB_API_KEY;
    merged.hasGoogleAI = !!env.GOOGLE_AI_KEY;
    
    return merged;
}

export async function onRequestGet(context) {
    const { request, env } = context;

    if (!isAuthenticated(request, env)) {
        return errorResponse("Non autorisé", 401);
    }

    try {
        // Essayer de lire config.json depuis GitHub
        const githubConfig = await readConfigFromGitHub(env);
        
        // Fusionner avec les valeurs par défaut
        const config = mergeConfig(githubConfig, env);
        
        return jsonResponse(config);
    } catch (error) {
        console.error('Error loading config:', error);
        // En cas d'erreur, retourner la config par défaut
        const config = mergeConfig(null, env);
        return jsonResponse(config);
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;

    if (!isAuthenticated(request, env)) {
        return errorResponse("Non autorisé", 401);
    }

    try {
        const body = await request.json();
        
        // Valider les données reçues
        const config = {
            siteName: body.siteName || "WebSuite CMS",
            author: body.author || "Admin",
            blogRssUrl: body.blogRssUrl || "",
            youtubeRssUrl: body.youtubeRssUrl || "",
            frontendBuilderUrl: body.frontendBuilderUrl || "",
            podcastFeedUrl: body.podcastFeedUrl || "",
            wstdStagingUrl: body.wstdStagingUrl || "",
            analyticsEmbedUrl: body.analyticsEmbedUrl || "",
            seo: {
                metaTitle: body.seo?.metaTitle || "",
                metaDescription: body.seo?.metaDescription || "",
                metaKeywords: body.seo?.metaKeywords || ""
            }
        };
        
        // Sauvegarder sur GitHub
        await writeConfigToGitHub(env, config);
        
        return jsonResponse({
            success: true,
            message: "Configuration sauvegardée avec succès",
            config
        });
    } catch (error) {
        console.error('Error saving config:', error);
        return errorResponse(error.message || "Erreur lors de la sauvegarde de la configuration", 500);
    }
}
