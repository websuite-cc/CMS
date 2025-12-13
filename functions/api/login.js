// POST /api/login
import { corsHeaders, jsonResponse, errorResponse } from '../shared/utils.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const ADMIN_EMAIL = env.ADMIN_EMAIL || "admin@example.com";
        const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "admin";

        if (body.email === ADMIN_EMAIL && body.password === ADMIN_PASSWORD) {
            return jsonResponse({ success: true });
        } else {
            return errorResponse("Identifiants incorrects", 401);
        }
    } catch (e) {
        return errorResponse("Bad Request", 400);
    }
}
