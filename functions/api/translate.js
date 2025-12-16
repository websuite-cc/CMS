// POST /api/translate - LibreTranslate API
import { corsHeaders, jsonResponse, errorResponse } from '../shared/utils.js';

/**
 * Liste des instances LibreTranslate publiques (fallback si une est down)
 */
const LIBRETRANSLATE_INSTANCES = [
    'https://translate.argosopentech.com/translate',
    'https://libretranslate.de/translate',
    'https://translate.fortytwo-it.com/translate'
];

/**
 * Traduit un texte en utilisant MyMemory API (plus fiable que LibreTranslate)
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

/**
 * Traduit un texte en utilisant LibreTranslate (fallback)
 */
async function translateWithLibreTranslate(text, targetLanguage, sourceLanguage = 'auto', instanceIndex = 0) {
    if (instanceIndex >= LIBRETRANSLATE_INSTANCES.length) {
        throw new Error('All LibreTranslate instances failed');
    }
    
    const instanceUrl = LIBRETRANSLATE_INSTANCES[instanceIndex];
    
    try {
        // Timeout de 10 secondes pour éviter les attentes infinies
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(instanceUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                source: sourceLanguage === 'auto' ? 'auto' : sourceLanguage,
                target: targetLanguage,
                format: 'text'
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error(`LibreTranslate instance ${instanceIndex} error: ${response.status} - ${errorText}`);
            
            // Si erreur, essayer l'instance suivante
            if (instanceIndex < LIBRETRANSLATE_INSTANCES.length - 1) {
                return translateWithLibreTranslate(text, targetLanguage, sourceLanguage, instanceIndex + 1);
            }
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            console.error(`LibreTranslate API error: ${data.error}`);
            // Si erreur API, essayer l'instance suivante
            if (instanceIndex < LIBRETRANSLATE_INSTANCES.length - 1) {
                return translateWithLibreTranslate(text, targetLanguage, sourceLanguage, instanceIndex + 1);
            }
            throw new Error(data.error);
        }
        
        if (!data.translatedText) {
            throw new Error('No translated text in response');
        }
        
        return {
            translatedText: data.translatedText,
            detectedLanguage: data.detectedSourceLanguage || sourceLanguage
        };
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`LibreTranslate instance ${instanceIndex} timeout`);
        } else {
            console.error(`LibreTranslate instance ${instanceIndex} error:`, error.message);
        }
        
        // Si erreur réseau, essayer l'instance suivante
        if (instanceIndex < LIBRETRANSLATE_INSTANCES.length - 1) {
            return translateWithLibreTranslate(text, targetLanguage, sourceLanguage, instanceIndex + 1);
        }
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
        
        // Essayer d'abord MyMemory (plus fiable), puis LibreTranslate en fallback
        let result;
        let usedService = 'unknown';
        
        try {
            console.log(`[MyMemory] Translating: "${text.substring(0, 50)}..." to ${targetLanguage}`);
            result = await translateWithMyMemory(text, targetLanguage, sourceLanguage);
            usedService = 'MyMemory';
            console.log(`[MyMemory] Translation result: "${result.translatedText.substring(0, 50)}..."`);
        } catch (myMemoryError) {
            console.warn(`[MyMemory] Failed, trying LibreTranslate:`, myMemoryError.message);
            
            try {
                console.log(`[LibreTranslate] Translating: "${text.substring(0, 50)}..." to ${targetLanguage}`);
                result = await translateWithLibreTranslate(text, targetLanguage, sourceLanguage);
                usedService = 'LibreTranslate';
                console.log(`[LibreTranslate] Translation result: "${result.translatedText.substring(0, 50)}..."`);
            } catch (libreError) {
                console.error("Both translation services failed:", {
                    myMemory: myMemoryError.message,
                    libreTranslate: libreError.message
                });
                throw new Error(`Translation services unavailable: ${myMemoryError.message}`);
            }
        }
        
        return jsonResponse({
            success: true,
            translatedText: result.translatedText,
            detectedLanguage: result.detectedLanguage,
            targetLanguage: targetLanguage,
            sourceLanguage: result.detectedLanguage,
            service: usedService
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
        // Essayer de récupérer les langues depuis une instance LibreTranslate
        const response = await fetch('https://translate.argosopentech.com/languages', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const languages = await response.json();
            return jsonResponse({
                success: true,
                languages: languages
            });
        }
        
        // Fallback: liste des langues courantes
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

