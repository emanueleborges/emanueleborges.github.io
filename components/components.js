// Componentes da interface (Web Components nativos, sem framework e sem build), usados no site,
// nas demos, na página de vagas e na 404:
//   <site-logo size="34">   logo "E." animado, nas cores do tema
//   <theme-toggle>          botão que alterna os temas Amazônia (padrão) e Editorial
//   <sound-toggle>          liga/desliga os cliques sonoros e a vibração da interface (padrão: ligado)
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

  /* ---------- Sons e vibração da interface ---------- */

  // Cliques de teclado mecânico ao digitar e "bipes" curtos de interface ao clicar em botões e links,
  // sintetizados com Web Audio (sem arquivos de áudio); em celulares, uma vibração curta acompanha o clique.
  // A preferência fica salva em localStorage ("sound": "on" | "off").
  const readSound = () => {
    try {
      return localStorage.getItem("sound") !== "off";
    } catch {
      return true;
    }
  };
  let soundOn = readSound();
  let audio;
  let noise;

  const context = () => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audio) {
      audio = new Ctx();
      // 50 ms de ruído branco, reaproveitado por todos os cliques.
      noise = audio.createBuffer(1, Math.round(audio.sampleRate * 0.05), audio.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    }
    if (audio.state === "suspended") audio.resume();
    return audio;
  };

  // Estalo de ruído filtrado: o "tac" da tecla.
  const burst = (ctx, t, { freq, q = 1.2, gain, decay }) => {
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    src.buffer = noise;
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = q;
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(filter).connect(amp).connect(ctx.destination);
    src.start(t);
    src.stop(t + decay + 0.01);
  };

  // Tom curto: o corpo da tecla (grave) ou o bipe da interface (agudo).
  const tone = (ctx, t, { type = "sine", from, to = from, gain, decay }) => {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + decay);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + decay + 0.01);
  };

  const jitter = (value, spread) => value * (1 + (Math.random() - 0.5) * spread);
  let lastSound = 0;

  const play = (kind) => {
    if (!soundOn) return;
    const now = performance.now();
    if (now - lastSound < 28) return; // evita "metralhadora" em teclas repetidas
    lastSound = now;
    const ctx = context();
    if (!ctx) return;
    const t = ctx.currentTime;
    if (kind === "tick") {
      burst(ctx, t, { freq: jitter(4200, 0.3), gain: 0.035, decay: 0.018 });
    } else if (kind === "key") {
      burst(ctx, t, { freq: jitter(3600, 0.3), gain: 0.09, decay: 0.03 });
      tone(ctx, t, { from: jitter(170, 0.2), to: 90, gain: 0.05, decay: 0.025 });
    } else if (kind === "on") {
      tone(ctx, t, { type: "triangle", from: 900, to: 1500, gain: 0.04, decay: 0.07 });
      tone(ctx, t + 0.06, { type: "triangle", from: 1500, to: 2200, gain: 0.035, decay: 0.08 });
    } else {
      burst(ctx, t, { freq: jitter(5200, 0.2), q: 2, gain: 0.07, decay: 0.02 });
      tone(ctx, t + 0.005, { type: "square", from: jitter(1900, 0.1), to: 1300, gain: 0.018, decay: 0.045 });
    }
  };

  // Usado pelo chat (efeito de digitação): window.portfolioSound.play("tick").
  window.portfolioSound = { play };

  const buzz = (ms) => {
    if (soundOn && navigator.vibrate && matchMedia("(pointer: coarse)").matches) navigator.vibrate(ms);
  };

  const CLICKABLE =
    'a[href], button, select, summary, label, [role="button"], [role="tab"], [role="menuitem"], input[type="checkbox"], input[type="radio"], input[type="submit"], input[type="button"], input[type="range"]';
  const TYPING = 'textarea, input:not([type]), input[type="text"], input[type="search"], input[type="email"], input[type="url"], input[type="tel"], input[type="number"]';

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest(CLICKABLE) : null;
    if (!target || target.closest("[data-sound-toggle]")) return;
    play("click");
    buzz(8);
  });

  document.addEventListener("keydown", (event) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (!(event.target instanceof Element) || !event.target.matches(TYPING)) return;
    if (event.key.length === 1 || ["Backspace", "Delete", "Enter"].includes(event.key)) play("key");
  });

  /* ---------- <sound-toggle> ---------- */

  const SOUND_LABELS = {
    en: "Interface sounds",
    pt: "Sons da interface",
    es: "Sonidos de la interfaz",
    fr: "Sons de l’interface",
    it: "Suoni dell’interfaccia",
    de: "Oberflächenklänge",
    zh: "界面音效",
    ru: "Звуки интерфейса",
  };
  const ICON_ON =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18.2 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
  const ICON_OFF =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';

  class SoundToggle extends HTMLElement {
    connectedCallback() {
      if (this.button) return;
      this.innerHTML = '<button class="sound-toggle" type="button" data-sound-toggle></button>';
      this.button = this.querySelector("button");
      this.button.addEventListener("click", () => this.toggle());
      this.refresh = () => this.update();
      document.addEventListener("languagechange", this.refresh);
      document.addEventListener("soundchange", this.refresh);
      this.update();
    }

    disconnectedCallback() {
      document.removeEventListener("languagechange", this.refresh);
      document.removeEventListener("soundchange", this.refresh);
    }

    update() {
      const label = SOUND_LABELS[pageLang()] ?? SOUND_LABELS.en;
      this.button.innerHTML = soundOn ? ICON_ON : ICON_OFF;
      this.button.setAttribute("aria-pressed", String(soundOn));
      this.button.setAttribute("aria-label", label);
      this.button.title = label;
    }

    toggle() {
      soundOn = !soundOn;
      try {
        localStorage.setItem("sound", soundOn ? "on" : "off");
      } catch {
        /* navegação privada: vale só nesta visita */
      }
      if (soundOn) {
        play("on");
        buzz(12);
      }
      document.dispatchEvent(new CustomEvent("soundchange", { detail: { on: soundOn } }));
    }
  }

  customElements.define("site-logo", SiteLogo);
  customElements.define("theme-toggle", ThemeToggle);
  customElements.define("sound-toggle", SoundToggle);
})();
