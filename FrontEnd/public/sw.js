/**
 * sw.js - Service Worker para Agenda-One (PWA & Modo Offline)
 * Permite la instalación nativa en móviles y el acceso a itinerarios sin conexión a internet.
 */

const CACHE_STATIC_NAME = 'agenda-one-static-v1';
const CACHE_PORTAL_NAME = 'agenda-one-portal-api-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg'
];

// 1. Instalación del Service Worker: Pre-cachear assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Error al pre-cachear algunos activos estáticos:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activación: Limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_PORTAL_NAME) {
            console.log('[SW] Purgando caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Estrategia de Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo gestionar peticiones GET
  if (request.method !== 'GET') {
    return;
  }

  // A) Rutas de la API del Portal (/api/portal/*): Estrategia Network-First con Fallback a Caché
  if (url.pathname.includes('/api/portal/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Si la respuesta es válida, clonarla y guardarla en caché del portal
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_PORTAL_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Sin conexión: buscar en caché del portal
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            console.log('[SW] Modo offline: Devolviendo datos del portal desde caché local.');
            return cachedResponse;
          }
          // Si no está en caché, devolver error JSON informativo
          return new Response(
            JSON.stringify({
              error: true,
              offline: true,
              message: 'Sin conexión a internet. No hay datos en caché para este capacitador.'
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 503
            }
          );
        })
    );
    return;
  }

  // B) Activos Estáticos (Scripts, estilos, fuentes, imágenes): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_STATIC_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si la red falla y es navegación a la raíz, devolver /index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });

      return cachedResponse || fetchPromise;
    })
  );
});
