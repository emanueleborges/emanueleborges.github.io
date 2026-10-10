// Service worker: deixa o portfólio instalável e disponível sem internet.
// - Página: rede primeiro (sempre a versão mais nova); sem rede, a última cópia salva.
// - CSS, JS e imagens do próprio site: cópia salva primeiro, atualizada em segundo plano.
// - Outros domínios (IA, GitHub, fontes, estatísticas) não passam por aqui.
const CACHE = "portfolio-v1";
const PRECACHE = [
  "./",
  "styles.css",
  "i18n.js",
  "script.js",
  "api.js",
  "chat.js",
  "contact.js",
  "logo.svg",
  "favicon.svg",
  "emanuel-borges.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Guarda a resposta e apaga as versões antigas do mesmo arquivo (?v= diferente).
const store = async (request, response) => {
  if (!response.ok) return;
  const cache = await caches.open(CACHE);
  const path = new URL(request.url).pathname;
  const old = await cache.keys();
  await Promise.all(
    old.filter((key) => new URL(key.url).pathname === path && key.url !== request.url).map((key) => cache.delete(key)),
  );
  await cache.put(request, response);
};

const fromCache = (request) => caches.match(request).then((hit) => hit || caches.match(request, { ignoreSearch: true }));

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          event.waitUntil(store(request, response.clone()));
          return response;
        })
        .catch(() => fromCache(request).then((hit) => hit || caches.match("./"))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request).then((response) => {
        event.waitUntil(store(request, response.clone()));
        return response;
      });
      if (hit) {
        event.waitUntil(network.catch(() => {}));
        return hit;
      }
      return network.catch(() => fromCache(request));
    }),
  );
});
