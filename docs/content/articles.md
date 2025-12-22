# 📝 Articles (Substack)

Guide complet pour intégrer et gérer les articles depuis Substack.

## Configuration

### Obtenir l'URL du Flux RSS

1. Allez sur votre publication Substack
2. Ajoutez `/feed` à la fin de l'URL
3. Exemple : `https://votrecompte.substack.com/feed`

### Configuration

Dans les variables d'environnement :

```env
BLOG_FEED_URL=https://votrecompte.substack.com/feed
```

Ou dans `config.json` :

```json
{
  "blogRssUrl": "https://votrecompte.substack.com/feed"
}
```

## API

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

**Exemple :**

```http
GET /api/post/mon-premier-article
```

## Données Disponibles

Chaque article contient :

- **title** - Titre de l'article
- **slug** - Slug pour l'URL (généré automatiquement)
- **link** - Lien vers l'article sur Substack
- **pubDate** - Date de publication (ISO 8601)
- **description** - Description/extraite
- **content** - Contenu complet en HTML
- **image** - Image de couverture
- **author** - Nom de l'auteur
- **type** - Toujours `"post"`

## Affichage Frontend

### Liste des Articles

Les articles sont affichés sous forme de cartes avec :
- Image de couverture
- Titre
- Description
- Date de publication
- Lien vers l'article complet

### Page d'Article

La page de détail affiche :
- Image de couverture
- Titre
- Auteur et date
- Contenu complet (HTML)
- Lien vers Substack

## Exemple d'Utilisation

### JavaScript

```javascript
// Récupérer tous les articles
fetch('/api/posts')
  .then(res => res.json())
  .then(posts => {
    posts.forEach(post => {
      console.log(post.title, post.pubDate);
    });
  });

// Récupérer un article spécifique
fetch('/api/post/mon-premier-article')
  .then(res => res.json())
  .then(post => {
    console.log(post.content);
  });
```

### Filtrer les Articles Récents

```javascript
fetch('/api/posts')
  .then(res => res.json())
  .then(posts => {
    const now = new Date();
    const recent = posts.filter(post => {
      const postDate = new Date(post.pubDate);
      const daysDiff = (now - postDate) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7; // Articles des 7 derniers jours
    });
    console.log('Articles récents:', recent);
  });
```

## Dépannage

### Aucun Article Affiché

- Vérifiez que l'URL du flux RSS est correcte
- Vérifiez que la publication Substack a des articles publiés
- Testez l'URL du flux dans un navigateur

### Contenu HTML Mal Formé

- Substack fournit le contenu en HTML
- Le contenu est servi tel quel, sans modification
- Vérifiez que le HTML est valide dans Substack

### Images Manquantes

- Les images sont extraites automatiquement du flux RSS
- Si aucune image n'est disponible, une image placeholder est utilisée
- Vérifiez que les articles Substack ont des images de couverture

## Prochaines Étapes

- [Configuration des flux RSS](../configuration/rss-feeds.md)
- [API Documentation](../api/public-endpoints.md)
- [Interface Admin](admin/dashboard.md)

