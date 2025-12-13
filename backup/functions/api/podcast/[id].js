// GET /api/podcast/[id]
import { jsonResponse, errorResponse } from '../../shared/utils.js';
import { getCachedPodcastData } from '../../shared/cache.js';

export async function onRequestGet(context) {
    const { params, env } = context;
    const podcastId = params.id;
    const feedUrl = env.PODCAST_FEED_URL;

    if (!feedUrl) {
        return errorResponse("Flux Podcast non configuré", 404);
    }

    try {
        const podcasts = await getCachedPodcastData(feedUrl);
        const podcast = podcasts.find(p => p.guid === podcastId || p.slug === podcastId);

        if (podcast) {
            return jsonResponse(podcast);
        } else {
            return errorResponse("Podcast non trouvé", 404);
        }
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}
