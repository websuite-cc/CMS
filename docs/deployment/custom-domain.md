# 🌐 Domaine Personnalisé

Guide pour configurer un domaine personnalisé sur Cloudflare Pages.

## Prérequis

- Un domaine enregistré
- Le domaine doit être géré par Cloudflare (recommandé) ou configuré avec DNS

## Configuration

### Méthode 1 : Domaine Géré par Cloudflare (Recommandé)

1. Allez dans **Cloudflare Dashboard** → **Workers & Pages**
2. Sélectionnez votre projet Pages
3. Cliquez sur **Custom domains**
4. Cliquez sur **Set up a custom domain**
5. Entrez votre domaine (ex: `monsite.com`)
6. Cloudflare configure automatiquement les DNS

### Méthode 2 : Domaine Externe

1. Allez dans **Custom domains** → **Set up a custom domain**
2. Entrez votre domaine
3. Cloudflare vous donnera un enregistrement CNAME
4. Configurez le CNAME dans votre gestionnaire DNS :
   ```
   Type: CNAME
   Name: @ (ou www)
   Target: votre-projet.pages.dev
   ```

## Configuration DNS

### Enregistrement CNAME

```
Type: CNAME
Name: @ (ou www, ou les deux)
Target: votre-projet.pages.dev
```

### Enregistrement A (Alternative)

Si CNAME n'est pas supporté :

```
Type: A
Name: @
Target: 192.0.2.1 (IP fournie par Cloudflare)
```

## SSL/TLS

Cloudflare configure automatiquement SSL/TLS :
- Certificat automatique
- Renouvellement automatique
- HTTPS forcé

### Vérifier SSL

1. Allez dans **SSL/TLS** dans Cloudflare Dashboard
2. Vérifiez que le mode est **Full** ou **Full (strict)**
3. Attendez quelques minutes pour la propagation

## Propagation DNS

La propagation DNS peut prendre :
- **5-15 minutes** si le domaine est sur Cloudflare
- **24-48 heures** si le domaine est ailleurs

Vérifiez avec :
```bash
dig monsite.com
# ou
nslookup monsite.com
```

## Sous-domaines

### Ajouter un Sous-domaine

1. Allez dans **Custom domains**
2. Cliquez sur **Set up a custom domain**
3. Entrez le sous-domaine (ex: `api.monsite.com`)
4. Configurez le CNAME dans DNS

### Exemples

- `www.monsite.com` → Redirection vers `monsite.com`
- `api.monsite.com` → API séparée
- `admin.monsite.com` → Interface admin séparée

## Dépannage

### Erreur : "Domain not found"

- Vérifiez que le domaine est correctement configuré dans DNS
- Attendez la propagation DNS (peut prendre jusqu'à 48h)

### Erreur SSL

- Vérifiez que le mode SSL/TLS est **Full** ou **Full (strict)**
- Attendez quelques minutes pour le renouvellement du certificat

### Redirection www

Pour rediriger `www.monsite.com` vers `monsite.com` :

1. Allez dans **Page Rules** dans Cloudflare
2. Créez une règle :
   - URL: `www.monsite.com/*`
   - Setting: **Forwarding URL** → **301 Permanent**
   - Destination: `https://monsite.com/$1`

## Prochaines Étapes

- [Configuration](../configuration/overview.md)
- [SEO](../configuration/seo.md)
- [Déploiement](cloudflare-pages.md)

