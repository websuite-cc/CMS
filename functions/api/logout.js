// GET /api/logout
import { jsonResponse } from '../shared/utils.js';

export async function onRequestGet() {
    return jsonResponse({ success: true });
}
