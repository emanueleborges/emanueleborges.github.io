// Traduções do site e do currículo: um arquivo por idioma em i18n/<idioma>.js (window.I18N.<idioma>).
// pt (texto original do HTML e reserva para chaves ausentes) e en (idioma padrão) vêm na página;
// os outros idiomas só são baixados quando o visitante escolhe um: I18N.load("fr") → Promise<boolean>.
(() => {
  const I18N = (window.I18N = window.I18N || {});
  const LANGS = ["pt", "en", "es", "fr", "it", "de", "zh", "ru"];
  const base = new URL("i18n/", document.currentScript.src);
  const pending = {};

  const load = (lang) => {
    if (I18N[lang]) return Promise.resolve(true);
    if (!LANGS.includes(lang)) return Promise.resolve(false);
    pending[lang] ??= new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = new URL(`${lang}.js?v=20261011214315`, base).href;
      script.onload = () => resolve(Boolean(I18N[lang]));
      // Sem rede: tenta de novo na próxima escolha do idioma.
      script.onerror = () => {
        delete pending[lang];
        script.remove();
        resolve(false);
      };
      document.head.append(script);
    });
    return pending[lang];
  };

  // Não enumerável: Object.keys(I18N) continua listando só os idiomas.
  Object.defineProperty(I18N, "load", { value: load });
})();
