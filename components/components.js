// Componentes da interface (Web Components nativos, sem framework e sem build), usados no site,
// nas demos, na página de vagas e na 404:
//   <site-logo size="34">   logo "E." animado, nas cores do tema
//   <theme-toggle>          botão que alterna os temas Amazônia (padrão) e Editorial
(() => {
  /* ---------- <site-logo> ---------- */

  // Cada logo recebe ids próprios nos degradês (vários logos na mesma página não se confundem).
  let logoCount = 0;
  const logoSvg = (id, size) =>
    `<svg class="logo" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--logo-bg1)"/><stop offset="1" style="stop-color:var(--logo-bg2)"/></linearGradient><linearGradient id="${id}-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--logo-edge1)"/><stop offset="1" style="stop-color:var(--logo-edge2)"/></linearGradient><linearGradient id="${id}-letter" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--logo-letter1)"/><stop offset="0.55" style="stop-color:var(--logo-letter2)"/><stop offset="1" style="stop-color:var(--logo-letter3)"/></linearGradient><radialGradient id="${id}-node" cx=".35" cy=".35" r=".75"><stop offset="0" style="stop-color:var(--logo-node1)"/><stop offset="0.55" style="stop-color:var(--logo-node2)"/><stop offset="1" style="stop-color:var(--logo-node3)"/></radialGradient><radialGradient id="${id}-shine" cx=".2" cy=".1" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect x="2" y="2" width="60" height="60" rx="16" fill="url(#${id}-bg)" stroke="url(#${id}-edge)" stroke-width="2.5"/><rect x="3.5" y="3.5" width="57" height="57" rx="14.5" fill="url(#${id}-shine)"/><path class="logo-e" d="M17 46.5V17.5h19M17 32h14M17 46.5h19" fill="none" stroke="url(#${id}-letter)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" pathLength="100"/><circle class="logo-ring" cx="49" cy="46.5" r="7" fill="none" stroke-width="1.6"/><circle class="logo-node" cx="49" cy="46.5" r="4.4" fill="url(#${id}-node)"/></svg>`;

  class SiteLogo extends HTMLElement {
    connectedCallback() {
      if (this.firstChild) return;
      const size = Number(this.getAttribute("size")) || 34;
      this.style.width = this.style.height = `${size}px`;
      this.innerHTML = logoSvg(`lg${(logoCount += 1)}`, size);
    }
  }

  /* ---------- <theme-toggle> ---------- */

  const THEMES = ["amazonia", "editorial"];
  const THEME_COLORS = { amazonia: "#06100b", editorial: "#e1dbd0" };
  const LABELS = {
    en: ["Amazon", "Editorial", "Theme: {current}. Switch to {next}"],
    pt: ["Amazônia", "Editorial", "Tema: {current}. Mudar para {next}"],
    es: ["Amazonia", "Editorial", "Tema: {current}. Cambiar a {next}"],
    fr: ["Amazonie", "Éditorial", "Thème : {current}. Passer à {next}"],
    it: ["Amazzonia", "Editoriale", "Tema: {current}. Passa a {next}"],
    de: ["Amazonien", "Editorial", "Design: {current}. Zu {next} wechseln"],
    zh: ["亚马逊", "编辑风", "主题：{current}。切换到{next}"],
    ru: ["Амазония", "Редакционный", "Тема: {current}. Переключить на {next}"],
  };
  const currentTheme = () => (document.documentElement.dataset.theme === "editorial" ? "editorial" : "amazonia");
  const pageLang = () => (document.documentElement.lang || "en").slice(0, 2);

  class ThemeToggle extends HTMLElement {
    connectedCallback() {
      if (this.button) return;
      this.innerHTML =
        '<button class="theme-toggle" type="button" data-theme-toggle><span class="theme-swatch" aria-hidden="true"></span><span class="theme-name"></span></button>';
      this.button = this.querySelector("button");
      this.button.addEventListener("click", () => this.toggle());
      this.refresh = () => this.update();
      document.addEventListener("languagechange", this.refresh);
      document.addEventListener("themechange", this.refresh);
      this.update();
    }

    disconnectedCallback() {
      document.removeEventListener("languagechange", this.refresh);
      document.removeEventListener("themechange", this.refresh);
    }

    update() {
      const [amazonia, editorial, label] = LABELS[pageLang()] ?? LABELS.en;
      const names = { amazonia, editorial };
      const theme = currentTheme();
      const next = THEMES.find((name) => name !== theme);
      this.querySelector(".theme-name").textContent = names[theme];
      this.button.setAttribute("aria-label", label.replace("{current}", names[theme]).replace("{next}", names[next]));
    }

    toggle() {
      const next = THEMES.find((name) => name !== currentTheme());
      document.documentElement.dataset.theme = next;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[next]);
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* navegação privada: vale só nesta visita */
      }
      document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } }));
    }
  }

  customElements.define("site-logo", SiteLogo);
  customElements.define("theme-toggle", ThemeToggle);
})();
