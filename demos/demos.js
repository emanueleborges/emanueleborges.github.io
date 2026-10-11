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

  const track = (path, title) => window.goatcounter?.count?.({ path, title, event: true });

  // Tema (Amazônia padrão · Editorial): o inicial já foi aplicado no <head>; aqui fica o botão.
  const THEME_NAMES = {
    en: ["Amazon", "Editorial", "Theme: {current}. Switch to {next}"],
    pt: ["Amazônia", "Editorial", "Tema: {current}. Mudar para {next}"],
    es: ["Amazonia", "Editorial", "Tema: {current}. Cambiar a {next}"],
    fr: ["Amazonie", "Éditorial", "Thème : {current}. Passer à {next}"],
    it: ["Amazzonia", "Editoriale", "Tema: {current}. Passa a {next}"],
    de: ["Amazonien", "Editorial", "Design: {current}. Zu {next} wechseln"],
    zh: ["亚马逊", "编辑风", "主题：{current}。切换到{next}"],
    ru: ["Амазония", "Редакционный", "Тема: {current}. Переключить на {next}"],
  };
  const THEME_COLORS = { amazonia: "#06100b", editorial: "#f6f3ec" };
  const theme = () => (document.documentElement.dataset.theme === "editorial" ? "editorial" : "amazonia");
  const updateThemeButton = () => {
    const button = document.querySelector("[data-theme-toggle]");
    if (!button) return;
    const [amazonia, editorial, label] = THEME_NAMES[lang] ?? THEME_NAMES.en;
    const names = { amazonia, editorial };
    const next = theme() === "amazonia" ? "editorial" : "amazonia";
    button.querySelector("[data-theme-name]").textContent = names[theme()];
    button.setAttribute("aria-label", label.replace("{current}", names[theme()]).replace("{next}", names[next]));
  };
  const toggleTheme = () => {
    const next = theme() === "amazonia" ? "editorial" : "amazonia";
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[next]);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* navegação privada */
    }
    updateThemeButton();
    document.dispatchEvent(new CustomEvent("themechange"));
    track(`tema-${next}`, `Trocou o tema para ${next}`);
  };

  const setup = (pageTexts, render) => {
    texts = pageTexts;
    lang = detectLang();
    applyTexts();
    updateThemeButton();
    document.querySelector("[data-theme-toggle]")?.addEventListener("click", toggleTheme);
    document.querySelector("[data-lang]")?.addEventListener("change", (event) => {
      lang = event.target.value;
      try {
        localStorage.setItem("lang", lang);
      } catch {
        /* navegação privada */
      }
      applyTexts();
      updateThemeButton();
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

  // Mapa de cliques (como no site): "clique/<página>/<elemento>", com nomes fixos nos 8 idiomas.
  const pageArea = () => location.pathname.replace(/index\.html$/, "").replace(/^\/|\/$/g, "").replace(/\//g, "-") || "inicio";
  const kebab = (text) => String(text).replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest("a[href]");
      const button = event.target.closest("button, label.button");
      let label = null;
      if (link) {
        const href = link.getAttribute("href");
        if (link.closest(".evidence")) label = `evidencia/${href.split("#")[1] ?? "site"}`;
        else if (link.classList.contains("brand")) label = "logo";
        else if (href.includes("github.com")) label = "codigo";
        else if (href.includes("wikipedia.org")) label = "wikipedia";
        else if (href.startsWith("/cv/")) label = "curriculo";
        else if (href.includes("#contato")) label = "contato";
        else if (href === "/" || href.startsWith("/#") || href.startsWith("/?")) label = "voltar-portfolio";
        else label = "link";
      } else if (button) {
        label = `botao/${kebab(button.dataset.t || Object.keys(button.dataset)[0] || "sem-nome")}`;
      }
      if (label) track(`clique/${pageArea()}/${label}`, `Clique: ${pageArea()} › ${label}`);
    },
    { capture: true },
  );

  return { setup, t, locale, fmtDate, fmtNum, fmtPct, track, escape, get lang() { return lang; } };
})();
