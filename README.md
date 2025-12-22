# 🎯 WebSuite Platform

> **CMS headless moderne** basé sur RSS (Substack, YouTube, Podcasts, Meetup)  
> Déployez votre CMS sur n'importe quelle plateforme edge en un clic.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ Caractéristiques

- 🚀 **Déploiement automatique** via Git push
- ⚡ **Edge Functions** avec runtime Bun.js
- 🎨 **Interface admin moderne** avec TailwindCSS
- 📊 **Multi-sources** : Substack + YouTube + Podcasts + Meetup
- 🔐 **Authentification** simple et sécurisée
- 💨 **Cache intelligent** pour des performances optimales
- 🌍 **CDN global** ultra-rapide
- 💰 **100% Gratuit** (sur la plupart des plateformes edge)

---

## 🚀 Démarrage Rapide

Pour commencer rapidement, suivez le [guide de démarrage rapide](#/docs/guide/quick-start).

En résumé :

1. **Cloner le projet**
   ```bash
   git clone https://github.com/VOTRE_USERNAME/StackPagesCMS.git
   cd StackPagesCMS/ProdBeta
   ```

2. **Déployer sur votre plateforme edge préférée**
   - [GitHub Pages](#/docs/deployment/github-pages)
   - [Cloudflare Pages](#/docs/deployment/cloudflare-pages)
   - Ou toute autre plateforme supportant Edge Functions

3. **Configurer vos flux RSS**
   Voir [Configuration des flux RSS](#/docs/configuration/rss-feeds)

4. **C'est prêt !** 🎉

> 💡 **Astuce** : Consultez le [guide complet](#/docs/guide/quick-start) pour plus de détails.

---

## 📚 Documentation

### 🎓 Guides

- **[Démarrage Rapide](#/docs/guide/quick-start)** - Installation en 5 minutes
- **[Installation](#/docs/guide/installation)** - Guide d'installation détaillé
- **[Développement Local](#/docs/guide/development)** - Développement et test local
- **[Structure du Projet](#/docs/guide/structure)** - Architecture et organisation

### 🚀 Déploiement

- **[GitHub Pages](#/docs/deployment/github-pages)** - Déploiement sur GitHub Pages
- **[Cloudflare Pages](#/docs/deployment/cloudflare-pages)** - Déploiement sur Cloudflare Pages
- **[Domaine Personnalisé](#/docs/deployment/custom-domain)** - Configurer un domaine personnalisé
- **[Variables d'Environnement](#/docs/deployment/environment-variables)** - Configuration des variables

### ⚙️ Configuration

- **[Vue d'ensemble](#/docs/configuration/overview)** - Configuration générale
- **[Flux RSS](#/docs/configuration/rss-feeds)** - Configurer vos sources de contenu
- **[SEO & Métadonnées](#/docs/configuration/seo)** - Optimisation SEO

### 🔌 API

- **[Vue d'ensemble](#/docs/api/overview)** - Documentation API complète
- **[Endpoints Publics](#/docs/api/public-endpoints)** - Endpoints accessibles sans authentification
- **[Endpoints Protégés](#/docs/api/protected-endpoints)** - Endpoints nécessitant une authentification
- **[Authentification](#/docs/api/authentication)** - Système d'authentification
- **[Exemples](#/docs/api/examples)** - Exemples d'utilisation

### 📝 Gestion du Contenu

- **[Articles (Substack)](#/docs/content/articles)** - Gérer vos articles
- **[Vidéos (YouTube)](#/docs/content/videos)** - Gérer vos vidéos
- **[Podcasts](#/docs/content/podcasts)** - Gérer vos podcasts
- **[Événements (Meetup)](#/docs/content/events)** - Gérer vos événements

### 🎨 Interface Admin

- **[Dashboard](#/docs/admin/dashboard)** - Présentation du dashboard
- **[Fonctionnalités](#/docs/admin/features)** - Fonctionnalités disponibles
- **[Gestion du Contenu](#/docs/admin/content-management)** - Gérer votre contenu via l'interface
- **[API Explorer](#/docs/admin/api-explorer)** - Tester l'API depuis l'interface

### 🔧 Avancé

- **[Cache & Performance](#/docs/advanced/caching)** - Optimisation des performances
- **[Sécurité](#/docs/advanced/security)** - Bonnes pratiques de sécurité
- **[HTMX & SSR](#/docs/advanced/htmx-ssr)** - Rendu côté serveur avec HTMX
- **[Personnalisation](#/docs/advanced/customization)** - Personnaliser votre installation

### ❓ FAQ

- **[Questions Fréquentes](#/docs/faq/general)** - Réponses aux questions courantes
- **[Dépannage](#/docs/faq/troubleshooting)** - Résolution des problèmes courants

---

## 🏗️ Architecture

WebSuite Platform utilise une **architecture Edge Functions** avec runtime Bun.js :

```
┌─────────────────────────────────────────┐
│     Frontend (Static)                   │
│  ✓ HTML/CSS/JavaScript                  │
│  ✓ Interface Admin                      │
│  ✓ Templates HTMX                       │
└─────────────────────────────────────────┘
                    ↓ (API Calls)
┌─────────────────────────────────────────┐
│     Edge Functions (Backend)            │
│  ✓ API REST                             │
│  ✓ Parsing RSS                          │
│  ✓ Cache Management                     │
│  ✓ Authentification                     │
└─────────────────────────────────────────┘
```

> 📖 Pour plus de détails sur l'architecture, consultez la [Structure du Projet](#/docs/guide/structure).

---

## 🛠️ Technologies

- **Runtime** : Bun.js
- **Architecture** : Edge Functions
- **Frontend** : HTML, CSS (TailwindCSS), JavaScript vanilla
- **Backend** : Edge Functions (compatible avec toutes les plateformes edge)
- **Rendu** : HTMX pour le SSR dynamique
- **Parsing** : RSS/XML natif
- **Cache** : Edge cache distribué

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 License

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

---

## 📞 Support

- 📧 **Email** : cms@iziweb.page
- 💬 **Discord** : [Rejoindre la communauté](#)
- 📖 **Documentation** : https://cms.iziweb.page
- 🐛 **Issues** : [GitHub Issues](https://github.com/iziweb-studio/CMS/issues)

---

<p align="center">
  Fait avec ❤️ pour la communauté<br>
  <strong>WebSuite</strong> - Votre contenu, partout, facilement.<br>
  <small>Built on Edge with Bun</small>
</p>
