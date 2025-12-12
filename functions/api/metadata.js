// GET /api/metadata
import { jsonResponse } from '../shared/utils.js';

export async function onRequestGet(context) {
    const { env } = context;

    const metadata = {
        siteName: env.META_TITLE || "Stack Pages Portal",
        description: env.META_DESCRIPTION || "Portail de contenus",
        author: "Admin",
        lastBuildDate: new Date().toISOString(),
        blogRssUrl: env.BLOG_FEED_URL || "",
        youtubeRssUrl: env.YOUTUBE_FEED_URL || "",
        podcastFeedUrl: env.PODCAST_FEED_URL || ""
    };

    return jsonResponse(metadata);
}
