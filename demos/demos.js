// Base compartilhada das páginas de demo (demos/*): idioma, textos, formatação e estatísticas.
// Cada página chama Demo.setup(textos, render) com os textos nos 8 idiomas.
window.Demo = (() => {
  const htmlLang = { en: "en", pt: "pt-BR", es: "es", fr: "fr", it: "it", de: "de", zh: "zh-CN", ru: "ru" };
  let texts = {};
  let lang = "en";

  const detectLang = () => {
    const fromUrl = new URLSearchParams(location.search).get("lang");
    if (htmlLang[fromUrl]) return fromUrl;
    try {
      const stored = localStorage.getItem("lang");
      if (htmlLang[stored]) return stored;
    } catch {
      /* navegação privada */
    }
    return "en";
  };

  const t = (key, vars = {}) =>
    (texts[lang]?.[key] ?? texts.en[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");

  const applyTexts = () => {
    document.documentElement.lang = htmlLang[lang];
    document.querySelectorAll("[data-t]").forEach((el) => (el.innerHTML = t(el.dataset.t)));
    document.querySelectorAll("[data-t-content]").forEach((el) => el.setAttribute("content", t(el.dataset.tContent)));
    document.querySelectorAll("[data-t-placeholder]").forEach((el) => el.setAttribute("placeholder", t(el.dataset.tPlaceholder)));
    document.querySelectorAll("[data-t-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.tAria)));
    const select = document.querySelector("[data-lang]");
    if (select) select.value = lang;
  };

  const setup = (pageTexts, render) => {
    texts = pageTexts;
    lang = detectLang();
    applyTexts();
    document.querySelector("[data-lang]")?.addEventListener("change", (event) => {
      lang = event.target.value;
      try {
        localStorage.setItem("lang", lang);
      } catch {
        /* navegação privada */
      }
      applyTexts();
      render?.();
    });
  };

  const locale = () => htmlLang[lang];
  const fmtDate = (iso, options = { day: "2-digit", month: "short", year: "numeric" }) =>
    new Intl.DateTimeFormat(locale(), options).format(new Date(`${iso}T12:00:00`));
  const fmtNum = (value, digits = 2) =>
    new Intl.NumberFormat(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  const fmtPct = (value, sign = false) =>
    new Intl.NumberFormat(locale(), { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: sign ? "exceptZero" : "auto" }).format(value / 100);
  const track = (path, title) => window.goatcounter?.count?.({ path, title, event: true });
  const escape = (text) => String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  return { setup, t, locale, fmtDate, fmtNum, fmtPct, track, escape, get lang() { return lang; } };
})();
