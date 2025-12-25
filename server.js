// server.js
const server = Bun.serve({
    port: 8000,
    fetch(req) {
      const url = new URL(req.url);
      const filePath = url.pathname === '/' ? '/index.html' : url.pathname;
      
      try {
        return new Response(Bun.file(`.${filePath}`));
      } catch (e) {
        return new Response('File not found', { status: 404 });
      }
    },
  });
  
  console.log(`🚀 Server running at http://localhost:${server.port}`);