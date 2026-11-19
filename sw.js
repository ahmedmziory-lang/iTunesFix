const CACHE_NAME = 'itunesfix-shell-v1';
const SHELL_URLS = [
  new URL('./', self.registration.scope).href,
  new URL('index.html', self.registration.scope).href,
  new URL('manifest.webmanifest', self.registration.scope).href,
  new URL('exam-icon.svg', self.registration.scope).href
];
const SCOPE_URL = new URL(self.registration.scope);
const SHELL_PATHS = new Set([
  SCOPE_URL.pathname,
  new URL('index.html', SCOPE_URL).pathname,
  new URL('manifest.webmanifest', SCOPE_URL).pathname,
  new URL('exam-icon.svg', SCOPE_URL).pathname
]);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names
        .filter(name => name.startsWith('itunesfix-shell-') && name !== CACHE_NAME)
        .map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== SCOPE_URL.origin || !SHELL_PATHS.has(url.pathname)) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        event.waitUntil(cache.put(request, response.clone()).catch(error => {
          console.error('تعذر تحديث نسخة الواجهة المخزنة:', error);
        }));
      }
      return response;
    } catch (error) {
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      throw error;
    }
  })());
});
