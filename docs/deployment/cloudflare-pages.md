# ☁️ Déploiement sur Cloudflare Pages

Guide complet pour déployer WebSuite CMS sur Cloudflare Pages.

## Prérequis

- Un compte [Cloudflare](https://dash.cloudflare.com/sign-up) (gratuit)
- Un repository GitHub/GitLab/Bitbucket
- Le code source de WebSuite CMS

## Méthode 1 : Via Dashboard (Recommandé)

### Étape 1 : Créer un Projet

1. Allez sur [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Cliquez sur **Workers & Pages**
3. Cliquez sur **Create application**
4. Sélectionnez **Pages**
5. Cliquez sur **Connect to Git**

### Étape 2 : Connecter le Repository

1. Sélectionnez votre provider (GitHub, GitLab, Bitbucket)
2. Autorisez Cloudflare à accéder à vos repositories
3. Sélectionnez le repository contenant WebSuite CMS
4. Cliquez sur **Begin setup**

### Étape 3 : Configuration du Build

Configurez les paramètres suivants :

- **Project name** : `websuite-cms` (ou votre choix)
- **Production branch** : `main` (ou `master`)
- **Build command** : (laisser vide)
- **Build output directory** : `/` (racine)

> ⚠️ **Important** : Ne pas configurer de build command, le projet est statique.

### Étape 4 : Variables d'Environnement

Avant de déployer, configurez les variables :

1. Cliquez sur **Save and Deploy**
2. Une fois le déploiement terminé, allez dans **Settings** → **Environment variables**
3. Ajoutez toutes les variables nécessaires :

```env
ADMIN_EMAIL = admin@example.com
ADMIN_PASSWORD = votre_password_securise
BLOG_FEED_URL = https://votrecompte.substack.com/feed
YOUTUBE_FEED_URL = https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID
PODCAST_FEED_URL = https://anchor.fm/s/VOTRE_ID/podcast/rss
EVENTS_FEED_URL = https://www.meetup.com/fr-fr/votre-groupe/events/rss
```

> 🔒 **Sécurité** : Marquez `ADMIN_PASSWORD` comme **Encrypted** !

### Étape 5 : Déploiement

1. Cliquez sur **Save and Deploy**
2. Attendez la fin du déploiement (1-2 minutes)
3. Votre CMS est en ligne !

## Méthode 2 : Via CLI

### Installation de Wrangler

```bash
npm install -g wrangler
```

### Authentification

```bash
npx wrangler login
```

### Déploiement

```bash
# Se placer dans le dossier du projet
cd ProdBeta

# Déployer
npx wrangler pages deploy .
```

### Configuration des Variables

```bash
# Définir les variables
npx wrangler pages secret put ADMIN_EMAIL
npx wrangler pages secret put ADMIN_PASSWORD
npx wrangler pages secret put BLOG_FEED_URL
# etc.
```

Ou via le dashboard (plus simple).

## URL de Déploiement

Après le déploiement, votre CMS est accessible à :

```
https://votre-projet.pages.dev
```

L'interface admin :

```
https://votre-projet.pages.dev/admin
```

## Déploiement Automatique

Une fois connecté à Git, chaque push sur la branche principale déclenche automatiquement un nouveau déploiement.

### Workflow Recommandé

1. Faire des modifications localement
2. Commit et push vers GitHub
3. Cloudflare Pages déploie automatiquement
4. Les modifications sont en ligne en 1-2 minutes

## Environnements

Cloudflare Pages supporte plusieurs environnements :

- **Production** - Déploiement automatique depuis `main`
- **Preview** - Déploiement automatique depuis les branches/PRs

### Variables par Environnement

Vous pouvez définir des variables différentes pour chaque environnement dans le dashboard.

## Limites (Plan Gratuit)

| Ressource | Limite |
|-----------|--------|
| Requêtes/jour | 100 000 |
| Bandwidth | Illimité |
| Build time | 20 minutes |
| Functions CPU | 10ms/requête |

**Largement suffisant pour la plupart des cas d'usage !**

## Dépannage

### Erreur de Build

- Vérifiez que **Build command** est vide
- Vérifiez que **Build output directory** est `/`

### Variables d'Environnement Non Disponibles

- Vérifiez que les variables sont bien définies dans **Settings** → **Environment variables**
- Redéployez après avoir ajouté des variables

### Erreur 500

- Vérifiez les logs dans le dashboard Cloudflare
- Vérifiez que les URLs de flux RSS sont valides
- Vérifiez que les variables d'environnement sont correctes

## Prochaines Étapes

- [Configurer un domaine personnalisé](custom-domain.md)
- [Variables d'environnement](environment-variables.md)
- [Configuration](../configuration/overview.md)

