# 💡 Exemples d'Utilisation de l'API

Exemples pratiques d'utilisation de l'API WebSuite CMS.

## JavaScript (Vanilla)

### Récupérer les Articles

```javascript
async function getPosts() {
  const response = await fetch('/api/posts');
  const posts = await response.json();
  
  posts.forEach(post => {
    console.log(post.title, post.pubDate);
  });
}

getPosts();
```

### Afficher les 5 Derniers Articles

```javascript
async function displayRecentPosts() {
  const response = await fetch('/api/posts');
  const posts = await response.json();
  const recent = posts.slice(0, 5);
  
  const container = document.getElementById('posts-container');
  recent.forEach(post => {
    const article = document.createElement('article');
    article.innerHTML = `
      <h2>${post.title}</h2>
      <p>${post.description}</p>
      <a href="${post.link}">Lire la suite</a>
    `;
    container.appendChild(article);
  });
}
```

### Récupérer un Article Spécifique

```javascript
async function getPost(slug) {
  const response = await fetch(`/api/post/${slug}`);
  const post = await response.json();
  return post;
}

// Utilisation
const post = await getPost('mon-premier-article');
console.log(post.content);
```

## React

### Hook Personnalisé

```jsx
import { useState, useEffect } from 'react';

function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      });
  }, []);
  
  return { posts, loading };
}

// Utilisation
function PostsList() {
  const { posts, loading } = usePosts();
  
  if (loading) return <div>Chargement...</div>;
  
  return (
    <div>
      {posts.map(post => (
        <article key={post.slug}>
          <h2>{post.title}</h2>
          <p>{post.description}</p>
        </article>
      ))}
    </div>
  );
}
```

## Vue.js

### Composant

```vue
<template>
  <div>
    <article v-for="post in posts" :key="post.slug">
      <h2>{{ post.title }}</h2>
      <p>{{ post.description }}</p>
    </article>
  </div>
</template>

<script>
export default {
  data() {
    return {
      posts: []
    };
  },
  async mounted() {
    const response = await fetch('/api/posts');
    this.posts = await response.json();
  }
};
</script>
```

## Python

### Requête Simple

```python
import requests

def get_posts():
    response = requests.get('https://votre-site.com/api/posts')
    return response.json()

posts = get_posts()
for post in posts:
    print(post['title'])
```

### Avec Authentification

```python
import requests

def get_config():
    headers = {'X-Auth-Key': 'votre_password'}
    response = requests.get(
        'https://votre-site.com/api/config',
        headers=headers
    )
    return response.json()

config = get_config()
print(config)
```

## Node.js

### Express

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

app.get('/api/proxy/posts', async (req, res) => {
  try {
    const response = await axios.get('https://votre-site.com/api/posts');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

## cURL

### Requêtes de Base

```bash
# Articles
curl https://votre-site.com/api/posts

# Vidéos
curl https://votre-site.com/api/videos

# Podcasts
curl https://votre-site.com/api/podcasts

# Événements
curl https://votre-site.com/api/events
```

### Avec Authentification

```bash
# Configuration
curl -H "X-Auth-Key: votre_password" \
     https://votre-site.com/api/config

# Vider le cache
curl -X POST \
     -H "X-Auth-Key: votre_password" \
     https://votre-site.com/api/clear-cache
```

## Filtrage et Tri

### Filtrer les Événements à Venir

```javascript
async function getUpcomingEvents() {
  const response = await fetch('/api/events');
  const events = await response.json();
  const now = new Date();
  
  return events.filter(event => {
    return new Date(event.pubDate) > now;
  });
}
```

## Recherche

### Rechercher dans les Titres

```javascript
async function searchPosts(query) {
  const response = await fetch('/api/posts');
  const posts = await response.json();
  
  return posts.filter(post => {
    return post.title.toLowerCase().includes(query.toLowerCase());
  });
}

// Utilisation
const results = await searchPosts('tutorial');
```

## Pagination Côté Client

```javascript
const itemsPerPage = 10;
let currentPage = 1;

async function getPaginatedPosts(page) {
  const response = await fetch('/api/posts');
  const posts = await response.json();
  
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  
  return {
    posts: posts.slice(start, end),
    total: posts.length,
    pages: Math.ceil(posts.length / itemsPerPage)
  };
}

// Utilisation
const { posts, total, pages } = await getPaginatedPosts(1);
```

## Gestion d'Erreurs

```javascript
async function safeFetch(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    return null;
  }
}

// Utilisation
const posts = await safeFetch('/api/posts');
if (posts) {
  console.log('Articles chargés:', posts.length);
}
```

## Prochaines Étapes

- [Vue d'ensemble de l'API](overview.md)
- [Endpoints publics](public-endpoints.md)
- [Endpoints protégés](protected-endpoints.md)

