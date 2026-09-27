// Bump this on every deploy so the browser installs a fresh service worker
// and the new app shell replaces the old cache automatically.
var CACHE_VERSION = "v1";
var CACHE_NAME = "currency-converter-" + CACHE_VERSION;

var APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/css/style.css",
  "./assets/js/index.js",
  "./assets/js/register-sw.js",
  "./assets/icons/icon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(APP_SHELL);
      })
      .then(function () {
        // Activate the new service worker as soon as it's installed instead
        // of waiting for all tabs to close — that's what gives us
        // auto-update on next launch rather than requiring a manual reload.
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key.indexOf("currency-converter-") === 0 && key !== CACHE_NAME;
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Live exchange rates must always hit the network — never cache them.
  if (url.hostname.indexOf("er-api.com") !== -1) return;

  // Network-first for the app shell so a deployed update is picked up as
  // soon as the device is online, falling back to cache when offline.
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, copy);
        });
        return response;
      })
      .catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match("./index.html");
        });
      })
  );
});
