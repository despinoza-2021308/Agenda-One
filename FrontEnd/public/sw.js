/**
 * sw.js - Service Worker para Agenda-One (PWA & Modo Offline)
 * Permite la instalación nativa en móviles y el acceso a itinerarios sin conexión a internet.
 * Versión 5: Network-First para navegación y HTML para garantizar actualizaciones instantáneas.
 */

const CACHE_STATIC_NAME = 'agenda-one-static-v10';
const CACHE_PORTAL_NAME = 'agenda-one-portal-api-v4';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
  '/logo-one.png'
];

// 1. Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Error al pre-cachear activos estáticos:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activación: Limpieza agresiva de todas las cachés anteriores
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

// Forzar activación inmediata si la página principal lo solicita
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 3. Estrategia de Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo gestionar peticiones GET
  if (request.method !== 'GET') {
    return;
  }

  // IMPORTANTE: NO interceptar las llamadas a la API general (citas, clientes, capacitadores, reportes)
  // Deben viajar siempre directo a la red sin pasar por la caché para reflejar cambios en tiempo real
  if (url.pathname.startsWith('/api/') && !url.pathname.includes('/api/portal/')) {
    return;
  }

  // A) Rutas de la API del Portal (/api/portal/*): Network-First con Fallback a Caché
  if (url.pathname.includes('/api/portal/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_PORTAL_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            console.log('[SW] Modo offline: Devolviendo datos del portal desde caché local.');
            return cachedResponse;
          }
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

  // B) Navegación principal e index.html: NETWORK-FIRST estricto
  // Esto asegura que cada vez que el usuario entre o recargue, obtenga el index.html
  // más reciente con los hashes actualizados de Vite, sin quedar atrapado en versiones viejas.
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_STATIC_NAME).then((cache) => {
              cache.put('/index.html', responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si no hay red, servir la última versión en caché
          return caches.match('/index.html');
        })
    );
    return;
  }

  // C) Activos Estáticos (/assets/*, scripts, estilos, fuentes): Cache-First con Network Fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_STATIC_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
    })
  );
});
