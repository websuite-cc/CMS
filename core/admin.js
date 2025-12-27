// ====================================================================
// CONFIGURATION POUR MODE LOCAL (WORKER LOCAL)
// ====================================================================
// Mode simplifié : toutes les requêtes vont directement au worker local
// La configuration (flux RSS, etc.) est gérée par les env vars du worker

// Helper function to build API URL (modeagnostique)
function buildApiUrl(endpoint) {
    const baseUrl = localStorage.getItem('api_base_url');
    // Si une URL de base est définie (worker distant), on l'utilise
    if (baseUrl) {
        // Enlever le slash final si présent dans baseUrl et le slash initial si présent dans endpoint pour éviter //
        const cleanBase = baseUrl.replace(/\/$/, '');
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${cleanBase}${cleanEndpoint}`;
    }
    // Sinon comportement local standard
    return endpoint;
}

// State
const appState = {
    posts: [],
    videos: [],
    podcasts: [],
    events: [],
    metadata: {},
    config: {}
};

// Init
document.addEventListener('DOMContentLoaded', async () => {
    initDarkMode(); // Init dark mode
    await checkAuth();
    await loadConfig(); // load config first
    await loadData();
});

// Dark Mode Logic
function initDarkMode() {
    const isDark = localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    updateDarkModeIcon();
}

window.toggleDarkMode = function () {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
    updateDarkModeIcon();
}

function updateDarkModeIcon() {
    const isDark = document.documentElement.classList.contains('dark');
    const icons = document.querySelectorAll('.theme-toggle-icon');
    icons.forEach(icon => {
        if (isDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });
}

// Helper function to get auth token
function getAuthToken() {
    return localStorage.getItem('websuite_auth') || 
           localStorage.getItem('stackpages_auth') || 
           localStorage.getItem('admin_token');
}

// Search Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('search-posts')?.addEventListener('input', () => {
        currentPage = 1;
        renderContentTable();
    });

    document.getElementById('search-videos')?.addEventListener('input', () => {
        currentVideoPage = 1;
        renderVideos();
    });

    document.getElementById('search-podcasts')?.addEventListener('input', () => {
        currentPodcastPage = 1;
        renderPodcasts();
    });
    document.getElementById('search-events')?.addEventListener('input', () => {
        currentEventPage = 1;
        renderEvents();
    });
});

// Auth Check
async function checkAuth() {
    // Only check auth on dashboard page, not on login page or IDE
    const currentPath = window.location.pathname;
    
    // Liste des pages qui ne nécessitent pas d'authentification
    const publicPages = [
        '/admin',
        '/admin/',
        '/admin/index.html'
    ];
    
    // Vérifier si on est sur une page publique (login uniquement)
    // L'IDE nécessite maintenant l'authentification comme le dashboard
    const isPublicPage = publicPages.some(page => currentPath === page || currentPath.startsWith(page + '/'));
    
    if (isPublicPage) {
        // We're on the login page, don't redirect
        return;
    }

    const authKey = localStorage.getItem('websuite_auth');
    if (!authKey) {
        window.location.href = '/admin';
        return;
    }

    // Optional: Verify with server if needed, but for now just trust existence + API 401s
    try {
        const res = await fetch('/api/check-auth', { 
            headers: { 'X-Auth-Key': authKey }
        });
        const data = await res.json();
        if (!data.authenticated) {
            localStorage.removeItem('websuite_auth');
            window.location.href = '/admin';
        }
    } catch (e) {
        window.location.href = '/admin';
    }
}

// Navigation
function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    // Show selected
    document.getElementById(`view-${viewName}`).classList.remove('hidden');

    // Update Title
    const titles = {
        'dashboard': 'Tableau de bord',
        'content': 'Gestion des Articles',
        'videos': 'Vidéos YouTube',
        'api-explorer': 'Explorateur d\'API',
        'builder': 'Frontend Builder',
        'analytics': 'Google Analytics',
        'podcasts': 'Podcasts',
        'agents': 'Agents IA',
        'agent-create': 'Nouvel Agent Google',
        'config': 'Configuration',
        'help': 'Aide & Support'
    };
    document.getElementById('page-title').textContent = titles[viewName];

    // Load data for specific views
    if (viewName === 'agents') {
        loadAgents();
    }

    // Update Nav State
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('bg-purple-50', 'dark:bg-slate-700', 'text-purple-600', 'dark:text-purple-400');
        el.classList.add('text-slate-600', 'dark:text-slate-300');
    });
    const activeBtn = document.querySelector(`button[onclick="showView('${viewName}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('bg-purple-50', 'dark:bg-slate-700', 'text-purple-600', 'dark:text-purple-400');
        activeBtn.classList.remove('text-slate-600', 'dark:text-slate-300');
    }

    // Special handlers per view
    if (viewName === 'agents') loadAgents();
}

// Data Loading
async function loadData() {
    try {
        // Force refresh on load
        const refreshParam = '?refresh=true';

        // 1. Site Infos
        const siteinfosRes = await fetch(buildApiUrl(`/api/siteinfos${refreshParam}`));
        metadata = await siteinfosRes.json();

        // Update UI with Metadata
        // Update UI with Metadata
        // const siteNameEl = document.getElementById('dashboard-site-name');
        // if (siteNameEl) siteNameEl.textContent = metadata.siteName || 'iziWebCMS CMS';

        // const authorEl = document.getElementById('dashboard-author');
        // if (authorEl) authorEl.textContent = metadata.author || 'Admin';

        // Compute diffHours for feed status (use lastBuildDate if present)
        const statusEl = document.getElementById('stat-feed-status');
        let diffHours = 0;
        if (appState.metadata.lastBuildDate) {
            const now = new Date();
            const then = new Date(appState.metadata.lastBuildDate);
            diffHours = Math.abs(now - then) / 36e5; // milliseconds → hours
        }

        // 2. Load Content (Individually to prevent one failure from blocking others)
        const loadPosts = fetch(buildApiUrl('/api/posts')).then(res => res.ok ? res.json() : []).catch(e => { console.error("Posts fetch error:", e); return []; });
        const loadVideos = fetch(buildApiUrl('/api/videos')).then(res => res.ok ? res.json() : []).catch(e => { console.error("Videos fetch error:", e); return []; });
        const loadPodcasts = fetch(buildApiUrl('/api/podcasts')).then(res => res.ok ? res.json() : []).catch(e => { console.error("Podcasts fetch error:", e); return []; });
        const loadEvents = fetch(buildApiUrl('/api/events')).then(res => res.ok ? res.json() : []).catch(e => { console.error("Events fetch error:", e); return []; });

        const [posts, videos, podcasts, events] = await Promise.all([loadPosts, loadVideos, loadPodcasts, loadEvents]);

        appState.posts = posts;
        appState.videos = videos;
        appState.podcasts = podcasts;
        appState.events = events;

        // Update Stats
        const statPostsEl = document.getElementById('stat-posts-count');
        if (statPostsEl) statPostsEl.textContent = appState.posts.length;

        const lastPostDate = appState.posts.length > 0 ? new Date(appState.posts[0].pubDate).toLocaleDateString('fr-FR') : '-';
        const statLastSyncEl = document.getElementById('stat-last-sync');
        if (statLastSyncEl) statLastSyncEl.textContent = lastPostDate;

        const statVideosEl = document.getElementById('stat-videos-count');
        if (statVideosEl) statVideosEl.textContent = appState.videos.length;

        const statPodcastsEl = document.getElementById('stat-podcasts-count');
        if (statPodcastsEl) statPodcastsEl.textContent = appState.podcasts.length;

        const statEventsEl = document.getElementById('stat-events-count');
        if (statEventsEl) statEventsEl.textContent = appState.events.length;

        // Update badges and source labels
        updateStatBadges();

        // Feed status UI (only if element exists)
        if (statusEl) {
            if (diffHours < 24) {
                statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-500"></span> Actif';
                statusEl.className = "text-lg font-bold text-green-600 mt-2 flex items-center gap-2";
            } else if (diffHours < 72) {
                statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-yellow-500"></span> Stable';
                statusEl.className = "text-lg font-bold text-yellow-600 mt-2 flex items-center gap-2";
            } else {
                statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-400"></span> Inactif';
                statusEl.className = "text-lg font-bold text-slate-500 mt-2 flex items-center gap-2";
            }
        }

        // Render UI with new data
        renderDashboard();
        renderContentTable();
        renderVideos();
        renderPodcasts(); // Call renderPodcasts here
        renderEvents(); // Call renderEvents here

    } catch (e) {
        console.error("Erreur de chargement:", e);
        // alert("Impossible de charger les données de l'API.");
    }
}


// Config Loading
async function loadConfig() {
    try {
        const authKey = localStorage.getItem('websuite_auth');
        // Fetch config (environment variables)
        const configRes = await fetch(buildApiUrl('/api/config'), {
            headers: { 'X-Auth-Key': authKey }
        });
        const config = await configRes.json();
        // Fetch site infos from config.json
        const siteinfosRes = await fetch(buildApiUrl('/api/siteinfos'));
        const metadata = await siteinfosRes.json();

        // Save to State
        appState.config = config;
        appState.metadata = metadata;

        // Update Dashboard Greeting with author name
        const greetingEl = document.getElementById('dashboard-greeting');
        if (greetingEl) {
            const authorName = config.author || metadata.author || 'Admin';
            greetingEl.textContent = `Bonjour, ${authorName} 👋`;
        }

        // Populate Config Form (Read-Only) with combined data
        document.getElementById('conf-siteName').value = config.siteName || metadata.siteName || '';
        document.getElementById('conf-author').value = config.author || metadata.author || '';
        document.getElementById('conf-substack').value = config.blogRssUrl || '';
        if (document.getElementById('conf-youtube')) {
            document.getElementById('conf-youtube').value = config.youtubeRssUrl || 'Non configuré';
        }
        if (document.getElementById('conf-podcast')) {
            document.getElementById('conf-podcast').value = config.podcastFeedUrl || 'Non configuré';
        }
        if (document.getElementById('conf-events')) {
            document.getElementById('conf-events').value = config.eventsRssUrl || 'Non configuré';
        }
        if (document.getElementById('conf-wstd-staging')) {
            document.getElementById('conf-wstd-staging').value = config.wstdStagingUrl || 'Non configuré (fichiers locaux)';
        }
        if (config.seo) {
            document.getElementById('conf-metaTitle').value = config.seo.metaTitle || '';
            document.getElementById('conf-metaDesc').value = config.seo.metaDescription || '';
            document.getElementById('conf-metaKeywords').value = config.seo.metaKeywords || '';
        }
        // If metadata provides SEO overrides, use them when config lacks values
        if (metadata.seo) {
            if (!config.seo?.metaTitle) document.getElementById('conf-metaTitle').value = metadata.seo.metaTitle || '';
            if (!config.seo?.metaDescription) document.getElementById('conf-metaDesc').value = metadata.seo.metaDescription || '';
            if (!config.seo?.metaKeywords) document.getElementById('conf-metaKeywords').value = metadata.seo.metaKeywords || '';
        }
        // Show warning if Substack URL missing
        if (!config.blogRssUrl) {
            document.getElementById('config-warning')?.classList.remove('hidden');
        } else {
            document.getElementById('config-warning')?.classList.add('hidden');
        }

        // Update Frontend Builder Button URL
        const builderBtn = document.getElementById('builder-tab-btn');
        if (builderBtn) {
            if (config.frontendBuilderUrl) {
                builderBtn.href = config.frontendBuilderUrl;
                builderBtn.setAttribute('target', '_blank');
                builderBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                builderBtn.querySelector('span').textContent = "Ouvrir le Builder";
                builderBtn.onclick = null; // Remove any previous onclick handler
            } else {
                // Point vers la page de paiement Stripe pour Webstudio Builder Pro
                builderBtn.href = "https://urlz.fr/uZuu"; // URL à ajuster selon votre page Stripe
                builderBtn.setAttribute('target', '_blank');
                builderBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                builderBtn.querySelector('span').textContent = "Obtenir Webstudio Builder Pro";
                builderBtn.onclick = null; // Remove any previous onclick handler
            }
        }

        // Configure Analytics View
        const analyticsContainer = document.getElementById('analytics-container');
        const analyticsGuide = document.getElementById('analytics-guide');
        const analyticsFrame = document.getElementById('analytics-frame');

        if (analyticsContainer && analyticsGuide && analyticsFrame) {
            if (config.analyticsEmbedUrl) {
                // Show Analytics
                analyticsFrame.src = config.analyticsEmbedUrl;
                analyticsContainer.classList.remove('hidden');
                analyticsGuide.classList.add('hidden');
            } else {
                // Show Setup Guide
                analyticsContainer.classList.add('hidden');
                analyticsGuide.classList.remove('hidden');
            }
        }
    } catch (e) {
        console.error("Erreur chargement config:", e);
    }
}

// Config Saving
async function saveConfig() {
    const statusEl = document.getElementById('config-status');
    if (statusEl) {
        statusEl.textContent = 'Sauvegarde en cours...';
        statusEl.className = 'text-xs text-purple-500 mt-2';
    }

    try {
        const authKey = localStorage.getItem('websuite_auth');
        
        const config = {
            siteName: document.getElementById('conf-siteName').value.trim(),
            author: document.getElementById('conf-author').value.trim(),
            blogRssUrl: document.getElementById('conf-substack').value.trim(),
            youtubeRssUrl: document.getElementById('conf-youtube')?.value.trim() || '',
            podcastFeedUrl: document.getElementById('conf-podcast')?.value.trim() || '',
            eventsRssUrl: document.getElementById('conf-events')?.value.trim() || '',
            wstdStagingUrl: document.getElementById('conf-wstd-staging')?.value.trim() || '',
            analyticsEmbedUrl: appState.config.analyticsEmbedUrl || '',
            frontendBuilderUrl: appState.config.frontendBuilderUrl || '',
            seo: {
                metaTitle: document.getElementById('conf-metaTitle').value.trim(),
                metaDescription: document.getElementById('conf-metaDesc').value.trim(),
                metaKeywords: document.getElementById('conf-metaKeywords').value.trim()
            }
        };

        const response = await fetch(buildApiUrl('/api/config'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Key': authKey
            },
            body: JSON.stringify(config)
        });

        const result = await response.json();

        if (response.ok) {
            if (statusEl) {
                statusEl.textContent = '✓ Configuration sauvegardée avec succès dans config.json';
                statusEl.className = 'text-xs text-green-500 mt-2';
            }
            // Recharger la config pour s'assurer qu'elle est à jour
            await loadConfig();
            // Mettre à jour les badges après le rechargement
            updateStatBadges();
        } else {
            throw new Error(result.error || 'Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Save config error:', error);
        if (statusEl) {
            statusEl.textContent = `✗ Erreur: ${error.message}`;
            statusEl.className = 'text-xs text-red-500 mt-2';
        }
        alert(`Erreur lors de la sauvegarde: ${error.message}`);
    }
}

// Helper function to detect source from URL
function detectSourceFromUrl(url) {
    if (!url || url === 'Non configuré' || url.trim() === '') return null;
    
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        
        // Detect various sources
        if (hostname.includes('meetup.com')) return 'Meetup';
        if (hostname.includes('openagenda.com')) return 'OpenAgenda';
        if (hostname.includes('substack.com')) return 'Substack';
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube';
        if (hostname.includes('anchor.fm') || hostname.includes('spotify.com')) return 'Spotify';
        if (hostname.includes('wordpress.com') || hostname.includes('wordpress.org')) return 'WordPress';
        if (hostname.includes('medium.com')) return 'Medium';
        if (hostname.includes('ghost.org')) return 'Ghost';
        
        // Default: extract domain name
        const domain = hostname.split('.')[0];
        return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch (e) {
        return null;
    }
}

// Update stat badges and source labels
function updateStatBadges() {
    const config = appState.config || {};
    
    // Articles
    const postsBadge = document.getElementById('stat-posts-badge');
    const postsLabel = document.getElementById('stat-posts-label');
    const postsUrl = config.blogRssUrl || '';
    const postsActive = postsUrl && postsUrl !== 'Non configuré' && postsUrl.trim() !== '';
    
    if (postsBadge) {
        if (postsActive) {
            const source = detectSourceFromUrl(postsUrl);
            postsBadge.textContent = source || 'Actif';
            postsBadge.className = 'text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full';
        } else {
            postsBadge.textContent = 'Inactif';
            postsBadge.className = 'text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full';
        }
    }
    if (postsLabel && postsActive) {
        const source = detectSourceFromUrl(postsUrl);
        if (source) {
            postsLabel.textContent = `Articles (${source})`;
        } else {
            postsLabel.textContent = 'Articles';
        }
    }
    
    // Videos
    const videosBadge = document.getElementById('stat-videos-badge');
    const videosLabel = document.getElementById('stat-videos-label');
    const videosUrl = config.youtubeRssUrl || '';
    const videosActive = videosUrl && videosUrl !== 'Non configuré' && videosUrl.trim() !== '';
    
    if (videosBadge) {
        if (videosActive) {
            const source = detectSourceFromUrl(videosUrl);
            videosBadge.textContent = source || 'Actif';
            videosBadge.className = 'text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full';
        } else {
            videosBadge.textContent = 'Inactif';
            videosBadge.className = 'text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full';
        }
    }
    if (videosLabel && videosActive) {
        const source = detectSourceFromUrl(videosUrl);
        if (source) {
            videosLabel.textContent = `Vidéos (${source})`;
        } else {
            videosLabel.textContent = 'Vidéos';
        }
    }
    
    // Podcasts
    const podcastsBadge = document.getElementById('stat-podcasts-badge');
    const podcastsLabel = document.getElementById('stat-podcasts-label');
    const podcastsUrl = config.podcastFeedUrl || '';
    const podcastsActive = podcastsUrl && podcastsUrl !== 'Non configuré' && podcastsUrl.trim() !== '';
    
    if (podcastsBadge) {
        if (podcastsActive) {
            const source = detectSourceFromUrl(podcastsUrl);
            podcastsBadge.textContent = source || 'Actif';
            podcastsBadge.className = 'text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full';
        } else {
            podcastsBadge.textContent = 'Inactif';
            podcastsBadge.className = 'text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full';
        }
    }
    if (podcastsLabel && podcastsActive) {
        const source = detectSourceFromUrl(podcastsUrl);
        if (source) {
            podcastsLabel.textContent = `Podcasts (${source})`;
        } else {
            podcastsLabel.textContent = 'Podcasts';
        }
    }
    
    // Events
    const eventsBadge = document.getElementById('stat-events-badge');
    const eventsLabel = document.getElementById('stat-events-label');
    const eventsUrl = config.eventsRssUrl || '';
    const eventsActive = eventsUrl && eventsUrl !== 'Non configuré' && eventsUrl.trim() !== '';
    
    if (eventsBadge) {
        if (eventsActive) {
            const source = detectSourceFromUrl(eventsUrl);
            eventsBadge.textContent = source || 'Actif';
            eventsBadge.className = 'text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full';
        } else {
            eventsBadge.textContent = 'Inactif';
            eventsBadge.className = 'text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full';
        }
    }
    if (eventsLabel && eventsActive) {
        const source = detectSourceFromUrl(eventsUrl);
        if (source) {
            eventsLabel.textContent = `Événements (${source})`;
        } else {
            eventsLabel.textContent = 'Événements';
        }
    }
}

// Renderers
function renderDashboard() {
    // Recent Posts
    const postsTbody = document.getElementById('dashboard-recent-posts');
    if (postsTbody) {
        if (!appState.posts || appState.posts.length === 0) {
            postsTbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-slate-500 dark:text-slate-400">Aucun article trouvé.</td></tr>';
        } else {
            postsTbody.innerHTML = appState.posts.slice(0, 5).map(post => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition border-b border-transparent dark:border-slate-700/50 last:border-0">
                    <td class="px-6 py-4 font-medium text-slate-800 dark:text-white truncate max-w-xs" title="${post.title}">${post.title}</td>
                    <td class="px-6 py-4 text-slate-500 dark:text-slate-400">${new Date(post.pubDate).toLocaleDateString('fr-FR')}</td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="openPreview('${post.slug}')" class="text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium text-xs uppercase tracking-wide">Voir</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    // Recent Videos
    const videosTbody = document.getElementById('dashboard-recent-videos');
    if (videosTbody) {
        if (!appState.videos || appState.videos.length === 0) {
            videosTbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-slate-500 dark:text-slate-400">Aucune vidéo trouvée.</td></tr>';
        } else {
            videosTbody.innerHTML = appState.videos.slice(0, 5).map(video => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition border-b border-transparent dark:border-slate-700/50 last:border-0">
                    <td class="px-6 py-4 font-medium text-slate-800 dark:text-white truncate max-w-xs" title="${video.title}">${video.title}</td>
                    <td class="px-6 py-4 text-slate-500 dark:text-slate-400">${new Date(video.published).toLocaleDateString('fr-FR')}</td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="openVideoPreview('${video.link}')" class="text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium text-xs uppercase tracking-wide">Voir</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    // Recent Podcasts (Optimized safety check)
    const podcastsTbody = document.getElementById('dashboard-recent-podcasts');
    if (podcastsTbody) {
        if (!appState.podcasts || appState.podcasts.length === 0) {
            podcastsTbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-slate-500 dark:text-slate-400">Aucun podcast trouvé.</td></tr>';
        } else {
            podcastsTbody.innerHTML = appState.podcasts.slice(0, 5).map(podcast => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <td class="px-6 py-4 font-medium text-slate-800 dark:text-white truncate max-w-xs" title="${podcast.title}">${podcast.title}</td>
                    <td class="px-6 py-4 text-slate-500 dark:text-slate-400">${new Date(podcast.pubDate).toLocaleDateString('fr-FR')}</td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="openPodcastPreview('${podcast.link}')" class="text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium text-xs uppercase tracking-wide">Voir</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    // Recent Events
    const eventsTbody = document.getElementById('dashboard-recent-events');
    if (eventsTbody) {
        if (!appState.events || appState.events.length === 0) {
            eventsTbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-slate-500 dark:text-slate-400">Aucun événement trouvé.</td></tr>';
        } else {
            eventsTbody.innerHTML = appState.events.slice(0, 5).map(event => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <td class="px-6 py-4 font-medium text-slate-800 dark:text-white truncate max-w-xs" title="${event.title}">${event.title}</td>
                    <td class="px-6 py-4 text-slate-500 dark:text-slate-400">${new Date(event.pubDate).toLocaleDateString('fr-FR')}</td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="openEventPreview('${event.link}')" class="text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium text-xs uppercase tracking-wide">Voir</button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

let currentPage = 1;
const itemsPerPage = 10;

function renderContentTable() {
    const tbody = document.getElementById('all-posts-table');
    if (!tbody) return;

    const search = document.getElementById('search-posts').value.toLowerCase();
    const filtered = appState.posts.filter(p => p.title.toLowerCase().includes(search));

    // Pagination Logic
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = 1; // Reset if out of bounds

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedPosts = filtered.slice(start, end);

    // Update Table
    tbody.innerHTML = paginatedPosts.map(post => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group border-b border-transparent dark:border-slate-700/50 last:border-0">
            <td class="px-6 py-4">
                <div class="w-16 h-10 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    ${post.image ? `<img src="${post.image}" class="w-full h-full object-cover" />` : '<div class="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500"><i class="fas fa-image"></i></div>'}
                </div>
            </td>
            <td class="px-6 py-4 font-medium text-slate-800 dark:text-white">
                ${post.title}
                <div class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-md">${post.description.substring(0, 60)}...</div>
            </td>
            <td class="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">${new Date(post.pubDate).toLocaleDateString('fr-FR')}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="openPreview('${post.slug}')" class="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium text-sm transition flex items-center justify-end gap-1 ml-auto">
                    <i class="fas fa-eye"></i> Aperçu
                </button>
            </td>
        </tr>
    `).join('');

    // Update Pagination Controls
    document.getElementById('pagination-info').textContent = `Page ${currentPage} sur ${totalPages || 1}`;
    document.getElementById('prev-page-btn').disabled = currentPage === 1;
    document.getElementById('next-page-btn').disabled = currentPage === totalPages || totalPages === 0;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderContentTable();
    }
}

function nextPage() {
    const search = document.getElementById('search-posts').value.toLowerCase();
    const filtered = appState.posts.filter(p => p.title.toLowerCase().includes(search));
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    if (currentPage < totalPages) {
        currentPage++;
        renderContentTable();
    }
}

// Video Pagination State
let currentVideoPage = 1;
const VIDEOS_PER_PAGE = 10; // Renamed for consistency with diff

// Search Listener
function renderVideos() {
    const tbody = document.getElementById('videos-table');
    if (!tbody) return;

    const search = document.getElementById('search-videos')?.value.toLowerCase() || '';
    const filtered = appState.videos.filter(v => v.title.toLowerCase().includes(search));

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700"><i class="fas fa-video text-4xl text-slate-300 dark:text-slate-600 mb-3"></i><p class="text-slate-500 dark:text-slate-400">Aucune vidéo trouvée</p></td></tr>`;
        document.getElementById('video-pagination-info').textContent = `Page 1 sur 1`;
        document.getElementById('prev-video-page-btn').disabled = true;
        document.getElementById('next-video-page-btn').disabled = true;
        return;
    }

    const totalPages = Math.ceil(filtered.length / VIDEOS_PER_PAGE);
    if (currentVideoPage > totalPages) currentVideoPage = 1;

    const start = (currentVideoPage - 1) * VIDEOS_PER_PAGE;
    const pageVideos = filtered.slice(start, start + VIDEOS_PER_PAGE);

    tbody.innerHTML = pageVideos.map(video => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group border-b border-transparent dark:border-slate-700/50 last:border-0">
            <td class="px-6 py-4">
                <div class="w-16 h-10 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    ${video.thumbnail ? `<img src="${video.thumbnail}" class="w-full h-full object-cover"/>` : '<div class="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500"><i class="fas fa-video"></i></div>'}
                </div>
            </td>
            <td class="px-6 py-4 font-medium text-slate-800 dark:text-white">
                ${video.title}
                <div class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-md">${video.description ? video.description.substring(0, 60) + '...' : ''}</div>
            </td>
            <td class="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">${new Date(video.published).toLocaleDateString('fr-FR')}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="openVideoPreview('${video.link}')" class="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium text-sm transition flex items-center justify-end gap-1 ml-auto">
                    <i class="fas fa-eye"></i> Aperçu
                </button>
            </td>
        </tr>
    `).join('');

    document.getElementById('video-pagination-info').textContent = `Page ${currentVideoPage} sur ${totalPages}`;
    document.getElementById('prev-video-page-btn').disabled = currentVideoPage === 1;
    document.getElementById('next-video-page-btn').disabled = currentVideoPage === totalPages;
}

// Podcast Pagination State
let currentPodcastPage = 1;
const PODCASTS_PER_PAGE = 10;

let currentEventPage = 1;
const EVENTS_PER_PAGE = 10;

function renderPodcasts() {
    const tbody = document.getElementById('podcasts-table');
    if (!tbody) return;

    const search = document.getElementById('search-podcasts')?.value.toLowerCase() || '';
    const filtered = appState.podcasts.filter(p => p.title.toLowerCase().includes(search));

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700"><i class="fas fa-microphone text-4xl text-slate-300 dark:text-slate-600 mb-3"></i><p class="text-slate-500 dark:text-slate-400">Aucun épisode trouvé</p></td></tr>`;
        document.getElementById('podcast-pagination-info').textContent = `Page 1 sur 1`;
        document.getElementById('prev-podcast-page-btn').disabled = true;
        document.getElementById('next-podcast-page-btn').disabled = true;
        return;
    }

    const totalPages = Math.ceil(filtered.length / PODCASTS_PER_PAGE);
    if (currentPodcastPage > totalPages) currentPodcastPage = 1;

    const start = (currentPodcastPage - 1) * PODCASTS_PER_PAGE;
    const pagePodcasts = filtered.slice(start, start + PODCASTS_PER_PAGE);

    tbody.innerHTML = pagePodcasts.map(podcast => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group border-b border-transparent dark:border-slate-700/50 last:border-0">
            <td class="px-6 py-4">
                <div class="w-16 h-10 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div class="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500"><i class="fas fa-microphone"></i></div>
                </div>
            </td>
            <td class="px-6 py-4 font-medium text-slate-800 dark:text-white">
                ${podcast.title}
                <div class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-md">${podcast.description ? podcast.description.replace(/<[^>]*>/g, '').substring(0, 60) + '...' : ''}</div>
            </td>
            <td class="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">${new Date(podcast.pubDate).toLocaleDateString('fr-FR')}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="openPodcastPreview('${podcast.link}')" class="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium text-sm transition flex items-center justify-end gap-1 ml-auto">
                    <i class="fas fa-eye"></i> Aperçu
                </button>
            </td>
        </tr>
    `).join('');

    document.getElementById('podcast-pagination-info').textContent = `Page ${currentPodcastPage} sur ${totalPages}`;
    document.getElementById('prev-podcast-page-btn').disabled = currentPodcastPage === 1;
    document.getElementById('next-podcast-page-btn').disabled = currentPodcastPage === totalPages;
}

function prevPodcastPage() {
    if (currentPodcastPage > 1) {
        currentPodcastPage--;
        renderPodcasts();
    }
}

function nextPodcastPage() {
    const search = document.getElementById('search-podcasts')?.value.toLowerCase() || '';
    const filtered = appState.podcasts.filter(p => p.title.toLowerCase().includes(search));
    const totalPages = Math.ceil(filtered.length / PODCASTS_PER_PAGE);

    if (currentPodcastPage < totalPages) {
        currentPodcastPage++;
        renderPodcasts();
    }
}

function renderEvents() {
    const tbody = document.getElementById('events-table');
    if (!tbody) return;

    const search = document.getElementById('search-events')?.value.toLowerCase() || '';
    const filtered = appState.events.filter(e => 
        e.title.toLowerCase().includes(search) || 
        (e.location && e.location.toLowerCase().includes(search))
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700"><i class="fas fa-calendar-alt text-4xl text-slate-300 dark:text-slate-600 mb-3"></i><p class="text-slate-500 dark:text-slate-400">Aucun événement trouvé</p></td></tr>`;
        document.getElementById('event-pagination-info').textContent = `Page 1 sur 1`;
        document.getElementById('prev-event-page-btn').disabled = true;
        document.getElementById('next-event-page-btn').disabled = true;
        return;
    }

    const totalPages = Math.ceil(filtered.length / EVENTS_PER_PAGE);
    if (currentEventPage > totalPages) currentEventPage = 1;

    const start = (currentEventPage - 1) * EVENTS_PER_PAGE;
    const pageEvents = filtered.slice(start, start + EVENTS_PER_PAGE);

    tbody.innerHTML = pageEvents.map(event => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group border-b border-transparent dark:border-slate-700/50 last:border-0">
            <td class="px-6 py-4">
                ${event.image ? 
                    `<img src="${event.image}" alt="${event.title}" class="w-16 h-10 rounded object-cover">` :
                    `<div class="w-16 h-10 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div class="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500"><i class="fas fa-calendar-alt"></i></div>
                    </div>`
                }
            </td>
            <td class="px-6 py-4 font-medium text-slate-800 dark:text-white">
                ${event.title}
                <div class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-md">${event.description ? event.description.replace(/<[^>]*>/g, '').substring(0, 60) + '...' : ''}</div>
            </td>
            <td class="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">${new Date(event.pubDate).toLocaleDateString('fr-FR')}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="openEventPreview('${event.link}')" class="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium text-sm transition flex items-center justify-end gap-1 ml-auto">
                    <i class="fas fa-eye"></i> Aperçu
                </button>
            </td>
        </tr>
    `).join('');

    document.getElementById('event-pagination-info').textContent = `Page ${currentEventPage} sur ${totalPages}`;
    document.getElementById('prev-event-page-btn').disabled = currentEventPage === 1;
    document.getElementById('next-event-page-btn').disabled = currentEventPage === totalPages;
}

function prevEventPage() {
    if (currentEventPage > 1) {
        currentEventPage--;
        renderEvents();
    }
}

function nextEventPage() {
    const search = document.getElementById('search-events')?.value.toLowerCase() || '';
    const filtered = appState.events.filter(e => 
        e.title.toLowerCase().includes(search) || 
        (e.location && e.location.toLowerCase().includes(search))
    );
    const totalPages = Math.ceil(filtered.length / EVENTS_PER_PAGE);

    if (currentEventPage < totalPages) {
        currentEventPage++;
        renderEvents();
    }
}

// Helper function to sanitize and convert markdown to HTML
function sanitizeEventContent(content) {
    if (!content) return '';
    
    // Create a temporary div to parse HTML safely
    const tempDiv = document.createElement('div');
    tempDiv.textContent = content; // This escapes HTML first
    
    let text = tempDiv.innerHTML;
    
    // Convert markdown-style links [text](url) to HTML links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-purple-600 dark:text-purple-400 hover:underline">$1</a>');
    
    // Convert **bold** to <strong>
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em>
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Convert line breaks
    text = text.replace(/\n/g, '<br>');
    
    // Convert URLs to clickable links (if not already in markdown format)
    const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
    text = text.replace(urlRegex, (url) => {
        // Check if already wrapped in <a> tag
        if (text.includes(`href="${url}"`) || text.includes(`href='${url}'`)) {
            return url;
        }
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-purple-600 dark:text-purple-400 hover:underline">${url}</a>`;
    });
    
    return text;
}

function openEventPreview(link) {
    const event = appState.events.find(e => e.link === link);
    if (!event) {
        // Si l'événement n'est pas trouvé, ouvrir le lien dans un nouvel onglet
        window.open(link, '_blank');
        return;
    }

    document.getElementById('modal-title').textContent = event.title;

    // Sanitize and format the content
    const sanitizedContent = sanitizeEventContent(event.content || event.description || '');

    const content = `<div class="flex flex-col gap-4">
        ${event.image ? `
        <div class="w-full rounded-xl overflow-hidden shadow-lg">
            <img src="${event.image}" alt="${event.title}" class="w-full h-64 object-cover">
        </div>
        ` : `
        <div class="w-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-8 border border-purple-200 dark:border-purple-800 flex flex-col items-center justify-center gap-4">
            <div class="w-24 h-24 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center text-purple-500 dark:text-purple-400 mb-2">
                <i class="fas fa-calendar-alt text-4xl"></i>
            </div>
        </div>
        `}
        <div class="mt-6 prose prose-orange max-w-none dark:prose-invert">
            <div class="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                ${event.location ? `<div class="flex items-center gap-2">
                    <i class="fas fa-map-marker-alt"></i> ${event.location}
                </div>` : ''}
                ${event.fee ? `<div class="flex items-center gap-2">
                    <i class="fas fa-euro-sign"></i> ${event.fee}
                </div>` : ''}
                <div class="flex items-center gap-2">
                    <i class="far fa-calendar mr-2"></i> ${new Date(event.pubDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </div>
            <div class="event-content text-slate-700 dark:text-slate-300 leading-relaxed">
                ${sanitizedContent}
            </div>
            <a href="${event.link}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <i class="fas fa-external-link-alt"></i> Voir l'événement sur Meetup
            </a>
        </div>
    </div>`;

    document.getElementById('modal-content').innerHTML = content;
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('hidden');
}

function prevVideoPage() {
    if (currentVideoPage > 1) {
        currentVideoPage--;
        renderVideos();
    }
}

function nextVideoPage() {
    const search = document.getElementById('search-videos')?.value.toLowerCase() || '';
    const filtered = appState.videos.filter(v => v.title.toLowerCase().includes(search));
    const totalPages = Math.ceil(filtered.length / VIDEOS_PER_PAGE);

    if (currentVideoPage < totalPages) {
        currentVideoPage++;
        renderVideos();
    }
}

// Search Listener
document.getElementById('search-posts')?.addEventListener('input', renderContentTable);

// Modal Logic
function openPreview(slug) {
    const post = appState.posts.find(p => p.slug === slug);
    if (!post) return;

    document.getElementById('modal-title').textContent = post.title;
    document.getElementById('modal-content').innerHTML = post.content; // Warning: Ensure content is sanitized in worker

    const modal = document.getElementById('preview-modal');
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('preview-modal').classList.add('hidden');
    // Stop video if playing
    const content = document.getElementById('modal-content');
    content.innerHTML = '';
}

// New function to preview a video in the same modal
function openVideoPreview(link) {
    const video = appState.videos.find(v => v.link === link);
    if (!video) return;

    document.getElementById('modal-title').textContent = video.title;

    // Extract Video ID
    let videoId = '';
    try {
        const url = new URL(link);
        if (url.hostname.includes('youtube.com')) {
            videoId = url.searchParams.get('v');
        } else if (url.hostname.includes('youtu.be')) {
            videoId = url.pathname.slice(1);
        }
    } catch (e) {
        console.error("Invalid video URL", link);
    }

    const embedSrc = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : link;

    // Build modal content: embed video if possible, otherwise show link and description
    const content = `<div class="flex flex-col gap-4">
        <div class="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-lg">
            <iframe 
                width="100%" 
                height="100%" 
                src="${embedSrc}" 
                title="YouTube video player" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen>
            </iframe>
        </div>
        <div class="mt-6 prose prose-orange max-w-none">
            <p>${video.description || ''}</p>
            <a href="${video.link}" target="_blank" class="text-sm text-slate-500 hover:text-orange-500 flex items-center gap-2 mt-4">
                <i class="fab fa-youtube"></i> Regarder sur YouTube
            </a>
        </div>
    `;

    document.getElementById('modal-content').innerHTML = content;
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('hidden');
}

function openPodcastPreview(link) {
    const podcast = appState.podcasts.find(p => p.link === link);
    if (!podcast) return;

    document.getElementById('modal-title').textContent = podcast.title;

    const content = `<div class="flex flex-col gap-4">
        <div class="w-full bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col items-center justify-center gap-4">
            <div class="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center text-purple-500 mb-2">
                <i class="fas fa-microphone-alt text-4xl"></i>
            </div>
            <audio controls class="w-full max-w-md" preload="auto">
                <source src="${podcast.audioUrl}" type="audio/mpeg">
                Votre navigateur ne supporte pas l'élément audio.
            </audio>
        </div>
        <div class="mt-6 prose prose-orange max-w-none">
            <div class="text-sm text-slate-500 mb-2">
                <i class="far fa-calendar mr-2"></i> ${new Date(podcast.pubDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <p>${podcast.description || ''}</p>
            <a href="${podcast.link}" target="_blank" class="text-sm text-slate-500 hover:text-orange-500 flex items-center gap-2 mt-4">
                <i class="fas fa-external-link-alt"></i> Écouter sur la plateforme d'origine
            </a>
        </div>
    </div>`;

    document.getElementById('modal-content').innerHTML = content;
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('hidden');
}


// API Tester
async function testApiSlug() {
    const slug = document.getElementById('api-slug-input').value;
    if (!slug) {
        document.getElementById('api-output').textContent = "Erreur : Veuillez entrer un slug";
        return;
    }
    testApi(buildApiUrl(`/api/post/${slug}`));
}

async function testApiVideo() {
    const id = document.getElementById('api-video-input').value;
    if (!id) {
        document.getElementById('api-output').textContent = "Erreur : Veuillez entrer un ID vidéo";
        return;
    }
    testApi(buildApiUrl(`/api/video/${id}`));
}

async function testApiPodcast() {
    const id = document.getElementById('api-podcast-input').value;
    if (!id) {
        document.getElementById('api-output').textContent = "Erreur : Veuillez entrer un GUID ou un Slug de podcast";
        return;
    }
    testApi(buildApiUrl(`/api/podcast/${id}`));
}

async function testApi(endpoint) {
    const output = document.getElementById('api-output');
    const title = document.getElementById('api-response-title');

    if (title) title.textContent = `Réponse : ${endpoint}`;
    output.textContent = "Chargement...";

    try {
        const res = await fetch(endpoint);
        const data = await res.json();
        output.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
        output.textContent = "Erreur: " + e.message;
    }
}

function clearApiOutput() {
    const output = document.getElementById('api-output');
    const title = document.getElementById('api-response-title');

    if (output) output.textContent = "En attente...";
    if (title) title.textContent = "Réponse";
}

// Cache Clearing
async function clearCache() {
    const status = document.getElementById('cache-status');
    status.textContent = "Nettoyage...";
    try {
        const authKey = localStorage.getItem('websuite_auth');
        const res = await fetch(buildApiUrl('/api/clear-cache'), {
            method: 'POST',
            headers: { 'X-Auth-Key': authKey }
        });
        if (res.ok) {
            status.textContent = "Cache vidé avec succès !";
            status.className = "text-xs text-green-600 mt-2";
            setTimeout(() => status.textContent = "", 3000);
        } else {
            status.textContent = "Erreur lors du nettoyage.";
            status.className = "text-xs text-red-600 mt-2";
        }
    } catch (e) {
        status.textContent = "Erreur: " + e.message;
        status.className = "text-xs text-red-600 mt-2";
    }
}



// ====================================================================
// AGENTS LOGIC
// ====================================================================

// Configuration Check
async function checkAgentsConfig() {
    console.log("Checking Agents Config...");
    const warning = document.getElementById('agents-config-warning');
    const createBtn = document.getElementById('btn-create-agent');

    // Default State: Disabled
    if (createBtn) createBtn.disabled = true;

    try {
        const authKey = localStorage.getItem('websuite_auth');
        const raw = await fetch('/api/config', {
            headers: { 'X-Auth-Key': authKey }
        });
        if (!raw.ok) {
            console.error("Config fetch failed:", raw.status);
            if (warning) {
                warning.classList.remove('hidden');
                warning.innerHTML = `<div class="p-4 bg-red-100 text-red-700">Erreur de chargement de la configuration (${raw.status}).</div>`;
            }
            return false;
        }

        const conf = await raw.json();
        console.log("Config received:", conf);

        let missing = [];
        const missingGithub = document.getElementById('missing-github');
        const missingCron = document.getElementById('missing-cronjob');

        // Reset specific warnings
        if (missingGithub) missingGithub.classList.add('hidden');
        if (missingCron) missingCron.classList.add('hidden');

        if (!conf.hasGithub) {
            if (missingGithub) missingGithub.classList.remove('hidden');
            missing.push('github');
        }
        if (!conf.hasCronJob) {
            if (missingCron) missingCron.classList.remove('hidden');
            missing.push('cronjob');
        }

        // Google AI Check
        const missingGoogle = document.getElementById('missing-google');
        if (missingGoogle) missingGoogle.classList.add('hidden');

        if (!conf.hasGoogleAI) {
            if (missingGoogle) missingGoogle.classList.remove('hidden');
            missing.push('google');
        }

        if (missing.length > 0) {
            if (warning) warning.classList.remove('hidden');
            return false;
        }

        // Success
        if (warning) warning.classList.add('hidden');
        // Temporarily disabled: agent creation feature not ready
        // if (createBtn) createBtn.disabled = false;

        return true;
    } catch (e) {
        console.error("Config Check Error", e);
        if (warning) {
            warning.classList.remove('hidden');
            warning.innerHTML = `<div class="p-4 bg-red-100 text-red-700">Erreur système: impossible de vérifier la configuration.</div>`;
        }
        return false;
    }
}

// Agents data
let agentsList = [];
let agentsLogs = {}; // Cache des logs par agent

async function loadAgents() {
    const tbody = document.getElementById('agents-table');
    if (!tbody) return;

    await checkAgentsConfig();

    try {
        const authKey = localStorage.getItem('websuite_auth');
        const response = await fetch(buildApiUrl('/api/agents'), {
            headers: { 'X-Auth-Key': authKey }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Non authentifié, rediriger vers login
                window.location.href = '/admin/index.html';
        return;
            }
            throw new Error(`Erreur ${response.status}`);
        }

        agentsList = await response.json();

        if (agentsList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-slate-500">Aucun agent configuré. <button onclick="document.getElementById(\'agent-create-modal\').classList.remove(\'hidden\')" class="text-emerald-600 hover:underline ml-2">Créer un agent</button></td></tr>';
            return;
        }

        // Charger les logs du dernier exécution pour chaque agent
        for (const agent of agentsList) {
            try {
                const logsResponse = await fetch(buildApiUrl(`/api/agents/${agent.id}/logs`), {
                    headers: { 'X-Auth-Key': authKey }
                });
                if (logsResponse.ok) {
                    const logsData = await logsResponse.json();
                    agentsLogs[agent.id] = logsData.logs || [];
                }
            } catch (e) {
                console.warn(`Could not load logs for agent ${agent.id}:`, e);
            }
        }

        renderAgentsTable();

    } catch (error) {
        console.error('Error loading agents:', error);
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Erreur lors du chargement: ${error.message}</td></tr>`;
    }
}

function renderAgentsTable() {
    const tbody = document.getElementById('agents-table');
    if (!tbody) return;

    tbody.innerHTML = agentsList.map(agent => {
        const logs = agentsLogs[agent.id] || [];
        const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
        const lastRun = lastLog ? new Date(lastLog.timestamp) : null;
        const lastSuccess = lastLog ? lastLog.data.success : null;

        return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition border-b border-transparent dark:border-slate-700/50 last:border-0">
            <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${agent.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}">
                    <span class="w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
                    ${agent.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
            </td>
            <td class="px-6 py-4 font-medium text-slate-800 dark:text-white">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-white shadow-sm">
                        <i class="fas fa-robot text-sm"></i>
                    </div>
                    <div>
                        <div class="font-semibold">${agent.name}</div>
                        <div class="text-xs text-slate-400 mt-0.5 font-mono">${agent.id}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                ${lastRun ? `
                    <div>${lastRun.toLocaleString('fr-FR')}</div>
                    <div class="mt-1 ${lastSuccess ? 'text-emerald-600' : 'text-red-600'}">
                        ${lastSuccess ? '<i class="fas fa-check-circle"></i> Succès' : '<i class="fas fa-times-circle"></i> Échec'}
                    </div>
                ` : '<span class="text-slate-400">Jamais exécuté</span>'}
            </td>
            <td class="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                ${lastLog && lastLog.data.executionTime ? `${lastLog.data.executionTime}ms` : '-'}
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button onclick="executeAgent('${agent.id}', this)" 
                        class="text-slate-400 hover:text-emerald-500 transition p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded" 
                        title="Exécuter maintenant">
                    <i class="fas fa-play"></i>
                </button>
                    <button onclick="viewAgentLogs('${agent.id}')" 
                        class="text-slate-400 hover:text-blue-500 transition p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded" 
                        title="Voir les logs">
                        <i class="fas fa-list-alt"></i>
                    </button>
                    <button onclick="editAgent('${agent.id}')" 
                        class="text-slate-400 hover:text-purple-500 transition p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded" 
                        title="Éditer dans l'IDE">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
}

async function executeAgent(agentId, buttonElement) {
    if (!confirm(`Voulez-vous exécuter l'agent "${agentId}" maintenant ?`)) {
        return;
    }

    const button = buttonElement || (event && event.target.closest('button'));
    const originalHTML = button ? button.innerHTML : '';
    if (button) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        button.disabled = true;
    }

    try {
        const authKey = localStorage.getItem('websuite_auth');
        const response = await fetch(buildApiUrl(`/api/agents/${agentId}/execute`), {
            method: 'POST',
            headers: { 'X-Auth-Key': authKey }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `Erreur ${response.status}`);
        }

        const result = await response.json();
        
        // Recharger les logs
        await loadAgentLogs(agentId);
        renderAgentsTable();

        // Afficher le résultat
        alert(`Agent exécuté avec succès !\n\nTemps d'exécution: ${result.executionTime}ms\n\nRésultat: ${JSON.stringify(result.result, null, 2)}`);
    } catch (error) {
        alert(`Erreur lors de l'exécution: ${error.message}`);
    } finally {
        if (button) {
            button.innerHTML = originalHTML;
            button.disabled = false;
        }
    }
}

async function loadAgentLogs(agentId) {
    try {
        const authKey = localStorage.getItem('websuite_auth');
        const response = await fetch(buildApiUrl(`/api/agents/${agentId}/logs`), {
            headers: { 'X-Auth-Key': authKey }
        });

        if (response.ok) {
            const logsData = await response.json();
            agentsLogs[agentId] = logsData.logs || [];
        }
    } catch (error) {
        console.error(`Error loading logs for agent ${agentId}:`, error);
    }
}

function viewAgentLogs(agentId) {
    const agent = agentsList.find(a => a.id === agentId);
    const logs = agentsLogs[agentId] || [];

    // Créer le modal de logs
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4';
    modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700">
            <div class="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div>
                    <h2 class="text-xl font-bold dark:text-white flex items-center gap-3">
                        <i class="fas fa-list-alt text-purple-600"></i>
                        Logs - ${agent ? agent.name : agentId}
                    </h2>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">${logs.length} exécution(s) enregistrée(s)</p>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
                ${logs.length === 0 ? `
                    <div class="text-center py-12 text-slate-500">
                        <i class="fas fa-inbox text-4xl mb-4 opacity-50"></i>
                        <p>Aucun log disponible pour cet agent.</p>
                    </div>
                ` : `
                    <div class="space-y-4">
                        ${logs.reverse().map(log => `
                            <div class="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center gap-3">
                                        <span class="px-2.5 py-1 rounded-full text-xs font-medium ${log.data.success ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}">
                                            ${log.data.success ? '<i class="fas fa-check-circle"></i> Succès' : '<i class="fas fa-times-circle"></i> Échec'}
                                        </span>
                                        <span class="text-xs text-slate-500">${new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                                        <span class="text-xs text-slate-400">${log.data.triggeredBy || 'unknown'}</span>
                                    </div>
                                    ${log.data.executionTime ? `<span class="text-xs text-slate-500">${log.data.executionTime}ms</span>` : ''}
                                </div>
                                <pre class="text-xs bg-slate-900 dark:bg-slate-950 text-slate-100 p-3 rounded overflow-x-auto font-mono">${JSON.stringify(log.data.result || log.data.error || log.data, null, 2)}</pre>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('button').addEventListener('click', () => modal.remove());
}

function editAgent(agentId) {
    // Ouvrir l'IDE pour éditer l'agent
    window.open(`/admin/ide.html?agent=${agentId}`, '_blank');
}

function createNewAgent() {
    // Ouvrir l'IDE pour créer un nouvel agent
    window.open('/admin/ide.html?new-agent=true', '_blank');
}

// Services Modal Functions
window.openServicesModal = function() {
    try {
        console.log('[Services Modal] Opening modal...');
        const modal = document.getElementById('services-modal');
        if (!modal) {
            console.error('[Services Modal] Modal element not found!');
            alert('Erreur: La popup des services n\'a pas pu être trouvée.');
            return;
        }
        console.log('[Services Modal] Modal found, removing hidden class');
        modal.classList.remove('hidden');
        console.log('[Services Modal] Loading services...');
        if (typeof window.loadConnectedServices === 'function') {
            window.loadConnectedServices(); // Charger les services dynamiquement
        } else {
            console.error('[Services Modal] loadConnectedServices function not found!');
        }
    } catch (error) {
        console.error('[Services Modal] Error opening modal:', error);
        alert('Erreur lors de l\'ouverture de la popup: ' + error.message);
    }
}

// Rendre cette fonction accessible globalement pour le fallback
window.loadConnectedServices = async function loadConnectedServices() {
    const container = document.getElementById('services-list');
    if (!container) return;

    // Afficher le loading
    container.innerHTML = `
        <div class="text-center p-8">
            <i class="fas fa-spinner fa-spin text-3xl text-slate-400 mb-4"></i>
            <p class="text-slate-500 dark:text-slate-400">Chargement des services...</p>
        </div>
    `;

    try {
        const authKey = localStorage.getItem('websuite_auth');
        if (!authKey) {
            throw new Error('Non authentifié. Veuillez vous reconnecter.');
        }
        
        const apiUrl = buildApiUrl('/api/env-vars');
        console.log('[Services Modal] Fetching from:', apiUrl);
        
        const response = await fetch(apiUrl, {
            headers: {
                'X-Auth-Key': authKey
            }
        });

        console.log('[Services Modal] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Services Modal] API Error:', response.status, errorText);
            throw new Error(`Erreur ${response.status}: ${errorText || 'Erreur lors du chargement des services'}`);
        }

        const data = await response.json();
        const envVars = data.variables || [];

        // Mapping des variables d'env vers les services
        const servicesMap = {
            'GitHub': {
                icon: 'fab fa-github',
                color: 'bg-slate-900',
                description: 'Stockage et versionning de vos agents. Indispensable pour l\'exécution du code.',
                configUrl: 'https://github.com/settings/tokens',
                required: ['GITHUB_TOKEN', 'GITHUB_USER', 'GITHUB_REPO']
            },
            'CronJob': {
                icon: 'fas fa-clock',
                color: 'bg-blue-600',
                description: 'Planificateur de tâches externe gratuit et fiable pour exécuter vos agents.',
                configUrl: 'https://console.cron-job.org/settings',
                required: ['CRONJOB_API_KEY']
            },
            'Google AI (Gemini)': {
                icon: 'fab fa-google',
                color: 'bg-gradient-to-br from-blue-500 to-purple-600',
                description: 'Moteur d\'intelligence artificielle Gemini pour générer le code de vos agents.',
                configUrl: 'https://aistudio.google.com/app/apikey',
                required: ['GOOGLE_AI_KEY']
            },
            'Blog RSS': {
                icon: 'fas fa-rss',
                color: 'bg-orange-500',
                description: 'Flux RSS pour récupérer les articles de blog (Substack, WordPress, etc.)',
                configUrl: null,
                required: ['BLOG_FEED_URL', 'BLOG_RSS_URL']
            },
            'YouTube': {
                icon: 'fab fa-youtube',
                color: 'bg-red-600',
                description: 'Flux RSS YouTube pour récupérer les vidéos d\'une chaîne',
                configUrl: null,
                required: ['YOUTUBE_FEED_URL']
            },
            'Podcast': {
                icon: 'fas fa-podcast',
                color: 'bg-purple-600',
                description: 'Flux RSS du podcast (Anchor.fm, Spotify, etc.)',
                configUrl: null,
                required: ['PODCAST_FEED_URL']
            },
            'PDF Generation': {
                icon: 'fas fa-file-pdf',
                color: 'bg-red-700',
                description: 'Service de génération de fichiers PDF',
                configUrl: null,
                required: ['PDF_GENERATION_SERVICE_URL']
            },
            'Email': {
                icon: 'fas fa-envelope',
                color: 'bg-blue-500',
                description: 'Service d\'envoi d\'email',
                configUrl: null,
                required: ['EMAIL_API_KEY', 'EMAIL_SERVICE_URL']
            }
        };

        // Vérifier quels services sont connectés
        const envVarNames = envVars.map(v => v.name);
        const connectedServices = [];
        const availableServices = [];

        Object.entries(servicesMap).forEach(([serviceName, serviceConfig]) => {
            // Vérifier si au moins une variable requise est présente
            const hasAnyRequired = serviceConfig.required.some(req => envVarNames.includes(req));
            // Vérifier si toutes les variables requises sont présentes
            const hasAllRequired = serviceConfig.required.every(req => envVarNames.includes(req));
            
            if (hasAllRequired) {
                connectedServices.push({
                    name: serviceName,
                    ...serviceConfig,
                    status: 'connected',
                    varsFound: serviceConfig.required.filter(v => envVarNames.includes(v))
                });
            } else if (hasAnyRequired) {
                availableServices.push({
                    name: serviceName,
                    ...serviceConfig,
                    status: 'partial',
                    varsFound: serviceConfig.required.filter(v => envVarNames.includes(v)),
                    varsMissing: serviceConfig.required.filter(v => !envVarNames.includes(v))
                });
            } else {
                availableServices.push({
                    name: serviceName,
                    ...serviceConfig,
                    status: 'disconnected',
                    varsMissing: serviceConfig.required
                });
            }
        });

        // Rendre la liste dans la modal
        if (typeof window.renderServicesModal === 'function') {
            window.renderServicesModal(connectedServices, availableServices);
        } else {
            console.error('[loadConnectedServices] renderServicesModal function not found!');
        }

    } catch (error) {
        console.error('Erreur lors du chargement des services:', error);
        const container = document.getElementById('services-list');
        if (container) {
            container.innerHTML = `
                <div class="text-center p-8 text-red-500">
                    <i class="fas fa-exclamation-circle text-3xl mb-4"></i>
                    <p>Erreur lors du chargement des services connectés</p>
                    <p class="text-sm mt-2">${error.message}</p>
                </div>
            `;
        }
    }
}

window.renderServicesModal = function renderServicesModal(connectedServices, availableServices) {
    const container = document.getElementById('services-list');
    if (!container) return;

    let html = '';

    // Services connectés
    if (connectedServices.length > 0) {
        html += `
            <div class="mb-8">
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-check-circle text-emerald-500"></i>
                    Services Connectés (${connectedServices.length})
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        `;

        connectedServices.forEach(service => {
            html += `
                <div class="group relative bg-white dark:bg-slate-800 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 p-6 hover:shadow-lg transition-all duration-300">
                    <div class="absolute top-4 right-4">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <i class="fas fa-check-circle mr-1"></i> Connecté
                        </span>
                    </div>
                    <div class="mb-4">
                        <div class="w-12 h-12 ${service.color} rounded-lg flex items-center justify-center text-white text-2xl shadow-md group-hover:scale-110 transition-transform">
                            <i class="${service.icon}"></i>
                        </div>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">${service.name}</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mb-4 min-h-[40px]">${service.description}</p>
                    <div class="mb-4">
                        <p class="text-xs text-emerald-600 dark:text-emerald-400 mb-1 font-medium">Variables configurées:</p>
                        <div class="flex flex-wrap gap-1">
                            ${service.varsFound.map(v => `<span class="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded text-xs">${v}</span>`).join('')}
                        </div>
                    </div>
                    ${service.configUrl ? `
                        <a href="${service.configUrl}" target="_blank"
                            class="inline-flex w-full justify-center items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition gap-2">
                            <i class="fas fa-external-link-alt"></i> Configurer
                        </a>
                    ` : ''}
                </div>
            `;
        });

        html += `</div></div>`;
    }

    // Services disponibles mais non connectés
    if (availableServices.length > 0) {
        html += `
            <div class="mb-8">
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-plug text-slate-400"></i>
                    Services Disponibles (${availableServices.length})
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        `;

        availableServices.forEach(service => {
            const statusBadge = service.status === 'partial' 
                ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"><i class="fas fa-exclamation-circle mr-1"></i> Partiel</span>'
                : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"><i class="fas fa-times-circle mr-1"></i> Non connecté</span>';

            html += `
                <div class="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg opacity-75 transition-all duration-300">
                    <div class="absolute top-4 right-4">${statusBadge}</div>
                    <div class="mb-4">
                        <div class="w-12 h-12 ${service.color} rounded-lg flex items-center justify-center text-white text-2xl shadow-md group-hover:scale-110 transition-transform">
                            <i class="${service.icon}"></i>
                        </div>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">${service.name}</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mb-4 min-h-[40px]">${service.description}</p>
                    ${service.varsMissing && service.varsMissing.length > 0 ? `
                        <div class="mb-4">
                            <p class="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Variables manquantes:</p>
                            <div class="flex flex-wrap gap-1">
                                ${service.varsMissing.map(v => `<span class="px-2 py-0.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs">${v}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${service.configUrl ? `
                        <a href="${service.configUrl}" target="_blank"
                            class="inline-flex w-full justify-center items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition gap-2">
                            <i class="fas fa-external-link-alt"></i> Configurer
                        </a>
                    ` : `
                        <p class="text-xs text-slate-500 dark:text-slate-400 text-center">Ajoutez les variables d'environnement requises dans .dev.vars ou Cloudflare</p>
                    `}
                </div>
            `;
        });

        html += `</div></div>`;
    }

    container.innerHTML = html || '<div class="text-center p-8 text-slate-500">Aucun service configuré</div>';
}


// ====================================================================
// WIZARD LOGIC
// ====================================================================
let currentWizardStep = 1;

function wizardNext() {
    if (currentWizardStep < 3) {
        // Validation per step
        if (currentWizardStep === 1) {
            const name = document.getElementById('agent-name').value;
            const prompt = document.getElementById('agent-prompt').value;
            if (!name.trim() || !prompt.trim()) {
                alert("Veuillez remplir le nom et l'objectif de l'agent.");
                return;
            }
        }

        if (currentWizardStep === 2) {
            const gasUrl = document.getElementById('gas-url').value;
            if (!gasUrl.trim()) {
                alert("Veuillez entrer l'URL de votre déploiement Google Apps Script.");
                return;
            }
        }

        currentWizardStep++;
        updateWizardUI();
    } else {
        // Final Step: Create / Save
        // Determine Schedule
        let cron = "";
        const mode = document.getElementById('tab-simple').classList.contains('border-emerald-500') ? 'simple' : 'advanced';

        if (mode === 'advanced') {
            cron = document.getElementById('cron-expression').value;
            if (!cron.trim()) {
                alert("Expression Cron requise.");
                return;
            }
        } else {
            // Logic to build cron from simple UI would go here
            // For now, simple mock
            const freq = document.getElementById('sched-frequency').value;
            cron = freq + " (Mock)";
        }

        alert(`Création de l'agent...\n- Stockage sur GitHub\n- Planification sur CronJob.org: ${cron}`);

        // Mock Save to mockAgents for UI feedback
        mockAgents.push({
            name: document.getElementById('agent-name').value || "New Agent",
            id: "agent_" + Date.now(),
            status: "active",
            trigger: "cron",
            schedule: cron,
            lastRun: null
        });

        showView('agents');
        currentWizardStep = 1; // Reset
        updateWizardUI();

        // Refresh Agent List
        loadAgents();
    }
}

function wizardBack() {
    if (currentWizardStep > 1) {
        currentWizardStep--;
        updateWizardUI();
    }
}

// Scheduler UI Logic
function setScheduleMode(mode) {
    const simpleTab = document.getElementById('tab-simple');
    const advTab = document.getElementById('tab-advanced');
    const simpleView = document.getElementById('schedule-simple');
    const advView = document.getElementById('schedule-advanced');

    if (mode === 'simple') {
        simpleTab.classList.add('border-emerald-500', 'text-emerald-600', 'bg-slate-50', 'dark:bg-slate-800/50', 'font-bold');
        simpleTab.classList.remove('border-transparent', 'text-slate-500');
        advTab.classList.remove('border-emerald-500', 'text-emerald-600', 'bg-slate-50', 'dark:bg-slate-800/50', 'font-bold');
        advTab.classList.add('border-transparent', 'text-slate-500');

        simpleView.classList.remove('hidden');
        advView.classList.add('hidden');
    } else {
        advTab.classList.add('border-emerald-500', 'text-emerald-600', 'bg-slate-50', 'dark:bg-slate-800/50', 'font-bold');
        advTab.classList.remove('border-transparent', 'text-slate-500');
        simpleTab.classList.remove('border-emerald-500', 'text-emerald-600', 'bg-slate-50', 'dark:bg-slate-800/50', 'font-bold');
        simpleTab.classList.add('border-transparent', 'text-slate-500');

        advView.classList.remove('hidden');
        simpleView.classList.add('hidden');
    }
}

function toggleDay(btn, dayIdx) {
    btn.classList.toggle('bg-emerald-500');
    btn.classList.toggle('text-white');
    btn.classList.toggle('border-emerald-500');
    // ... logic to build state
}

function updateWizardUI() {
    // Hide all steps
    document.getElementById('wizard-step-1').classList.add('hidden');
    document.getElementById('wizard-step-2').classList.add('hidden');
    document.getElementById('wizard-step-3').classList.add('hidden');

    // Show current step
    document.getElementById(`wizard-step-${currentWizardStep}`).classList.remove('hidden');

    // Update Buttons
    const btnBack = document.getElementById('btn-back');
    const btnNext = document.getElementById('btn-next');

    if (currentWizardStep === 1) {
        btnBack.classList.add('hidden');
        btnNext.innerHTML = 'Générer le Code <i class="fas fa-code ml-2"></i>';
        btnNext.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
        btnNext.classList.add('bg-purple-600', 'hover:bg-purple-700');
    } else {
        btnBack.classList.remove('hidden');
        if (currentWizardStep === 3) {
            btnNext.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Activer l\'Agent';
            btnNext.classList.remove('bg-purple-600', 'hover:bg-purple-700');
            btnNext.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
        } else {
            btnNext.innerHTML = 'Configurer le Planning <i class="fas fa-clock ml-2"></i>';
            btnNext.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
            btnNext.classList.remove('bg-purple-600', 'hover:bg-purple-700');
        }
    }

    // Update Markers
    for (let i = 1; i <= 3; i++) {
        const marker = document.getElementById(`step-marker-${i}`);
        if (i < currentWizardStep) {
            // Completed
            marker.className = "w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-lg transition-colors";
            marker.innerHTML = '<i class="fas fa-check"></i>';
        } else if (i === currentWizardStep) {
            // Current
            marker.className = "w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-lg ring-4 ring-emerald-100 dark:ring-emerald-900/30 transition-colors";
            marker.innerHTML = i;
        } else {
            // Future
            marker.className = "w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center font-bold transition-colors";
            marker.innerHTML = i;
        }
    }
}