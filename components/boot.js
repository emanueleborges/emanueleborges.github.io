// Roda no <head>, antes da pintura (script síncrono): aplica o tema — ?theme= ou o salvo, senão o
// padrão de data/temas.json — e decide o idioma da página (window.IDIOMA_INICIAL). A página inicial tem uma versão
// por idioma (<html data-idioma>): ?lang= e, na raiz, a última escolha salva levam à versão certa.
(function () {
  // gerado: temas (não edite aqui: data/temas.json + node scripts/gerar-secoes.mjs)
  var TEMAS = (window.TEMAS = {"padrao":"amazonia","intensidade":{"min":0.3,"max":1.7,"passo":0.05,"escurecer":0.8},"temas":{"amazonia":{"nome":{"en":"Amazon","pt":"Amazônia","es":"Amazonia"},"fundo":"#050f14"},"editorial":{"nome":{"en":"Editorial","pt":"Editorial","es":"Editorial"},"fundo":"#0b0f19"}}});
  // /gerado: temas
  var raiz = new URL("../", document.currentScript.src);
  window.RAIZ = raiz.href; // raiz do site, para montar endereços vindos de qualquer pasta
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
  var padrao = Object.keys(idiomas)[0];
  var pedido = tem(idiomas, params.get("lang")) ? params.get("lang") : null;
  var lang = pedido || stored("lang");
  lang = tem(idiomas, lang) ? lang : padrao;
  // Página inicial: o endereço manda. Visitar uma versão traduzida conta como escolha (as demos seguem o idioma salvo).
  var daPagina = document.documentElement.getAttribute("data-idioma");
  if (daPagina) {
    var alvo = pedido || (daPagina === padrao ? lang : daPagina);
    if (pedido || daPagina !== padrao) {
      try {
        localStorage.setItem("lang", alvo);
      } catch (e) {
        /* navegação privada: segue sem salvar */
      }
    }
    if (alvo !== daPagina) {
      params.delete("lang");
      var resto = params.toString();
      location.replace(new URL(alvo === padrao ? "" : alvo + "/", raiz).href + (resto ? "?" + resto : "") + location.hash);
    }
    lang = daPagina;
  }
  window.IDIOMA_INICIAL = lang; // idioma da página: script.js, demos/demos.js
  document.documentElement.dataset.theme = theme;
  // Intensidade das cores salva pela barra ao lado do botão de tema (limites em data/temas.json).
  var forca = parseFloat(stored("intensidade"));
  if (forca >= TEMAS.intensidade.min && forca <= TEMAS.intensidade.max) document.documentElement.style.setProperty("--intensidade", forca);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = TEMAS.temas[theme].fundo;
})();
