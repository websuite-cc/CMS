// GET /api/videos
import { jsonResponse } from '../shared/utils.js';
import { getCachedYoutubeData } from '../shared/cache.js';

export async function onRequestGet(context) {
    const { env } = context;
    const feedUrl = env.YOUTUBE_FEED_URL;

    if (!feedUrl) {
        return jsonResponse([]);
    }

    try {
        const videos = await getCachedYoutubeData(feedUrl);
        return jsonResponse(videos);
    } catch (error) {
        console.error("Error fetching YouTube RSS:", error);
        return jsonResponse([]);
    }
}
