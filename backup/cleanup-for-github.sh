#!/bin/bash

# ====================================================================
# SCRIPT DE NETTOYAGE - Fichiers inutiles pour GitHub
# ====================================================================

echo "🧹 Nettoyage du projet pour GitHub opensource..."
echo ""

# Fichiers à supprimer (générés pendant le développement, inutiles pour GitHub)
FILES_TO_DELETE=(
    "FINAL_RECAP.md"
    "MICROSERVICES_SUMMARY.txt"
    "DEPLOY_NOW.txt"
    "VALIDATION_REPORT.md"
    "test-config.sh"
    "_worker.js"
    "FILES_AUDIT.md"  # Ce fichier lui-même après lecture
)

echo "📋 Fichiers à supprimer :"
for file in "${FILES_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        echo "   - $file"
    fi
done

echo ""
read -p "⚠️  Confirmer la suppression ? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🗑️  Suppression en cours..."
    
    for file in "${FILES_TO_DELETE[@]}"; do
        if [ -f "$file" ]; then
            rm "$file"
            echo "   ✅ Supprimé : $file"
        fi
    done
    
    echo ""
    echo "✅ Nettoyage terminé !"
    echo ""
    echo "📁 Fichiers conservés :"
    echo "   ✅ README.md"
    echo "   ✅ QUICK_START.md"
    echo "   ✅ CLOUDFLARE_PAGES_DEPLOY.md"
    echo "   ✅ MICROSERVICES_ARCHITECTURE.md"
    echo "   ✅ CHANGELOG.md"
    echo "   ✅ wrangler.toml"
    echo "   ✅ .dev.vars.example"
    echo "   ✅ validate-project.sh"
    echo ""
    echo "🎯 Votre projet est maintenant prêt pour GitHub !"
else
    echo ""
    echo "❌ Nettoyage annulé."
fi
