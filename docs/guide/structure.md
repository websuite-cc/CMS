# 📁 Structure du Projet

Vue d'ensemble de l'architecture et de l'organisation du code.

## Structure des Dossiers

```
ProdBeta/
├── index.html              # Page d'accueil frontend
├── admin/                  # Interface admin
│   ├── index.html          # Page de login
│   ├── dashboard.html      # Dashboard principal
│   └── ide.html            # IDE intégré
├── core/                   # Scripts JavaScript
│   ├── admin.js            # Logique dashboard
│   └── frontend.js         # Utilitaires frontend
├── functions/              # Cloudflare Pages Functions
│   ├── _middleware.js      # Routeur principal
│   ├── api/                # Endpoints API
│   │   ├── posts.js        # Liste articles
│   │   ├── post/           # Article spécifique
│   │   ├── videos.js       # Liste vidéos
│   │   ├── video/          # Vidéo spécifique
│   │   ├── podcasts.js     # Liste podcasts
│   │   ├── podcast/        # Podcast spécifique
│   │   ├── events.js       # Liste événements
│   │   ├── event/          # Événement spécifique
│   │   ├── config.js       # Configuration
│   │   ├── login.js        # Authentification
│   │   └── clear-cache.js  # Gestion cache
│   └── shared/             # Utilitaires partagés
│       ├── rss-parser.js   # Parsing RSS
│       ├── cache.js        # Gestion cache
│       ├── htmx-render.js  # Rendu HTMX
│       └── utils.js        # Utilitaires
├── frontend/               # Templates frontend
│   └── index.html          # Template principal
├── config.json             # Configuration globale
└── .dev.vars               # Variables d'environnement (local)
```

## Fichiers Principaux

### `index.html`
Page d'accueil du frontend avec templates HTMX pour le rendu dynamique.

### `admin/dashboard.html`
Interface admin complète avec :
- Statistiques
- Gestion du contenu
- API Explorer
- Configuration

### `functions/_middleware.js`
Routeur principal qui :
- Gère toutes les routes
- Sert les fichiers statiques
- Route les requêtes API
- Gère le rendu HTMX

### `functions/shared/rss-parser.js`
Parse les différents formats RSS :
- Substack (articles)
- YouTube (vidéos)
- Podcasts (Anchor, Spotify, etc.)
- Meetup (événements)

### `functions/shared/cache.js`
Gère le cache avec :
- TTL de 180 secondes
- Cache Cloudflare
- Fonctions de rafraîchissement

## Architecture

### Architecture Serverless

WebSuite CMS utilise une architecture serverless avec Edge Functions :

```
┌─────────────────────────────────────────┐
│     Cloudflare Pages                    │
│  Frontend + Backend (Edge Functions)    │
│  - HTML statique                        │
│  - Edge Functions (_middleware.js)      │
│  - API REST                             │
│  - SSR avec HTMX                        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     Sources RSS                         │
│  - Substack (Articles)                  │
│  - YouTube (Vidéos)                     │
│  - Podcasts (RSS)                       │
│  - Meetup (Événements)                  │
└─────────────────────────────────────────┘
```

### Frontend
- **HTML statique** avec templates
- **HTMX** pour le rendu dynamique (SSR)
- **TailwindCSS** pour le styling
- **JavaScript vanilla** pour l'interactivité
- **Appels API** vers `/api/*` (même domaine)

### Backend (Edge Functions)
- **Middleware** - Routing et SSR (`_middleware.js`)
- **API REST** - Endpoints API (`functions/api/`)
- **RSS Parsing** - Extraction des données (`functions/shared/rss-parser.js`)
- **Cache** - Gestion du cache (180s, Cloudflare Cache)
- **HTMX Rendering** - Rendu côté serveur (`functions/shared/htmx-render.js`)

### Déploiement
- **Cloudflare Pages** - Hébergement complet (frontend + backend)
- **Edge Functions** - Exécution sur le réseau Cloudflare
- **Git** - Déploiement automatique
- **CDN Global** - Distribution via Cloudflare (300+ datacenters)

## Flux de Données

```
RSS Feed → Edge Function (_middleware.js)
                ↓
            Parser → Cache → API
                ↓
            SSR HTMX / API Response
                ↓
            Frontend (Browser)
                ↓
            Admin Dashboard
```

1. **RSS Feed** - Source de contenu (Substack, YouTube, etc.)
2. **Edge Function** - Traitement sur Cloudflare Edge
3. **Parser** - Extraction des données (`functions/shared/rss-parser.js`)
4. **Cache** - Stockage temporaire (180s, Cloudflare Cache)
5. **API** - Exposition des données via `/api/*`
6. **Frontend** - Affichage utilisateur (SSR HTMX ou API)

## Extensibilité

### Ajouter un Nouveau Type de Contenu

1. Ajouter le parser RSS dans `functions/shared/rss-parser.js`
2. Créer les endpoints API dans `functions/api/`
3. Ajouter l'interface dans `admin/dashboard.html`
4. Ajouter le template dans `frontend/index.html`

### Ajouter une Nouvelle Fonctionnalité Frontend

1. Modifier les fichiers frontend (`frontend/index.html`, `admin/dashboard.html`)
2. Ajouter la logique backend dans `functions/api/` si nécessaire
3. Documenter dans la doc

> 💡 **Note** : Toutes les modifications backend (API, parsing, cache) sont dans le même projet et déployées avec Cloudflare Pages.

## Bonnes Pratiques

- ✅ Séparer la logique métier des vues
- ✅ Utiliser le cache pour les performances
- ✅ Valider les entrées utilisateur
- ✅ Gérer les erreurs gracieusement
- ✅ Documenter le code

## Prochaines Étapes

- [Développement Local](#/docs/guide/development)
- [Configuration](#/docs/configuration/overview)
- [API Documentation](#/docs/api/overview)

