(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) return;

  var refreshing = false;

  // A new SW activates itself (skipWaiting) as soon as it's installed; once
  // it takes control of this page we reload once so the user gets the new
  // version automatically, without a manual "update available" prompt.
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("./sw.js")
      .then(function (registration) {
        // Check for a newer sw.js every time the app is opened/resumed.
        registration.update();
        document.addEventListener("visibilitychange", function () {
          if (document.visibilityState === "visible") registration.update();
        });
      })
      .catch(function () {
        // Offline-first PWA features are optional — the app still works
        // as a regular site if the service worker fails to register.
      });
  });
})();
