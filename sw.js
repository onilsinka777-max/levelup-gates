/* LevelUp «Врата» — service worker: opens instantly, works offline, keeps the camera models after the first download.
   index.html: network first (updates arrive), cache as fallback. Everything else: cache first. */
const V="a1fab3f48f", CORE="gates-core-"+V, RUN="gates-run-v1";
const PRE=["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png","./apple-touch-icon.png","./audio/amb.mp3","./audio/raid.mp3"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(CORE).then(c=>Promise.all(PRE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting())); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("gates-core-")&&k!==CORE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{ const r=e.request; if(r.method!=="GET") return; const u=new URL(r.url);
  // the page itself: fresh when online, cached when not
  if(r.mode==="navigate"||(u.origin===location.origin&&/\/(index\.html)?$/.test(u.pathname))){
    e.respondWith(fetch(r).then(res=>{ const cp=res.clone(); caches.open(CORE).then(c=>c.put("./index.html",cp)); return res; }).catch(()=>caches.match("./index.html"))); return; }
  // config and the live world server: always network
  if(u.pathname.endsWith("config.json")||u.search.includes("p=/api")||u.pathname.includes("/api/")) return;
  // camera models, wasm, fonts, map tiles: cache first
  const heavy=/cdn\.jsdelivr\.net|storage\.googleapis\.com|fonts\.(googleapis|gstatic)\.com|tiles\.openfreemap\.org/.test(u.host)||u.origin===location.origin;
  if(!heavy) return;
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{ if(res.ok||res.type==="opaque"){ const cp=res.clone(); caches.open(u.origin===location.origin?CORE:RUN).then(c=>c.put(r,cp)); } return res; }))); });
