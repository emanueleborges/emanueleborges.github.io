// Roda no <head>, antes da pintura (script síncrono): aplica o tema — ?theme= ou o salvo, senão o
// padrão de data/temas.json — e decide o idioma da página (window.IDIOMA_INICIAL), pré-carregando a tradução.
// Com data-i18n, já começa a baixar o arquivo do idioma salvo/pedido (pt e en vêm na própria página).
(function () {
  // gerado: temas (não edite aqui: data/temas.json + node scripts/gerar-secoes.mjs)
  var TEMAS = (window.TEMAS = {"padrao":"amazonia","intensidade":{"min":0.3,"max":1.7,"passo":0.05,"escurecer":0.8},"temas":{"amazonia":{"nome":{"en":"Amazon","pt":"Amazônia","es":"Amazonia"},"fundo":"#050f14"},"editorial":{"nome":{"en":"Editorial","pt":"Editorial","es":"Editorial"},"fundo":"#0b0f19"}}});
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
  // Só chaves próprias: "constructor" ou "__proto__" na URL não contam como tema ou idioma.
  var tem = function (obj, key) {
    return key != null && Object.prototype.hasOwnProperty.call(obj, key);
  };
  var theme = tem(TEMAS.temas, params.get("theme")) ? params.get("theme") : stored("theme");
  theme = tem(TEMAS.temas, theme) ? theme : TEMAS.padrao;
  var idiomas = window.IDIOMAS;
  var lang = tem(idiomas, params.get("lang")) ? params.get("lang") : stored("lang");
  lang = tem(idiomas, lang) ? lang : Object.keys(idiomas)[0];
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
  // Abertura do index.html no celular (.splash, styles.css): uma vez por visita; some quando a página
  // termina de carregar, mas só depois de o logo acabar de se desenhar (o CSS a esconde sozinho em 8 s).
  var sessao = function (valor) {
    try {
      return valor ? sessionStorage.setItem("splash", "1") : sessionStorage.getItem("splash");
    } catch (e) {
      return null; // navegação privada
    }
  };
  if (sessao()) document.documentElement.classList.add("splash-visto");
  else {
    var inicio = Date.now();
    addEventListener("load", function () {
      setTimeout(function () {
        document.documentElement.classList.add("splash-fim");
        sessao(true);
      }, Math.max(0, 2000 - (Date.now() - inicio)));
    });
  }
})();
