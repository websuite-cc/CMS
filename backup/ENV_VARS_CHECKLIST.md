# ⚠️ Checklist Variables d'Environnement Cloudflare Pages

## Variables REQUISES pour que le Dashboard fonctionne

Vérifier que ces variables sont configurées dans **Cloudflare Dashboard** :

Settings → Environment variables → **Production**

### ✅ Variables Obligatoires

```bash
# Authentification Admin
ADMIN_EMAIL=votre@email.com
ADMIN_PASSWORD=votre_password_fort

# Flux RSS Contenus
SUBSTACK_FEED_URL=https://votrecompte.substack.com/feed
YOUTUBE_FEED_URL=https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_ID
PODCAST_FEED_URL=https://anchor.fm/s/VOTRE_ID/podcast/rss

# Frontend Webstudio
WSTD_STAGING_URL=https://votre-projet.wstd.io

# SEO (optionnel)
META_TITLE=Votre Site
META_DESCRIPTION=Description
META_KEYWORDS=mots,clés
```

## Comment Ajouter les Variables

1. **Aller sur** : https://dash.cloudflare.com/
2. **Pages** → Votre projet
3. **Settings** → **Environment variables**
4. **Production** tab
5. **Add variable** pour chaque variable ci-dessus
6. **Save**
7. **Redéployer** : Deployments → Retry deployment

## Tester si les variables sont bien configurées

```bash
# Tester l'API metadata
curl https://votre-projet.pages.dev/api/metadata

# Devrait retourner :
{
  "siteName": "...",
  "substackRssUrl": "https://...",  <- Si vide, variable manquante !
  "youtubeRssUrl": "https://...",
  ...
}
```

## Si les données ne s'affichent toujours pas

### 1. Vérifier Console Browser (F12)

Ouvrir le dashboard et regarder :
- **Console** : Erreurs JavaScript ?
- **Network** : Requêtes `/api/*` retournent 200 ou erreur ?

### 2. Vérifier Logs Cloudflare

```bash
npx wrangler pages deployment tail
```

### 3. Tester API manuellement

```bash
# Posts
curl https://votre-projet.pages.dev/api/posts

# Devrait retourner array JSON, pas []
```

## Problèmes courants

❌ **Tableau vide `[]`** → `SUBSTACK_FEED_URL` manquante ou invalide  
❌ **Erreur 401** → `ADMIN_EMAIL` / `ADMIN_PASSWORD` manquants  
❌ **Erreur 500** → URL RSS invalide ou inaccessible  
❌ **"Not Found"** → `_worker.js` existe encore (le supprimer !)  

---

**Action immédiate** : Configurez toutes les variables dans Cloudflare Dashboard ! 🎯
