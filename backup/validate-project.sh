#!/bin/bash

# ====================================================================
# SCRIPT DE VALIDATION - StackPages CMS
# ====================================================================
# Teste la compatibilité Cloudflare Pages et clean code

echo "🔍 Validation du projet StackPages CMS..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'  # No Color

TESTS_PASSED=0
TESTS_FAILED=0

test_check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((TESTS_FAILED++))
    fi
}

# ====================================================================
# 1. STRUCTURE FICHIERS
# ====================================================================
echo "📂 Test 1 : Structure des fichiers"

[ -d "functions" ]
test_check $? "Dossier functions/ existe"

[ -d "functions/api" ]
test_check $? "Dossier functions/api/ existe"

[ -d "functions/shared" ]
test_check $? "Dossier functions/shared/ existe"

[ -f "functions/_middleware.js" ]
test_check $? "Middleware global existe"

# ====================================================================
# 2. MODULES PARTAGÉS
# ====================================================================
echo ""
echo "📦 Test 2 : Modules partagés"

[ -f "functions/shared/utils.js" ]
test_check $? "utils.js existe"

[ -f "functions/shared/rss-parser.js" ]
test_check $? "rss-parser.js existe"

[ -f "functions/shared/cache.js" ]
test_check $? "cache.js existe"

# ====================================================================
# 3. ROUTES API
# ====================================================================
echo ""
echo "🛣️  Test 3 : Routes API"

EXPECTED_ROUTES=(
    "functions/api/login.js"
    "functions/api/logout.js"
    "functions/api/metadata.js"
    "functions/api/posts.js"
    "functions/api/post/[slug].js"
    "functions/api/videos.js"
    "functions/api/video/[id].js"
    "functions/api/podcasts.js"
    "functions/api/podcast/[id].js"
    "functions/api/config.js"
    "functions/api/clear-cache.js"
)

for route in "${EXPECTED_ROUTES[@]}"; do
    [ -f "$route" ]
    test_check $? "Route $route existe"
done

# ====================================================================
# 4. SYNTAXE JAVASCRIPT
# ====================================================================
echo ""
echo "✏️  Test 4 : Syntaxe JavaScript (node -c)"

JS_FILES=$(find functions -name "*.js")
SYNTAX_ERRORS=0

for file in $JS_FILES; do
    if node -c "$file" 2>/dev/null; then
        : # Syntaxe OK
    else
        echo -e "${RED}   Erreur syntaxe: $file${NC}"
        ((SYNTAX_ERRORS++))
    fi
done

[ $SYNTAX_ERRORS -eq 0 ]
test_check $? "Aucune erreur de syntaxe ($SYNTAX_ERRORS erreurs)"

# ====================================================================
# 5. EXPORTS CLOUDFLARE PAGES
# ====================================================================
echo ""
echo "🔌 Test 5 : Exports Cloudflare Pages Functions"

# Middleware doit exporter onRequest
grep -q "export async function onRequest" functions/_middleware.js
test_check $? "Middleware exporte onRequest"

# Routes API doivent exporter onRequestGet ou onRequestPost
grep -rq "export async function onRequest" functions/api/
test_check $? "Routes API exportent onRequest*"

# ====================================================================
# 6. IMPORTS ES MODULES
# ====================================================================
echo ""
echo "📥 Test 6 : Imports ES Modules"

# Vérifier pas de require() (Node.js CommonJS)
if grep -rq "require(" functions/*.js functions/**/*.js 2>/dev/null; then
    test_check 1 "Pas de require() (CommonJS)"
else
    test_check 0 "Imports ES Modules uniquement"
fi

# Vérifier imports relatifs corrects
grep -r "import.*from '.*/utils.js'" functions/api/ > /dev/null
test_check $? "Imports relatifs corrects vers shared/"

# ====================================================================
# 7. COMPATIBILITÉ CLOUDFLARE PAGES
# ====================================================================
echo ""
echo "☁️  Test 7 : Compatibilité Cloudflare Pages"

# Vérifier env.ASSETS.fetch()
grep -q "env.ASSETS.fetch" functions/_middleware.js
test_check $? "Middleware utilise env.ASSETS.fetch()"

# Vérifier paramètres dynamiques [slug], [id]
[ -f "functions/api/post/[slug].js" ]
test_check $? "Paramètres dynamiques [slug] présents"

# Vérifier context.params
grep -rq "params.slug\|params.id" functions/api/ 
test_check $? "Routes utilisent context.params"

# ====================================================================
# 8. HEADERS CORS
# ====================================================================
echo ""
echo "🌐 Test 8 : Headers CORS"

grep -q "corsHeaders" functions/shared/utils.js
test_check $? "corsHeaders définis dans utils.js"

grep -q "Access-Control-Allow-Origin" functions/shared/utils.js
test_check $? "CORS headers incluent Allow-Origin"

# ====================================================================
# 9. GESTION CACHE
# ====================================================================
echo ""
echo "💾 Test 9 : Gestion du cache"

grep -q "getCachedRSSData\|getCachedYoutubeData\|getCachedPodcastData" functions/shared/cache.js
test_check $? "Fonctions de cache présentes"

grep -q "caches.default" functions/shared/cache.js
test_check $? "Utilise Cloudflare Cache API"

# ====================================================================
# 10. AUTHENTIFICATION
# ====================================================================
echo ""
echo "🔐 Test 10 : Authentification"

grep -q "isAuthenticated" functions/shared/utils.js
test_check $? "Fonction isAuthenticated définie"

grep -q "X-Auth-Key" functions/shared/utils.js
test_check $? "Header X-Auth-Key utilisé"

grep -rq "isAuthenticated" functions/api/config.js functions/api/clear-cache.js
test_check $? "Routes protégées utilisent isAuthenticated"

# ====================================================================
# RÉSUMÉ
# ====================================================================
echo ""
echo "======================================================================" 
echo -e "${GREEN}Tests réussis : $TESTS_PASSED${NC}"
echo -e "${RED}Tests échoués : $TESTS_FAILED${NC}"
echo "======================================================================"

# Résultat récapitulatif
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║   ✅ VALIDATION RÉUSSIE !                               ║"
    echo "║                                                          ║"
    echo "║   Votre projet est prêt pour Cloudflare Pages ! 🚀      ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo "Prochaine étape : npx wrangler pages deploy ."
    echo ""
    exit 0
else
    echo -e "${RED}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║   ⚠️  DES ERREURS ONT ÉTÉ DÉTECTÉES                     ║" 
    echo "║                                                          ║"
    echo "║   Corrigez les erreurs avant de déployer.               ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    exit 1
fi
