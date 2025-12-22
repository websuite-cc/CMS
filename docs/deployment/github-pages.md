# 🚀 Déploiement sur GitHub Pages

Guide complet pour déployer WebSuite Platform sur GitHub Pages.

## Architecture

WebSuite Platform utilise une architecture hybride :
- **Worker MCP** : Hébergé sur `mcp.websuite.cc` (géré par WebSuite)
- **CMS/Frontend** : Déployé par vous sur GitHub Pages

Tous les appels API pointent automatiquement vers le worker MCP distant.

## Prérequis

- Un compte GitHub
- Un repository GitHub
- Le code source de WebSuite Platform

## Méthode 1 : Via GitHub Settings (Recommandé)

### Étape 1 : Pousser le Code

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Étape 2 : Activer GitHub Pages

1. Allez sur votre repository GitHub
2. Cliquez sur **Settings** → **Pages**
3. Sous **Source**, sélectionnez :
   - **Branch** : `main` (ou `master`)
   - **Folder** : `/` (root)
4. Cliquez sur **Save**

### Étape 3 : Votre Site est en Ligne !

Votre CMS sera disponible sur :
```
https://votre-username.github.io/votre-repo
```

## Configuration du Worker MCP

Le worker MCP sur `mcp.websuite.cc` est automatiquement configuré pour :
- Parser les flux RSS
- Gérer le cache
- Exposer les MCP Workers
- Fournir l'API backend

### Configuration des Variables

Pour le développement local, créez un fichier `.dev.vars` :

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=votre_password_securise
BLOG_FEED_URL=https://votrecompte.substack.com/feed
YOUTUBE_FEED_URL=https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID
PODCAST_FEED_URL=https://anchor.fm/s/VOTRE_ID/podcast/rss
EVENTS_FEED_URL=https://www.meetup.com/fr-fr/votre-groupe/events/rss
```

> ⚠️ **Note** : `.dev.vars` est dans `.gitignore` - ne sera pas commité.

### Pour la Production

Pour la production, contactez WebSuite pour configurer vos variables d'environnement sur le worker MCP distant (`mcp.websuite.cc`).

## Domaine Personnalisé

1. Allez dans **Settings** → **Pages**
2. Sous **Custom domain**, entrez votre domaine
3. Configurez votre DNS selon les instructions GitHub :
   - **Type A** : `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - **Type CNAME** : `votre-username.github.io`
4. Activez **Enforce HTTPS**

## Avantages de GitHub Pages

- ✅ Gratuit et illimité
- ✅ SSL automatique
- ✅ Déploiement automatique via Git
- ✅ CDN global
- ✅ Pas de configuration serveur
- ✅ Worker MCP géré par WebSuite

## Communication avec le Worker MCP

Tous les appels API dans votre code pointent automatiquement vers `https://mcp.websuite.cc/api/*` :

- `GET https://mcp.websuite.cc/api/posts` - Liste des articles
- `GET https://mcp.websuite.cc/api/videos` - Liste des vidéos
- `GET https://mcp.websuite.cc/api/podcasts` - Liste des podcasts
- `GET https://mcp.websuite.cc/api/events` - Liste des événements
- `POST https://mcp.websuite.cc/api/login` - Authentification

Le worker MCP gère :
- Les variables d'environnement (RSS feeds, admin password)
- Le parsing RSS
- Le cache
- L'authentification
- Les MCP Workers

## Développement Local

Pour tester localement :

```bash
# Créer .dev.vars avec vos variables
cp .dev.vars.example .dev.vars

# Lancer un serveur HTTP local
python -m http.server 8000
# ou
npx http-server
# ou
php -S localhost:8000

# Ouvrir dans le navigateur
open http://localhost:8000
```

Le frontend communiquera automatiquement avec le worker MCP sur `mcp.websuite.cc`.

## Dépannage

### Le site ne se charge pas

- Vérifiez que GitHub Pages est activé dans Settings → Pages
- Vérifiez que la branche `main` est sélectionnée
- Attendez quelques minutes pour la propagation DNS

### Les appels API échouent

- Vérifiez que le worker MCP est accessible : `https://mcp.websuite.cc`
- Vérifiez la console du navigateur pour les erreurs CORS
- Contactez WebSuite si le problème persiste

### Variables d'environnement

- Pour le développement local : utilisez `.dev.vars`
- Pour la production : contactez WebSuite pour configurer les variables sur le worker MCP

## Prochaines Étapes

- 📖 [Configuration des flux RSS](../configuration/rss-feeds.md)
- 🎨 [Personnaliser l'interface](../admin/dashboard.md)
- 🔌 [Utiliser l'API](../api/overview.md)
- 🌐 [Configurer un domaine personnalisé](custom-domain.md)

