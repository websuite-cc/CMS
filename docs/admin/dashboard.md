# 🎨 Interface Admin - Dashboard

Le dashboard admin offre une vue d'ensemble complète de votre CMS.

## Accès

L'interface admin est accessible à :

```
https://votre-projet.pages.dev/admin
```

## Connexion

1. Entrez votre email admin (variable `ADMIN_EMAIL`)
2. Entrez votre mot de passe (variable `ADMIN_PASSWORD`)
3. Cliquez sur **Se connecter**

## Vue d'Ensemble

Le dashboard affiche :

### 📊 Statistiques

- **Articles** - Nombre total d'articles
- **Vidéos** - Nombre total de vidéos
- **Podcasts** - Nombre total d'épisodes
- **Événements** - Nombre total d'événements

Chaque carte affiche :
- Le nombre d'éléments
- Le statut du flux (Actif/Inactif)
- La source détectée (Substack, YouTube, Meetup, etc.)

### 📝 Derniers Contenus

Tableaux affichant les derniers éléments de chaque type :
- Titre
- Date de publication
- Action (bouton "Voir" pour prévisualiser)

## Navigation

### Onglets Disponibles

- **Dashboard** - Vue d'ensemble
- **Articles** - Gestion des articles
- **Vidéos** - Gestion des vidéos
- **Podcasts** - Gestion des podcasts
- **Événements** - Gestion des événements
- **API Explorer** - Tester les endpoints API
- **Configuration** - Paramètres (lecture seule)

## Fonctionnalités

### Recherche

Tous les onglets de contenu incluent une barre de recherche pour filtrer les éléments.

### Pagination

Navigation par pages pour les grandes listes de contenu.

### Prévisualisation

Cliquez sur **Voir** pour afficher une modal avec :
- Le contenu complet
- Les métadonnées
- Un lien vers la source originale

### API Explorer

Testez directement les endpoints API depuis l'interface :
- Sélectionnez un endpoint
- Configurez les paramètres
- Visualisez la réponse JSON

## Prochaines Étapes

- [Fonctionnalités détaillées](features.md)
- [Gestion du contenu](content-management.md)
- [API Explorer](api-explorer.md)

