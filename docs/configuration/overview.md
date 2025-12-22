# ⚙️ Configuration - Vue d'Ensemble

Guide complet de la configuration de WebSuite CMS.

## Méthodes de Configuration

WebSuite CMS peut être configuré de deux façons :

1. **Variables d'environnement** (recommandé pour la production)
2. **config.json** (fallback ou développement)

> ⚠️ **Note** : Les variables d'environnement ont toujours la priorité sur `config.json`.

## Variables d'Environnement

Voir [Variables d'Environnement](../deployment/environment-variables.md) pour la liste complète.

## config.json

Le fichier `config.json` à la racine du projet :

```json
{
  "siteName": "WebSuite",
  "author": "Votre Nom",
  "blogRssUrl": "https://votrecompte.substack.com/feed",
  "youtubeRssUrl": "https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID",
  "podcastFeedUrl": "https://anchor.fm/s/VOTRE_ID/podcast/rss",
  "eventsRssUrl": "https://www.meetup.com/fr-fr/votre-groupe/events/rss",
  "seo": {
    "metaTitle": "WebSuite CMS",
    "metaDescription": "Description du site",
    "metaKeywords": "cms, rss, cloudflare"
  }
}
```

## Sections de Configuration

### Informations du Site

- `siteName` - Nom du site
- `author` - Auteur du site

### Flux RSS

- `blogRssUrl` - Articles (Substack)
- `youtubeRssUrl` - Vidéos (YouTube)
- `podcastFeedUrl` - Podcasts
- `eventsRssUrl` - Événements (Meetup)

### SEO

- `metaTitle` - Titre SEO
- `metaDescription` - Description SEO
- `metaKeywords` - Mots-clés SEO

## Accès à la Configuration

### Via API (Protégé)

```bash
curl -H "X-Auth-Key: votre_password" \
     https://votre-projet.pages.dev/api/config
```

### Via Interface Admin

1. Connectez-vous à `/admin`
2. Allez dans l'onglet **Configuration**
3. La configuration est en lecture seule dans l'interface

## Modification de la Configuration

### En Production

1. Modifiez les variables d'environnement dans Cloudflare Dashboard
2. Redéployez (automatique si connecté à Git)

### En Local

1. Modifiez `.dev.vars` pour les variables d'environnement
2. Ou modifiez `config.json` directement
3. Redémarrez Wrangler

## Vérification

### Tester la Configuration

```bash
# Vérifier les informations du site
curl https://votre-projet.pages.dev/api/siteinfos

# Vérifier la config complète (nécessite auth)
curl -H "X-Auth-Key: votre_password" \
     https://votre-projet.pages.dev/api/config
```

## Prochaines Étapes

- [Flux RSS](rss-feeds.md)
- [SEO](seo.md)
- [Variables d'environnement](../deployment/environment-variables.md)

