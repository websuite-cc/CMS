# 📝 Gestion du Contenu

Guide complet pour gérer vos contenus depuis l'interface admin.

## Vue d'Ensemble

L'interface admin permet de gérer tous vos contenus agrégés depuis les flux RSS :
- Articles (Substack)
- Vidéos (YouTube)
- Podcasts
- Événements (Meetup)

## Navigation

### Accéder aux Contenus

1. Connectez-vous à `/admin`
2. Utilisez les onglets de navigation :
   - **Articles**
   - **Vidéos**
   - **Podcasts**
   - **Événements**

## Fonctionnalités Communes

### Recherche

Tous les onglets de contenu incluent une barre de recherche qui filtre en temps réel :
- Recherche par titre
- Recherche insensible à la casse
- Mise à jour instantanée

### Pagination

Pour les grandes listes :
- Navigation par pages
- Boutons Précédent/Suivant
- Affichage du nombre d'éléments

### Prévisualisation

Cliquez sur **Voir** (bouton violet) pour :
- Afficher le contenu complet dans une modal
- Voir les métadonnées
- Accéder au lien source

## Gestion des Articles

### Liste des Articles

Affiche tous les articles depuis Substack avec :
- Titre
- Date de publication
- Action (Voir)

### Prévisualisation d'Article

La modal affiche :
- Image de couverture
- Titre complet
- Auteur
- Date de publication
- Contenu HTML complet
- Lien vers Substack

## Gestion des Vidéos

### Liste des Vidéos

Affiche toutes les vidéos depuis YouTube avec :
- Titre
- Date de publication
- Action (Voir)

### Prévisualisation de Vidéo

La modal affiche :
- Lecteur YouTube intégré
- Titre
- Description
- Date de publication
- Lien vers YouTube

## Gestion des Podcasts

### Liste des Podcasts

Affiche tous les épisodes avec :
- Titre
- Date de publication
- Action (Voir)

### Prévisualisation de Podcast

La modal affiche :
- Lecteur audio intégré
- Titre
- Description
- Durée
- Date de publication
- Lien vers la plateforme

## Gestion des Événements

### Liste des Événements

Affiche tous les événements depuis Meetup avec :
- Titre
- Date de publication
- Action (Voir)

### Prévisualisation d'Événement

La modal affiche :
- Image de l'événement
- Titre
- Date et heure
- Lieu
- Prix
- Description complète
- Lien vers Meetup

## Actualisation du Contenu

### Cache Automatique

Le contenu est mis en cache pendant 180 secondes (3 minutes) pour optimiser les performances.

### Forcer l'Actualisation

Pour forcer la mise à jour immédiate :
1. Allez dans l'onglet **Configuration**
2. Utilisez l'endpoint `/api/clear-cache` via l'API Explorer
3. Ou utilisez directement l'API avec authentification

## Statistiques

Le dashboard affiche :
- Nombre total d'articles
- Nombre total de vidéos
- Nombre total de podcasts
- Nombre total d'événements
- Statut de chaque flux (Actif/Inactif)
- Source détectée (Substack, YouTube, Meetup, etc.)

## Dépannage

### Contenu Non Affiché

- Vérifiez que le flux RSS est configuré
- Vérifiez que le flux est accessible
- Videz le cache si nécessaire

### Recherche Ne Fonctionne Pas

- Vérifiez que JavaScript est activé
- Rechargez la page
- Videz le cache du navigateur

## Prochaines Étapes

- [Dashboard](dashboard.md)
- [Fonctionnalités](features.md)
- [API Explorer](api-explorer.md)

