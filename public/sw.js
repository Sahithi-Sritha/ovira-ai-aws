// Ovira AI — Custom Service Worker (No npm packages)
const CACHE_NAME = 'ovira-ai-v1';
const OFFLINE_URL = '/offline.html';

// Pre-cache ONLY predictable static files (NOT /_next/static/* which has hashed names)
const PRECACHE_ASSETS = [
    OFFLINE_URL,
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/icon-maskable-192x192.png',
    '/icons/icon-maskable-512x512.png',
    '/icons/apple-touch-icon.png',
];

// ─── Install: Pre-cache essential static assets ───
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching offline assets');
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

// ─── Activate: Clean up old caches ───
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            )
        )
    );
    self.clients.claim();
});

// ─── Fetch: Route requests to the appropriate strategy ───
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and non-HTTP(S) protocols
    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    // 1) API Calls (/api/*) → Network-First, fall back to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // 2) Next.js Static Assets & Images → Cache-First (Runtime Caching)
    if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/images/') || url.pathname.startsWith('/icons/')) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // 3) Navigation Requests (HTML pages) → Network-First with offline fallback
    if (request.mode === 'navigate') {
        event.respondWith(navigationHandler(request));
        return;
    }

    // 4) Everything else → Cache-First
    event.respondWith(cacheFirst(request));
});

// ─── Strategy: Network-First ───
// Try network, if it fails serve from cache (good for API data)
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        const cached = await caches.match(request);
        return cached || new Response(
            JSON.stringify({ success: false, error: 'Offline', message: 'You are currently offline.' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// ─── Strategy: Cache-First ───
// Serve from cache if available, otherwise fetch from network and cache it
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // For non-critical assets, just return a basic offline response
        return new Response('', { status: 408 });
    }
}

// ─── Strategy: Navigation Handler ───
// Network-first for pages, offline.html fallback if fully offline
async function navigationHandler(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // Try serving the cached version of the page first
        const cached = await caches.match(request);
        if (cached) return cached;

        // Last resort: serve the offline fallback page
        return caches.match(OFFLINE_URL);
    }
}
