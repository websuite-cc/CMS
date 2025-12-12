// ====================================================================
// GESTION DU CACHE CLOUDFLARE
// ====================================================================

import { extractChannelMetadata, parseSubstackRSS, parseYoutubeRSS } from './rss-parser.js';

const CACHE_TTL = 180; // 3 minutes

/**
 * Récupère les données RSS Substack avec cache
 */
export async function getCachedRSSData(feedUrl, forceRefresh = false) {
    const cache = caches.default;
    const cacheKey = new Request(feedUrl, { method: 'GET' });

    if (!forceRefresh) {
        let response = await cache.match(cacheKey);
        if (response) {
            return await response.json();
        }
    }

    const res = await fetch(feedUrl);
    if (!res.ok) throw new Error(`Échec du chargement du flux RSS : ${res.statusText}`);
    const xml = await res.text();

    const metadata = extractChannelMetadata(xml);
    const posts = parseSubstackRSS(xml);

    const data = {
        metadata,
        posts
    };

    const cachedResponse = new Response(JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': `public, max-age=${CACHE_TTL}`
        }
    });

    await cache.put(cacheKey, cachedResponse.clone());

    return data;
}

/**
 * Récupère les données YouTube avec cache
 */
export async function getCachedYoutubeData(feedUrl, forceRefresh = false) {
    if (!feedUrl) return [];

    const cache = caches.default;
    const cacheKey = new Request(feedUrl, { method: 'GET' });

    if (!forceRefresh) {
        let response = await cache.match(cacheKey);
        if (response) {
            return await response.json();
        }
    }

    try {
        const res = await fetch(feedUrl);
        if (!res.ok) throw new Error(`Échec du chargement du flux YouTube`);
        const xml = await res.text();
        const videos = parseYoutubeRSS(xml);

        const cachedResponse = new Response(JSON.stringify(videos), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': `public, max-age=${CACHE_TTL}`
            }
        });

        await cache.put(cacheKey, cachedResponse.clone());

        return videos;
    } catch (e) {
        console.error("Erreur YouTube Fetch:", e);
        return [];
    }
}

/**
 * Récupère les données Podcast avec cache
 */
export async function getCachedPodcastData(feedUrl, forceRefresh = false) {
    if (!feedUrl) return [];

    const cache = caches.default;
    const cacheKey = new Request(feedUrl, { method: 'GET' });

    if (!forceRefresh) {
        let response = await cache.match(cacheKey);
        if (response) {
            return await response.json();
        }
    }

    try {
        const res = await fetch(feedUrl, {
            headers: { "User-Agent": "iziWebCMS-Worker/1.0" }
        });
        if (!res.ok) throw new Error(`Failed to fetch RSS: ${res.status}`);

        const xmlText = await res.text();
        const { parsePodcastRSS } = await import('./rss-parser.js');
        const podcasts = parsePodcastRSS(xmlText);

        const cachedResponse = new Response(JSON.stringify(podcasts), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': `public, max-age=${CACHE_TTL}`
            }
        });

        await cache.put(cacheKey, cachedResponse.clone());

        return podcasts;
    } catch (e) {
        console.error("Erreur Podcast Fetch:", e);
        return [];
    }
}
