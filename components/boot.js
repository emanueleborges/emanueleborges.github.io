// Roda no <head>, antes da pintura (script síncrono): aplica o tema — ?theme= ou o salvo, padrão
// "amazonia" — e configura o GoatCounter para contar só o caminho (sem ?lang=, ?theme=…), mantendo a
// origem (?ref=, utm_*). Uma página pode definir o seu próprio window.goatcounter antes deste script (ex.: 404).
(function () {
  var theme;
  try {
    theme = new URLSearchParams(location.search).get("theme") || localStorage.getItem("theme");
  } catch (e) {
    /* navegação privada */
  }
  theme = theme === "editorial" ? "editorial" : "amazonia";
  document.documentElement.dataset.theme = theme;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === "editorial" ? "#f6f3ec" : "#06100b";
  window.goatcounter = window.goatcounter || {
    path: function (p) {
      return p.split("?")[0].replace(/index\.html$/, "") || "/";
    },
  };
})();
