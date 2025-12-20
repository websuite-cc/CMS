# 💻 Développement Local

Guide pour développer et tester WebSuite Platform en local.

## Architecture

WebSuite Platform utilise une architecture hybride :
- **Worker MCP** : Hébergé sur `mcp.websuite.cc` (géré par WebSuite)
- **CMS/Frontend** : Déployé par vous sur GitHub Pages

Pour le développement local, le frontend communique avec le worker MCP distant.

## Prérequis

- Un éditeur de code (VS Code recommandé)
- Python, Node.js, ou PHP (pour servir les fichiers statiques)

## Installation

### 1. Cloner le Projet

```bash
git clone https://github.com/VOTRE_USERNAME/StackPagesCMS.git
cd StackPagesCMS/ProdBeta
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

### Option 1 : Avec Python

```bash
python -m http.server 8000
```

### Option 2 : Avec Node.js

```bash
npx http-server
```

### Option 3 : Avec PHP

```bash
php -S localhost:8000
```

Le serveur démarre sur `http://localhost:8000`

## Configuration du Worker MCP

Le worker MCP est hébergé sur `https://mcp.websuite.cc` et gère toutes les variables d'environnement.

### Communication avec le Worker

Tous les appels API pointent automatiquement vers le worker MCP distant :

- `GET https://mcp.websuite.cc/api/posts` - Liste des articles
- `GET https://mcp.websuite.cc/api/videos` - Liste des vidéos
- `GET https://mcp.websuite.cc/api/podcasts` - Liste des podcasts
- `GET https://mcp.websuite.cc/api/events` - Liste des événements

Le worker MCP gère :
- Les variables d'environnement (RSS feeds, admin password)
- Le parsing RSS
- Le cache
- L'authentification
- Les MCP Workers

> 💡 **Note** : Pour le développement local, les variables dans `.dev.vars` sont utilisées uniquement pour la configuration locale. Le worker MCP distant utilise ses propres variables configurées par WebSuite.

## Workflow de Développement

### 1. Faire des Modifications

Éditez les fichiers dans votre éditeur. Les modifications sont prises en compte automatiquement.

### 2. Tester Localement

- Frontend : `http://localhost:8000`
- Admin : `http://localhost:8000/admin`
- API : Les appels API pointent vers `https://mcp.websuite.cc/api/*`

### 3. Déboguer

Utilisez `console.log()` dans le code. Les logs apparaissent dans le terminal où Wrangler tourne.

### 4. Tester les API

```bash
# Tester les articles (via le worker MCP distant)
curl https://mcp.websuite.cc/api/posts

# Tester avec authentification
curl -H "X-Auth-Key: votre_password" \
     https://mcp.websuite.cc/api/config
```

## Structure de Développement

### Modifier le Frontend

Les templates sont dans `frontend/index.html`. Les modifications sont visibles immédiatement après rechargement.

### Modifier l'Admin

L'interface admin est dans `admin/dashboard.html` et `core/admin.js`.

> ⚠️ **Note** : L'API backend est gérée par le worker MCP distant. Pour modifier l'API, contactez WebSuite.

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
- Rechargez la page dans le navigateur

### Cache Persistant

Le cache est géré par le worker MCP distant. Pour le vider :

1. Utilisez l'interface admin : `/admin` → Configuration → Vider le cache
2. Ou contactez WebSuite pour vider le cache sur le worker MCP

## Prochaines Étapes

- [Structure du projet](structure.md)
- [API Documentation](../api/overview.md)
- [Déploiement sur GitHub Pages](../deployment/github-pages.md)

