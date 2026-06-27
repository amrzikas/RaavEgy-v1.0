import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  
  const isProd = process.env.NODE_ENV === "production";
  // Under Cloud Run/Firebase App Hosting in prod, we MUST listen on the port defined by PORT (usually 8080)
  // In development, the local workspace reverse proxy requires port 3000
  const PORT = isProd ? Number(process.env.PORT || 8080) : 3000;

  // Serve static assets in production
  if (isProd) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Vite middleware for development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
