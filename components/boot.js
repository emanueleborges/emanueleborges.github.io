// Roda no <head>, antes da pintura (script síncrono): aplica o tema — ?theme= ou o salvo, senão o
// padrão de data/temas.json — e decide o idioma da página (window.IDIOMA_INICIAL), pré-carregando a tradução.
// Com data-i18n, já começa a baixar o arquivo do idioma salvo/pedido (pt e en vêm na própria página).
(function () {
  // gerado: temas (não edite aqui: data/temas.json + node scripts/gerar-secoes.mjs)
  var TEMAS = (window.TEMAS = {"padrao":"amazonia","intensidade":{"min":0.3,"max":1.7,"passo":0.05,"escurecer":0.8},"temas":{"amazonia":{"nome":{"en":"Amazon","pt":"Amazônia","es":"Amazonia","fr":"Amazonie","it":"Amazzonia","de":"Amazonien","zh":"亚马逊","ru":"Амазония"},"fundo":"#050f14"},"editorial":{"nome":{"en":"Editorial","pt":"Editorial","es":"Editorial","fr":"Éditorial","it":"Editoriale","de":"Editorial","zh":"编辑风","ru":"Редакционный"},"fundo":"#0b0f19"}}});
  // /gerado: temas
  var boot = document.currentScript;
  var params = new URLSearchParams(location.search);
  // ?theme= / ?lang= na URL, senão a última escolha salva, senão o padrão (data/temas.json, idiomas.js).
  var stored = function (key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null; // navegação privada
    }
  };
  var theme = TEMAS.temas[params.get("theme")] ? params.get("theme") : stored("theme");
  theme = TEMAS.temas[theme] ? theme : TEMAS.padrao;
  var idiomas = window.IDIOMAS;
  var lang = idiomas[params.get("lang")] ? params.get("lang") : stored("lang");
  lang = idiomas[lang] ? lang : Object.keys(idiomas)[0];
  window.IDIOMA_INICIAL = lang; // idioma da página: script.js, demos/demos.js
  if (boot && boot.hasAttribute("data-i18n")) {
    // pt e en já vêm na página; os outros idiomas do site (idiomas.js) são pré-carregados.
    if (lang !== "pt" && lang !== "en") {
      var preload = document.createElement("link");
      preload.rel = "preload";
      preload.as = "script";
      preload.href = new URL("../i18n/" + lang + ".js", boot.src).href;
      document.head.appendChild(preload);
    }
  }
  document.documentElement.dataset.theme = theme;
  // Intensidade das cores salva pela barra ao lado do botão de tema (limites em data/temas.json).
  var forca = parseFloat(stored("intensidade"));
  if (forca >= TEMAS.intensidade.min && forca <= TEMAS.intensidade.max) document.documentElement.style.setProperty("--intensidade", forca);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = TEMAS.temas[theme].fundo;
})();
