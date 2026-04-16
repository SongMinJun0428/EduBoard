const CACHE_NAME = 'eduboard-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/js/index.js',
  '/eduboard_logo_premium.png',
  '/manifest.json'
];

// 서비스 워커 설치 및 리소스 캐싱
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 네트워크 요청 제어 (네트워크 우선, 실패 시 캐시)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
