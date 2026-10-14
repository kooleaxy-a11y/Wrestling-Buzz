/* Wrestling Buzz service worker: lets the site install as an app and open even with a weak connection.
   It always tries the network first, so new questions and updates show up as soon as you're online. */
var CACHE = "wb-v2";
var CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var r = e.request;
  if(r.method!=="GET") return;
  var u = new URL(r.url);
  if(u.origin!==location.origin) return;            /* fonts, forms and WhatsApp go straight to the network */
  e.respondWith(
    fetch(r).then(function(res){
      if(res && res.ok){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(r, copy); }); }
      return res;
    }).catch(function(){
      return caches.match(r).then(function(m){ return m || caches.match("index.html"); });
    })
  );
});
