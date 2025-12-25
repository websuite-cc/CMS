# 🔐 Endpoints Protégés

Ces endpoints nécessitent une authentification via header `X-Auth-Key`.

## Authentification

Tous les endpoints protégés nécessitent le header suivant :

```http
X-Auth-Key: votre_password_admin
```

Le mot de passe correspond à la variable d'environnement `ADMIN_PASSWORD`.

## Configuration

### Récupérer la Configuration

```http
GET /api/config
```

**Headers requis :**
```http
X-Auth-Key: votre_password_admin
```

**Réponse :**

```json
{
  "siteName": "WebSuite",
  "author": "Ange Kacou Oi",
  "blogRssUrl": "https://substack.com/feed",
  "youtubeRssUrl": "https://youtube.com/feed",
  "podcastFeedUrl": "https://anchor.fm/feed",
  "eventsRssUrl": "https://meetup.com/events/rss",
  "seo": {
    "metaTitle": "WebSuite Platform",
    "metaDescription": "Description",
    "metaKeywords": "cms, rss"
  }
}
```

**Exemple avec cURL :**

```bash
curl -H "X-Auth-Key: votre_password" \
     https://votre-projet.pages.dev/api/config
```

## Vider le Cache

### Forcer le Rafraîchissement du Cache

```http
POST /api/clear-cache
```

**Headers requis :**
```http
X-Auth-Key: votre_password_admin
```

**Réponse :**

```json
{
  "success": true,
  "message": "Cache cleared successfully"
}
```

**Exemple avec cURL :**

```bash
curl -X POST \
     -H "X-Auth-Key: votre_password" \
     https://votre-projet.pages.dev/api/clear-cache
```

**Quand utiliser :**

- Après avoir publié un nouvel article
- Après avoir mis à jour un flux RSS
- Pour tester les modifications en production

## Connexion Admin

### Se Connecter

```http
POST /api/login
Content-Type: application/json
```

**Body :**

```json
{
  "email": "admin@example.com",
  "password": "votre_password"
}
```

**Réponse (succès) :**

```json
{
  "success": true,
  "token": "session_token_here"
}
```

**Réponse (échec) :**

```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Exemple avec cURL :**

```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"votre_password"}' \
     https://votre-projet.pages.dev/api/login
```

## Codes de Statut

- `200 OK` - Requête réussie
- `401 Unauthorized` - Authentification requise ou invalide
- `403 Forbidden` - Accès refusé
- `500 Internal Server Error` - Erreur serveur

## Sécurité

### Bonnes Pratiques

1. **Ne jamais exposer le mot de passe** dans le code client
2. **Utiliser HTTPS** uniquement (automatique sur Cloudflare Pages)
3. **Changer le mot de passe** régulièrement
4. **Utiliser un mot de passe fort** (12+ caractères)

### Exemple Sécurisé (JavaScript)

```javascript
// ❌ MAUVAIS - Ne jamais faire ça
const password = 'mon_password';
fetch('/api/config', {
  headers: { 'X-Auth-Key': password }
});

// ✅ BON - Utiliser une variable d'environnement côté serveur
// Le mot de passe ne doit jamais être dans le code client
```

## Dépannage

### Erreur 401 Unauthorized

- Vérifiez que le header `X-Auth-Key` est présent
- Vérifiez que le mot de passe correspond à `ADMIN_PASSWORD`
- Vérifiez que la variable d'environnement est bien définie

### Erreur 403 Forbidden

- Vérifiez que vous utilisez le bon email/password pour `/api/login`
- Vérifiez que la session est valide

