# 🔧 Guide de Diagnostic - Dashboard Vide

## Problèmes Identifiés et Corrigés

### ✅ 1. Redirection après login
**Problème** : Redirection vers `/dashboard` (404)  
**Correction** : `/admin/dashboard.html`  
**Fichier** : `admin/index.html` ligne 109

---

## Dashboard Vide - Checklist de Diagnostic

### Étape 1 : Vérifier que le nouveau code est déployé

Le code a été modifié pour utiliser `BLOG_FEED_URL` et `blogRssUrl`.

**Vérifier** :
```bash
# Tester l'API metadata - doit retourner "blogRssUrl" et NON "substackRssUrl"
curl https://votre-projet.pages.dev/api/metadata

# ✅ Si vous voyez "blogRssUrl": "..." → nouveau code déployé
# ❌ Si vous voyez "substackRssUrl": "..." → ancien code, redéployer !
```

**Si ancien code → REDÉPLOYER** :
```bash
git add .
git commit -m "Fix: blogRssUrl and redirect"
git push origin main
```

---

### Étape 2 : Vérifier les Variables d'Environnement

Dans Cloudflare Dashboard :
- ✅ `BLOG_FEED_URL` configurée
- ✅ `YOUTUBE_FEED_URL` configurée  
- ✅ `PODCAST_FEED_URL` configurée
- ✅ `ADMIN_EMAIL` configurée
- ✅ `ADMIN_PASSWORD` configurée

**Attention** : Après modification des variables, **redéployer** obligatoirement !

---

### Étape 3 : Vérifier la Console Browser (F12)

1. Ouvrir le dashboard
2. F12 → Console
3. Rechercher erreurs :
   - ❌ `404 /api/posts` → Routes API non accessibles
   - ❌ `CORS error` → Problème headers
   - ❌ `[] (empty array)` → `BLOG_FEED_URL` vide ou invalide

---

### Étape 4 : Tester les Routes API Manuellement

```bash
# 1. Metadata (doit retourner les URLs configurées)
curl https://votre-projet.pages.dev/api/metadata

# Doit afficher :
{
  "siteName": "...",
  "blogRssUrl": "https://blog.cloudflare...",  ← Doit être rempli
  "youtubeRssUrl": "https://...",
  "podcastFeedUrl": "https://..."
}

# 2. Posts (doit retourner array d'articles)
curl https://votre-projet.pages.dev/api/posts

# Doit afficher :
[
  {
    "title": "...",
    "slug": "...",
    ...
  }
]

# ❌ Si [] vide → BLOG_FEED_URL manquante ou invalide
```

---

### Étape 5 : Vérifier l'URL RSS du Blog

**Tester l'URL directement** :
```bash
curl https://blog.cloudflare.com/feed/
```

Doit retourner du XML avec `<rss>` ou `<feed>`.

**URLs valides** :
- ✅ Substack : `https://compte.substack.com/feed`
- ✅ WordPress : `https://site.com/feed`
- ✅ Ghost : `https://site.com/rss`
- ✅ Medium : `https://medium.com/feed/@username`

---

## Solutions selon les Symptômes

### Symptôme : Dashboard complètement vide

**Cause probable** : Code pas déployé ou variables manquantes

**Solution** :
1. Vérifier `/api/metadata` retourne `blogRssUrl` (pas `substackRssUrl`)
2. Si non → Redéployer le code
3. Vérifier variables CF Dashboard configurées
4. Redéployer après modification variables

---

### Symptôme : "⚠️ Substack URL manquante"

**Cause** : Variable `BLOG_FEED_URL` vide

**Solution** :
1. Cloudflare Dashboard → Settings → Environment variables
2. Ajouter `BLOG_FEED_URL=https://...`
3. Redéployer

---

### Symptôme : Tableaux vides mais pas d'erreur

**Cause** : URL RSS invalide ou flux inaccessible

**Solution** :
1. Tester l'URL RSS manuellement : `curl https://...`
2. Vérifier le format (doit être XML valide)
3. Corriger l'URL dans Cloudflare variables
4. Redéployer

---

### Symptôme : Onglets ne fonctionnent pas

**Cause probable** : Erreur JavaScript ou navigation cassée

**Solution** :
1. F12 → Console → Rechercher erreurs
2. Vérifier que `showSection()` existe dans `admin.js`
3. Vérifier que les ID des sections existent dans `dashboard.html`

---

## Vérification Rapide (Checklist)

Cocher chaque point :

- [ ] Code redéployé après modifications `blogRssUrl`
- [ ] `/api/metadata` retourne `blogRssUrl` (pas `substackRssUrl`)
- [ ] Variable `BLOG_FEED_URL` configurée dans CF Dashboard
- [ ] URL RSS testée manuellement (retourne XML)
- [ ] Console browser sans erreurs
- [ ] `/api/posts` retourne array d'articles
- [ ] Login redirige vers `/admin/dashboard.html`

---

## Commandes de Test Rapide

```bash
# Test complet
echo "=== Metadata ==="
curl https://votre-projet.pages.dev/api/metadata | jq .

echo "=== Posts ===\"
curl https://votre-projet.pages.dev/api/posts | jq '. | length'

echo "=== Videos ===\"
curl https://votre-projet.pages.dev/api/videos | jq '. | length'
```

Si tout retourne des données → Le problème est côté frontend (admin.js)  
Si API vide → Le problème est variables d'env ou URL RSS
