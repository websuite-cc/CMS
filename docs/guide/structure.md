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

### Architecture Hybride

WebSuite Platform utilise une architecture hybride :

```
┌─────────────────────────────────────────┐
│     GitHub Pages (Développeur)          │
│  Frontend + CMS Interface               │
└─────────────────────────────────────────┘
                    ↓ (API Calls)
┌─────────────────────────────────────────┐
│     mcp.websuite.cc (Worker MCP)        │
│  - MCP Workers                          │
│  - RSS Parsing                          │
│  - Cache Management                     │
│  - API Backend                          │
└─────────────────────────────────────────┘
```

### Frontend (GitHub Pages)
- **HTML statique** avec templates
- **HTMX** pour le rendu dynamique
- **TailwindCSS** pour le styling
- **JavaScript vanilla** pour l'interactivité
- **Appels API** vers `https://mcp.websuite.cc/api/*`

### Backend (mcp.websuite.cc)
- **MCP Workers** - Agents MCP pour LLMs
- **RSS Parsing** - Extraction des données
- **Cache** - Gestion du cache global
- **API REST** - Endpoints API complets
- **Variables d'environnement** - Gérées par le worker

### Communication

Le frontend sur GitHub Pages communique avec le worker MCP via :
- **API REST** : `https://mcp.websuite.cc/api/*`
- **HTMX** : Requêtes HTMX vers le worker
- **CORS** : Configuré automatiquement sur le worker

### Déploiement
- **GitHub Pages** - Hébergement du frontend
- **mcp.websuite.cc** - Hébergement du worker MCP (géré par WebSuite)
- **Git** - Déploiement automatique
- **CDN Global** - Distribution via GitHub Pages

## Flux de Données

```
RSS Feed → Worker MCP (mcp.websuite.cc)
                ↓
            Parser → Cache → API
                ↓
            Frontend (GitHub Pages)
                ↓
            Admin Dashboard
```

1. **RSS Feed** - Source de contenu
2. **Worker MCP** - Traitement sur `mcp.websuite.cc`
3. **Parser** - Extraction des données (dans le worker)
4. **Cache** - Stockage temporaire (180s, géré par le worker)
5. **API** - Exposition des données via `https://mcp.websuite.cc/api/*`
6. **Frontend** - Affichage utilisateur (sur GitHub Pages)

## Extensibilité

### Ajouter un Nouveau Type de Contenu

1. Contacter WebSuite pour ajouter le parser dans le worker MCP
2. Ajouter l'interface dans `admin/dashboard.html`
3. Ajouter le template dans `frontend/index.html`
4. Les appels API pointent automatiquement vers `https://mcp.websuite.cc/api/*`

### Ajouter une Nouvelle Fonctionnalité Frontend

1. Modifier les fichiers frontend (`frontend/index.html`, `admin/dashboard.html`)
2. Les appels API utilisent automatiquement le worker MCP distant
3. Documenter dans la doc

> ⚠️ **Note** : Les modifications backend (API, parsing, cache) doivent être faites sur le worker MCP distant. Contactez WebSuite pour ces modifications.

## Bonnes Pratiques

- ✅ Séparer la logique métier des vues
- ✅ Utiliser le cache pour les performances
- ✅ Valider les entrées utilisateur
- ✅ Gérer les erreurs gracieusement
- ✅ Documenter le code

## Prochaines Étapes

- [Développement Local](development.md)
- [Configuration](../configuration/overview.md)
- [API Documentation](../api/overview.md)

