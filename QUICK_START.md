# 🚀 Guide de Démarrage Rapide - iziWebCMS

## ✅ Configuration en 5 minutes

### 1️⃣ Installer Wrangler (CLI Cloudflare)

```bash
npm install -g wrangler
```

### 2️⃣ Créer le fichier de variables d'environnement

```bash
# Copier le template
cp .dev.vars.example .dev.vars

# Éditer avec vos vraies valeurs
nano .dev.vars
```

**Modifier au minimum :**
- `ADMIN_EMAIL` : votre email de connexion
- `ADMIN_PASSWORD` : votre mot de passe (minimum 8 caractères recommandé)
- `SUBSTACK_FEED_URL` : l'URL de votre flux RSS Substack

**Exemple :**
```env
ADMIN_EMAIL=moi@example.com
ADMIN_PASSWORD=monMotDePasseSecurise123
SUBSTACK_FEED_URL=https://moncompte.substack.com/feed
```

### 3️⃣ Lancer le worker en local

```bash
npx wrangler dev
```

Vous devriez voir :
```
⛅️ wrangler 3.x.x
------------------
⬣ Listening on http://localhost:8787
```

### 4️⃣ Accéder au CMS

1. Ouvrir votre navigateur : **http://localhost:8787/admin/**
2. Se connecter avec votre `ADMIN_EMAIL` et `ADMIN_PASSWORD`
3. Le dashboard se charge avec vos contenus !

---

## 🧪 Tester que tout fonctionne

### Test 1 : API Metadata
Ouvrir dans le navigateur :
```
http://localhost:8787/api/metadata
```

Vous devriez voir un JSON avec :
```json
{
  "siteName": "iziWebCMS",
  "description": "Portail de contenus",
  "author": "Admin",
  ...
}
```

### Test 2 : API Posts
```
http://localhost:8787/api/posts
```

Devrait retourner un array JSON avec vos articles Substack.

### Test 3 : Dashboard
```
http://localhost:8787/admin/dashboard.html
```

Devrait afficher :
- ✅ Nombre d'articles
- ✅ Nombre de vidéos
- ✅ Nombre de podcasts
- ✅ Tableaux remplis avec vos contenus

---

## 🔧 Dépannage Express

### ❌ "Failed to fetch" dans le dashboard ?

**Causes possibles :**
1. Le worker n'est pas lancé → Vérifier que `wrangler dev` tourne
2. Mauvaise URL → Vérifier que vous êtes bien sur `localhost:8787`
3. CORS bloqué → Vérifier la console (F12), le worker gère normalement CORS

**Solution :**
```bash
# Relancer le worker
Ctrl+C (pour arrêter)
npx wrangler dev
```

### ❌ "Identifiants incorrects" à la connexion ?

**Vérifier :**
1. Fichier `.dev.vars` existe bien
2. `ADMIN_EMAIL` et `ADMIN_PASSWORD` sont corrects
3. Relancer le worker après modification du `.dev.vars`

### ❌ Pas de données affichées (tableaux vides) ?

**Causes :**
1. URL flux RSS invalide
2. Flux RSS vide (aucun contenu publié)
3. Problème de parsing RSS

**Test manuel :**
```bash
# Tester votre flux RSS directement
curl https://votre-compte.substack.com/feed
```

Devrait retourner du XML avec vos articles.

---

## 📦 Déploiement en Production (Cloudflare)

### Étape 1 : S'authentifier

```bash
wrangler login
```

### Étape 2 : Configurer les variables sur Cloudflare

**Ne PAS mettre les secrets dans `wrangler.toml` !**

Via Cloudflare Dashboard :
1. Workers & Pages → Votre worker → Settings → Variables
2. Ajouter chaque variable :
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `SUBSTACK_FEED_URL`
   - etc.

Ou via CLI :
```bash
wrangler secret put ADMIN_PASSWORD
# Entrer votre password quand demandé
```

### Étape 3 : Déployer

```bash
npx wrangler deploy
```

Votre CMS est maintenant en ligne ! 🎉

URL : `https://stackpages-cms.VOTRE_COMPTE.workers.dev`

---

## 🎯 Commandes Utiles

```bash
# Développement local
npx wrangler dev

# Développement avec port custom
npx wrangler dev --port 3000

# Voir les logs en temps réel (production)
npx wrangler tail

# Déployer en production
npx wrangler deploy

# Lister vos workers
npx wrangler list

# Supprimer un worker
npx wrangler delete stackpages-cms
```

---

## 📚 Structure des Endpoints

Une fois lancé, votre CMS expose :

### Pages publiques
- `http://localhost:8787/` - Page d'accueil
- `http://localhost:8787/admin/` - Connexion admin

### API publique (sans auth)
- `GET /api/metadata` - Infos du site
- `GET /api/posts` - Articles Substack
- `GET /api/post/:slug` - Article spécifique
- `GET /api/videos` - Vidéos YouTube
- `GET /api/video/:id` - Vidéo spécifique
- `GET /api/podcasts` - Épisodes podcast
- `GET /api/podcast/:id` - Podcast spécifique
- `POST /api/login` - Connexion

### API protégée (avec auth)
- `GET /api/config` - Configuration
- `POST /api/clear-cache` - Vider le cache

---

## 🔐 Sécurité

### ⚠️ Checklist Sécurité Production

- [ ] Changer `ADMIN_PASSWORD` (minimum 12 caractères)
- [ ] Ne jamais commiter `.dev.vars` dans Git
- [ ] Utiliser des secrets via Cloudflare Dashboard
- [ ] Activer l'authentification 2FA sur Cloudflare
- [ ] Restricter les IP autorisées (optionnel)
- [ ] Utiliser HTTPS uniquement (automatique sur Cloudflare)

---

## 💬 Besoin d'aide ?

- 📖 Documentation : [MODE_LOCAL_CONFIG.md](./MODE_LOCAL_CONFIG.md)
- 🐛 Issues GitHub : Ouvrir un ticket si problème
- 💬 Support : Contacter l'équipe StackPages

---

Bon développement ! 🚀
