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

### Frontend
- **HTML statique** avec templates
- **HTMX** pour le rendu dynamique
- **TailwindCSS** pour le styling
- **JavaScript vanilla** pour l'interactivité

### Backend
- **Cloudflare Pages Functions** (serverless)
- **RSS Parsing** natif (pas de dépendances)
- **Cache** intégré Cloudflare
- **API REST** complète

### Déploiement
- **Cloudflare Pages** - Hébergement
- **Git** - Déploiement automatique
- **CDN Global** - Distribution

## Flux de Données

```
RSS Feed → Parser → Cache → API → Frontend
                ↓
            Admin Dashboard
```

1. **RSS Feed** - Source de contenu
2. **Parser** - Extraction des données
3. **Cache** - Stockage temporaire (180s)
4. **API** - Exposition des données
5. **Frontend** - Affichage utilisateur

## Extensibilité

### Ajouter un Nouveau Type de Contenu

1. Créer un parser dans `functions/shared/rss-parser.js`
2. Créer un endpoint dans `functions/api/`
3. Ajouter la route dans `functions/_middleware.js`
4. Ajouter l'interface dans `admin/dashboard.html`
5. Ajouter le template dans `frontend/index.html`

### Ajouter une Nouvelle Fonctionnalité

1. Créer la fonction dans `functions/shared/`
2. Exposer via API si nécessaire
3. Intégrer dans l'admin si applicable
4. Documenter dans la doc

## Bonnes Pratiques

- ✅ Séparer la logique métier des vues
- ✅ Utiliser le cache pour les performances
- ✅ Valider les entrées utilisateur
- ✅ Gérer les erreurs gracieusement
- ✅ Documenter le code

## Prochaines Étapes

- [Développement Local](development.md)
- [Configuration](configuration/overview.md)
- [API Documentation](api/overview.md)

