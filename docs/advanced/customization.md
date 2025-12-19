# 🎨 Personnalisation

Guide pour personnaliser et étendre WebSuite CMS.

## Vue d'Ensemble

WebSuite CMS est conçu pour être extensible et personnalisable. Ce guide vous montre comment adapter le CMS à vos besoins.

## Personnalisation du Frontend

### Templates

Les templates sont dans `frontend/index.html`. Vous pouvez :
- Modifier les styles
- Changer la structure HTML
- Ajouter de nouveaux éléments

### Styles

Le projet utilise TailwindCSS. Vous pouvez :
- Ajouter des classes Tailwind
- Créer des styles personnalisés
- Modifier les couleurs et thèmes

### Exemple : Changer les Couleurs

```html
<!-- Avant -->
<button class="bg-purple-600">Bouton</button>

<!-- Après -->
<button class="bg-blue-600">Bouton</button>
```

## Ajouter un Nouveau Type de Contenu

### 1. Créer le Parser RSS

Dans `functions/shared/rss-parser.js` :

```javascript
export function parseCustomRSS(xmlText) {
  // Votre logique de parsing
  return items.map(item => ({
    title: item.title,
    // ... autres champs
    type: 'custom'
  }));
}
```

### 2. Créer l'Endpoint API

Dans `functions/api/custom.js` :

```javascript
export async function onRequestGet(context) {
  const { env } = context;
  const feedUrl = env.CUSTOM_FEED_URL;
  
  // Récupérer et parser le flux
  const items = await getCachedCustomData(feedUrl);
  
  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 3. Ajouter la Route

Dans `functions/_middleware.js`, ajoutez la route pour `/api/custom`.

### 4. Créer le Template

Dans `frontend/index.html` :

```html
<template id="tpl-custom">
  <div class="custom-item">
    <h2>{{title}}</h2>
    <p>{{description}}</p>
  </div>
</template>
```

### 5. Ajouter dans l'Admin

Dans `admin/dashboard.html` et `core/admin.js`, ajoutez la gestion du nouveau type.

## Personnalisation de l'Admin

### Dashboard

Modifiez `admin/dashboard.html` pour :
- Changer les statistiques affichées
- Ajouter de nouvelles sections
- Modifier les styles

### Fonctionnalités

Dans `core/admin.js`, vous pouvez :
- Ajouter de nouvelles fonctions
- Modifier le comportement existant
- Intégrer de nouveaux outils

## Configuration Avancée

### Variables d'Environnement Personnalisées

Ajoutez vos propres variables dans :
- `.dev.vars` (local)
- Cloudflare Dashboard (production)

### config.json

Modifiez `config.json` pour ajouter :
- Nouvelles configurations
- Paramètres personnalisés
- Métadonnées supplémentaires

## Intégrations

### Ajouter un Service Externe

1. Créez une fonction dans `functions/shared/`
2. Appelez l'API du service
3. Intégrez les données dans vos templates

### Exemple : Intégration Analytics

```javascript
// functions/shared/analytics.js
export async function trackEvent(eventName, data) {
  // Envoyer à votre service d'analytics
  await fetch('https://analytics.example.com/track', {
    method: 'POST',
    body: JSON.stringify({ event: eventName, data })
  });
}
```

## Thèmes

### Créer un Thème Personnalisé

1. Créez un fichier CSS dans `frontend/`
2. Modifiez les couleurs et styles
3. Intégrez-le dans `frontend/index.html`

### Mode Sombre

Le projet supporte déjà le mode sombre via TailwindCSS :
- Utilisez les classes `dark:`
- Le mode suit les préférences système

## Extensions

### Plugins

Vous pouvez créer des plugins en ajoutant des scripts dans `core/` :
- `core/plugins/custom.js`
- Chargez-les dans `admin/dashboard.html`

### Webhooks

Créez des endpoints webhook dans `functions/api/webhooks/` pour :
- Recevoir des notifications
- Déclencher des actions
- Synchroniser avec d'autres services

## Bonnes Pratiques

### Organisation du Code

- ✅ Séparer la logique métier des vues
- ✅ Utiliser des fonctions réutilisables
- ✅ Documenter le code
- ✅ Suivre les conventions existantes

### Performance

- ✅ Utiliser le cache quand possible
- ✅ Minimiser les requêtes externes
- ✅ Optimiser les templates
- ✅ Tester les performances

## Dépannage

### Modifications Non Visibles

- Videz le cache du navigateur
- Videz le cache serveur (`/api/clear-cache`)
- Vérifiez que les fichiers sont bien déployés

### Erreurs JavaScript

- Vérifiez la console du navigateur (F12)
- Vérifiez les logs du serveur
- Testez en local d'abord

## Ressources

- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [HTMX Documentation](https://htmx.org/docs/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

## Prochaines Étapes

- [Cache & Performance](caching.md)
- [Sécurité](security.md)
- [HTMX & SSR](htmx-ssr.md)

