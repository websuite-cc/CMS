# 🎥 Vidéos (YouTube)

Guide complet pour intégrer et gérer les vidéos depuis YouTube.

## Configuration

### Obtenir le Channel ID

1. Allez sur [Comment Picker](https://commentpicker.com/youtube-channel-id.php)
2. Entrez l'URL de votre chaîne YouTube
3. Copiez le Channel ID

### Configuration

Dans les variables d'environnement :

```env
YOUTUBE_FEED_URL=https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_CHANNEL_ID
```

Ou dans `config.json` :

```json
{
  "youtubeRssUrl": "https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_CHANNEL_ID"
}
```

## API

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

**Exemple :**

```http
GET /api/video/dQw4w9WgXcQ
```

## Données Disponibles

Chaque vidéo contient :

- **title** - Titre de la vidéo
- **id** - ID YouTube de la vidéo
- **link** - Lien vers la vidéo sur YouTube
- **pubDate** - Date de publication (ISO 8601)
- **description** - Description complète
- **thumbnail** - URL de la miniature
- **duration** - Durée au format ISO 8601 (PT10M30S)
- **type** - Toujours `"video"`

## Affichage Frontend

### Liste des Vidéos

Les vidéos sont affichées sous forme de cartes avec :
- Miniature YouTube
- Titre
- Description (tronquée)
- Date de publication
- Durée

### Page de Vidéo

La page de détail affiche :
- Lecteur YouTube intégré (iframe)
- Titre
- Description complète
- Date de publication
- Lien vers YouTube

### Embed YouTube

```html
<iframe 
  width="560" 
  height="315" 
  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
  frameborder="0" 
  allowfullscreen>
</iframe>
```

## Exemple d'Utilisation

### JavaScript

```javascript
// Récupérer toutes les vidéos
fetch('/api/videos')
  .then(res => res.json())
  .then(videos => {
    videos.forEach(video => {
      console.log(video.title, video.id);
    });
  });

// Récupérer une vidéo spécifique
fetch('/api/video/dQw4w9WgXcQ')
  .then(res => res.json())
  .then(video => {
    const embedUrl = `https://www.youtube.com/embed/${video.id}`;
    // Afficher la vidéo dans un iframe
  });
```

### Afficher une Vidéo

```javascript
function displayVideo(videoId) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  const iframe = document.createElement('iframe');
  iframe.src = embedUrl;
  iframe.width = '560';
  iframe.height = '315';
  iframe.allowFullscreen = true;
  document.getElementById('video-container').appendChild(iframe);
}

// Utilisation
fetch('/api/video/dQw4w9WgXcQ')
  .then(res => res.json())
  .then(video => displayVideo(video.id));
```

## Dépannage

### Aucune Vidéo Affichée

- Vérifiez que le Channel ID est correct
- Vérifiez que la chaîne YouTube a des vidéos publiées
- Testez l'URL du flux dans un navigateur

### Erreur de Parsing

- Vérifiez que l'URL du flux RSS est correcte
- Certaines chaînes privées peuvent nécessiter une authentification

### Miniatures Manquantes

- Les miniatures sont générées automatiquement par YouTube
- Utilisez l'ID de la vidéo pour construire l'URL :
  - `https://i.ytimg.com/vi/{VIDEO_ID}/maxresdefault.jpg`

## Prochaines Étapes

- [Configuration des flux RSS](../configuration/rss-feeds.md)
- [API Documentation](../api/public-endpoints.md)
- [Interface Admin](admin/dashboard.md)

