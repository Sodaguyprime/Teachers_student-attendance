import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DB_PATH, IS_PROD, PORT, loadServerSecret } from './config.js';
import { applySchema, createDb } from './db/client.js';
import { localNetworkAddress } from './lib/net.js';
import { loopbackOnly, securityHeaders } from './lib/security.js';
import { scanRoutes } from './routes/scan.js';
import { teacherRoutes } from './routes/teacher.js';

const { db, sqlite } = createDb(DB_PATH);
applySchema(sqlite);

const serverSecret = loadServerSecret();
/** In dev the browser talks to Vite, which proxies /api here. */
const publicPort = Number(process.env.PUBLIC_PORT ?? (IS_PROD ? PORT : 5173));

const app = new Hono();
app.use('*', securityHeaders(IS_PROD));

app.get('/api/health', (c) => c.json({ ok: true }));

app.route('/api/scan', scanRoutes(db, serverSecret));
app.use('/api/teacher/*', loopbackOnly((c) => c.env?.incoming?.socket?.remoteAddress));
app.route('/api/teacher', teacherRoutes(db, publicPort));

if (IS_PROD) {
  const clientDir = resolve(process.cwd(), 'dist/client');
  const indexHtml = readFileSync(resolve(clientDir, 'index.html'), 'utf8');

  app.use('/assets/*', serveStatic({ root: './dist/client' }));
  app.get('/favicon.svg', serveStatic({ root: './dist/client' }));
  // Everything else is the single-page app.
  app.get('*', (c) => c.html(indexHtml));
}

serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, () => {
  const lan = localNetworkAddress();
  console.log(`\n  Attendance server on port ${PORT}`);
  console.log(`  Teacher   http://localhost:${publicPort}/`);
  console.log(`  Students  http://${lan}:${publicPort}/  (same WiFi)\n`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    sqlite.close();
    process.exit(0);
  });
}
