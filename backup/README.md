# 🎯 iziWebCMS - Cloudflare Pages Edition

> **CMS headless moderne** basé sur RSS (Substack, YouTube, Podcasts) déployable sur Cloudflare Pages en un clic.

[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange?logo=cloudflare)](https://pages.cloudflare.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ Caractéristiques

- 🚀 **Déploiement automatique** via Git push
- ⚡ **Serverless** avec Cloudflare Pages Functions
- 🎨 **Interface admin moderne** avec TailwindCSS
- 📊 **Multi-sources** : Substack + YouTube + Podcasts
- 🔐 **Authentification** simple et sécurisée
- 💨 **Cache intelligent** (180s TTL)
- 🌍 **CDN global** ultra-rapide
- 💰 **Gratuit** (plan généreux de Cloudflare)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│     Cloudflare Pages (Même domaine)     │
├─────────────────────────────────────────┤
│  Frontend (Static)  │  Backend (API)    │
│  ✓ index.html       │  ✓ /api/posts     │
│  ✓ admin/           │  ✓ /api/videos    │
│  ✓ core/admin.js    │  ✓ /api/podcasts  │
│                     │  ✓ /api/login      │
└─────────────────────┴───────────────────┘
```

**Avantages** :
- ✅ Pas de CORS (tout sur le même domaine)
- ✅ SSL automatique et gratuit
- ✅ Auto-deploy sur Git push
- ✅ CDN global intégré

---

## 🚀 Démarrage Rapide

### 1. Cloner le projet

```bash
git clone https://github.com/VOTRE_USERNAME/StackPagesCMS.git
cd StackPagesCMS/ProdBeta
```

### 2. Déployer sur Cloudflare Pages

#### Option A : Via Dashboard (Recommandé)

1. Aller sur https://dash.cloudflare.com/
2. **Workers & Pages** → **Create application** → **Pages**
3. **Connect to Git** → Sélectionner votre repo
4. Configurer :
   - **Build command** : (laisser vide)
   - **Build output** : `/` (racine)
5. **Déployer** !

#### Option B : Via CLI

```bash
npx wrangler login
npx wrangler pages deploy .
```

### 3. Configurer les Variables

Dashboard → Settings → Environment variables

```env
ADMIN_EMAIL = admin@example.com
ADMIN_PASSWORD = votre_password_securise
SUBSTACK_FEED_URL = https://votrecompte.substack.com/feed
YOUTUBE_FEED_URL = https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID
PODCAST_FEED_URL = https://anchor.fm/s/VOTRE_ID/podcast/rss
```

### 4. C'est prêt ! 🎉

Votre CMS est en ligne :
```
https://votre-projet.pages.dev
```

---

## 💻 Développement Local

```bash
# 1. Installer Wrangler
npm install -g wrangler

# 2. Créer les variables d'environnement
cp .dev.vars.example .dev.vars
nano .dev.vars

# 3. Lancer le serveur local
npx wrangler pages dev . --compatibility-date=2024-12-12

# 4. Ouvrir dans le navigateur
open http://localhost:8788
```

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
├── _worker.js              # Worker standalone (backup)
├── wrangler.toml           # Configuration Wrangler
├── .dev.vars.example       # Template variables env
└── .gitignore              # Protection secrets
```

---

## 📖 Documentation

- 📘 [**Guide Déploiement Cloudflare Pages**](./CLOUDFLARE_PAGES_DEPLOY.md) - Déploiement détaillé
- 📗 [**Guide Démarrage Rapide**](./QUICK_START.md) - Setup en 5 minutes
- 📙 [**Configuration Mode Local**](./MODE_LOCAL_CONFIG.md) - Développement local
- 📕 [**Changelog**](./CHANGELOG.md) - Historique des modifications

---

## 🔌 API Endpoints

Tous les endpoints sont disponibles après déploiement :

### Public (pas d'auth)

```http
GET  /api/metadata          # Infos du site
GET  /api/posts             # Articles Substack
GET  /api/post/:slug        # Article spécifique
GET  /api/videos            # Vidéos YouTube
GET  /api/video/:id         # Vidéo spécifique
GET  /api/podcasts          # Épisodes podcast
GET  /api/podcast/:id       # Podcast spécifique
POST /api/login             # Connexion admin
```

### Protégé (auth requise)

```http
GET  /api/config            # Configuration
POST /api/clear-cache       # Vider le cache
```

**Authentification** : Header `X-Auth-Key: votre_password`

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
- Spotify for Podcasters
- Apple Podcasts
- RSS standards

---

## ⚙️ Configuration

### Variables d'Environnement

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `ADMIN_EMAIL` | Email de connexion admin | ✅ |
| `ADMIN_PASSWORD` | Mot de passe admin | ✅ |
| `SUBSTACK_FEED_URL` | URL flux RSS Substack | ✅ |
| `YOUTUBE_FEED_URL` | URL flux RSS YouTube | ❌ |
| `PODCAST_FEED_URL` | URL flux RSS Podcast | ❌ |
| `FRONTEND_BUILDER_URL` | URL Webstudio (optionnel) | ❌ |
| `META_TITLE` | Titre du site (SEO) | ❌ |
| `META_DESCRIPTION` | Description (SEO) | ❌ |
| `META_KEYWORDS` | Mots-clés (SEO) | ❌ |

---

## 🔐 Sécurité

### Bonnes Pratiques

- ✅ Utilisez un mot de passe fort (12+ caractères)
- ✅ Marquez `ADMIN_PASSWORD` comme **Encrypted** dans Cloudflare
- ✅ Ne commitez JAMAIS `.dev.vars` dans Git (déjà dans `.gitignore`)
- ✅ Activez la 2FA sur votre compte Cloudflare
- ✅ Utilisez HTTPS uniquement (automatique sur Pages)

---

## 📊 Performance

### Cache

- **TTL** : 180 secondes (3 minutes)
- **Endpoint** : `/api/clear-cache` pour forcer le rafraîchissement
- **Cache Cloudflare** : Global, distribué sur 300+ datacenters

### Limites (Plan Gratuit)

| Ressource | Limite |
|-----------|--------|
| Requêtes/jour | 100 000 |
| Bandwidth | Illimité |
| Functions CPU | 10ms/requête |
| Build time | 20 min |

**Largement suffisant pour 99% des cas d'usage !**

---

## 🛠️ Technologies

- **Frontend** : HTML, CSS (TailwindCSS), JavaScript
- **Backend** : Cloudflare Pages Functions (Workers API)
- **Déploiement** : Cloudflare Pages
- **Parsing** : RSS/XML natif (pas de dépendances)
- **Authentification** : Simple password-based
- **Cache** : Cloudflare Cache API

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

- [Cloudflare Pages](https://pages.cloudflare.com/) - Hébergement gratuit et performant
- [TailwindCSS](https://tailwindcss.com/) - Framework CSS
- [Font Awesome](https://fontawesome.com/) - Icônes
- [Google Fonts](https://fonts.google.com/) - Typographies

---

## 📞 Support

- 📧 **Email** : support@stackpages.net
- 💬 **Discord** : [Rejoindre la communauté](#)
- 📖 **Documentation** : https://docs.stackpages.net
- 🐛 **Issues** : [GitHub Issues](https://github.com/VOTRE_USERNAME/StackPagesCMS/issues)

---

<p align="center">
  Fait avec ❤️ pour la communauté<br>
  <strong>iziWebCMS</strong> - Votre contenu, partout, facilement.
</p>
