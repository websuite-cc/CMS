# 🎨 Fonctionnalités de l'Interface Admin

Vue d'ensemble complète des fonctionnalités disponibles dans l'interface admin.

## Vue d'Ensemble

L'interface admin offre une gestion complète de votre CMS avec :

- 📊 **Dashboard** - Statistiques et vue d'ensemble
- 📝 **Gestion du contenu** - Articles, vidéos, podcasts, événements
- 🔧 **API Explorer** - Tester les endpoints
- ⚙️ **Configuration** - Paramètres du site

## Dashboard

### Statistiques

Cartes affichant le nombre total de :
- Articles
- Vidéos
- Podcasts
- Événements

Chaque carte affiche également :
- Statut du flux (Actif/Inactif)
- Source détectée (Substack, YouTube, Meetup, etc.)

### Derniers Contenus

Tableaux affichant les derniers éléments de chaque type avec :
- Titre
- Date de publication
- Bouton "Voir" pour prévisualiser

## Gestion du Contenu

### Articles

- Liste complète des articles
- Recherche par titre
- Pagination
- Prévisualisation dans une modal
- Lien vers l'article sur Substack

### Vidéos

- Liste complète des vidéos
- Recherche par titre
- Pagination
- Prévisualisation avec lecteur YouTube intégré
- Lien vers la vidéo sur YouTube

### Podcasts

- Liste complète des épisodes
- Recherche par titre
- Pagination
- Prévisualisation avec lecteur audio
- Lien vers l'épisode sur la plateforme

### Événements

- Liste complète des événements
- Recherche par titre
- Pagination
- Prévisualisation avec détails complets
- Lien vers l'événement sur Meetup

## API Explorer

### Fonctionnalités

- Sélection d'endpoint dans une liste déroulante
- Configuration des paramètres
- Envoi de requête
- Affichage de la réponse JSON formatée

### Endpoints Disponibles

- `GET /api/posts`
- `GET /api/post/:slug`
- `GET /api/videos`
- `GET /api/video/:id`
- `GET /api/podcasts`
- `GET /api/podcast/:id`
- `GET /api/events`
- `GET /api/event/:slug`
- `GET /api/siteinfos`
- `GET /api/config` (protégé)
- `POST /api/clear-cache` (protégé)

## Configuration

### Affichage

La configuration est affichée en lecture seule avec :
- Nom du site
- Auteur
- URLs des flux RSS
- Paramètres SEO

### Modification

Les modifications se font via les variables d'environnement dans Cloudflare Dashboard.

## Recherche

Tous les onglets de contenu incluent une barre de recherche pour filtrer les éléments en temps réel.

## Pagination

Navigation par pages pour les grandes listes de contenu avec :
- Boutons Précédent/Suivant
- Affichage du nombre d'éléments par page

## Prévisualisation

Cliquez sur **Voir** pour afficher une modal avec :
- Contenu complet
- Métadonnées
- Lien vers la source originale

## Prochaines Étapes

- [Dashboard](dashboard.md)
- [Gestion du contenu](content-management.md)
- [API Explorer](api-explorer.md)

