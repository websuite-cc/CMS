# 📅 Événements (Meetup)

WebSuite CMS supporte l'intégration d'événements depuis Meetup via RSS.

## Configuration

### Obtenir l'URL du Flux Meetup

1. Allez sur votre groupe Meetup
2. Ajoutez `/events/rss` à la fin de l'URL
3. Exemple : `https://www.meetup.com/fr-fr/votre-groupe/events/rss`

### Configuration

Dans les variables d'environnement :

```env
EVENTS_FEED_URL=https://www.meetup.com/fr-fr/votre-groupe/events/rss
```

Ou dans `config.json` :

```json
{
  "eventsRssUrl": "https://www.meetup.com/fr-fr/votre-groupe/events/rss"
}
```

## API

### Liste des Événements

```http
GET /api/events
```

**Réponse :**

```json
[
  {
    "title": "Soirée Networking Paris",
    "slug": "soiree-networking-paris",
    "link": "https://www.meetup.com/event/123456",
    "pubDate": "2024-01-15T18:00:00Z",
    "description": "Description de l'événement...",
    "image": "https://secure.meetupstatic.com/photos/event/...",
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

**Exemple :**

```http
GET /api/event/soiree-networking-paris
```

## Données Disponibles

Chaque événement contient :

- **title** - Titre de l'événement
- **slug** - Slug pour l'URL
- **link** - Lien vers l'événement sur Meetup
- **pubDate** - Date et heure de l'événement
- **description** - Description complète (HTML)
- **image** - Image de couverture
- **location** - Lieu de l'événement
- **fee** - Prix (Gratuit ou montant)
- **type** - Toujours `"event"`

## Affichage Frontend

### Liste des Événements

Les événements sont affichés sous forme de cartes avec :
- Image à gauche
- Titre et description au centre
- Bouton "Voir" à droite
- Informations de lieu et date

### Page d'Événement

La page de détail affiche :
- Image de couverture
- Titre
- Date et heure
- Lieu
- Description complète (HTML)
- Lien vers Meetup

## Exemple d'Utilisation

### JavaScript

```javascript
// Récupérer tous les événements
fetch('/api/events')
  .then(res => res.json())
  .then(events => {
    events.forEach(event => {
      console.log(event.title, event.location);
    });
  });

// Récupérer un événement spécifique
fetch('/api/event/soiree-networking-paris')
  .then(res => res.json())
  .then(event => {
    console.log(event);
  });
```

### Filtrer les Événements à Venir

```javascript
fetch('/api/events')
  .then(res => res.json())
  .then(events => {
    const now = new Date();
    const upcoming = events.filter(event => {
      return new Date(event.pubDate) > now;
    });
    console.log('Événements à venir:', upcoming);
  });
```

## Dépannage

### Aucun Événement Affiché

- Vérifiez que l'URL du flux RSS est correcte
- Vérifiez que le groupe Meetup a des événements à venir
- Testez l'URL du flux dans un navigateur

### Erreur de Parsing

- Vérifiez que l'URL pointe bien vers un flux RSS Meetup
- Certains groupes privés peuvent nécessiter une authentification

### Images Manquantes

- Les images sont extraites automatiquement du flux RSS
- Si aucune image n'est disponible, une image placeholder est utilisée

## Prochaines Étapes

- [Configuration des flux RSS](../configuration/rss-feeds.md)
- [API Documentation](../api/public-endpoints.md)
- [Interface Admin](admin/dashboard.md)

