# 🌐 Configuration Proxy Webstudio

## Vue d'ensemble

Le middleware est maintenant configuré pour afficher le **frontend Webstudio** sur votre domaine Cloudflare Pages, tout en gardant l'API et l'admin locaux.

## Architecture

```
https://votre-projet.pages.dev/
├── /                   → Proxy vers Webstudio (frontend)
├── /page1              → Proxy vers Webstudio
├── /about              → Proxy vers Webstudio
├── /api/*              → Functions locales (API)
└── /admin/*            → Dashboard admin local
```

## Comment ça fonctionne

### 1. Routing dans `functions/_middleware.js`

```javascript
// Routes locales (gardées par Cloudflare Pages)
/api/*     → API Functions (articles, vidéos, podcasts)
/admin/*   → Dashboard admin

// Toutes les autres routes → Proxy vers Webstudio
/*         → fetch(WSTD_STAGING_URL + pathname)
```

### 2. Réécriture d'URLs

Le HTML retourné par Webstudio est modifié à la volée :
- URLs Webstudio `https://votre-projet.wstd.io` 
- Remplacées par `https://votre-projet.pages.dev`

**Résultat** : Les liens internes fonctionnent correctement !

---

## Configuration

### Variable d'environnement requise

**`WSTD_STAGING_URL`** : URL de votre projet Webstudio (staging ou prod)

#### Cloudflare Dashboard
1. **Pages** → Votre projet → **Settings** → **Environment variables**
2. **Add variable** :
   - Name : `WSTD_STAGING_URL`
   - Value : `https://votre-projet.wstd.io`
3. **Save**

#### Développement local (.dev.vars)
```bash
WSTD_STAGING_URL=https://votre-projet.wstd.io
```

---

## Exemples d'URLs

Après déploiement sur Cloudflare Pages :

| Requête | Réponse |
|---------|---------|
| `https://stackpages.pages.dev/` | Proxié → Webstudio homepage |
| `https://stackpages.pages.dev/about` | Proxié → Webstudio /about |
| `https://stackpages.pages.dev/api/posts` | **Local** → API articles |
| `https://stackpages.pages.dev/admin/` | **Local** → Dashboard admin |

---

## Avantages

✅ **Un seul domaine** : `https://votre-projet.pages.dev`  
✅ **Pas de CORS** : Frontend et API sur le même domaine  
✅ **Webstudio + API** : Le meilleur des deux mondes  
✅ **SEO friendly** : URLs propres  
✅ **Admin intégré** : Dashboard toujours accessible  

---

## Déploiement

```bash
# 1. Configurer WSTD_STAGING_URL dans .dev.vars (local) ou Dashboard (prod)

# 2. Déployer
npx wrangler pages deploy .

# 3. Tester
curl https://votre-projet.pages.dev/
curl https://votre-projet.pages.dev/api/metadata
```

---

## Fallback

Si Webstudio est inaccessible (erreur réseau), le middleware sert automatiquement `index.html` local.

---

## Performance

- ✅ **Cache Cloudflare** : Les pages Webstudio sont cachées
- ✅ **Pas de double hop** : Proxy direct (pas de redirect)
- ✅ **Streaming** : Contenu streamé dès réception

---

Votre CMS est maintenant un **reverse proxy Webstudio** ! 🎉
