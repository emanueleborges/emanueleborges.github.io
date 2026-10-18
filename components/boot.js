// Roda no <head>, antes da pintura (script síncrono): aplica o tema — ?theme= ou o salvo, padrão
// "amazonia" — e prepara o idioma pedido/salvo para pré-carregar sua tradução.
// Com data-i18n, já começa a baixar o arquivo do idioma salvo/pedido (pt e en vêm na própria página).
(function () {
  var boot = document.currentScript;
  var theme;
  try {
    theme = new URLSearchParams(location.search).get("theme") || localStorage.getItem("theme");
  } catch (e) {
    /* navegação privada */
  }
  theme = theme === "editorial" ? "editorial" : "amazonia";
  if (boot && boot.hasAttribute("data-i18n")) {
    var lang;
    try {
      lang = new URLSearchParams(location.search).get("lang") || localStorage.getItem("lang");
    } catch (e) {
      /* navegação privada */
    }
    if (/^(es|fr|it|de|zh|ru)$/.test(lang)) {
      var preload = document.createElement("link");
      preload.rel = "preload";
      preload.as = "script";
      preload.href = new URL("../i18n/" + lang + ".js", boot.src).href;
      document.head.appendChild(preload);
    }
  }
  document.documentElement.dataset.theme = theme;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === "editorial" ? "#e1dbd0" : "#050f14";
})();
