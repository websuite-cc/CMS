# 🔌 API - Vue d'ensemble

WebSuite CMS expose une API REST complète pour accéder à tous vos contenus.

## Base URL

```
https://votre-projet.pages.dev/api
```

## Authentification

### Endpoints Publics

La plupart des endpoints sont publics et ne nécessitent pas d'authentification :

- `GET /api/posts` - Liste des articles
- `GET /api/videos` - Liste des vidéos
- `GET /api/podcasts` - Liste des podcasts
- `GET /api/events` - Liste des événements
- `GET /api/siteinfos` - Informations du site

### Endpoints Protégés

Certains endpoints nécessitent une authentification via header :

```http
X-Auth-Key: votre_password_admin
```

Endpoints protégés :
- `GET /api/config` - Configuration
- `POST /api/clear-cache` - Vider le cache
- `POST /api/login` - Connexion admin

## Format de Réponse

Toutes les réponses sont au format JSON :

```json
{
  "success": true,
  "data": [...],
  "error": null
}
```

En cas d'erreur :

```json
{
  "success": false,
  "data": null,
  "error": "Message d'erreur"
}
```

## Cache

Toutes les réponses sont mises en cache pendant **180 secondes** (3 minutes) pour optimiser les performances.

Pour forcer le rafraîchissement, utilisez l'endpoint `/api/clear-cache` (protégé).

## Rate Limiting

Sur le plan gratuit Cloudflare Pages :
- **100 000 requêtes/jour**
- Pas de limite de bande passante
- CDN global avec 300+ datacenters

## Endpoints Disponibles

### Contenu

- [Articles](public-endpoints.md#articles) - `GET /api/posts`
- [Vidéos](public-endpoints.md#vidéos) - `GET /api/videos`
- [Podcasts](public-endpoints.md#podcasts) - `GET /api/podcasts`
- [Événements](public-endpoints.md#événements) - `GET /api/events`

### Utilitaires

- [Informations du site](public-endpoints.md#informations-du-site) - `GET /api/siteinfos`
- [Configuration](protected-endpoints.md#configuration) - `GET /api/config`
- [Vider le cache](protected-endpoints.md#vider-le-cache) - `POST /api/clear-cache`

## Exemples d'Utilisation

### JavaScript (Fetch)

```javascript
// Récupérer les articles
fetch('https://votre-projet.pages.dev/api/posts')
  .then(response => response.json())
  .then(data => console.log(data));

// Récupérer un article spécifique
fetch('https://votre-projet.pages.dev/api/post/mon-article')
  .then(response => response.json())
  .then(data => console.log(data));
```

### cURL

```bash
# Liste des articles
curl https://votre-projet.pages.dev/api/posts

# Article spécifique
curl https://votre-projet.pages.dev/api/post/mon-article

# Avec authentification
curl -H "X-Auth-Key: votre_password" \
     https://votre-projet.pages.dev/api/config
```

### Python

```python
import requests

# Récupérer les articles
response = requests.get('https://votre-projet.pages.dev/api/posts')
articles = response.json()

# Avec authentification
headers = {'X-Auth-Key': 'votre_password'}
response = requests.get(
    'https://votre-projet.pages.dev/api/config',
    headers=headers
)
config = response.json()
```

## Documentation Complète

- [Endpoints Publics](public-endpoints.md)
- [Endpoints Protégés](protected-endpoints.md)
- [Authentification](authentication.md)
- [Exemples d'utilisation](examples.md)

