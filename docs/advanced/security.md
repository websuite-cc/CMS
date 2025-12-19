# 🔐 Sécurité

Guide complet sur la sécurité de WebSuite CMS.

## Vue d'Ensemble

WebSuite CMS est conçu avec la sécurité en tête, mais il est important de suivre les bonnes pratiques pour protéger votre installation.

## Authentification

### Mot de Passe Admin

**Recommandations :**
- ✅ Minimum 12 caractères
- ✅ Combinaison de lettres, chiffres et symboles
- ✅ Unique (ne pas réutiliser d'autres mots de passe)
- ✅ Changé régulièrement

### Protection du Mot de Passe

**Dans Cloudflare :**
1. Allez dans **Settings** → **Environment variables**
2. Marquez `ADMIN_PASSWORD` comme **Encrypted**
3. Le mot de passe ne sera jamais exposé publiquement

**En Local :**
- Le fichier `.dev.vars` est dans `.gitignore`
- Ne jamais commiter ce fichier
- Ne jamais partager ce fichier

## Variables d'Environnement

### Variables Sensibles

Ces variables doivent être chiffrées :
- `ADMIN_PASSWORD` - **Toujours chiffrer**
- Toute variable contenant des secrets ou tokens

### Variables Publiques

Ces variables peuvent rester non chiffrées :
- `BLOG_FEED_URL`
- `YOUTUBE_FEED_URL`
- `META_TITLE`
- `META_DESCRIPTION`

## HTTPS

### Automatique sur Cloudflare Pages

- ✅ SSL/TLS automatique
- ✅ Certificats renouvelés automatiquement
- ✅ HTTPS forcé
- ✅ Pas de configuration nécessaire

### Vérification

Vérifiez que votre site utilise HTTPS :
- L'URL doit commencer par `https://`
- Le cadenas doit être vert dans le navigateur

## Protection des Endpoints

### Endpoints Publics

Les endpoints publics sont accessibles sans authentification :
- `/api/posts`
- `/api/videos`
- `/api/podcasts`
- `/api/events`

Ces endpoints sont conçus pour être publics.

### Endpoints Protégés

Les endpoints protégés nécessitent une authentification :
- `/api/config` - Requiert `X-Auth-Key`
- `/api/clear-cache` - Requiert `X-Auth-Key`

## Bonnes Pratiques

### Développement

1. ✅ Ne jamais commiter les secrets
2. ✅ Utiliser des variables d'environnement
3. ✅ Vérifier `.gitignore` régulièrement
4. ✅ Utiliser HTTPS en production

### Production

1. ✅ Mot de passe fort et unique
2. ✅ Variables chiffrées dans Cloudflare
3. ✅ 2FA activé sur le compte Cloudflare
4. ✅ Monitoring des accès

### Code Client

**⚠️ Important :** Ne jamais exposer le mot de passe dans le code client !

```javascript
// ❌ MAUVAIS
const password = 'mon_password';
fetch('/api/config', {
  headers: { 'X-Auth-Key': password }
});

// ✅ BON
// Utiliser l'endpoint /api/login pour obtenir un token
// Le mot de passe reste côté serveur
```

## Protection contre les Attaques

### Rate Limiting

Cloudflare Pages inclut un rate limiting automatique :
- Protection contre les attaques DDoS
- Limitation des requêtes abusives
- 100 000 requêtes/jour sur le plan gratuit

### Validation des Entrées

- Les paramètres d'URL sont validés
- Les slugs sont sanitizés
- Protection contre l'injection

### XSS (Cross-Site Scripting)

- Le contenu HTML est échappé
- Les descriptions sont sanitizées
- Protection contre l'injection de scripts

## Audit de Sécurité

### Vérifications Régulières

1. ✅ Vérifier les accès admin
2. ✅ Vérifier les logs Cloudflare
3. ✅ Vérifier les variables d'environnement
4. ✅ Mettre à jour les mots de passe

### Signes d'Intrusion

- Activité suspecte dans les logs
- Modifications non autorisées
- Accès depuis des IP inconnues

## Dépannage

### Mot de Passe Oublié

1. Allez dans Cloudflare Dashboard
2. Modifiez la variable `ADMIN_PASSWORD`
3. Redéployez

### Compromission Suspectée

1. Changez immédiatement le mot de passe
2. Vérifiez les logs Cloudflare
3. Vérifiez les variables d'environnement
4. Contactez le support si nécessaire

## Ressources

- [Cloudflare Security](https://www.cloudflare.com/learning/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Documentation Cloudflare Pages](https://developers.cloudflare.com/pages/)

## Prochaines Étapes

- [Cache & Performance](caching.md)
- [HTMX & SSR](htmx-ssr.md)
- [Personnalisation](customization.md)

