# 💻 Développement Local

Guide pour développer et tester WebSuite Platform en local.

## Prérequis

- [Bun](https://bun.sh) installé (runtime JavaScript)
- Un éditeur de code (VS Code recommandé)

## Installation

### 1. Cloner le Projet

```bash
git clone https://github.com/VOTRE_USERNAME/WebSuitePlatform.git
cd WebSuitePlatform/ProdBeta
```

### 2. Configurer les Variables

Créez un fichier `.dev.vars` à la racine :

```bash
cp .dev.vars.example .dev.vars
```

Éditez `.dev.vars` :

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=votre_password_securise
BLOG_FEED_URL=https://votrecompte.substack.com/feed
YOUTUBE_FEED_URL=https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID
PODCAST_FEED_URL=https://anchor.fm/s/VOTRE_ID/podcast/rss
EVENTS_FEED_URL=https://www.meetup.com/fr-fr/votre-groupe/events/rss
```

> ⚠️ **Important** : `.dev.vars` est dans `.gitignore` - ne sera pas commité.

## Lancer le Serveur Local

### Avec Bun (Recommandé)

```bash
bun server.js
```

Le serveur démarre sur `http://localhost:8000`

Le serveur local (`server.js`) simule le comportement de Cloudflare Pages Functions, incluant :
- Routing des requêtes
- SSR avec HTMX
- API endpoints
- Gestion des variables d'environnement
- Cache en mémoire

### Avec Wrangler (Alternative)

```bash
npx wrangler pages dev . --compatibility-date=2024-12-25
```

Le serveur démarre sur `http://localhost:8788`

## Workflow de Développement

### 1. Faire des Modifications

Éditez les fichiers dans votre éditeur. Pour les modifications de `server.js` ou des fonctions, redémarrez le serveur.

### 2. Tester Localement

- Frontend : `http://localhost:8000`
- Admin : `http://localhost:8000/admin`
- API : `http://localhost:8000/api/posts`, `/api/videos`, etc.

### 3. Déboguer

Utilisez `console.log()` dans le code. Les logs apparaissent dans le terminal où le serveur tourne.

### 4. Tester les API

```bash
# Tester les articles
curl http://localhost:8000/api/posts

# Tester avec authentification
curl -H "X-Auth-Key: votre_password" \
     http://localhost:8000/api/config
```

## Structure de Développement

### Modifier le Frontend

Les templates sont dans `frontend/index.html`. Les modifications sont visibles immédiatement après rechargement.

### Modifier l'Admin

L'interface admin est dans `admin/dashboard.html` et `core/admin.js`.

### Modifier l'API Backend

Les endpoints API sont dans `functions/api/`. Toutes les modifications sont dans le même projet.

## Outils de Développement

### VS Code Extensions Recommandées

- **Tailwind CSS IntelliSense** - Autocomplétion Tailwind
- **Prettier** - Formatage de code
- **ESLint** - Linting JavaScript

### Débogage

#### Logs Console

```javascript
// Dans functions/api/posts.js
console.log('Fetching posts...');
```

#### Erreurs

Les erreurs sont affichées dans le terminal Wrangler et dans la console du navigateur.

## Tests

### Tester les Endpoints

```bash
# Script de test simple
./test-api.sh
```

### Tester le Cache

1. Faire une requête API
2. Vérifier le temps de réponse
3. Faire la même requête (devrait être plus rapide)
4. Attendre 180 secondes et retester

## Hot Reload

Pour les serveurs HTTP simples, rechargez manuellement la page dans le navigateur après chaque modification.

Pour un hot reload automatique, utilisez un outil comme `live-server` :

```bash
npm install -g live-server
live-server
```

## Variables d'Environnement

Les variables dans `.dev.vars` sont utilisées pour le développement local uniquement.

Pour les modifier :

1. Éditez `.dev.vars`
2. Rechargez la page dans le navigateur

> 💡 **Note** : Pour la production, les variables sont configurées sur le worker MCP distant (`mcp.websuite.cc`) par WebSuite.

## Débogage Avancé

### Mode Debug

Utilisez les DevTools du navigateur (Console et Network) pour déboguer.

### Inspecter les Requêtes

Utilisez les DevTools du navigateur (Network tab) pour inspecter les requêtes.

## Problèmes Courants

### Port Déjà Utilisé

```bash
# Avec Python, utiliser un autre port
python -m http.server 8001

# Avec Node.js
npx http-server -p 8001
```

### Variables Non Chargées

- Vérifiez que `.dev.vars` existe
- Vérifiez la syntaxe (pas d'espaces autour du `=`)
- Redémarrez le serveur après modification de `.dev.vars`

### Cache Persistant

Le cache est géré localement en mémoire. Pour le vider :

1. Utilisez l'interface admin : `/admin` → Configuration → Vider le cache
2. Ou redémarrez le serveur (`bun server.js`)

## Prochaines Étapes

- [Structure du projet](#/docs/guide/structure)
- [API Documentation](#/docs/api/overview)
- [Déploiement sur Cloudflare Pages](#/docs/deployment/cloudflare-pages)

