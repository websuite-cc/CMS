# ⚙️ Variables d'Environnement

Guide complet des variables d'environnement de WebSuite CMS.

## Variables Obligatoires

### ADMIN_EMAIL

Email de connexion pour l'interface admin.

```env
ADMIN_EMAIL=admin@example.com
```

### ADMIN_PASSWORD

Mot de passe pour l'interface admin. **Minimum 12 caractères recommandé**.

```env
ADMIN_PASSWORD=votre_password_securise_12_caracteres_minimum
```

> 🔒 **Sécurité** : Marquez cette variable comme **Encrypted** dans Cloudflare !

### BLOG_FEED_URL

URL du flux RSS Substack pour les articles.

```env
BLOG_FEED_URL=https://votrecompte.substack.com/feed
```

## Variables Optionnelles

### YOUTUBE_FEED_URL

URL du flux RSS YouTube pour les vidéos.

```env
YOUTUBE_FEED_URL=https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_CHANNEL_ID
```

### PODCAST_FEED_URL

URL du flux RSS pour les podcasts.

```env
PODCAST_FEED_URL=https://anchor.fm/s/VOTRE_ID/podcast/rss
```

### EVENTS_FEED_URL

URL du flux RSS Meetup pour les événements.

```env
EVENTS_FEED_URL=https://www.meetup.com/fr-fr/votre-groupe/events/rss
```

### FRONTEND_BUILDER_URL

URL du builder frontend (Webstudio, etc.).

```env
FRONTEND_BUILDER_URL=https://votre-builder.webstudio.dev
```

### META_TITLE

Titre SEO du site.

```env
META_TITLE=WebSuite CMS
```

### META_DESCRIPTION

Description SEO du site.

```env
META_DESCRIPTION=CMS headless moderne basé sur RSS
```

### META_KEYWORDS

Mots-clés SEO (séparés par des virgules).

```env
META_KEYWORDS=cms, rss, cloudflare, headless
```

## Configuration dans Cloudflare Pages

### Via Dashboard

1. Allez dans **Workers & Pages** → Votre projet
2. **Settings** → **Environment variables**
3. Cliquez sur **Add variable**
4. Entrez le nom et la valeur
5. Pour les variables sensibles, cochez **Encrypted**

### Via CLI

```bash
# Variable normale
npx wrangler pages secret put ADMIN_EMAIL

# Variable chiffrée (recommandé pour les mots de passe)
npx wrangler pages secret put ADMIN_PASSWORD
```

## Configuration Locale (.dev.vars)

Pour le développement local, créez un fichier `.dev.vars` :

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=votre_password_securise
BLOG_FEED_URL=https://votrecompte.substack.com/feed
YOUTUBE_FEED_URL=https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID
PODCAST_FEED_URL=https://anchor.fm/s/VOTRE_ID/podcast/rss
EVENTS_FEED_URL=https://www.meetup.com/fr-fr/votre-groupe/events/rss
```

> ⚠️ **Important** : `.dev.vars` est dans `.gitignore` et ne sera jamais commité.

## Priorité des Variables

1. **Variables d'environnement Cloudflare** (priorité la plus haute)
2. **config.json** (fallback)
3. **Valeurs par défaut** (si définies)

## Variables par Environnement

Cloudflare Pages supporte des variables différentes par environnement :

- **Production** - Variables pour la production
- **Preview** - Variables pour les previews (branches/PRs)

Configurez-les séparément dans le dashboard.

## Sécurité

### Bonnes Pratiques

1. ✅ **Utilisez des mots de passe forts** (12+ caractères)
2. ✅ **Marquez les variables sensibles comme Encrypted**
3. ✅ **Ne commitez jamais `.dev.vars`**
4. ✅ **Changez les mots de passe régulièrement**
5. ✅ **Utilisez des variables différentes pour dev/prod**

### Variables à Chiffrer

- `ADMIN_PASSWORD` - **Toujours chiffrer**
- Toute variable contenant des secrets ou tokens

### Variables Publiques

Ces variables peuvent rester non chiffrées :
- `BLOG_FEED_URL`
- `YOUTUBE_FEED_URL`
- `META_TITLE`
- `META_DESCRIPTION`

## Vérification

### Tester les Variables

```bash
# En local avec Wrangler
npx wrangler pages dev .

# Les variables sont chargées automatiquement depuis .dev.vars
```

### Vérifier dans l'API

```bash
# Récupérer la config (nécessite auth)
curl -H "X-Auth-Key: votre_password" \
     https://votre-projet.pages.dev/api/config
```

## Dépannage

### Variables Non Chargées

1. Vérifiez que les variables sont définies dans le dashboard
2. Redéployez après avoir ajouté des variables
3. Vérifiez la syntaxe (pas d'espaces autour du `=`)

### Variables Non Disponibles en Local

1. Vérifiez que `.dev.vars` existe
2. Vérifiez la syntaxe du fichier
3. Redémarrez Wrangler

## Prochaines Étapes

- [Configuration des flux RSS](../configuration/rss-feeds.md)
- [Déploiement](cloudflare-pages.md)
- [Sécurité](advanced/security.md)

