// GET /api/podcasts
import { jsonResponse, errorResponse } from '../shared/utils.js';
import { getCachedPodcastData } from '../shared/cache.js';

export async function onRequestGet(context) {
    const { env } = context;
    const feedUrl = env.PODCAST_FEED_URL;

    if (!feedUrl) {
        return jsonResponse([]);
    }

    try {
        const podcasts = await getCachedPodcastData(feedUrl);
        return jsonResponse(podcasts);
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}
