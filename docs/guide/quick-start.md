# 🚀 Démarrage Rapide

Bienvenue dans **WebSuite CMS** ! Ce guide vous permettra de déployer votre CMS sur Cloudflare Pages en moins de 5 minutes.

## Prérequis

- Un compte [Cloudflare](https://dash.cloudflare.com/sign-up) (gratuit)
- Un repository GitHub/GitLab/Bitbucket
- Des flux RSS de vos contenus (Substack, YouTube, Podcasts, Meetup)

## Étapes de Déploiement

### 1. Cloner le Projet

```bash
git clone https://github.com/VOTRE_USERNAME/StackPagesCMS.git
cd StackPagesCMS/ProdBeta
```

### 2. Déployer sur Cloudflare Pages

1. Allez sur [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Cliquez sur **Workers & Pages** → **Create application**
3. Sélectionnez **Pages** → **Connect to Git**
4. Autorisez Cloudflare à accéder à votre repository
5. Sélectionnez votre repository et cliquez sur **Begin setup**

**Configuration du Build :**
- **Project name** : `websuite-cms` (ou votre choix)
- **Production branch** : `main`
- **Build command** : (laisser vide)
- **Build output directory** : `/` (racine)

Cliquez sur **Save and Deploy**

### 3. Configurer les Variables d'Environnement

Une fois déployé, allez dans **Settings** → **Environment variables** et ajoutez :

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=votre_password_securise_12_caracteres_minimum
BLOG_FEED_URL=https://votrecompte.substack.com/feed
YOUTUBE_FEED_URL=https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID
PODCAST_FEED_URL=https://anchor.fm/s/VOTRE_ID/podcast/rss
EVENTS_FEED_URL=https://www.meetup.com/fr-fr/votre-groupe/events/rss
```

> 🔒 **Sécurité** : Marquez `ADMIN_PASSWORD` comme **Encrypted** !

### 4. Accéder à votre CMS

Une fois déployé, votre CMS est accessible à :

```
https://votre-projet.pages.dev
```

L'interface admin est disponible à :

```
https://votre-projet.pages.dev/admin
```

## Développement Local

Pour tester localement avec Bun :

```bash
# Créer .dev.vars
cp .dev.vars.example .dev.vars
# Éditer .dev.vars avec vos valeurs

# Lancer le serveur
bun server.js
```

Le serveur démarre sur `http://localhost:8000`

## Prochaines Étapes

- 📖 [Configuration des flux RSS](../configuration/rss-feeds.md)
- 🎨 [Personnaliser l'interface admin](../admin/dashboard.md)
- 🔌 [Utiliser l'API](../api/overview.md)
- 🌐 [Configurer un domaine personnalisé](../deployment/custom-domain.md)
- 📚 [Guide de déploiement complet](../deployment/cloudflare-pages.md)

## Besoin d'Aide ?

- 📧 Email : cms@iziweb.page
- 🐛 [GitHub Issues](https://github.com/VOTRE_USERNAME/StackPagesCMS/issues)
- 📖 [Documentation complète](../../README.md)

