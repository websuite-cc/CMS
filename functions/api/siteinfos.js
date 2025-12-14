// GET /api/siteinfos
// Charge les informations du site depuis config.json
import { jsonResponse } from '../shared/utils.js';
import { readConfigFromGitHub } from '../shared/github-config.js';

export async function onRequestGet(context) {
    const { env } = context;

    try {
        // Essayer de charger config.json depuis GitHub
        const config = await readConfigFromGitHub(env);
        
        if (config) {
            // Utiliser les données de config.json
            const siteinfos = {
                siteName: config.siteName || "WebSuite CMS",
                description: config.seo?.metaDescription || "",
                author: config.author || "Admin",
                lastBuildDate: new Date().toISOString(),
                blogRssUrl: config.blogRssUrl || "",
                youtubeRssUrl: config.youtubeRssUrl || "",
                podcastFeedUrl: config.podcastFeedUrl || "",
                seo: {
                    metaTitle: config.seo?.metaTitle || "",
                    metaDescription: config.seo?.metaDescription || "",
                    metaKeywords: config.seo?.metaKeywords || ""
                }
            };
            
            return jsonResponse(siteinfos);
        }
        
        // Fallback: utiliser les variables d'environnement si config.json n'existe pas
        const siteinfos = {
            siteName: env.META_TITLE || "WebSuite CMS",
            description: env.META_DESCRIPTION || "",
            author: "Admin",
            lastBuildDate: new Date().toISOString(),
            blogRssUrl: env.BLOG_FEED_URL || "",
            youtubeRssUrl: env.YOUTUBE_FEED_URL || "",
            podcastFeedUrl: env.PODCAST_FEED_URL || "",
            seo: {
                metaTitle: env.META_TITLE || "",
                metaDescription: env.META_DESCRIPTION || "",
                metaKeywords: env.META_KEYWORDS || ""
            }
        };
        
        return jsonResponse(siteinfos);
    } catch (error) {
        console.error('Error loading siteinfos:', error);
        // En cas d'erreur, retourner les valeurs par défaut
        const siteinfos = {
            siteName: "WebSuite CMS",
            description: "",
            author: "Admin",
            lastBuildDate: new Date().toISOString(),
            blogRssUrl: "",
            youtubeRssUrl: "",
            podcastFeedUrl: "",
            seo: {
                metaTitle: "",
                metaDescription: "",
                metaKeywords: ""
            }
        };
        
        return jsonResponse(siteinfos);
    }
}

