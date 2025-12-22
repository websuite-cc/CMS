# ❓ Questions Fréquentes

## Général

### Qu'est-ce que WebSuite CMS ?

WebSuite CMS est un CMS headless moderne basé sur RSS, déployable sur Cloudflare Pages. Il agrège automatiquement du contenu depuis Substack, YouTube, Podcasts et Meetup.

### Est-ce gratuit ?

Oui ! Le plan gratuit de Cloudflare Pages offre :
- 100 000 requêtes/jour
- Bandwidth illimité
- CDN global
- SSL automatique

### Quelles sources de contenu sont supportées ?

- ✅ **Substack** - Articles de blog
- ✅ **YouTube** - Vidéos
- ✅ **Podcasts** - Anchor.fm, Spotify, Apple Podcasts, etc.
- ✅ **Meetup** - Événements

### Puis-je ajouter d'autres sources ?

Oui ! Le système est extensible. Vous pouvez ajouter de nouvelles sources en créant un parser RSS personnalisé.

## Installation

### Comment installer WebSuite CMS ?

Voir le guide [Démarrage Rapide](../guide/quick-start.md).

### Puis-je l'installer ailleurs que sur Cloudflare Pages ?

Le code est conçu pour Cloudflare Pages Functions, mais peut être adapté pour d'autres plateformes serverless.

### Combien de temps prend l'installation ?

Moins de 5 minutes ! La plupart du temps est passé à configurer les variables d'environnement.

## Configuration

### Comment obtenir l'URL d'un flux RSS ?

- **Substack** : `https://votrecompte.substack.com/feed`
- **YouTube** : `https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID`
- **Podcasts** : Vérifiez la documentation de votre plateforme
- **Meetup** : `https://www.meetup.com/fr-fr/votre-groupe/events/rss`

### Comment trouver mon Channel ID YouTube ?

Utilisez [Comment Picker](https://commentpicker.com/youtube-channel-id.php).

### Les variables d'environnement sont-elles sécurisées ?

Oui, sur Cloudflare Pages, vous pouvez marquer les variables sensibles comme **Encrypted**. Elles ne seront jamais exposées publiquement.

## API

### L'API est-elle publique ?

La plupart des endpoints sont publics (articles, vidéos, podcasts, événements). Seuls les endpoints d'administration nécessitent une authentification.

### Comment s'authentifier ?

Utilisez le header `X-Auth-Key` avec votre mot de passe admin :

```http
X-Auth-Key: votre_password
```

### Y a-t-il des limites de taux ?

Sur le plan gratuit : 100 000 requêtes/jour. C'est largement suffisant pour la plupart des cas d'usage.

## Contenu

### Combien de temps prend la mise à jour du contenu ?

Le cache est de 180 secondes (3 minutes). Après publication d'un nouvel article, il apparaîtra dans les 3 minutes.

### Puis-je forcer le rafraîchissement ?

Oui, utilisez l'endpoint `/api/clear-cache` (protégé) pour vider le cache.

### Les images sont-elles incluses ?

Oui, les images sont extraites automatiquement des flux RSS et servies via le CDN Cloudflare.

## Déploiement

### Puis-je utiliser mon propre domaine ?

Oui ! Voir [Domaine Personnalisé](../deployment/custom-domain.md).

### Le déploiement est-il automatique ?

Oui, une fois connecté à Git, chaque push déclenche un nouveau déploiement automatique.

### Puis-je avoir plusieurs environnements ?

Oui, Cloudflare Pages supporte les environnements de production et de preview (branches/PRs).

## Support

### Où obtenir de l'aide ?

- 📧 Email : cms@iziweb.page
- 🐛 [GitHub Issues](https://github.com/iziweb-studio/CMS/issues)
- 📖 [Documentation complète](README.md)

### Puis-je contribuer ?

Oui ! Les contributions sont les bienvenues. Voir la section Contribution dans le README.

## Problèmes Techniques

### Mon contenu ne s'affiche pas

1. Vérifiez que les URLs de flux RSS sont correctes
2. Vérifiez que les flux sont accessibles publiquement
3. Videz le cache avec `/api/clear-cache`
4. Attendez quelques minutes

### Erreur 500

1. Vérifiez les logs dans Cloudflare Dashboard
2. Vérifiez que les variables d'environnement sont définies
3. Vérifiez que les URLs de flux RSS sont valides

### L'admin ne fonctionne pas

1. Vérifiez que `ADMIN_EMAIL` et `ADMIN_PASSWORD` sont corrects
2. Vérifiez que vous utilisez HTTPS
3. Videz le cache du navigateur

Pour plus d'aide, voir [Dépannage](troubleshooting.md).

