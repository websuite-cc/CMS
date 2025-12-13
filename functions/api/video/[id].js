// GET /api/video/[id]
import { jsonResponse, errorResponse } from '../../shared/utils.js';
import { getCachedYoutubeData } from '../../shared/cache.js';

export async function onRequestGet(context) {
    const { params, env } = context;
    const videoId = params.id;
    const feedUrl = env.YOUTUBE_FEED_URL;

    if (!feedUrl) {
        return errorResponse("Flux YouTube non configuré", 404);
    }

    try {
        const videos = await getCachedYoutubeData(feedUrl);
        const video = videos.find(v => v.id === videoId);

        if (video) {
            return jsonResponse(video);
        } else {
            return errorResponse("Vidéo non trouvée", 404);
        }
    } catch (error) {
        console.error("Error fetching YouTube RSS:", error);
        return errorResponse(error.message, 500);
    }
}
