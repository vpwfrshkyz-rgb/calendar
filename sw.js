// 오프라인용: 앱 파일을 휴대폰에 보관해 두고, 인터넷이 되면 새 버전으로 바꾼다.
const CACHE = 'mycal-v5';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // 앱 화면: 인터넷이 되면 최신 버전, 안 되면 보관해 둔 버전 (3초 넘으면 보관본)
    e.respondWith(new Promise(resolve => {
      let done = false;
      const fallback = () => caches.match('./index.html').then(r => r || caches.match('./')).then(r => { if (!done && r) { done = true; resolve(r); } });
      const t = setTimeout(fallback, 3000);
      fetch(req).then(res => {
        clearTimeout(t);
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
        if (!done) { done = true; resolve(res); }
      }).catch(() => { clearTimeout(t); fallback(); });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
