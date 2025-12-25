# 🌐 Endpoints Publics

Tous les endpoints publics sont accessibles sans authentification.

## Articles

### Liste des Articles

```http
GET /api/posts
```

**Réponse :**

```json
[
  {
    "title": "Titre de l'article",
    "slug": "titre-de-l-article",
    "link": "https://substack.com/article",
    "pubDate": "2024-01-15T10:00:00Z",
    "description": "Description de l'article",
    "content": "<p>Contenu HTML complet...</p>",
    "image": "https://substack.com/image.jpg",
    "author": "Nom de l'auteur",
    "type": "post"
  }
]
```

### Article Spécifique

```http
GET /api/post/:slug
```

**Paramètres :**
- `slug` : Slug de l'article (dans l'URL)

**Exemple :**

```http
GET /api/post/mon-premier-article
```

**Réponse :**

```json
{
  "title": "Mon Premier Article",
  "slug": "mon-premier-article",
  "link": "https://substack.com/article",
  "pubDate": "2024-01-15T10:00:00Z",
  "description": "Description...",
  "content": "<p>Contenu complet...</p>",
  "image": "https://substack.com/image.jpg",
  "author": "Nom de l'auteur",
  "type": "post"
}
```

## Vidéos

### Liste des Vidéos

```http
GET /api/videos
```

**Réponse :**

```json
[
  {
    "title": "Titre de la vidéo",
    "id": "dQw4w9WgXcQ",
    "link": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "pubDate": "2024-01-15T10:00:00Z",
    "description": "Description de la vidéo",
    "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "duration": "PT10M30S",
    "type": "video"
  }
]
```

### Vidéo Spécifique

```http
GET /api/video/:id
```

**Paramètres :**
- `id` : ID YouTube de la vidéo

**Exemple :**

```http
GET /api/video/dQw4w9WgXcQ
```

## Podcasts

### Liste des Podcasts

```http
GET /api/podcasts
```

**Réponse :**

```json
[
  {
    "title": "Titre de l'épisode",
    "id": "episode-123",
    "link": "https://anchor.fm/episode",
    "pubDate": "2024-01-15T10:00:00Z",
    "description": "Description de l'épisode",
    "audioUrl": "https://anchor.fm/audio.mp3",
    "image": "https://anchor.fm/image.jpg",
    "duration": "3600",
    "type": "podcast"
  }
]
```

### Podcast Spécifique

```http
GET /api/podcast/:id
```

**Paramètres :**
- `id` : ID de l'épisode

## Événements

### Liste des Événements

```http
GET /api/events
```

**Réponse :**

```json
[
  {
    "title": "Titre de l'événement",
    "slug": "titre-de-l-evenement",
    "link": "https://meetup.com/event",
    "pubDate": "2024-01-15T10:00:00Z",
    "description": "Description de l'événement",
    "image": "https://meetup.com/image.jpg",
    "location": "Paris, France",
    "fee": "Gratuit",
    "type": "event"
  }
]
```

### Événement Spécifique

```http
GET /api/event/:slug
```

**Paramètres :**
- `slug` : Slug de l'événement

**Exemple :**

```http
GET /api/event/soiree-networking-paris
```

## Informations du Site

### Récupérer les Informations du Site

```http
GET /api/siteinfos
```

**Réponse :**

```json
{
  "siteName": "WebSuite",
  "author": "Ange Kacou Oi",
  "seo": {
    "metaTitle": "WebSuite Platform",
    "metaDescription": "Description du site",
    "metaKeywords": "cms, rss, cloudflare"
  }
}
```

## Codes de Statut

- `200 OK` - Requête réussie
- `404 Not Found` - Ressource non trouvée
- `500 Internal Server Error` - Erreur serveur

## Exemples d'Utilisation

### Récupérer les 5 Derniers Articles

```javascript
fetch('/api/posts')
  .then(res => res.json())
  .then(posts => {
    const recentPosts = posts.slice(0, 5);
    console.log(recentPosts);
  });
```

### Afficher une Vidéo YouTube

```javascript
fetch('/api/video/dQw4w9WgXcQ')
  .then(res => res.json())
  .then(video => {
    const embedUrl = `https://www.youtube.com/embed/${video.id}`;
    // Afficher la vidéo dans un iframe
  });
```

### Lister les Événements à Venir

```javascript
fetch('/api/events')
  .then(res => res.json())
  .then(events => {
    const upcoming = events.filter(event => {
      return new Date(event.pubDate) > new Date();
    });
    console.log(upcoming);
  });
```

