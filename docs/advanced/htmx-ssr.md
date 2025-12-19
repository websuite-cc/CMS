# ⚡ HTMX & SSR

Guide sur l'utilisation de HTMX et du Server-Side Rendering dans WebSuite CMS.

## Vue d'Ensemble

WebSuite CMS utilise HTMX pour le rendu dynamique et le Server-Side Rendering (SSR) pour optimiser les performances.

## HTMX

### Qu'est-ce que HTMX ?

HTMX permet de faire des requêtes AJAX directement depuis le HTML, sans JavaScript complexe.

### Utilisation dans WebSuite CMS

Les templates frontend utilisent HTMX pour :
- Charger le contenu dynamiquement
- Naviguer sans rechargement de page
- Mettre à jour des sections spécifiques

### Exemple

```html
<a href="/posts" 
   hx-get="/posts" 
   hx-target="#main-content" 
   hx-push-url="true">
  Voir les articles
</a>
```

**Attributs HTMX :**
- `hx-get` - Requête GET
- `hx-target` - Cible de remplacement
- `hx-push-url` - Mise à jour de l'URL

## Server-Side Rendering (SSR)

### Fonctionnement

Le SSR génère le HTML côté serveur avant de l'envoyer au client :
1. Requête vers une route (ex: `/posts`)
2. Le serveur génère le HTML complet
3. Le HTML est envoyé au client
4. HTMX remplace la section cible

### Avantages

- ✅ Meilleur SEO (contenu indexable)
- ✅ Chargement initial plus rapide
- ✅ Fonctionne sans JavaScript
- ✅ Meilleure expérience utilisateur

## Routes SSR

### Routes Supportées

- `/posts` - Liste des articles
- `/post/:slug` - Article spécifique
- `/videos` - Liste des vidéos
- `/video/:id` - Vidéo spécifique
- `/podcasts` - Liste des podcasts
- `/podcast/:id` - Podcast spécifique
- `/events` - Liste des événements
- `/event/:slug` - Événement spécifique

### Détection Automatique

Le middleware détecte automatiquement :
- Les requêtes HTMX
- Les routes de contenu
- Les templates à utiliser

## Templates

### Structure

Les templates sont dans `frontend/index.html` :
- `<template id="tpl-posts">` - Liste des articles
- `<template id="tpl-post-detail">` - Détail d'un article
- Etc.

### Placeholders

Les templates utilisent des placeholders :
- `{{title}}` - Titre
- `{{content}}` - Contenu
- `{{items}}` - Liste d'éléments

### Génération

Le serveur remplace les placeholders avec les données réelles avant d'envoyer le HTML.

## Exemples

### Navigation HTMX

```html
<!-- Navigation avec HTMX -->
<nav>
  <a href="/posts" 
     hx-get="/posts" 
     hx-target="#main-content" 
     hx-push-url="true">
    Articles
  </a>
  <a href="/videos" 
     hx-get="/videos" 
     hx-target="#main-content" 
     hx-push-url="true">
    Vidéos
  </a>
</nav>

<!-- Zone de contenu -->
<div id="main-content">
  <!-- Le contenu sera injecté ici -->
</div>
```

### Requête AJAX Simple

```html
<button hx-get="/api/posts" 
        hx-target="#posts-list">
  Charger les articles
</button>

<div id="posts-list">
  <!-- Les articles apparaîtront ici -->
</div>
```

## Personnalisation

### Créer un Nouveau Template

1. Ajoutez un template dans `frontend/index.html` :
```html
<template id="tpl-custom">
  <div class="custom-content">
    <h1>{{title}}</h1>
    <p>{{description}}</p>
  </div>
</template>
```

2. Créez une fonction de génération dans `functions/shared/htmx-render.js`

3. Ajoutez la route dans `functions/_middleware.js`

## Performance

### Cache

Le SSR utilise le même cache que l'API :
- Cache de 180 secondes
- Réduction des requêtes vers les sources
- Réponses ultra-rapides

### Optimisations

- Génération côté serveur (pas de JavaScript nécessaire)
- HTML minimal (pas de framework lourd)
- CDN Cloudflare pour la distribution

## Dépannage

### Contenu Non Affiché

- Vérifiez que HTMX est chargé
- Vérifiez la console du navigateur (F12)
- Vérifiez que la route existe

### Erreur 404

- Vérifiez que le template existe
- Vérifiez que la fonction de génération est correcte
- Vérifiez les logs du serveur

## Prochaines Étapes

- [Cache & Performance](caching.md)
- [Sécurité](security.md)
- [Personnalisation](customization.md)

