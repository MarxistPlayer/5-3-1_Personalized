/* 5/3/1 SST — service worker. Khi cập nhật app, tăng số VERSION bên dưới. */
const VERSION = "sst531-v1";
const CORE = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Trang chính: ưu tiên mạng để nhận bản mới, mất mạng thì dùng bản đã lưu
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); return res;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  // Font Google: lưu lại để dùng khi offline
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(VERSION).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
      c.put(req, res.clone()); return res; }))).catch(() => caches.match(req)));
    return;
  }
  // Các file khác của app: dùng bản đã lưu, không có thì tải
  if (url.origin === self.location.origin) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
  }
});
