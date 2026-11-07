/* Banco de pruebas del taller — service worker
   La página (HTML) se pide SIEMPRE fresca a la red cuando hay conexión
   (así cada publicación se ve al abrir, sin reinstalar el acceso);
   los iconos y el manifiesto se sirven de la caché y se renuevan detrás.
   Sin conexión, se muestra la última copia guardada. */
var CACHE = "banco-v1";

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return c.addAll(["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"]).catch(function(){});
  }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var url = new URL(e.request.url);
  if (e.request.mode === "navigate" || url.pathname.endsWith("index.html") || url.pathname.endsWith("version.json")){
    e.respondWith(
      fetch(e.request, { cache: "no-store" }).then(function(r){
        var copia = r.clone();
        caches.open(CACHE).then(function(c){ c.put("index.html", copia); });
        return r;
      }).catch(function(){
        return caches.match("index.html");
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(enCache){
      var red = fetch(e.request).then(function(r){
        var copia = r.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copia); });
        return r;
      }).catch(function(){ return enCache; });
      return enCache || red;
    })
  );
});
