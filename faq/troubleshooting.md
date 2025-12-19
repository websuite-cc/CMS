# 🔧 Dépannage

Guide de résolution des problèmes courants.

## Problèmes de Déploiement

### Erreur : "Build failed"

**Cause** : Configuration de build incorrecte.

**Solution** :
- Vérifiez que **Build command** est vide
- Vérifiez que **Build output directory** est `/`

### Variables d'environnement non disponibles

**Cause** : Variables non définies ou mal configurées.

**Solution** :
1. Allez dans **Settings** → **Environment variables**
2. Vérifiez que toutes les variables sont définies
3. Redéployez après avoir ajouté des variables

## Problèmes d'API

### Erreur 404 sur les endpoints

**Cause** : Route non trouvée.

**Solution** :
- Vérifiez l'URL de l'endpoint
- Vérifiez que le fichier existe dans `functions/api/`
- Vérifiez les logs dans Cloudflare Dashboard

### Erreur 401 Unauthorized

**Cause** : Authentification manquante ou incorrecte.

**Solution** :
- Vérifiez que le header `X-Auth-Key` est présent
- Vérifiez que le mot de passe correspond à `ADMIN_PASSWORD`
- Vérifiez que la variable d'environnement est définie

### Erreur 500 Internal Server Error

**Cause** : Erreur serveur.

**Solution** :
1. Vérifiez les logs dans Cloudflare Dashboard
2. Vérifiez que les URLs de flux RSS sont valides
3. Vérifiez que les variables d'environnement sont correctes

## Problèmes de Contenu

### Aucun contenu affiché

**Cause** : Flux RSS invalide ou inaccessible.

**Solution** :
1. Testez l'URL du flux RSS dans un navigateur
2. Vérifiez que le flux est accessible publiquement
3. Vérifiez le format XML du flux
4. Videz le cache avec `/api/clear-cache`

### Contenu non mis à jour

**Cause** : Cache actif.

**Solution** :
- Attendez 180 secondes (durée du cache)
- Utilisez `/api/clear-cache` pour forcer le rafraîchissement
- Vérifiez que le nouveau contenu est bien dans le flux RSS

### Images manquantes

**Cause** : Images non extraites du flux RSS.

**Solution** :
- Vérifiez que le flux RSS contient des images
- Certains flux peuvent ne pas inclure d'images
- Une image placeholder est utilisée par défaut

## Problèmes d'Admin

### Impossible de se connecter

**Cause** : Identifiants incorrects.

**Solution** :
1. Vérifiez que `ADMIN_EMAIL` correspond
2. Vérifiez que `ADMIN_PASSWORD` correspond
3. Vérifiez que les variables sont bien définies
4. Videz le cache du navigateur

### Dashboard ne charge pas

**Cause** : Erreur JavaScript ou API.

**Solution** :
1. Ouvrez la console du navigateur (F12)
2. Vérifiez les erreurs JavaScript
3. Vérifiez que les endpoints API répondent
4. Vérifiez la connexion réseau

## Problèmes de Performance

### Requêtes lentes

**Cause** : Cache non utilisé ou flux RSS lent.

**Solution** :
- Vérifiez que le cache fonctionne (deuxième requête plus rapide)
- Vérifiez la vitesse du flux RSS source
- Utilisez le CDN Cloudflare (automatique)

### Limite de requêtes atteinte

**Cause** : Trop de requêtes (100k/jour sur plan gratuit).

**Solution** :
- Optimisez l'utilisation du cache
- Réduisez la fréquence des requêtes
- Passez à un plan payant si nécessaire

## Problèmes Locaux

### Wrangler ne démarre pas

**Cause** : Port occupé ou configuration incorrecte.

**Solution** :
```bash
# Utiliser un autre port
npx wrangler pages dev . --port=8789

# Vérifier la configuration
npx wrangler pages dev . --compatibility-date=2024-12-12
```

### Variables non chargées en local

**Cause** : Fichier `.dev.vars` manquant ou mal formaté.

**Solution** :
1. Vérifiez que `.dev.vars` existe à la racine
2. Vérifiez la syntaxe (pas d'espaces autour du `=`)
3. Redémarrez Wrangler

### Cache persistant en local

**Cause** : Cache Wrangler non vidé.

**Solution** :
```bash
# Vider le cache
rm -rf .wrangler

# Relancer
npx wrangler pages dev .
```

## Logs et Debugging

### Voir les logs

**Cloudflare Dashboard** :
1. Allez dans **Workers & Pages**
2. Sélectionnez votre projet
3. Cliquez sur **Logs**

**Local (Wrangler)** :
Les logs apparaissent directement dans le terminal.

### Mode Debug

```bash
# Wrangler en mode verbose
npx wrangler pages dev . --log-level=debug
```

### Console du Navigateur

Ouvrez les DevTools (F12) pour voir :
- Erreurs JavaScript
- Requêtes réseau
- Logs console

## Obtenir de l'Aide

Si le problème persiste :

1. 📧 Email : cms@iziweb.page
2. 🐛 [GitHub Issues](https://github.com/iziweb-studio/CMS/issues)
3. 📖 [Documentation complète](README.md)

Incluez dans votre demande :
- Description du problème
- Messages d'erreur
- Étapes pour reproduire
- Configuration (sans mots de passe)

