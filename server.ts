import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { initDatabase } from './src/server/db.ts';
import { apiRouter } from './src/server/routes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startAppServer() {
  // Initialize Database schemas, foreign keys, default settings, and admin account
  initDatabase();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON & URL-encoded parser with 25MB limit for diagnostic reports/images
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API router
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'HEALTHY', timestamp: new Date().toISOString() });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode: Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[RuralCare] Vite dev middleware mounted');
  } else {
    // Production mode: Serve built static assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[RuralCare] Production static assets mounted from dist');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RuralCare Connect] Production Server listening on http://0.0.0.0:${PORT}`);
  });
}

startAppServer().catch((err) => {
  console.error('[RuralCare] Fatal server startup error:', err);
  process.exit(1);
});
