# 🔍 SEO & Métadonnées

Configuration SEO pour optimiser le référencement de votre site.

## Métadonnées de Base

### Titre (Meta Title)

```env
META_TITLE=WebSuite CMS - Votre Titre
```

Ou dans `config.json` :

```json
{
  "seo": {
    "metaTitle": "WebSuite CMS - Votre Titre"
  }
}
```

**Recommandations** :
- 50-60 caractères maximum
- Inclure le nom de votre site
- Unique et descriptif

### Description (Meta Description)

```env
META_DESCRIPTION=CMS headless moderne basé sur RSS, déployable sur Cloudflare Pages
```

**Recommandations** :
- 150-160 caractères
- Description accrocheuse
- Inclure des mots-clés pertinents

### Mots-clés (Meta Keywords)

```env
META_KEYWORDS=cms, rss, cloudflare, headless, serverless
```

**Recommandations** :
- 5-10 mots-clés maximum
- Séparés par des virgules
- Pertinents pour votre contenu

## Open Graph

Les métadonnées Open Graph sont générées automatiquement à partir de votre contenu pour les partages sur les réseaux sociaux.

### Images

Les images sont extraites automatiquement :
- Articles : Image de couverture
- Vidéos : Miniature YouTube
- Podcasts : Image de l'épisode
- Événements : Image de l'événement

## Structure des URLs

### Articles

```
https://votre-site.com/post/slug-de-l-article
```

### Vidéos

```
https://votre-site.com/video/id-youtube
```

### Podcasts

```
https://votre-site.com/podcast/id-episode
```

### Événements

```
https://votre-site.com/event/slug-evenement
```

## Sitemap

Un sitemap XML peut être généré automatiquement. Contactez le support pour l'activation.

## Robots.txt

Par défaut, tous les contenus sont indexables. Pour restreindre l'indexation :

1. Créez un fichier `robots.txt` à la racine
2. Configurez les règles d'indexation

## Bonnes Pratiques

### Contenu

- ✅ Utilisez des titres descriptifs
- ✅ Ajoutez des descriptions complètes
- ✅ Utilisez des images de qualité
- ✅ Structurez le contenu avec des balises HTML sémantiques

### Performance

- ✅ Le cache de 180s améliore les temps de chargement
- ✅ Le CDN Cloudflare optimise la distribution
- ✅ Les images sont servies via CDN

### Mobile

- ✅ Le site est responsive par défaut
- ✅ Les métadonnées sont optimisées pour mobile

## Vérification

### Tester les Métadonnées

```bash
# Vérifier les informations du site
curl https://votre-projet.pages.dev/api/siteinfos
```

### Outils de Test

- [Google Search Console](https://search.google.com/search-console)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)

## Prochaines Étapes

- [Configuration générale](overview.md)
- [Flux RSS](rss-feeds.md)
- [Déploiement](../deployment/cloudflare-pages.md)

