
import { isAuthenticated, jsonResponse, errorResponse } from '../../shared/utils.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    if (!isAuthenticated(request, env)) {
        return errorResponse("Non autorisé", 401);
    }

    if (!env.GOOGLE_AI_KEY) {
        return errorResponse("Configuration manquante : GOOGLE_AI_KEY", 500);
    }

    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return errorResponse("Le prompt est requis", 400);
        }

        // System Prompt for GAS Generation
        const systemPrompt = `
You are an expert Google Apps Script developer.
Your goal is to generate a complete, copy-paste ready 'Code.gs' file based on the user's request.
The script MUST include a doPost(e) function to receive data from the CMS.
The doPost(e) function MUST verify a 'token' property in the incoming JSON payload against a 'SECRET_TOKEN' variable.
The script should be concise, well-commented, and effective.

Output ONLY the JavaScript code, without markdown backticks or explanations.
`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GOOGLE_AI_KEY}`;

        const payload = {
            contents: [{
                parts: [{ text: systemPrompt + "\n\nUser Request: " + prompt }]
            }]
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini API Error: ${err}`);
        }

        const data = await response.json();

        let generatedCode = data.candidates?.[0]?.content?.parts?.[0]?.text || "// Erreur de génération";

        // Clean up markdown if Gemini adds it despite instructions
        generatedCode = generatedCode.replace(/^```javascript\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');

        return jsonResponse({ code: generatedCode });

    } catch (e) {
        console.error("AI Generation Error:", e);
        return errorResponse("Erreur lors de la génération: " + e.message);
    }
}
