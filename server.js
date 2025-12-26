// server.js - Serveur Bun local pour développement
const server = Bun.serve({
    port: 8000,
    async fetch(req) {
        const url = new URL(req.url);
        let pathname = url.pathname;
        
        // Route racine
        if (pathname === '/' || pathname === '/index.html') {
            const file = Bun.file('./index.html');
            if (await file.exists()) {
                return new Response(file);
            }
        }
        
        // Route /admin -> admin/index.html
        if (pathname === '/admin' || pathname === '/admin/') {
            const file = Bun.file('./admin/index.html');
            if (await file.exists()) {
                return new Response(file);
            }
        }
        
        // Route /admin/dashboard -> admin/dashboard.html
        if (pathname === '/admin/dashboard' || pathname === '/admin/dashboard/') {
            const file = Bun.file('./admin/dashboard.html');
            if (await file.exists()) {
                return new Response(file);
            }
        }
        
        // Route /admin/* avec extension .html déjà présente
        if (pathname.startsWith('/admin/') && pathname.endsWith('.html')) {
            const file = Bun.file(`.${pathname}`);
            if (await file.exists()) {
                return new Response(file);
            }
        }
        
        // Route /admin/* sans extension -> essayer avec .html
        if (pathname.startsWith('/admin/') && !pathname.endsWith('.html')) {
            const fileWithHtml = Bun.file(`.${pathname}.html`);
            if (await fileWithHtml.exists()) {
                return new Response(fileWithHtml);
            }
            // Si pas trouvé, essayer comme dossier avec index.html
            const indexFile = Bun.file(`.${pathname}/index.html`);
            if (await indexFile.exists()) {
                return new Response(indexFile);
            }
        }
        
        // Pour toutes les autres routes, essayer de servir le fichier directement
        const file = Bun.file(`.${pathname}`);
        if (await file.exists()) {
            return new Response(file);
        }
        
        // Si pas trouvé, essayer avec extension .html
        if (!pathname.endsWith('.html') && !pathname.includes('.')) {
            const fileWithHtml = Bun.file(`.${pathname}.html`);
            if (await fileWithHtml.exists()) {
                return new Response(fileWithHtml);
            }
        }
        
        // 404 si rien n'est trouvé
        return new Response('File not found: ' + pathname, { status: 404 });
    },
});

console.log(`🚀 Server running at http://localhost:${server.port}`);