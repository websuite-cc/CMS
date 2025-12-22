# 🚀 Démarrage Rapide

Bienvenue dans **WebSuite Platform** ! Ce guide vous permettra de déployer votre CMS sur GitHub Pages en moins de 5 minutes.

## Architecture

WebSuite Platform utilise une architecture hybride :
- **Worker MCP** : Hébergé sur `mcp.websuite.cc` (géré par WebSuite)
- **CMS/Frontend** : Déployé par vous sur GitHub Pages

Tous les appels API pointent automatiquement vers le worker MCP distant.

## Prérequis

- Un compte [GitHub](https://github.com/signup) (gratuit)
- Des flux RSS de vos contenus (Substack, YouTube, Podcasts, Meetup)

## Étapes de Déploiement

### 1. Cloner le Projet

```bash
git clone https://github.com/VOTRE_USERNAME/StackPagesCMS.git
cd StackPagesCMS/ProdBeta
```

### 2. Déployer sur GitHub Pages

#### Option A : Via GitHub Settings (Recommandé)

1. Pousser votre code sur GitHub :
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Aller sur votre repository GitHub
3. Cliquer sur **Settings** → **Pages**
4. Sous **Source**, sélectionner :
   - **Branch** : `main`
   - **Folder** : `/` (root)
5. Cliquer sur **Save**

Votre site sera disponible sur :
```
https://votre-username.github.io/votre-repo
```

#### Option B : Via GitHub Actions (Automatique)

Le déploiement se fait automatiquement à chaque push sur `main`.

### 3. Configurer les Variables de Développement

Pour le développement local, créez un fichier `.dev.vars` à la racine :

```bash
cp .dev.vars.example .dev.vars
nano .dev.vars
```

Contenu de `.dev.vars` :

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=votre_password_securise_12_caracteres_minimum
BLOG_FEED_URL=https://votrecompte.substack.com/feed
YOUTUBE_FEED_URL=https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID
PODCAST_FEED_URL=https://anchor.fm/s/VOTRE_ID/podcast/rss
EVENTS_FEED_URL=https://www.meetup.com/fr-fr/votre-groupe/events/rss
```

> ⚠️ **Important** : Ajoutez `.dev.vars` à votre `.gitignore` pour ne pas commiter vos secrets !

### 4. Configuration du Worker MCP

Le worker MCP est déjà configuré sur `mcp.websuite.cc`. Pour la production :

1. Contactez WebSuite pour configurer vos variables d'environnement sur le worker MCP distant
2. Le worker gère automatiquement :
   - Le parsing RSS
   - Le cache
   - L'authentification
   - Les MCP Workers

### 5. Accéder à votre CMS

Une fois déployé, votre CMS est accessible à :

```
https://votre-username.github.io/votre-repo
```

L'interface admin est disponible à :

```
https://votre-username.github.io/votre-repo/admin
```

Tous les appels API pointent automatiquement vers `https://mcp.websuite.cc/api/*`

## Prochaines Étapes

- 📖 [Configuration des flux RSS](../configuration/rss-feeds.md)
- 🎨 [Personnaliser l'interface admin](../admin/dashboard.md)
- 🔌 [Utiliser l'API](../api/overview.md)
- 🌐 [Configurer un domaine personnalisé](../deployment/custom-domain.md)

## Besoin d'Aide ?

- 📧 Email : cms@iziweb.page
- 🐛 [GitHub Issues](https://github.com/iziweb-studio/CMS/issues)
- 📖 [Documentation complète](README.md)

