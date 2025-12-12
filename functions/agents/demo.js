// Agent de Démonstration
// URL: /agents/demo

import { jsonResponse } from '../shared/utils.js';

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // Exemple de logique : Récupérer des infos
    const timestamp = new Date().toISOString();
    const agentName = "Agent 001 - Demo";

    // On pourrait ici faire des fetch() vers d'autres services,
    // lire des RSS, poster sur Slack, etc.

    return jsonResponse({
        message: "Bonjour ! Je suis un Agent IA vivant.",
        agent: agentName,
        time: timestamp,
        query: Object.fromEntries(url.searchParams),
        status: "Active"
    });
}
