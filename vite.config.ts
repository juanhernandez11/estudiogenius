import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import groqFunction from './netlify/functions/groq.mjs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env.GROQ_API_KEY ||= env.GROQ_API_KEY || '';
  process.env.GROQ_MODEL ||= env.GROQ_MODEL || '';
  process.env.FIREBASE_API_KEY ||= env.FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY || '';
  process.env.FIREBASE_PROJECT_ID ||= env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || '';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['img/icon-192.png', 'img/icon-512.png'],
        manifest: {
          name: 'EstudioGenius',
          short_name: 'EstudioGenius',
          description: 'Tu asistente de estudio con IA',
          theme_color: '#6366f1',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: '/',
          lang: 'es',
          icons: [
            {
              src: '/img/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/img/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/?$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'tailwind-runtime',
                expiration: { maxEntries: 1, maxAgeSeconds: 30 * 24 * 60 * 60 },
              },
            },
          ],
        },
      }),
      {
        name: 'local-groq-function',
        configureServer(server) {
          server.middlewares.use((request, response, next) => {
            if (request.url?.split('?')[0] !== '/api/groq') return next();

            void (async () => {
              try {
                const chunks = [];
                let size = 0;
                for await (const chunk of request) {
                  size += chunk.length;
                  if (size > 65536) {
                    response.statusCode = 413;
                    response.end(JSON.stringify({ error: 'La solicitud es demasiado grande.' }));
                    return;
                  }
                  chunks.push(Buffer.from(chunk));
                }

                const apiRequest = new Request('http://localhost/api/groq', {
                  method: request.method,
                  headers: {
                    'Authorization': request.headers.authorization || '',
                    'Content-Type': 'application/json',
                  },
                  body: Buffer.concat(chunks).toString('utf8'),
                });
                const result = await groqFunction(apiRequest);
                response.statusCode = result.status;
                response.setHeader('Content-Type', 'application/json; charset=utf-8');
                response.end(await result.text());
              } catch {
                response.statusCode = 500;
                response.end(JSON.stringify({ error: 'No se pudo procesar la solicitud local.' }));
              }
            })();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
