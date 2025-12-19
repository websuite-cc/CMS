# 🔧 API Explorer

Guide d'utilisation de l'explorateur d'API intégré dans l'interface admin.

## Vue d'Ensemble

L'API Explorer permet de tester directement les endpoints API depuis l'interface admin, sans avoir besoin d'outils externes comme Postman ou cURL.

## Accès

1. Connectez-vous à `/admin`
2. Cliquez sur l'onglet **API Explorer**

## Fonctionnalités

### Sélection d'Endpoint

Une liste déroulante permet de sélectionner l'endpoint à tester :

**Endpoints Publics :**
- `GET /api/posts` - Liste des articles
- `GET /api/post/:slug` - Article spécifique
- `GET /api/videos` - Liste des vidéos
- `GET /api/video/:id` - Vidéo spécifique
- `GET /api/podcasts` - Liste des podcasts
- `GET /api/podcast/:id` - Podcast spécifique
- `GET /api/events` - Liste des événements
- `GET /api/event/:slug` - Événement spécifique
- `GET /api/siteinfos` - Informations du site

**Endpoints Protégés :**
- `GET /api/config` - Configuration (nécessite auth)
- `POST /api/clear-cache` - Vider le cache (nécessite auth)

### Configuration des Paramètres

Pour les endpoints avec paramètres (comme `/api/post/:slug`) :
- Un champ de saisie apparaît
- Entrez la valeur du paramètre (slug, id, etc.)
- Exemple : Pour `/api/post/:slug`, entrez `mon-premier-article`

### Authentification

Pour les endpoints protégés :
- L'authentification est gérée automatiquement
- Utilise votre session admin active
- Pas besoin de configurer manuellement les headers

### Envoi de Requête

1. Sélectionnez l'endpoint
2. Configurez les paramètres si nécessaire
3. Cliquez sur **Envoyer** ou appuyez sur Entrée
4. La réponse s'affiche dans la zone de résultat

### Affichage de la Réponse

La réponse JSON est :
- Formatée automatiquement
- Coloriée pour la lisibilité
- Copiable en un clic

## Exemples d'Utilisation

### Tester la Liste des Articles

1. Sélectionnez `GET /api/posts`
2. Cliquez sur **Envoyer**
3. La liste complète des articles s'affiche

### Tester un Article Spécifique

1. Sélectionnez `GET /api/post/:slug`
2. Entrez le slug dans le champ (ex: `mon-premier-article`)
3. Cliquez sur **Envoyer**
4. Les détails de l'article s'affichent

### Vider le Cache

1. Sélectionnez `POST /api/clear-cache`
2. Cliquez sur **Envoyer**
3. Un message de confirmation s'affiche

## Codes de Statut

L'explorateur affiche le code de statut HTTP :
- `200 OK` - Requête réussie
- `404 Not Found` - Ressource non trouvée
- `401 Unauthorized` - Authentification requise
- `500 Internal Server Error` - Erreur serveur

## Dépannage

### Erreur 401 Unauthorized

- Vérifiez que vous êtes connecté à l'admin
- Reconnectez-vous si nécessaire

### Erreur 404 Not Found

- Vérifiez que le paramètre (slug, id) est correct
- Vérifiez que la ressource existe

### Pas de Réponse

- Vérifiez votre connexion internet
- Vérifiez que le serveur est accessible
- Consultez la console du navigateur (F12) pour les erreurs

## Avantages

- ✅ Test rapide sans outils externes
- ✅ Authentification automatique
- ✅ Formatage JSON automatique
- ✅ Interface intuitive
- ✅ Accessible depuis n'importe où

## Prochaines Étapes

- [Vue d'ensemble de l'API](../api/overview.md)
- [Endpoints publics](../api/public-endpoints.md)
- [Endpoints protégés](../api/protected-endpoints.md)

