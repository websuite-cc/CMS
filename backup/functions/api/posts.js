// GET /api/posts
import { jsonResponse, errorResponse } from '../shared/utils.js';
import { getCachedRSSData } from '../shared/cache.js';

export async function onRequestGet(context) {
    const { env } = context;
    const feedUrl = env.BLOG_FEED_URL;

    if (!feedUrl) {
        return jsonResponse([]);
    }

    try {
        const blogData = await getCachedRSSData(feedUrl);
        return jsonResponse(blogData.posts);
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}
