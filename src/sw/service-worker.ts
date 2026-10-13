/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME_MODELS = 'dhse-models-v2';
const CACHE_NAME_SHELL = 'dhse-shell-v2';

self.addEventListener('install', (event: ExtendableEvent) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME_MODELS && k !== CACHE_NAME_SHELL) {
            return caches.delete(k);
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // Model weights / ONNX shards: Cache-First
  if (url.pathname.startsWith('/models/')) {
    event.respondWith(
      caches.open(CACHE_NAME_MODELS).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const res = await fetch(event.request);
        if (res.status === 200) {
          cache.put(event.request, res.clone());
        }
        return res;
      })
    );
    return;
  }

  // App shell: Stale-While-Revalidate
  if (
    event.request.destination === 'document' ||
    event.request.destination === 'script' ||
    event.request.destination === 'style'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME_SHELL).then(async (cache) => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request)
          .then((res) => {
            if (res.status === 200) {
              cache.put(event.request, res.clone());
            }
            return res;
          })
          .catch(() => undefined);
        const response = cached || (await fetchPromise);
        return response || new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // License and API endpoints: Network-Only
  event.respondWith(fetch(event.request));
});

export {};
