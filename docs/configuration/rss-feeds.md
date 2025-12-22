# 📡 Configuration des Flux RSS

WebSuite CMS supporte plusieurs sources de contenu via RSS.

## Sources Supportées

- ✅ **Substack** - Articles de blog
- ✅ **YouTube** - Vidéos
- ✅ **Podcasts** - Anchor.fm, Spotify, Apple Podcasts, etc.
- ✅ **Meetup** - Événements

## Configuration

### Variables d'Environnement

Configurez les URLs des flux RSS dans les variables d'environnement :

```env
BLOG_FEED_URL=https://votrecompte.substack.com/feed
YOUTUBE_FEED_URL=https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID
PODCAST_FEED_URL=https://anchor.fm/s/VOTRE_ID/podcast/rss
EVENTS_FEED_URL=https://www.meetup.com/fr-fr/votre-groupe/events/rss
```

### Configuration via config.json

Vous pouvez aussi configurer les flux dans `config.json` :

```json
{
  "blogRssUrl": "https://votrecompte.substack.com/feed",
  "youtubeRssUrl": "https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID",
  "podcastFeedUrl": "https://anchor.fm/s/VOTRE_ID/podcast/rss",
  "eventsRssUrl": "https://www.meetup.com/fr-fr/votre-groupe/events/rss"
}
```

> ⚠️ **Note** : Les variables d'environnement ont la priorité sur `config.json`.

## Articles (Substack)

### Obtenir l'URL du Flux

1. Allez sur votre publication Substack
2. Ajoutez `/feed` à la fin de l'URL
3. Exemple : `https://votrecompte.substack.com/feed`

### Configuration

```env
BLOG_FEED_URL=https://votrecompte.substack.com/feed
```

### Données Récupérées

- Titre de l'article
- Contenu complet (HTML)
- Image de couverture
- Date de publication
- Auteur
- Description

## Vidéos (YouTube)

### Obtenir le Channel ID

1. Allez sur [Comment Picker](https://commentpicker.com/youtube-channel-id.php)
2. Entrez l'URL de votre chaîne YouTube
3. Copiez le Channel ID

### Configuration

```env
YOUTUBE_FEED_URL=https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_CHANNEL_ID
```

### Données Récupérées

- Titre de la vidéo
- Description
- Miniature
- Date de publication
- Durée
- ID YouTube (pour l'embed)

## Podcasts

### Anchor.fm

```env
PODCAST_FEED_URL=https://anchor.fm/s/VOTRE_ID/podcast/rss
```

### Spotify for Podcasters

```env
PODCAST_FEED_URL=https://anchor.fm/s/VOTRE_ID/podcast/rss
```

### Substack Podcasts

```env
PODCAST_FEED_URL=https://api.substack.com/feed/podcast/VOTRE_ID.rss
```

### Autres Plateformes

Toute plateforme qui fournit un flux RSS standard fonctionne :

- Apple Podcasts
- Ausha
- Buzzsprout
- Etc.

### Données Récupérées

- Titre de l'épisode
- Description
- URL audio
- Image de couverture
- Date de publication
- Durée

## Événements (Meetup)

### Obtenir l'URL du Flux

1. Allez sur votre groupe Meetup
2. Ajoutez `/events/rss` à la fin de l'URL
3. Exemple : `https://www.meetup.com/fr-fr/votre-groupe/events/rss`

### Configuration

```env
EVENTS_FEED_URL=https://www.meetup.com/fr-fr/votre-groupe/events/rss
```

### Données Récupérées

- Titre de l'événement
- Description
- Image
- Date et heure
- Lieu
- Prix (gratuit/payant)

## Vérification

### Tester un Flux RSS

```bash
# Tester avec cURL
curl https://votrecompte.substack.com/feed

# Vérifier que c'est du XML valide
curl https://votrecompte.substack.com/feed | head -20
```

### Vérifier dans l'API

```bash
# Vérifier les articles
curl https://votre-projet.pages.dev/api/posts

# Vérifier les vidéos
curl https://votre-projet.pages.dev/api/videos

# Vérifier les podcasts
curl https://votre-projet.pages.dev/api/podcasts

# Vérifier les événements
curl https://votre-projet.pages.dev/api/events
```

## Dépannage

### Erreur : "Feed URL not found"

- Vérifiez que l'URL est correcte
- Vérifiez que le flux RSS est accessible publiquement
- Testez l'URL dans un navigateur

### Erreur : "Invalid RSS format"

- Vérifiez que l'URL pointe bien vers un flux RSS/XML
- Certaines plateformes nécessitent une authentification

### Le contenu ne se met pas à jour

- Le cache est de 180 secondes (3 minutes)
- Utilisez `/api/clear-cache` pour forcer le rafraîchissement
- Attendez quelques minutes après la publication

## Prochaines Étapes

- [Configuration SEO](seo.md)
- [Variables d'environnement](../deployment/environment-variables.md)
- [API Documentation](../api/overview.md)

