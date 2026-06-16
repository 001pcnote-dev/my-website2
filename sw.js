const CACHE_NAME = 'smartprint-v2';

// キャッシュするローカルファイルの一覧
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // JSライブラリ
  './js/tailwindcss.js',
  './js/marked.min.js',
  './js/purify.min.js',
  './js/html2pdf.bundle.min.js',
  // Font Awesome (CSSとアイコンフォント)
  './css/all.min.css',
  './webfonts/fa-solid-900.woff2',
  './webfonts/fa-regular-400.woff2',
  './webfonts/fa-brands-400.woff2',
  // 日本語フォント (.ttfファイルを指定)
  './fonts/NotoSansJP-Regular.ttf',
  './fonts/NotoSansJP-Bold.ttf',
  './fonts/NotoSerifJP-Regular.ttf'
];

// インストール時に静的アセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 古いキャッシュの削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチ戦略：完全にローカル（オフライン）優先
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // キャッシュがあればそれを即座に返す（オフラインでも動く）
        // オンライン時はバックグラウンドで最新版を確認・更新する
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // キャッシュにない場合はネットワークから取得
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) return networkResponse;
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {});
    })
  );
});