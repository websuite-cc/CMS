# 🎯 WebSuite Platform - GitHub Pages Edition

> **CMS headless moderne** basé sur RSS (Substack, YouTube, Podcasts, Meetup)  
> Worker MCP distant sur `mcp.websuite.cc` - Déployez votre CMS sur GitHub Pages en un clic.

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-222222?logo=github)](https://pages.github.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ Caractéristiques

- 🚀 **Déploiement automatique** via Git push sur GitHub Pages
- ⚡ **Worker MCP distant** hébergé sur `mcp.websuite.cc`
- 🎨 **Interface admin moderne** avec TailwindCSS
- 📊 **Multi-sources** : Substack + YouTube + Podcasts + Meetup
- 🔐 **Authentification** simple et sécurisée
- 💨 **Cache intelligent** géré par le worker MCP
- 🌍 **CDN global** ultra-rapide
- 💰 **100% Gratuit** (GitHub Pages + Worker MCP)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│     GitHub Pages (Développeur)          │
├─────────────────────────────────────────┤
│  Frontend (Static)                     │
│  ✓ index.html                          │
│  ✓ admin/                              │
│  ✓ core/admin.js                       │
│  ✓ frontend/index.html                 │
└─────────────────────────────────────────┘
                    ↓ (API Calls)
┌─────────────────────────────────────────┐
│     mcp.websuite.cc (Worker MCP)        │
├─────────────────────────────────────────┤
│  API Backend                            │
│  ✓ /api/posts                           │
│  ✓ /api/videos                          │
│  ✓ /api/podcasts                        │
│  ✓ /api/events                          │
│  ✓ /api/login                           │
│  ✓ Variables d'environnement           │
│  ✓ RSS Parsing                          │
│  ✓ Cache Management                     │
│  ✓ MCP Workers                          │
└─────────────────────────────────────────┘
```

**Avantages** :
- ✅ Déploiement simplifié (GitHub Pages uniquement)
- ✅ Worker MCP géré et maintenu par WebSuite
- ✅ Mises à jour automatiques du worker
- ✅ SSL automatique et gratuit
- ✅ Auto-deploy sur Git push
- ✅ CDN global intégré
- ✅ Pas de configuration serveur nécessaire

---

## 🚀 Démarrage Rapide

### Architecture

WebSuite Platform utilise une architecture hybride :
- **Worker MCP** : Hébergé sur `mcp.websuite.cc` (géré par WebSuite)
- **CMS/Frontend** : Déployé par vous sur GitHub Pages

### 1. Cloner le projet

```bash
git clone https://github.com/VOTRE_USERNAME/StackPagesCMS.git
cd StackPagesCMS/ProdBeta
```

### 2. Déployer sur GitHub Pages

#### Option A : Via GitHub Settings (Recommandé)

1. Pousser votre code sur GitHub
2. Aller dans **Settings** → **Pages**
3. Sélectionner la branche `main` comme source
4. Votre site sera disponible sur `https://votre-username.github.io/votre-repo`

#### Option B : Via GitHub Actions (Automatique)

Le déploiement se fait automatiquement à chaque push sur `main`.

### 3. Configurer le Worker MCP

Le worker MCP est déjà configuré sur `mcp.websuite.cc`. Vous n'avez qu'à :

1. Créer un fichier `.dev.vars` à la racine du projet pour le développement local :

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=votre_password_securise
BLOG_FEED_URL=https://votrecompte.substack.com/feed
YOUTUBE_FEED_URL=https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID
PODCAST_FEED_URL=https://anchor.fm/s/VOTRE_ID/podcast/rss
EVENTS_FEED_URL=https://www.meetup.com/fr-fr/votre-groupe/events/rss
```

> ⚠️ **Sécurité** : Ajoutez `.dev.vars` à votre `.gitignore` pour ne pas commiter vos secrets !

2. Pour la production, contactez WebSuite pour configurer vos variables sur le worker MCP distant.

### 4. Configuration dans le Code

Tous les appels API pointent automatiquement vers `https://mcp.websuite.cc/api/*`. Le worker MCP gère :
- Le parsing RSS
- Le cache
- L'authentification
- Les MCP Workers

### 5. C'est prêt ! 🎉

Votre CMS est en ligne :
```
https://votre-username.github.io/votre-repo
```

Le worker MCP sur `mcp.websuite.cc` gère automatiquement toutes les opérations backend.

---

## 💻 Développement Local

```bash
# 1. Créer les variables d'environnement
cp .dev.vars.example .dev.vars
nano .dev.vars

# 2. Lancer un serveur HTTP local
# Option A : Avec Python
python -m http.server 8000

# Option B : Avec Node.js
npx http-server

# Option C : Avec PHP
php -S localhost:8000

# 3. Ouvrir dans le navigateur
open http://localhost:8000
```

> 💡 **Note** : Le frontend communiquera automatiquement avec le worker MCP sur `mcp.websuite.cc`. Les variables dans `.dev.vars` sont utilisées pour le développement local uniquement.

---

## 📁 Structure du Projet

```
ProdBeta/
├── index.html              # Page d'accueil
├── admin/                  
│   ├── index.html          # Login admin
│   └── dashboard.html      # Dashboard principal
├── core/
│   ├── admin.js            # Logique dashboard
│   └── frontend.js         # Utilitaires frontend
├── functions/
│   └── _middleware.js      # API Backend (Pages Functions)
├── .dev.vars.example       # Template variables env
└── .gitignore              # Protection secrets
```

---


## 🔌 API Endpoints

Tous les endpoints sont disponibles via le worker MCP sur `https://mcp.websuite.cc/api/*` :

### Public (pas d'auth)

```http
GET  https://mcp.websuite.cc/api/siteinfos         # Infos du site
GET  https://mcp.websuite.cc/api/posts             # Articles Substack
GET  https://mcp.websuite.cc/api/post/:slug        # Article spécifique
GET  https://mcp.websuite.cc/api/videos            # Vidéos YouTube
GET  https://mcp.websuite.cc/api/video/:id         # Vidéo spécifique
GET  https://mcp.websuite.cc/api/podcasts          # Épisodes podcast
GET  https://mcp.websuite.cc/api/podcast/:id       # Podcast spécifique
GET  https://mcp.websuite.cc/api/events            # Événements Meetup
GET  https://mcp.websuite.cc/api/event/:slug      # Événement spécifique
POST https://mcp.websuite.cc/api/login             # Connexion admin
```

### Protégé (auth requise)

```http
GET  https://mcp.websuite.cc/api/config            # Configuration
POST https://mcp.websuite.cc/api/clear-cache       # Vider le cache
```

**Authentification** : Header `X-Auth-Key: votre_password`

> 💡 **Note** : Tous les appels API pointent automatiquement vers le worker MCP distant. Vous n'avez pas besoin de spécifier l'URL complète dans votre code.

---

## 🎨 Interface Admin

L'interface admin offre :

- 📊 **Dashboard** avec statistiques en temps réel
- 📝 **Gestion articles** avec recherche et pagination
- 🎥 **Gestion vidéos** avec aperçu intégré
- 🎙️ **Gestion podcasts** avec lecteur audio
- 🔧 **API Explorer** pour tester les endpoints
- 📈 **Google Analytics** intégré
- 🎨 **Frontend Builder** (Webstudio)
- ⚙️ **Configuration** en lecture seule

---

## 🌐 Sources de Contenu

### Substack

```env
SUBSTACK_FEED_URL=https://votrecompte.substack.com/feed
```

Récupère automatiquement :
- Titres des articles
- Contenus complets (HTML)
- Images de couverture
- Dates de publication
- Descriptions

### YouTube

```env
YOUTUBE_FEED_URL=https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID
```

Pour trouver votre Channel ID : https://commentpicker.com/youtube-channel-id.php

### Podcasts

```env
PODCAST_FEED_URL=https://anchor.fm/s/VOTRE_ID/podcast/rss
```

Compatible avec :
- Anchor.fm
- Substack
- Spotify for Podcasters
- Ausha
- Apple Podcasts
- RSS standards
- Etc.

---

## ⚙️ Configuration

### Variables d'Environnement

Pour le développement local, créez un fichier `.dev.vars` :

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=votre_password_securise
BLOG_FEED_URL=https://votrecompte.substack.com/feed
YOUTUBE_FEED_URL=https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID
PODCAST_FEED_URL=https://anchor.fm/s/VOTRE_ID/podcast/rss
EVENTS_FEED_URL=https://www.meetup.com/fr-fr/votre-groupe/events/rss
```

> ⚠️ **Sécurité** : Ajoutez `.dev.vars` à votre `.gitignore` pour ne pas commiter vos secrets !

### Configuration du Worker MCP

Pour la production, les variables d'environnement sont configurées sur le worker MCP distant (`mcp.websuite.cc`) par WebSuite. Contactez WebSuite pour configurer vos variables.

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `ADMIN_EMAIL` | Email de connexion admin | ✅ |
| `ADMIN_PASSWORD` | Mot de passe admin | ✅ |
| `BLOG_FEED_URL` | URL flux RSS Substack | ✅ |
| `YOUTUBE_FEED_URL` | URL flux RSS YouTube | ❌ |
| `PODCAST_FEED_URL` | URL flux RSS Podcast | ❌ |
| `EVENTS_FEED_URL` | URL flux RSS Meetup | ❌ |
| `FRONTEND_BUILDER_URL` | URL Webstudio (optionnel) | ❌ |
| `META_TITLE` | Titre du site (SEO) | ❌ |
| `META_DESCRIPTION` | Description (SEO) | ❌ |
| `META_KEYWORDS` | Mots-clés (SEO) | ❌ |

---

## 🔐 Sécurité

### Bonnes Pratiques

- ✅ Utilisez un mot de passe fort (12+ caractères)
- ✅ Ne commitez JAMAIS `.dev.vars` dans Git (déjà dans `.gitignore`)
- ✅ Utilisez HTTPS uniquement (automatique sur GitHub Pages)
- ✅ Les variables d'environnement sont gérées de manière sécurisée sur le worker MCP
- ✅ Contactez WebSuite pour toute question de sécurité

---

## 📊 Performance

### Cache

- **TTL** : 180 secondes (3 minutes)
- **Endpoint** : `https://mcp.websuite.cc/api/clear-cache` pour forcer le rafraîchissement
- **Cache** : Géré par le worker MCP, distribué globalement

### Limites GitHub Pages

| Ressource | Limite |
|-----------|--------|
| Bandwidth | 100 GB/mois |
| Build time | 10 minutes |
| Taille du repo | 1 GB |

**Largement suffisant pour la plupart des cas d'usage !**

> 💡 **Note** : Le worker MCP gère les limites de requêtes API. Contactez WebSuite pour plus d'informations.

---

## 🛠️ Technologies

- **Frontend** : HTML, CSS (TailwindCSS), JavaScript
- **Backend** : Worker MCP distant sur `mcp.websuite.cc`
- **Déploiement** : GitHub Pages
- **Parsing** : RSS/XML natif (géré par le worker MCP)
- **Authentification** : Simple password-based (géré par le worker MCP)
- **Cache** : Géré par le worker MCP
- **MCP Workers** : Agents MCP pour LLMs (hébergés sur `mcp.websuite.cc`)

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 License

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- [GitHub Pages](https://pages.github.com/) - Hébergement gratuit et performant
- [TailwindCSS](https://tailwindcss.com/) - Framework CSS
- [Font Awesome](https://fontawesome.com/) - Icônes
- [Google Fonts](https://fonts.google.com/) - Typographies
- [WebSuite](https://websuite.cc) - Worker MCP distant

---

## 📞 Support

- 📧 **Email** : cms@iziweb.page
- 💬 **Discord** : [Rejoindre la communauté](#)
- 📖 **Documentation** : https://cms.iziweb.page
- 🐛 **Issues** : [GitHub Issues](https://github.com/iziweb-studio/CMS/issues)

---

<p align="center">
  Fait avec ❤️ pour la communauté<br>
  <strong>WebSuite</strong> - Votre contenu, partout, facilement.
</p>
