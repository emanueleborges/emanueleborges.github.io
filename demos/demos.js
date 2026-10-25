// Base compartilhada das páginas de demo (demos/*): idioma, textos, formatação e estatísticas.
// Cada página chama Demo.setup(textos, render) com os textos em todos os idiomas do site. Nos textos, {nome} e
// {nomeCompleto} vêm do perfil (data/perfil.json), e o título da aba ganha " — <nome completo>" (não repita nos textos).
// Dentro do modal do portfólio (?embed=1, demo-modal.js): sem cabeçalho nem "Voltar ao portfólio",
// e links para o resto do site abrem na janela principal, não dentro do modal.
if (new URLSearchParams(location.search).has("embed") && window.top !== window) {
  document.documentElement.classList.add("is-embedded");
  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest?.("a[href]");
      if (!link || link.target) return;
      const url = new URL(link.href, location.href);
      if (url.origin === location.origin && !url.pathname.startsWith(location.pathname)) link.target = "_top";
    },
    true,
  );
}

export const Demo = (() => {
  const htmlLang = Object.fromEntries(Object.entries(globalThis.IDIOMAS).map(([code, idioma]) => [code, idioma.html])); // idiomas.js
  let texts = {};
  let lang = "en";

  const { nome, nomeCompleto } = globalThis.PERFIL;
  const t = (key, vars = {}) =>
    (texts[lang]?.[key] ?? texts.en[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => ({ nome, nomeCompleto, ...vars })[name] ?? "");

  const applyTexts = () => {
    document.documentElement.lang = htmlLang[lang];
    document.querySelectorAll("[data-t]").forEach((el) => (el.innerHTML = t(el.dataset.t)));
    document.querySelectorAll("[data-t-content]").forEach((el) => el.setAttribute("content", t(el.dataset.tContent)));
    document.querySelectorAll("[data-t-placeholder]").forEach((el) => el.setAttribute("placeholder", t(el.dataset.tPlaceholder)));
    document.querySelectorAll("[data-t-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.tAria)));
    document.title = `${t("meta.title")} — ${nomeCompleto}`;
    const select = document.querySelector("[data-lang]");
    if (select) select.value = lang;
  };

  // Rótulos comuns a todas as páginas (a página pode sobrescrever): seção "Estudo de caso" das demos.
  const COMUNS = {
    en: { "caso.titulo": "Case study", "caso.lp": "Problem", "caso.ls": "Solution", "caso.lr": "Result", "caso.lm": "What I'd change" },
    pt: { "caso.titulo": "Estudo de caso", "caso.lp": "Problema", "caso.ls": "Solução", "caso.lr": "Resultado", "caso.lm": "O que eu mudaria" },
    es: { "caso.titulo": "Caso de estudio", "caso.lp": "Problema", "caso.ls": "Solución", "caso.lr": "Resultado", "caso.lm": "Qué cambiaría" },
  };

  const setup = (pageTexts, render) => {
    texts = Object.fromEntries(Object.entries(pageTexts).map(([code, page]) => [code, { ...COMUNS[code], ...page }]));
    lang = window.IDIOMA_INICIAL; // ?lang=, o salvo ou o padrão (components/boot.js)
    applyTexts();
    document.dispatchEvent(new CustomEvent("languagechange"));
    document.querySelector("[data-lang]")?.addEventListener("change", (event) => {
      lang = event.target.value;
      try {
        localStorage.setItem("lang", lang);
      } catch {
        /* navegação privada */
      }
      applyTexts();
      document.dispatchEvent(new CustomEvent("languagechange"));
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
  const escape = (text) => String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  return { setup, t, locale, fmtDate, fmtNum, fmtPct, escape, get lang() { return lang; } };
})();
