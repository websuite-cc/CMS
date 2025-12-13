// GET /api/config (protégé)
import { isAuthenticated, jsonResponse, errorResponse } from '../shared/utils.js';

export async function onRequestGet(context) {
    const { request, env } = context;

    if (!isAuthenticated(request, env)) {
        return errorResponse("Non autorisé", 401);
    }

    const config = {
        siteName: "iziWebCMS CMS",
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
        },
        hasGithub: !!env.GITHUB_TOKEN && !!env.GITHUB_USER && !!env.GITHUB_REPO,
        hasCronJob: !!env.CRONJOB_API_KEY,
        hasGoogleAI: !!env.GOOGLE_AI_KEY
    };

    return jsonResponse(config);
}
