// GET /api/post/[slug]
import { jsonResponse, errorResponse } from '../../shared/utils.js';
import { getCachedRSSData } from '../../shared/cache.js';

export async function onRequestGet(context) {
    const { params, env } = context;
    const slug = params.slug;
    const feedUrl = env.BLOG_FEED_URL;

    if (!feedUrl) {
        return errorResponse("No Substack URL configured", 404);
    }

    try {
        const blogData = await getCachedRSSData(feedUrl);
        const post = blogData.posts.find(p => p.slug === slug);

        if (post) {
            return jsonResponse(post);
        } else {
            return errorResponse("Post not found", 404);
        }
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}
