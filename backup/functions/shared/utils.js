// ====================================================================
// FONCTIONS UTILITAIRES PARTAGÉES
// ====================================================================

/**
 * Convertit un texte en slug URL-friendly
 */
export function slugify(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .trim();
}

/**
 * Décode les entités HTML
 */
export function decodeHTMLEntities(str) {
    if (!str) return "";
    const map = {
        "nbsp": " ", "amp": "&", "quot": '"', "lt": "<", "gt": ">", "#39": "'"
    };
    return str.replace(/&(#?\w+);/g, (match, entity) => {
        if (entity.startsWith('#')) {
            const code = entity.startsWith('#x')
                ? parseInt(entity.slice(2), 16)
                : parseInt(entity.slice(1), 10);
            return String.fromCharCode(code);
        }
        return map[entity] || match;
    });
}

/**
 * Extrait la première image d'un contenu HTML
 */
export function extractFirstImage(html) {
    const imgRe = /<img[^>]+src=["']([^"']+)["']/i;
    const match = html.match(imgRe);
    return match ? match[1] : null;
}

/**
 * Extrait l'image d'une balise enclosure
 */
export function extractEnclosureImage(block) {
    const re = /<enclosure\s+url=["']([^"']+)["'][^>]*type=["']image\/[^"']+/i;
    const match = block.match(re);
    return match && match[1] ? match[1].trim() : null;
}

/**
 * Nettoie le contenu HTML (supprime les classes indésirables)
 */
export function cleanHtmlContent(html) {
    if (!html) return "";

    // Suppression des balises <a> avec classe "image-link-expand" (UI Substack)
    const regexExpand = /<a\s+[^>]*class=["'][^"']*image-link-expand[^"']*(?:[^>]*)*>.*?<\/a>/gis;
    let cleanedHtml = html.replace(regexExpand, '');

    // Nettoyage des attributs style pour éviter les conflits CSS
    cleanedHtml = cleanedHtml.replace(/style="[^"]*"/gi, '');

    return cleanedHtml;
}

/**
 * Headers CORS standard
 */
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Key',
    'Content-Type': 'application/json'
};

/**
 * Vérifie l'authentification via header
 */
export function isAuthenticated(request, env) {
    const authKey = request.headers.get('X-Auth-Key');
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "admin";
    return authKey === ADMIN_PASSWORD;
}

/**
 * Retourne une réponse JSON avec headers CORS
 */
export function jsonResponse(data, status = 200, additionalHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, ...additionalHeaders }
    });
}

/**
 * Retourne une erreur JSON
 */
export function errorResponse(message, status = 500) {
    return jsonResponse({ error: message }, status);
}
