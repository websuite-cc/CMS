# 🚀 Démarrage Rapide

Bienvenue dans **WebSuite CMS** ! Ce guide vous permettra de déployer votre CMS en moins de 5 minutes.

## Prérequis

- Un compte [Cloudflare](https://dash.cloudflare.com/sign-up) (gratuit)
- Un compte GitHub (pour le déploiement automatique)
- Des flux RSS de vos contenus (Substack, YouTube, Podcasts, Meetup)

## Étapes de Déploiement

### 1. Cloner le Projet

```bash
git clone https://github.com/VOTRE_USERNAME/StackPagesCMS.git
cd StackPagesCMS/ProdBeta
```

### 2. Déployer sur Cloudflare Pages

#### Option A : Via Dashboard (Recommandé)

1. Allez sur [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **Workers & Pages** → **Create application** → **Pages**
3. **Connect to Git** → Sélectionnez votre repository
4. Configurez :
   - **Build command** : (laisser vide)
   - **Build output directory** : `/` (racine)
5. Cliquez sur **Save and Deploy** !

#### Option B : Via CLI

```bash
# Installer Wrangler
npm install -g wrangler

# Se connecter
npx wrangler login

# Déployer
npx wrangler pages deploy .
```

### 3. Configurer les Variables d'Environnement

Dans le dashboard Cloudflare Pages :

1. Allez dans **Settings** → **Environment variables**
2. Ajoutez les variables suivantes :

```env
ADMIN_EMAIL = admin@example.com
ADMIN_PASSWORD = votre_password_securise_12_caracteres_minimum
BLOG_FEED_URL = https://votrecompte.substack.com/feed
YOUTUBE_FEED_URL = https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID
PODCAST_FEED_URL = https://anchor.fm/s/VOTRE_ID/podcast/rss
EVENTS_FEED_URL = https://www.meetup.com/fr-fr/votre-groupe/events/rss
```

> ⚠️ **Important** : Marquez `ADMIN_PASSWORD` comme **Encrypted** pour la sécurité !

### 4. Accéder à votre CMS

Une fois déployé, votre CMS est accessible à :

```
https://votre-projet.pages.dev
```

L'interface admin est disponible à :

```
https://votre-projet.pages.dev/admin
```

## Prochaines Étapes

- 📖 [Configuration des flux RSS](configuration/rss-feeds.md)
- 🎨 [Personnaliser l'interface admin](admin/dashboard.md)
- 🔌 [Utiliser l'API](api/overview.md)
- 🌐 [Configurer un domaine personnalisé](deployment/custom-domain.md)

## Besoin d'Aide ?

- 📧 Email : cms@iziweb.page
- 🐛 [GitHub Issues](https://github.com/iziweb-studio/CMS/issues)
- 📖 [Documentation complète](README.md)

