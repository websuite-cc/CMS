# 💨 Cache & Performance

Guide complet sur le système de cache et l'optimisation des performances.

## Vue d'Ensemble

WebSuite CMS utilise un système de cache intelligent pour optimiser les performances et réduire la charge sur les flux RSS sources.

## Système de Cache

### Cache Cloudflare

Le cache utilise l'infrastructure Cloudflare :
- **TTL** : 180 secondes (3 minutes)
- **Distribution** : 300+ datacenters dans le monde
- **Type** : Cache distribué global

### Fonctionnement

1. **Première requête** : Les données sont récupérées depuis le flux RSS
2. **Parsing** : Les données sont parsées et formatées
3. **Cache** : Les données sont mises en cache
4. **Requêtes suivantes** : Servies depuis le cache (ultra-rapide)

### Durée du Cache

- **180 secondes** par défaut
- Équilibre entre fraîcheur des données et performance
- Suffisant pour la plupart des cas d'usage

## Gestion du Cache

### Vider le Cache

Pour forcer le rafraîchissement immédiat :

**Via API :**

```bash
curl -X POST \
     -H "X-Auth-Key: votre_password" \
     https://votre-projet.pages.dev/api/clear-cache
```

**Via Interface Admin :**

1. Allez dans **API Explorer**
2. Sélectionnez `POST /api/clear-cache`
3. Cliquez sur **Envoyer**

### Quand Vider le Cache

- Après avoir publié un nouvel article
- Après avoir mis à jour un flux RSS
- Pour tester les modifications en production
- Si le contenu ne se met pas à jour

## Performance

### Temps de Réponse

- **Avec cache** : < 50ms (depuis le CDN)
- **Sans cache** : 500-2000ms (fetch + parsing)

### Optimisations

1. **CDN Global** : Distribution sur 300+ datacenters
2. **Cache Intelligent** : Réduction des requêtes vers les sources
3. **Parsing Optimisé** : Traitement rapide des flux RSS
4. **Compression** : Gzip automatique par Cloudflare

## Limites

### Plan Gratuit Cloudflare

- **100 000 requêtes/jour**
- **Bandwidth illimité**
- **Cache illimité**

### Cache par Endpoint

Chaque endpoint a son propre cache :
- `/api/posts` - Cache séparé
- `/api/videos` - Cache séparé
- `/api/podcasts` - Cache séparé
- `/api/events` - Cache séparé

## Monitoring

### Vérifier le Cache

```bash
# Première requête (sans cache)
time curl https://votre-projet.pages.dev/api/posts

# Deuxième requête (avec cache)
time curl https://votre-projet.pages.dev/api/posts
```

La deuxième requête devrait être significativement plus rapide.

### Headers de Cache

Les réponses incluent des headers de cache :
- `Cache-Control` : Instructions de cache
- `CF-Cache-Status` : Statut du cache Cloudflare

## Bonnes Pratiques

### Pour les Développeurs

1. ✅ Utilisez le cache pour les requêtes fréquentes
2. ✅ Videz le cache après les mises à jour importantes
3. ✅ Ne videz pas le cache trop souvent (impact performance)

### Pour les Utilisateurs

1. ✅ Attendez 3 minutes après publication pour voir le nouveau contenu
2. ✅ Utilisez `/api/clear-cache` si le contenu ne se met pas à jour
3. ✅ Le cache améliore la vitesse de chargement

## Dépannage

### Contenu Non Mis à Jour

1. Attendez 180 secondes (durée du cache)
2. Videz le cache avec `/api/clear-cache`
3. Vérifiez que le nouveau contenu est dans le flux RSS

### Performance Lente

1. Vérifiez que le cache fonctionne (deuxième requête plus rapide)
2. Vérifiez la vitesse du flux RSS source
3. Vérifiez votre connexion internet

## Prochaines Étapes

- [Sécurité](security.md)
- [HTMX & SSR](htmx-ssr.md)
- [Personnalisation](customization.md)

