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
});

// Auth Check
async function checkAuth() {
    // Only check auth on dashboard page, not on login page
    const currentPath = window.location.pathname;
    if (currentPath === '/admin' || currentPath === '/admin/' || currentPath === '/admin/index.html') {
        // We're on the login page, don't redirect
        return;
    }

    const authKey = localStorage.getItem('stackpages_auth');
    if (!authKey) {
        window.location.href = '/admin';
        return;
    }

    // Optional: Verify with server if needed, but for now just trust existence + API 401s
    /*
    try {
        const res = await fetch('/api/check-auth', { 
            headers: { 'X-Auth-Key': authKey }
        });
        const data = await res.json();
        if (!data.authenticated) {
            localStorage.removeItem('stackpages_auth');
            window.location.href = '/admin';
        }
    } catch (e) {
        window.location.href = '/admin';
    }
    */
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
        'agents': 'Agents Google AI',
        'agent-create': 'Nouvel Agent Google',
        'config': 'Configuration',
        'help': 'Aide & Support'
    };
    document.getElementById('page-title').textContent = titles[viewName];

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

        // 1. Metadata
        const metaRes = await fetch(buildApiUrl(`/api/metadata${refreshParam}`));
        metadata = await metaRes.json();

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

        const [posts, videos, podcasts] = await Promise.all([loadPosts, loadVideos, loadPodcasts]);

        appState.posts = posts;
        appState.videos = videos;
        appState.podcasts = podcasts;

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

    } catch (e) {
        console.error("Erreur de chargement:", e);
        // alert("Impossible de charger les données de l'API.");
    }
}


// Config Loading
async function loadConfig() {
    try {
        const authKey = localStorage.getItem('stackpages_auth');
        // Fetch config (environment variables)
        const configRes = await fetch(buildApiUrl('/api/config'), {
            headers: { 'X-Auth-Key': authKey }
        });
        const config = await configRes.json();
        // Fetch metadata from Substack RSS (site name, author, SEO if any)
        const metaRes = await fetch(buildApiUrl('/api/metadata'));
        const metadata = await metaRes.json();

        // Save to State
        appState.config = config;
        appState.metadata = metadata;

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
                builderBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                builderBtn.href = "#";
                builderBtn.removeAttribute('target');
                builderBtn.classList.add('opacity-50', 'cursor-not-allowed');
                builderBtn.querySelector('span').textContent = "Builder non configuré";
                builderBtn.onclick = (e) => { e.preventDefault(); alert("Veuillez configurer FRONTEND_BUILDER_URL"); };
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

// Config Saving (Disabled)
// La configuration est gérée par les variables d'environnement.

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
                        <button onclick="openPodcastPreview('${podcast.link}')" class="text-blue-500 dark:text-blue-400 hover:text-blue-700 font-medium text-xs uppercase tracking-wide">Ouvrir</button>
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
                    <i class="fas fa-play"></i> Ouvrir
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
        const authKey = localStorage.getItem('stackpages_auth');
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
        const authKey = localStorage.getItem('stackpages_auth');
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

// Mock Data for agents
const mockAgents = [
    {
        name: "Gmail Prospecting",
        id: "gmail_bot",
        status: "active",
        trigger: "cron",
        schedule: "0 9 * * *",
        type: "gas",
        lastRun: new Date(Date.now() - 3600000).toISOString()
    }
];

async function loadAgents() {
    const tbody = document.getElementById('agents-table');
    if (!tbody) return;

    await checkAgentsConfig();

    // TODO: Fetch from /api/agents

    if (mockAgents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-slate-500">Aucun agent configuré.</td></tr>';
        return;
    }

    tbody.innerHTML = mockAgents.map(agent => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition border-b border-transparent dark:border-slate-700/50 last:border-0">
            <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${agent.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}">
                    <span class="w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
                    ${agent.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
            </td>
            <td class="px-6 py-4 font-medium text-slate-800 dark:text-white">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-white border border-slate-200 dark:bg-slate-700 dark:border-slate-600 flex items-center justify-center text-xl shadow-sm">
                        <i class="fab fa-google text-lg"></i>
                    </div>
                    <div>
                        ${agent.name}
                        <div class="text-xs text-slate-400 mt-0.5">${agent.schedule}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs text-right">
                ${agent.lastRun ? new Date(agent.lastRun).toLocaleString('fr-FR') : 'Jamais'}
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="alert('Déclenchement du script Google...')" class="text-slate-400 hover:text-emerald-500 transition mx-1" title="Lancer manuellement">
                    <i class="fas fa-play"></i>
                </button>
            </td>
        </tr>
    `).join('');
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