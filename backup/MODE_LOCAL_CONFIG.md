# Configuration Mode Local - iziWebCMS

## ✅ Modifications effectuées

### 1. **`core/admin.js`** - Simplification pour mode local
- ❌ **Supprimé** : Configuration hybride public/self-hosted
- ❌ **Supprimé** : Ajout de query params (`substack_url`, `youtube_url`, etc.)
- ✅ **Simplifié** : `buildApiUrl()` retourne directement l'endpoint
- ✅ **Résultat** : Toutes les requêtes API vont directement au worker local

### 2. **`admin/dashboard.html`** - Désactivation mode public
- ❌ **Commenté** : `window.STACKPAGES_API_URL`
- ❌ **Commenté** : `window.STACKPAGES_CONFIG`
- ✅ **Résultat** : Mode local activé par défaut

---

## 🚀 Comment ça fonctionne maintenant

### Architecture simplifiée :

```
Frontend (admin/dashboard.html)
         ↓
    admin.js fait appel à /api/*
         ↓
    Worker local (_worker.js)
         ↓
    Lit les ENV VARS (SUBSTACK_FEED_URL, etc.)
         ↓
    Retourne les données
```

### Flux de données :

1. **Le dashboard charge** → `admin.js` appelle `/api/posts`
2. **Le worker reçoit la requête** → Lit `env.SUBSTACK_FEED_URL`
3. **Le worker parse le RSS** → Cache les données (180s)
4. **Le worker répond** → JSON avec les articles
5. **`admin.js` affiche** → Les articles dans le tableau

---

## 🔧 Configuration requise

### Variables d'environnement dans `wrangler.toml` ou Cloudflare Dashboard :

```toml
[vars]
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "votre_password_securise"
SUBSTACK_FEED_URL = "https://votre-compte.substack.com/feed"
YOUTUBE_FEED_URL = "https://www.youtube.com/feeds/videos.xml?channel_id=VOTRE_CHANNEL_ID"
PODCAST_FEED_URL = "https://anchor.fm/s/VOTRE_PODCAST_ID/podcast/rss"
FRONTEND_BUILDER_URL = "https://apps.webstudio.is/dashboard"
META_TITLE = "Mon Site StackPages"
META_DESCRIPTION = "Description de mon site"
META_KEYWORDS = "mots,clés,seo"
```

---

## 🧪 Tester en local

### Option 1 : Wrangler Dev (Recommandé)

```bash
# Dans le dossier ProdBeta/
npx wrangler dev _worker.js

# Le serveur démarre sur http://localhost:8787
```

### Option 2 : Miniflare (Alternative)

```bash
npm install -g miniflare
miniflare _worker.js --binding SUBSTACK_FEED_URL="https://..."
```

### Accéder au dashboard :

1. Ouvrir : `http://localhost:8787/admin/`
2. Se connecter avec `ADMIN_EMAIL` et `ADMIN_PASSWORD`
3. Le dashboard charge les données depuis le worker local

---

## 📋 Endpoints API disponibles

| Endpoint | Méthode | Auth | Description |
|----------|---------|------|-------------|
| `/api/login` | POST | ❌ | Connexion admin |
| `/api/metadata` | GET | ❌ | Infos du site |
| `/api/posts` | GET | ❌ | Articles Substack |
| `/api/post/:slug` | GET | ❌ | Article spécifique |
| `/api/videos` | GET | ❌ | Vidéos YouTube |
| `/api/video/:id` | GET | ❌ | Vidéo spécifique |
| `/api/podcasts` | GET | ❌ | Épisodes podcast |
| `/api/podcast/:id` | GET | ❌ | Podcast spécifique |
| `/api/config` | GET | ✅ | Config (protégé) |
| `/api/clear-cache` | POST | ✅ | Vider cache (protégé) |

**Auth** : Header `X-Auth-Key: votre_password`

---

## 🐛 Dépannage

### Le dashboard ne charge pas les données ?

**Vérifier :**
1. Le worker tourne bien (`npx wrangler dev`)
2. Les env vars sont définies dans `wrangler.toml`
3. La console browser (F12) pour voir les erreurs
4. L'onglet Network pour voir les requêtes API

### Erreur CORS ?

Le worker inclut déjà les headers CORS :
```javascript
corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
}
```

### Cache ne se rafraîchit pas ?

Utiliser le bouton **"Vider le Cache"** dans Configuration, ou ajouter `?refresh=true` :
```
http://localhost:8787/api/posts?refresh=true
```

---

## 🔄 Basculer vers le mode PUBLIC (optionnel)

Si vous voulez utiliser un worker API partagé :

1. **Décommenter** dans `admin/dashboard.html` (lignes 756-766)
2. **Configurer** `STACKPAGES_API_URL` avec l'URL du worker public
3. **Configurer** `STACKPAGES_CONFIG` avec vos flux RSS

---

## ✅ Checklist de validation

- [ ] Worker démarre sans erreur (`wrangler dev`)
- [ ] Page d'accueil `/` affiche le portail
- [ ] Page `/admin/` affiche la connexion
- [ ] Connexion fonctionne avec email/password
- [ ] Dashboard `/admin/dashboard.html` se charge
- [ ] Statistiques affichent les nombres corrects
- [ ] Tableaux Articles/Vidéos/Podcasts se remplissent
- [ ] Recherche fonctionne dans les tableaux
- [ ] Pagination fonctionne (si +10 items)
- [ ] Modal d'aperçu fonctionne
- [ ] API Explorer retourne des JSON valides
- [ ] Configuration affiche les valeurs des env vars

---

## 📝 Notes importantes

- **Cache TTL** : 180 secondes (3 min) pour optimiser les performances
- **Authentification** : Basique (localStorage + header), pas de JWT
- **Pas de DB** : Tout vient des flux RSS externes
- **Serverless** : Déployable sur Cloudflare Workers gratuitement

Votre CMS est maintenant configuré en **MODE LOCAL** ! 🎉
