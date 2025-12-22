# 🎙️ Podcasts

Guide complet pour intégrer et gérer les podcasts depuis différentes plateformes.

## Plateformes Supportées

- ✅ **Anchor.fm**
- ✅ **Spotify for Podcasters**
- ✅ **Substack Podcasts**
- ✅ **Apple Podcasts**
- ✅ **Ausha**
- ✅ **Buzzsprout**
- ✅ **Toute plateforme avec flux RSS standard**

## Configuration

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

Toute plateforme qui fournit un flux RSS standard fonctionne. Trouvez l'URL du flux RSS dans les paramètres de votre plateforme.

## API

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

**Exemple :**

```http
GET /api/podcast/episode-123
```

## Données Disponibles

Chaque épisode contient :

- **title** - Titre de l'épisode
- **id** - ID unique de l'épisode
- **link** - Lien vers l'épisode sur la plateforme
- **pubDate** - Date de publication (ISO 8601)
- **description** - Description complète
- **audioUrl** - URL directe du fichier audio
- **image** - Image de couverture
- **duration** - Durée en secondes
- **type** - Toujours `"podcast"`

## Affichage Frontend

### Liste des Podcasts

Les épisodes sont affichés sous forme de cartes avec :
- Image de couverture
- Titre
- Description (tronquée)
- Date de publication
- Durée
- Lecteur audio intégré

### Page de Podcast

La page de détail affiche :
- Image de couverture
- Titre
- Description complète
- Lecteur audio
- Date de publication
- Lien vers la plateforme

### Lecteur Audio HTML5

```html
<audio controls>
  <source src="https://anchor.fm/audio.mp3" type="audio/mpeg">
  Votre navigateur ne supporte pas l'élément audio.
</audio>
```

## Exemple d'Utilisation

### JavaScript

```javascript
// Récupérer tous les podcasts
fetch('/api/podcasts')
  .then(res => res.json())
  .then(podcasts => {
    podcasts.forEach(podcast => {
      console.log(podcast.title, podcast.duration);
    });
  });

// Récupérer un podcast spécifique
fetch('/api/podcast/episode-123')
  .then(res => res.json())
  .then(podcast => {
    const audio = new Audio(podcast.audioUrl);
    audio.play();
  });
```

### Afficher un Lecteur Audio

```javascript
function createAudioPlayer(podcast) {
  const audio = document.createElement('audio');
  audio.controls = true;
  audio.src = podcast.audioUrl;
  document.getElementById('player-container').appendChild(audio);
}

// Utilisation
fetch('/api/podcast/episode-123')
  .then(res => res.json())
  .then(podcast => createAudioPlayer(podcast));
```

## Dépannage

### Aucun Podcast Affiché

- Vérifiez que l'URL du flux RSS est correcte
- Vérifiez que le podcast a des épisodes publiés
- Testez l'URL du flux dans un navigateur

### Erreur de Parsing

- Vérifiez que l'URL pointe bien vers un flux RSS
- Certaines plateformes nécessitent une authentification

### Audio Ne Joue Pas

- Vérifiez que l'URL audio est accessible
- Vérifiez les CORS si nécessaire
- Certains fichiers audio peuvent nécessiter une authentification

## Prochaines Étapes

- [Configuration des flux RSS](../configuration/rss-feeds.md)
- [API Documentation](../api/public-endpoints.md)
- [Interface Admin](admin/dashboard.md)

