#!/bin/bash
# Script pour télécharger les assets nécessaires pour le mode offline

echo "📥 Téléchargement des assets pour le mode offline..."

# Créer les dossiers
mkdir -p static/js static/css static/webfonts

# Télécharger Tailwind CSS Play CDN (standalone)
echo "📦 Téléchargement de Tailwind CSS..."
curl -L https://cdn.tailwindcss.com -o static/js/tailwindcss.js || {
    echo "⚠️  Échec du téléchargement de Tailwind CSS"
    echo "   Vous pouvez le télécharger manuellement depuis: https://cdn.tailwindcss.com"
    echo "   Et le placer dans: static/js/tailwindcss.js"
}

# Télécharger HTMX
echo "📦 Téléchargement de HTMX..."
curl -L https://unpkg.com/htmx.org@1.9.10/dist/htmx.min.js -o static/js/htmx.min.js || {
    echo "⚠️  Échec du téléchargement de HTMX"
    echo "   Vous pouvez le télécharger manuellement depuis: https://unpkg.com/htmx.org@1.9.10/dist/htmx.min.js"
    echo "   Et le placer dans: static/js/htmx.min.js"
}

# Télécharger Font Awesome CSS
echo "📦 Téléchargement de Font Awesome CSS..."
curl -L https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css -o static/css/all.min.css.tmp || {
    echo "⚠️  Échec du téléchargement de Font Awesome CSS"
    echo "   Vous pouvez le télécharger manuellement depuis: https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    echo "   Et le placer dans: static/css/all.min.css"
    exit 1
}

# Corriger les chemins vers les webfonts pour qu'ils pointent vers /static/webfonts/
echo "🔧 Correction des chemins dans le CSS Font Awesome..."
sed 's|url(../webfonts/|url(/static/webfonts/|g' static/css/all.min.css.tmp > static/css/all.min.css
rm static/css/all.min.css.tmp
echo "   ✅ Chemins corrigés"

# Télécharger les webfonts Font Awesome
echo "📦 Téléchargement des webfonts Font Awesome..."
cd static/webfonts
for font in fa-brands-400.woff2 fa-regular-400.woff2 fa-solid-900.woff2; do
    echo "  - $font"
    curl -L "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/$font" -o "$font" || {
        echo "    ⚠️  Échec pour $font"
    }
done
cd ../..

echo ""
echo "✅ Téléchargement terminé!"
echo ""
echo "Les fichiers sont maintenant disponibles dans le dossier static/"
echo "Le serveur servira automatiquement ces fichiers en mode offline."

