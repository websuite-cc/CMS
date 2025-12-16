// POST /api/translate - MyMemory Translation API
import { corsHeaders, jsonResponse, errorResponse } from '../shared/utils.js';

/**
 * Traduit un texte en utilisant MyMemory API
 */
async function translateWithMyMemory(text, targetLanguage, sourceLanguage = 'auto') {
    try {
        // MyMemory API - gratuit jusqu'à 10K mots/jour, pas de clé requise
        const langPair = sourceLanguage === 'auto' ? `en|${targetLanguage}` : `${sourceLanguage}|${targetLanguage}`;
        const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            // Gérer spécifiquement le rate limiting (429)
            if (response.status === 429) {
                throw new Error(`Rate limit exceeded. Please wait before making more requests.`);
            }
            throw new Error(`MyMemory API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
            return {
                translatedText: data.responseData.translatedText,
                detectedLanguage: data.responseData.detectedSourceLanguage || sourceLanguage
            };
        }
        
        throw new Error('MyMemory API returned invalid response');
        
    } catch (error) {
        console.error('MyMemory translation error:', error.message);
        throw error;
    }
}

export async function onRequestPost(context) {
    const { request } = context;
    
    // Gérer les requêtes OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    
    // Ajouter des logs pour le débogage
    console.log('Translation request received');
    
    try {
        const body = await request.json();
        const { text, targetLanguage = 'fr', sourceLanguage = 'auto' } = body;
        
        if (!text || typeof text !== 'string') {
            return errorResponse("Text is required and must be a string", 400);
        }
        
        if (!targetLanguage) {
            return errorResponse("Target language is required", 400);
        }
        
        // Limiter la longueur du texte (éviter les abus)
        if (text.length > 5000) {
            return errorResponse("Text too long. Maximum 5000 characters.", 400);
        }
        
        // Traduire avec MyMemory API
        console.log(`[MyMemory] Translating: "${text.substring(0, 50)}..." to ${targetLanguage}`);
        const result = await translateWithMyMemory(text, targetLanguage, sourceLanguage);
        console.log(`[MyMemory] Translation result: "${result.translatedText.substring(0, 50)}..."`);
        
        return jsonResponse({
            success: true,
            translatedText: result.translatedText,
            detectedLanguage: result.detectedLanguage,
            targetLanguage: targetLanguage,
            sourceLanguage: result.detectedLanguage,
            service: 'MyMemory'
        });
        
    } catch (error) {
        console.error("Translation error:", error);
        console.error("Error stack:", error.stack);
        
        // Retourner une erreur plus détaillée pour le débogage
        const errorMessage = error.message || "Translation service unavailable. Please try again later.";
        return errorResponse(
            {
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            500
        );
    }
}

// GET /api/translate/languages - Liste des langues supportées
export async function onRequestGet(context) {
    const { request } = context;
    
    try {
        // MyMemory supporte 179 langues, retourner la liste des langues courantes
        const fallbackLanguages = [
            { code: 'en', name: 'English' },
            { code: 'fr', name: 'Français' },
            { code: 'es', name: 'Español' },
            { code: 'de', name: 'Deutsch' },
            { code: 'it', name: 'Italiano' },
            { code: 'pt', name: 'Português' },
            { code: 'ru', name: 'Русский' },
            { code: 'ja', name: '日本語' },
            { code: 'zh', name: '中文' },
            { code: 'ar', name: 'العربية' }
        ];
        
        return jsonResponse({
            success: true,
            languages: fallbackLanguages
        });
        
    } catch (error) {
        console.error("Error fetching languages:", error);
        return errorResponse("Failed to fetch languages", 500);
    }
}

