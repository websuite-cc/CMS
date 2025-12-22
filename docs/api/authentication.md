# 🔐 Authentification

Guide complet de l'authentification dans WebSuite CMS.

## Vue d'Ensemble

WebSuite CMS utilise une authentification simple basée sur un mot de passe pour protéger les endpoints d'administration.

## Endpoints Protégés

Les endpoints suivants nécessitent une authentification :

- `GET /api/config` - Configuration
- `POST /api/clear-cache` - Vider le cache
- `POST /api/login` - Connexion admin

## Méthode d'Authentification

### Header X-Auth-Key

Pour les endpoints protégés (sauf `/api/login`), utilisez le header :

```http
X-Auth-Key: votre_password_admin
```

Le mot de passe correspond à la variable d'environnement `ADMIN_PASSWORD`.

### Exemple avec cURL

```bash
curl -H "X-Auth-Key: votre_password" \
     https://votre-projet.pages.dev/api/config
```

### Exemple avec JavaScript

```javascript
fetch('/api/config', {
  headers: {
    'X-Auth-Key': 'votre_password'
  }
})
  .then(res => res.json())
  .then(data => console.log(data));
```

## Connexion Admin

### Endpoint de Connexion

```http
POST /api/login
Content-Type: application/json
```

### Body

```json
{
  "email": "admin@example.com",
  "password": "votre_password"
}
```

### Réponse (Succès)

```json
{
  "success": true,
  "token": "session_token_here"
}
```

### Réponse (Échec)

```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### Exemple

```javascript
async function login(email, password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  return await response.json();
}

// Utilisation
const result = await login('admin@example.com', 'votre_password');
if (result.success) {
  console.log('Connecté !', result.token);
}
```

## Codes de Statut

- `200 OK` - Authentification réussie
- `401 Unauthorized` - Authentification requise ou invalide
- `403 Forbidden` - Accès refusé

## Sécurité

### Bonnes Pratiques

1. ✅ **Utilisez un mot de passe fort** (12+ caractères)
2. ✅ **Ne commitez jamais le mot de passe** dans le code
3. ✅ **Utilisez HTTPS uniquement** (automatique sur Cloudflare Pages)
4. ✅ **Changez le mot de passe régulièrement**
5. ✅ **Marquez `ADMIN_PASSWORD` comme Encrypted** dans Cloudflare

### ⚠️ Important

**Ne jamais exposer le mot de passe dans le code client !**

```javascript
// ❌ MAUVAIS - Ne jamais faire ça
const password = 'mon_password';
fetch('/api/config', {
  headers: { 'X-Auth-Key': password }
});

// ✅ BON - Le mot de passe doit rester côté serveur
// Utilisez l'endpoint /api/login pour obtenir un token
```

## Gestion de Session

### Interface Admin

L'interface admin (`/admin`) gère automatiquement la session :
1. L'utilisateur se connecte via le formulaire
2. Le token est stocké dans le localStorage
3. Les requêtes suivantes utilisent ce token

### Déconnexion

```http
POST /api/logout
```

## Dépannage

### Erreur 401 Unauthorized

**Causes possibles :**
- Header `X-Auth-Key` manquant
- Mot de passe incorrect
- Variable `ADMIN_PASSWORD` non définie

**Solutions :**
1. Vérifiez que le header est présent
2. Vérifiez que le mot de passe correspond à `ADMIN_PASSWORD`
3. Vérifiez que la variable d'environnement est définie

### Erreur 403 Forbidden

**Causes possibles :**
- Email incorrect pour `/api/login`
- Session expirée

**Solutions :**
1. Vérifiez que l'email correspond à `ADMIN_EMAIL`
2. Reconnectez-vous

## Prochaines Étapes

- [Endpoints protégés](protected-endpoints.md)
- [Sécurité](advanced/security.md)
- [Configuration](../configuration/overview.md)

