# 💻 Développement Local

Guide pour développer et tester WebSuite CMS en local.

## Prérequis

- [Node.js](https://nodejs.org/) v18 ou supérieur
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- Un éditeur de code (VS Code recommandé)

## Installation

### 1. Installer Wrangler

```bash
npm install -g wrangler
```

### 2. Cloner le Projet

```bash
git clone https://github.com/VOTRE_USERNAME/StackPagesCMS.git
cd StackPagesCMS/ProdBeta
```

### 3. Configurer les Variables

Créez un fichier `.dev.vars` :

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

## Lancer le Serveur

```bash
npx wrangler pages dev . --compatibility-date=2024-12-12
```

Le serveur démarre sur `http://localhost:8788`

## Workflow de Développement

### 1. Faire des Modifications

Éditez les fichiers dans votre éditeur. Les modifications sont prises en compte automatiquement.

### 2. Tester Localement

- Frontend : `http://localhost:8788`
- Admin : `http://localhost:8788/admin`
- API : `http://localhost:8788/api/posts`

### 3. Déboguer

Utilisez `console.log()` dans le code. Les logs apparaissent dans le terminal où Wrangler tourne.

### 4. Tester les API

```bash
# Tester les articles
curl http://localhost:8788/api/posts

# Tester avec authentification
curl -H "X-Auth-Key: votre_password" \
     http://localhost:8788/api/config
```

## Structure de Développement

### Modifier l'API

Les endpoints sont dans `functions/api/`. Modifiez le fichier correspondant et rechargez.

### Modifier le Frontend

Les templates sont dans `frontend/index.html`. Les modifications sont visibles immédiatement.

### Modifier l'Admin

L'interface admin est dans `admin/dashboard.html` et `core/admin.js`.

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

Wrangler recharge automatiquement les modifications. Parfois, un redémarrage manuel est nécessaire :

```bash
# Arrêter avec Ctrl+C
# Relancer
npx wrangler pages dev . --compatibility-date=2024-12-12
```

## Variables d'Environnement

Les variables dans `.dev.vars` sont chargées automatiquement. Pour les modifier :

1. Éditez `.dev.vars`
2. Redémarrez Wrangler

## Débogage Avancé

### Mode Verbose

```bash
npx wrangler pages dev . --compatibility-date=2024-12-12 --log-level=debug
```

### Inspecter les Requêtes

Utilisez les DevTools du navigateur (Network tab) pour inspecter les requêtes.

## Problèmes Courants

### Port Déjà Utilisé

```bash
# Utiliser un autre port
npx wrangler pages dev . --port=8789
```

### Variables Non Chargées

- Vérifiez que `.dev.vars` existe
- Vérifiez la syntaxe (pas d'espaces autour du `=`)
- Redémarrez Wrangler

### Cache Persistant

Le cache local peut persister. Pour le vider :

```bash
# Vider le cache Wrangler
rm -rf .wrangler
```

## Prochaines Étapes

- [Structure du projet](structure.md)
- [API Documentation](api/overview.md)
- [Déploiement](deployment/cloudflare-pages.md)

