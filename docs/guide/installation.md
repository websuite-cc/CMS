# 📦 Installation

Guide détaillé pour installer et configurer WebSuite CMS.

## Installation Locale

### Prérequis

- [Node.js](https://nodejs.org/) (v18 ou supérieur)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (CLI Cloudflare)

### Étapes d'Installation

#### 1. Installer Wrangler

```bash
npm install -g wrangler
```

#### 2. Cloner le Repository

```bash
git clone https://github.com/VOTRE_USERNAME/StackPagesCMS.git
cd StackPagesCMS/ProdBeta
```

#### 3. Créer les Variables d'Environnement

Créez un fichier `.dev.vars` à la racine du projet :

```bash
cp .dev.vars.example .dev.vars
```

Éditez `.dev.vars` avec vos valeurs :

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=votre_password_securise
BLOG_FEED_URL=https://votrecompte.substack.com/feed
YOUTUBE_FEED_URL=https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID
PODCAST_FEED_URL=https://anchor.fm/s/VOTRE_ID/podcast/rss
EVENTS_FEED_URL=https://www.meetup.com/fr-fr/votre-groupe/events/rss
```

> ⚠️ **Sécurité** : Le fichier `.dev.vars` est déjà dans `.gitignore` et ne sera jamais commité.

#### 4. Lancer le Serveur de Développement

```bash
npx wrangler pages dev . --compatibility-date=2024-12-12
```

Le serveur démarre sur `http://localhost:8788`

### Structure des Fichiers

```
ProdBeta/
├── index.html              # Page d'accueil frontend
├── admin/                  # Interface admin
│   ├── index.html          # Page de login
│   └── dashboard.html      # Dashboard principal
├── core/                   # Scripts JavaScript
│   ├── admin.js            # Logique dashboard
│   └── frontend.js         # Utilitaires frontend
├── functions/              # Cloudflare Pages Functions
│   ├── _middleware.js      # Routeur principal
│   ├── api/                # Endpoints API
│   └── shared/             # Utilitaires partagés
├── frontend/               # Templates frontend
├── config.json             # Configuration globale
└── .dev.vars               # Variables d'environnement (local)
```

## Installation en Production

### Déploiement sur Cloudflare Pages

Voir le guide [Déploiement sur Cloudflare Pages](../deployment/cloudflare-pages.md) pour les instructions complètes.

### Variables d'Environnement en Production

Dans le dashboard Cloudflare Pages :

1. **Settings** → **Environment variables**
2. Ajoutez toutes les variables nécessaires
3. Marquez les variables sensibles (comme `ADMIN_PASSWORD`) comme **Encrypted**

## Vérification de l'Installation

### Test Local

1. Lancez le serveur : `npx wrangler pages dev .`
2. Ouvrez `http://localhost:8788`
3. Vérifiez que la page d'accueil s'affiche
4. Testez l'admin : `http://localhost:8788/admin`

### Test des API

```bash
# Tester l'endpoint des articles
curl http://localhost:8788/api/posts

# Tester l'endpoint des vidéos
curl http://localhost:8788/api/videos

# Tester l'endpoint des podcasts
curl http://localhost:8788/api/podcasts

# Tester l'endpoint des événements
curl http://localhost:8788/api/events
```

## Dépannage

### Erreur : "Cannot find module"

```bash
# Réinstaller les dépendances
npm install
```

### Erreur : "Invalid credentials"

Vérifiez que vos variables d'environnement sont correctement définies dans `.dev.vars`.

### Erreur : "Feed URL not found"

Assurez-vous que les URLs de flux RSS sont valides et accessibles.

## Prochaines Étapes

- [Développement Local](development.md)
- [Configuration](../configuration/overview.md)
- [API Documentation](../api/overview.md)

