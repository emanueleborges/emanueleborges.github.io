// Componentes da interface (Web Components nativos, sem framework e sem build), usados no site,
// nas demos, na página de vagas e na 404:
//   <site-logo size="34">   logo "E." animado, nas cores do tema
//   <theme-toggle>          botão que alterna os temas Amazônia (padrão) e Editorial
//   <sound-toggle>          liga/desliga os cliques sonoros e a vibração da interface (padrão: ligado)
//   links do GitHub         abrem num visualizador em modal (pastas, README e código) em vez de sair do site
//   outros links externos   (LinkedIn, WhatsApp, e-mail, sites) abrem um cartão em modal; o site só abre se pedido
//   [data-share]            "Compartilhar portfólio": QR code, link para copiar e atalhos de compartilhamento
//   <share-button>          ícone de compartilhar no cabeçalho (abre o mesmo modal)
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
  const THEME_COLORS = { amazonia: "#050f14", editorial: "#0b0f19" };
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

  /* ---------- Visualizador do GitHub ---------- */

  // Links para github.com/emanueleborges/... abrem num modal dentro do site, sem sair da página:
  // pastas, README/Markdown formatados e código. Sem o limite de 60 consultas/hora da API do GitHub:
  // a lista de arquivos vem do jsDelivr (data.jsdelivr.com), o conteúdo do raw.githubusercontent.com
  // e o Markdown é formatado no navegador (vendor/marked.min.js). A API do GitHub fica só como reserva
  // (repositório que o jsDelivr não serve). Outros donos, issues etc. continuam abrindo no GitHub.
  // Dentro de uma página embutida (modal das demos), o visualizador abre na janela principal.
  const GH_OWNER = "emanueleborges";
  const GH_LABELS = {
    en: ["Back", "Close", "GITHUB ↗", "Loading…", "Couldn't load this from GitHub right now.", "GitHub's hourly request limit was reached. Try again in a few minutes or open it on GitHub.", "Repositories"],
    pt: ["Voltar", "Fechar", "GITHUB ↗", "Carregando…", "Não foi possível carregar do GitHub agora.", "O limite de consultas por hora do GitHub foi atingido. Tente em alguns minutos ou abra no GitHub.", "Repositórios"],
    es: ["Volver", "Cerrar", "GITHUB ↗", "Cargando…", "No se pudo cargar desde GitHub ahora.", "Se alcanzó el límite de consultas por hora de GitHub. Inténtalo en unos minutos o ábrelo en GitHub.", "Repositorios"],
    fr: ["Retour", "Fermer", "GITHUB ↗", "Chargement…", "Impossible de charger depuis GitHub pour le moment.", "La limite horaire de requêtes GitHub est atteinte. Réessayez dans quelques minutes ou ouvrez-le sur GitHub.", "Dépôts"],
    it: ["Indietro", "Chiudi", "GITHUB ↗", "Caricamento…", "Impossibile caricare da GitHub in questo momento.", "Raggiunto il limite orario di richieste a GitHub. Riprova tra qualche minuto o aprilo su GitHub.", "Repository"],
    de: ["Zurück", "Schließen", "GITHUB ↗", "Wird geladen…", "Konnte gerade nicht von GitHub geladen werden.", "Das stündliche Anfragelimit von GitHub ist erreicht. Versuchen Sie es in ein paar Minuten erneut oder öffnen Sie es auf GitHub.", "Repositorys"],
    zh: ["返回", "关闭", "GITHUB ↗", "加载中…", "暂时无法从 GitHub 加载。", "已达到 GitHub 每小时请求上限。请几分钟后再试，或在 GitHub 上打开。", "仓库"],
    ru: ["Назад", "Закрыть", "GITHUB ↗", "Загрузка…", "Сейчас не удалось загрузить с GitHub.", "Достигнут почасовой лимит запросов к GitHub. Попробуйте через несколько минут или откройте на GitHub.", "Репозитории"],
  };
  const ghText = () => GH_LABELS[pageLang()] ?? GH_LABELS.en;

  // github.com/emanueleborges[/repo[/tree|blob/ref[/caminho]]] → { repo, ref, path }; o resto → null.
  const parseGithub = (href) => {
    let url;
    try {
      url = new URL(href, location.href);
    } catch {
      return null;
    }
    if (url.hostname !== "github.com") return null;
    const [owner, repo, kind, ref, ...rest] = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (owner?.toLowerCase() !== GH_OWNER || (kind && !["tree", "blob"].includes(kind)) || (kind && !ref)) return null;
    return { repo: repo ?? "", ref: ref ?? "", path: rest.join("/"), hash: url.hash };
  };
  const githubUrl = ({ repo, ref, path }) =>
    `https://github.com/${GH_OWNER}${repo ? `/${repo}` : ""}${repo && (ref || path) ? `/tree/${ref}${path ? `/${path}` : ""}` : ""}`;

  const ghCache = new Map();
  const ghFetch = (path, accept = "application/vnd.github+json") => {
    const key = `${accept} ${path}`;
    if (!ghCache.has(key)) {
      // Mesma URL com Accept diferente (JSON / HTML / texto): sem cache HTTP para não misturar as respostas.
      const json = accept.endsWith("github+json");
      const request = fetch(`https://api.github.com${path}`, { headers: { Accept: accept }, cache: json ? "default" : "no-store" }).then((response) => {
        if (!response.ok) throw Object.assign(new Error("github"), { status: response.status });
        return json ? response.json() : response.text();
      });
      ghCache.set(key, request);
      request.catch(() => ghCache.delete(key));
    }
    return ghCache.get(key);
  };
  const enc = (path) => path.split("/").map(encodeURIComponent).join("/");

  // Lista de repositórios: a mesma que os cards de projeto já guardaram na sessão (script.js);
  // senão a API; sem ela, os repositórios citados nos cards da página.
  let repoListPromise = null;
  const repoList = () => (repoListPromise ??= loadRepoList().catch((error) => ((repoListPromise = null), Promise.reject(error))));
  const loadRepoList = async () => {
    try {
      const cached = JSON.parse(sessionStorage.getItem("repos") ?? "null");
      if (Array.isArray(cached) && cached.length) return cached;
    } catch {
      /* sem sessionStorage */
    }
    try {
      return await ghFetch(`/users/${GH_OWNER}/repos?sort=pushed&per_page=100`);
    } catch (error) {
      const names = [...new Set([...document.querySelectorAll("[data-repo]")].map((link) => link.dataset.repo))];
      if (!names.length) throw error;
      return names.map((name) => ({ name, description: document.querySelector(`[data-repo="${name}"]`)?.closest(".project-card")?.querySelector("h3")?.textContent ?? "" }));
    }
  };
  const defaultBranch = async (repo) => {
    const known = (await repoList().catch(() => [])).find((item) => item.name === repo)?.default_branch;
    return known ?? "main";
  };

  // Todos os arquivos do repositório num ref (jsDelivr; sem limite por hora). null = use a API.
  const cdnLists = new Map();
  const cdnFiles = (repo, ref) => {
    const key = `${repo}@${ref}`;
    if (!cdnLists.has(key)) {
      cdnLists.set(
        key,
        fetch(`https://data.jsdelivr.com/v1/packages/gh/${GH_OWNER}/${repo}@${encodeURIComponent(ref)}?structure=flat`, { cache: "no-cache" })
          .then((response) => (response.ok ? response.json() : null))
          .then((data) => (Array.isArray(data?.files) ? data.files.map((file) => ({ path: file.name.replace(/^\//, ""), size: file.size })) : null))
          .catch(() => null),
      );
    }
    return cdnLists.get(key);
  };
  const rawUrl = (repo, ref, path) => `https://raw.githubusercontent.com/${GH_OWNER}/${repo}/${encodeURIComponent(ref)}/${enc(path)}`;
  const rawText = async (repo, ref, path) => {
    const response = await fetch(rawUrl(repo, ref, path));
    if (!response.ok) throw Object.assign(new Error("raw"), { status: response.status });
    return response.text();
  };

  // Scripts de terceiros servidos pelo próprio site (components/vendor/), carregados só quando usados.
  const vendorScripts = {};
  const loadVendor = (file, global) =>
    (vendorScripts[file] ??= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(`components/vendor/${file}`, SITE_ROOT).href;
      script.onload = () => resolve(window[global]);
      script.onerror = () => {
        delete vendorScripts[file];
        reject(new Error(file));
      };
      document.head.append(script);
    }));
  const markdownHtml = async (text) => (await loadVendor("marked.min.js", "marked")).parse(text, { gfm: true });

  // HTML do GitHub (já higienizado por ele) passa por mais uma limpeza e tem links e imagens resolvidos.
  const cleanHtml = (html, { repo, ref, dir }) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script, style, iframe, object, embed, form, link, meta, base").forEach((node) => node.remove());
    doc.querySelectorAll("*").forEach((el) => {
      for (const attr of [...el.attributes]) {
        if (/^on/i.test(attr.name) || (/^(href|src|xlink:href|action)$/i.test(attr.name) && /^\s*(javascript|data):/i.test(attr.value))) el.removeAttribute(attr.name);
      }
    });
    const folder = dir ? `${enc(dir)}/` : "";
    const pageBase = `https://github.com/${GH_OWNER}/${repo}/blob/${ref}/${folder}`;
    const rawBase = `https://raw.githubusercontent.com/${GH_OWNER}/${repo}/${ref}/${folder}`;
    doc.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href.startsWith("#")) a.setAttribute("href", new URL(href, pageBase).href);
    });
    doc.querySelectorAll("img[src]").forEach((img) => {
      img.setAttribute("src", new URL(img.getAttribute("src"), rawBase).href);
      img.setAttribute("loading", "lazy");
    });
    // Âncoras como as do GitHub ("## Como rodar" → #como-rodar), para os links do sumário.
    doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
      if (!heading.id) heading.id = heading.textContent.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
    });
    return [...doc.body.childNodes];
  };

  const GH_STYLE = `
    html:has(.gh-viewer[open]) { overflow: hidden; }
    .gh-viewer { width: min(1080px, calc(100% - 32px)); height: min(860px, calc(100dvh - 48px)); max-width: none; max-height: none; margin: auto; padding: 0; border: 1px solid rgba(var(--accent-rgb),.35); border-radius: 18px; background: var(--bg); color: var(--text); box-shadow: 0 30px 90px rgba(0,0,0,.45); overflow: hidden; font-family: Manrope, sans-serif; }
    .gh-viewer[open] { display: flex; flex-direction: column; }
    .gh-viewer::backdrop { background: rgba(0,0,0,.6); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
    .gh-bar { display: flex; align-items: center; gap: 10px; min-height: 50px; padding: 0 10px; border-bottom: 1px solid var(--line); background: var(--surface); }
    .gh-bar button { display: grid; place-items: center; flex: none; width: 34px; height: 34px; border: 1px solid var(--line); border-radius: 50%; background: var(--surface-2); color: var(--text); font: 600 16px/1 Manrope, sans-serif; cursor: pointer; }
    .gh-bar button:disabled { opacity: .35; cursor: default; }
    .gh-bar button:focus-visible, .gh-viewer a:focus-visible, .gh-row:focus-visible { outline: 2px solid var(--accent-text); outline-offset: 2px; }
    .gh-crumbs { display: flex; flex: 1; align-items: center; gap: 4px; min-width: 0; overflow-x: auto; font: 500 12px "DM Mono", monospace; white-space: nowrap; scrollbar-width: none; }
    .gh-crumbs button { width: auto; height: auto; padding: 4px 6px; border: 0; border-radius: 6px; background: none; color: var(--muted); font: inherit; }
    .gh-crumbs button:last-child { color: var(--text); }
    .gh-crumbs button:hover { background: var(--surface-2); color: var(--text); }
    .gh-crumbs span { color: var(--muted); }
    .gh-external { flex: none; color: var(--accent-text); font: 500 11px "DM Mono", monospace; letter-spacing: .06em; text-decoration: none; }
    .gh-external:hover { text-decoration: underline; }
    .gh-body { flex: 1; min-height: 0; overflow: auto; padding: 22px clamp(16px, 4vw, 40px) 40px; }
    .gh-status { color: var(--muted); font: 500 13px "DM Mono", monospace; }
    .gh-list { margin: 0 0 26px; padding: 0; border: 1px solid var(--line); border-radius: 12px; list-style: none; overflow: hidden; }
    .gh-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 16px; border: 0; border-top: 1px solid var(--line); background: none; color: var(--text); font: 500 14px Manrope, sans-serif; text-align: left; cursor: pointer; }
    .gh-list li:first-child .gh-row { border-top: 0; }
    .gh-row:hover { background: rgba(var(--accent-rgb),.08); }
    .gh-row small { margin-left: auto; color: var(--muted); font: 400 11px "DM Mono", monospace; }
    .gh-icon { flex: none; width: 18px; color: var(--accent-text); text-align: center; }
    .gh-repos { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
    .gh-repo { display: grid; gap: 6px; padding: 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface-2); color: var(--text); text-align: left; cursor: pointer; font: inherit; }
    .gh-repo:hover { border-color: rgba(var(--accent-rgb),.5); }
    .gh-repo strong { font-size: 15px; }
    .gh-repo span { color: var(--muted); font-size: 13px; line-height: 1.5; }
    .gh-repo small { color: var(--accent-text); font: 500 11px "DM Mono", monospace; }
    .gh-readme-title { margin: 0 0 14px; color: var(--muted); font: 500 11px "DM Mono", monospace; letter-spacing: .08em; }
    .gh-md { max-width: 860px; line-height: 1.7; font-size: 15px; overflow-wrap: anywhere; }
    .gh-md h1, .gh-md h2, .gh-md h3 { margin: 1.4em 0 .5em; line-height: 1.25; letter-spacing: -.02em; }
    .gh-md h1 { font-size: 30px; } .gh-md h2 { padding-bottom: 6px; border-bottom: 1px solid var(--line); font-size: 22px; } .gh-md h3 { font-size: 18px; }
    .gh-md > :first-child, .gh-md > :first-child > :first-child { margin-top: 0; }
    .gh-md a { color: var(--accent-text); }
    .gh-md code { padding: 2px 6px; border-radius: 5px; background: var(--surface-2); font: 13px "DM Mono", monospace; }
    .gh-md pre, .gh-code { margin: 0 0 16px; padding: 16px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); overflow: auto; font: 13px/1.6 "DM Mono", monospace; tab-size: 2; }
    .gh-md pre code { padding: 0; background: none; }
    .gh-md table { display: block; max-width: 100%; margin: 0 0 16px; border-collapse: collapse; overflow: auto; font-size: 14px; }
    .gh-md th, .gh-md td { padding: 7px 12px; border: 1px solid var(--line); }
    .gh-md th { background: var(--surface-2); }
    .gh-md blockquote { margin: 0 0 16px; padding: 4px 16px; border-left: 3px solid var(--accent); color: var(--muted); }
    .gh-md img { max-width: 100%; height: auto; }
    .gh-md hr { border: 0; border-top: 1px solid var(--line); }
    .gh-md .anchor, .gh-md .octicon { display: none; }
    .gh-image { display: block; max-width: 100%; margin: 0 auto; border-radius: 10px; }
    @media (max-width: 760px) { .gh-viewer { width: 100%; height: 100dvh; border: 0; border-radius: 0; } }
  `;

  let ghDialog = null;
  let ghHistory = [];

  const ghBuild = () => {
    const style = document.createElement("style");
    style.textContent = GH_STYLE;
    document.head.append(style);
    ghDialog = document.createElement("dialog");
    ghDialog.className = "gh-viewer";
    ghDialog.setAttribute("aria-labelledby", "gh-crumbs");
    ghDialog.innerHTML =
      '<div class="gh-bar"><button type="button" class="gh-back">←</button><nav class="gh-crumbs" id="gh-crumbs"></nav><a class="gh-external" target="_blank" rel="noopener"></a><button type="button" class="gh-close">×</button></div><div class="gh-body" tabindex="-1"></div>';
    document.body.append(ghDialog);
    ghDialog.querySelector(".gh-close").addEventListener("click", () => ghDialog.close());
    ghDialog.querySelector(".gh-back").addEventListener("click", () => {
      ghHistory.pop();
      if (ghHistory.length) ghShow(ghHistory.at(-1));
    });
    ghDialog.addEventListener("click", (event) => event.target === ghDialog && ghDialog.close());
    ghDialog.addEventListener("close", () => (ghHistory = []));
    // Links dentro do conteúdo: do mesmo dono navegam no visualizador; âncoras rolam; o resto abre em nova aba.
    ghDialog.querySelector(".gh-body").addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href");
      if (href.startsWith("#")) {
        event.preventDefault();
        const id = decodeURIComponent(href.slice(1));
        ghDialog.querySelector(`[id="user-content-${CSS.escape(id)}"], [id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "start" });
        return;
      }
      const target = parseGithub(link.href);
      if (target) {
        event.preventDefault();
        ghNavigate(target);
      } else {
        link.target = "_blank";
        link.rel = "noopener";
      }
    });
  };

  const ghSetBar = (target) => {
    const [back, close] = [ghDialog.querySelector(".gh-back"), ghDialog.querySelector(".gh-close")];
    const [labelBack, labelClose, external] = ghText();
    back.setAttribute("aria-label", labelBack);
    close.setAttribute("aria-label", labelClose);
    back.disabled = ghHistory.length < 2;
    const link = ghDialog.querySelector(".gh-external");
    link.textContent = external;
    link.href = githubUrl(target);
    const crumbs = ghDialog.querySelector(".gh-crumbs");
    const parts = [{ label: GH_OWNER, target: { repo: "", ref: "", path: "" } }];
    if (target.repo) parts.push({ label: target.repo, target: { repo: target.repo, ref: target.ref, path: "" } });
    target.path.split("/").filter(Boolean).forEach((part, i, all) => parts.push({ label: part, target: { ...target, path: all.slice(0, i + 1).join("/") } }));
    crumbs.replaceChildren(
      ...parts.flatMap((part, i) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = part.label;
        button.addEventListener("click", () => ghNavigate(part.target));
        if (i === parts.length - 1) button.setAttribute("aria-current", "page");
        if (!i) return [button];
        const slash = document.createElement("span");
        slash.textContent = "/";
        slash.setAttribute("aria-hidden", "true");
        return [slash, button];
      }),
    );
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  const ghShow = async (target) => {
    const body = ghDialog.querySelector(".gh-body");
    ghSetBar(target);
    body.replaceChildren(el("p", "gh-status", `>_ ${ghText()[3]}`));
    body.scrollTop = 0;
    const current = ghHistory.at(-1);
    try {
      const nodes = await ghRender(target);
      if (ghHistory.at(-1) !== current) return; // o visitante já navegou para outro lugar
      ghSetBar(target);
      body.replaceChildren(...nodes);
      const anchor = target.hash ? CSS.escape(decodeURIComponent(target.hash.slice(1))) : "";
      if (anchor) ghDialog.querySelector(`[id="${anchor}"], [id="user-content-${anchor}"]`)?.scrollIntoView({ block: "start" });
    } catch (error) {
      if (ghHistory.at(-1) !== current) return;
      const message = el("p", "gh-status", error.status === 403 || error.status === 429 ? ghText()[5] : ghText()[4]);
      const open = el("a", "gh-external", ghText()[2]);
      open.href = githubUrl(target);
      open.target = "_blank";
      open.rel = "noopener";
      body.replaceChildren(message, open);
    }
  };

  const sizeLabel = (size) => (size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B`);
  const fileRow = (target, item) => {
    const li = el("li");
    const row = el("button", "gh-row");
    row.type = "button";
    row.append(el("span", "gh-icon", item.dir ? "▸" : "·"), el("span", null, item.name));
    if (!item.dir) row.append(el("small", null, sizeLabel(item.size)));
    row.addEventListener("click", () => ghNavigate({ ...target, path: item.path, hash: "" }));
    li.append(row);
    return li;
  };
  const markdownArticle = async (target, path) => {
    const article = el("article", "gh-md");
    const dir = path.split("/").slice(0, -1).join("/");
    article.append(...cleanHtml(await markdownHtml(await rawText(target.repo, target.ref, path)), { repo: target.repo, ref: target.ref, dir }));
    return article;
  };
  // Pasta: lista (pastas primeiro) + README formatado, se houver.
  const folderNodes = async (target, items) => {
    const list = el("ul", "gh-list");
    const sorted = [...items].sort((a, b) => (a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1));
    list.append(...sorted.map((item) => fileRow(target, item)));
    const nodes = [list];
    const readme = items.find((item) => !item.dir && /^readme(\.(md|markdown))?$/i.test(item.name));
    if (readme) nodes.push(el("p", "gh-readme-title", readme.name.toUpperCase()), await markdownArticle(target, readme.path));
    return nodes;
  };
  // Arquivo: Markdown formatado, imagem ou código como texto.
  const fileNodes = async (target, name, size) => {
    if (/\.(md|markdown)$/i.test(name)) return [await markdownArticle(target, target.path)];
    if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(name)) {
      const img = el("img", "gh-image");
      img.src = rawUrl(target.repo, target.ref, target.path);
      img.alt = name;
      return [img];
    }
    if (size > 400000) throw Object.assign(new Error("large"), { status: 0 });
    const code = el("pre", "gh-code");
    code.append(el("code", null, await rawText(target.repo, target.ref, target.path)));
    return [code];
  };

  const ghRender = async (target) => {
    if (!target.repo) {
      const repos = (await repoList()).filter((repo) => !repo.fork);
      const grid = el("div", "gh-repos");
      grid.append(
        ...repos.map((repo) => {
          const card = el("button", "gh-repo");
          card.type = "button";
          card.append(el("strong", null, repo.name), el("span", null, repo.description ?? ""), el("small", null, [repo.language, repo.stargazers_count ? `★ ${repo.stargazers_count}` : ""].filter(Boolean).join(" · ")));
          card.addEventListener("click", () => ghNavigate({ repo: repo.name, ref: "", path: "" }));
          return card;
        }),
      );
      return [el("p", "gh-readme-title", ghText()[6].toUpperCase()), grid];
    }
    target.ref ||= await defaultBranch(target.repo);
    const path = target.path.replace(/\/+$/, "");

    // 1) jsDelivr: a lista completa do repositório numa chamada só.
    const files = await cdnFiles(target.repo, target.ref);
    if (files) {
      const file = files.find((item) => item.path === path);
      if (file) return fileNodes(target, path.split("/").pop(), file.size);
      const prefix = path ? `${path}/` : "";
      const items = new Map();
      files
        .filter((item) => item.path.startsWith(prefix))
        .forEach((item) => {
          const [name, ...rest] = item.path.slice(prefix.length).split("/");
          if (!items.has(name)) items.set(name, { name, path: prefix + name, dir: rest.length > 0, size: item.size });
        });
      if (!items.size) throw Object.assign(new Error("not found"), { status: 404 });
      return folderNodes(target, [...items.values()]);
    }

    // 2) Reserva: API do GitHub (60 consultas/hora por visitante).
    const entry = await ghFetch(`/repos/${GH_OWNER}/${target.repo}/contents/${enc(path)}?ref=${encodeURIComponent(target.ref)}`);
    if (Array.isArray(entry)) return folderNodes(target, entry.map((item) => ({ name: item.name, path: item.path, dir: item.type === "dir", size: item.size })));
    return fileNodes(target, entry.name, entry.size);
  };

  const ghNavigate = (target) => {
    ghHistory.push(target);
    ghShow(target);
  };

  const openGithub = (href) => {
    const target = parseGithub(href);
    if (!target) return false;
    if (!ghDialog) ghBuild();
    ghHistory = [];
    ghNavigate(target);
    if (!ghDialog.open) ghDialog.showModal();
    ghDialog.querySelector(".gh-close").focus();
    return true;
  };
  window.portfolioGithub = { open: openGithub };

  // Qualquer link para o GitHub do Emanuel, em qualquer página (Ctrl/⌘/Shift+clique abre no GitHub).
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.closest(".gh-viewer") || !parseGithub(link.href)) return;
    event.preventDefault();
    // Página embutida no modal do portfólio: abre na janela principal (mesma origem).
    try {
      if (window.top !== window && window.top.portfolioGithub?.open(link.href)) return;
    } catch {
      /* janela principal de outra origem */
    }
    openGithub(link.href);
  });

  /* ---------- Links externos num modal ---------- */

  // LinkedIn, WhatsApp, os portais da Prefeitura e outros sites proíbem ser exibidos dentro de outra
  // página (X-Frame-Options / frame-ancestors), e e-mail abre um aplicativo. Em vez de sair do
  // portfólio, o link abre um cartão no próprio site — QR code do WhatsApp, perfil do LinkedIn,
  // e-mail para copiar, descrição do sistema — e o site externo só abre se o visitante pedir.
  const SITE_ROOT = new URL("..", document.currentScript?.src ?? location.href).href;
  const LINK_LABELS = {
    en: { close: "Close", copy: "Copy", copied: "Copied!", note: "This site can't be shown inside the portfolio — open it whenever you like.", whatsTitle: "Chat on WhatsApp", scan: "Point your phone's camera at the code", openWhats: "Open chat ↗", linkedinTitle: "LinkedIn profile", openLinkedin: "Open on LinkedIn ↗", mailTitle: "Email", openMail: "Write an email ↗", siteTitle: "External site", openSite: "Open site ↗", headline: "Senior Full Stack Developer · Applied AI", location: "Manaus, Brazil", stack: "Stack", compras: "Procurement and public bidding portal of the Manaus City Hall, developed by Emanuel at SEMEF.", contratos: "Contract management system of the Manaus City Hall, developed by Emanuel at SEMEF / SEMAD.", shareKind: "Share", shareTitle: "Share this portfolio", shareScan: "Point a phone camera at the code to open the portfolio", shareNow: "Share ↗", shareText: "Emanuel Borges's portfolio — Senior Full Stack Developer building with AI" },
    pt: { close: "Fechar", copy: "Copiar", copied: "Copiado!", note: "Este site não pode ser exibido dentro do portfólio — abra quando quiser.", whatsTitle: "Conversar no WhatsApp", scan: "Aponte a câmera do celular para o código", openWhats: "Abrir conversa ↗", linkedinTitle: "Perfil no LinkedIn", openLinkedin: "Abrir no LinkedIn ↗", mailTitle: "E-mail", openMail: "Escrever e-mail ↗", siteTitle: "Site externo", openSite: "Abrir site ↗", headline: "Desenvolvedor Full Stack Sênior · IA aplicada", location: "Manaus, AM · Brasil", stack: "Tecnologias", compras: "Portal de compras e licitações da Prefeitura de Manaus, desenvolvido por Emanuel na SEMEF.", contratos: "Sistema de gestão de contratos da Prefeitura de Manaus, desenvolvido por Emanuel na SEMEF / SEMAD.", shareKind: "Compartilhar", shareTitle: "Compartilhe este portfólio", shareScan: "Aponte a câmera do celular para abrir o portfólio", shareNow: "Compartilhar ↗", shareText: "Portfólio de Emanuel Borges — Full Stack Sênior construindo com IA" },
    es: { close: "Cerrar", copy: "Copiar", copied: "¡Copiado!", note: "Este sitio no puede mostrarse dentro del portafolio — ábrelo cuando quieras.", whatsTitle: "Hablar por WhatsApp", scan: "Apunta la cámara del móvil al código", openWhats: "Abrir chat ↗", linkedinTitle: "Perfil de LinkedIn", openLinkedin: "Abrir en LinkedIn ↗", mailTitle: "Correo", openMail: "Escribir correo ↗", siteTitle: "Sitio externo", openSite: "Abrir sitio ↗", headline: "Desarrollador Full Stack Sénior · IA aplicada", location: "Manaos, Brasil", stack: "Tecnologías", compras: "Portal de compras y licitaciones del Ayuntamiento de Manaos, desarrollado por Emanuel en la SEMEF.", contratos: "Sistema de gestión de contratos del Ayuntamiento de Manaos, desarrollado por Emanuel en la SEMEF / SEMAD.", shareKind: "Compartir", shareTitle: "Comparte este portafolio", shareScan: "Apunta la cámara del móvil al código para abrir el portafolio", shareNow: "Compartir ↗", shareText: "Portafolio de Emanuel Borges — Full Stack Sénior construyendo con IA" },
    fr: { close: "Fermer", copy: "Copier", copied: "Copié !", note: "Ce site ne peut pas s’afficher dans le portfolio — ouvrez-le quand vous voulez.", whatsTitle: "Discuter sur WhatsApp", scan: "Pointez l’appareil photo du téléphone vers le code", openWhats: "Ouvrir la discussion ↗", linkedinTitle: "Profil LinkedIn", openLinkedin: "Ouvrir sur LinkedIn ↗", mailTitle: "E-mail", openMail: "Écrire un e-mail ↗", siteTitle: "Site externe", openSite: "Ouvrir le site ↗", headline: "Développeur Full Stack Senior · IA appliquée", location: "Manaus, Brésil", stack: "Technologies", compras: "Portail d’achats et d’appels d’offres de la mairie de Manaus, développé par Emanuel à la SEMEF.", contratos: "Système de gestion des contrats de la mairie de Manaus, développé par Emanuel à la SEMEF / SEMAD.", shareKind: "Partager", shareTitle: "Partagez ce portfolio", shareScan: "Pointez l’appareil photo d’un téléphone vers le code pour ouvrir le portfolio", shareNow: "Partager ↗", shareText: "Portfolio d’Emanuel Borges — Développeur Full Stack Senior qui construit avec l’IA" },
    it: { close: "Chiudi", copy: "Copia", copied: "Copiato!", note: "Questo sito non può essere mostrato nel portfolio — aprilo quando vuoi.", whatsTitle: "Scrivi su WhatsApp", scan: "Inquadra il codice con la fotocamera del telefono", openWhats: "Apri chat ↗", linkedinTitle: "Profilo LinkedIn", openLinkedin: "Apri su LinkedIn ↗", mailTitle: "E-mail", openMail: "Scrivi un’e-mail ↗", siteTitle: "Sito esterno", openSite: "Apri sito ↗", headline: "Sviluppatore Full Stack Senior · IA applicata", location: "Manaus, Brasile", stack: "Tecnologie", compras: "Portale acquisti e gare del Comune di Manaus, sviluppato da Emanuel alla SEMEF.", contratos: "Sistema di gestione dei contratti del Comune di Manaus, sviluppato da Emanuel alla SEMEF / SEMAD.", shareKind: "Condividi", shareTitle: "Condividi questo portfolio", shareScan: "Inquadra il codice con la fotocamera del telefono per aprire il portfolio", shareNow: "Condividi ↗", shareText: "Portfolio di Emanuel Borges — Full Stack Senior che costruisce con l’IA" },
    de: { close: "Schließen", copy: "Kopieren", copied: "Kopiert!", note: "Diese Website kann nicht im Portfolio angezeigt werden — öffnen Sie sie, wann Sie möchten.", whatsTitle: "Auf WhatsApp schreiben", scan: "Richten Sie die Handykamera auf den Code", openWhats: "Chat öffnen ↗", linkedinTitle: "LinkedIn-Profil", openLinkedin: "Auf LinkedIn öffnen ↗", mailTitle: "E-Mail", openMail: "E-Mail schreiben ↗", siteTitle: "Externe Website", openSite: "Website öffnen ↗", headline: "Senior Full-Stack-Entwickler · Angewandte KI", location: "Manaus, Brasilien", stack: "Technologien", compras: "Einkaufs- und Ausschreibungsportal der Stadt Manaus, von Emanuel bei der SEMEF entwickelt.", contratos: "Vertragsverwaltung der Stadt Manaus, von Emanuel bei SEMEF / SEMAD entwickelt.", shareKind: "Teilen", shareTitle: "Dieses Portfolio teilen", shareScan: "Richten Sie eine Handykamera auf den Code, um das Portfolio zu öffnen", shareNow: "Teilen ↗", shareText: "Portfolio von Emanuel Borges — Senior Full-Stack-Entwickler, der mit KI baut" },
    zh: { close: "关闭", copy: "复制", copied: "已复制！", note: "该网站无法在作品集中显示——需要时再打开即可。", whatsTitle: "通过 WhatsApp 联系", scan: "用手机相机扫描二维码", openWhats: "打开聊天 ↗", linkedinTitle: "领英主页", openLinkedin: "在领英打开 ↗", mailTitle: "电子邮件", openMail: "写邮件 ↗", siteTitle: "外部网站", openSite: "打开网站 ↗", headline: "高级全栈开发工程师 · 应用 AI", location: "巴西 马瑙斯", stack: "技术", compras: "马瑙斯市政府采购与招标门户，由 Emanuel 在 SEMEF 开发。", contratos: "马瑙斯市政府合同管理系统，由 Emanuel 在 SEMEF / SEMAD 开发。", shareKind: "分享", shareTitle: "分享这个作品集", shareScan: "用手机相机扫描二维码即可打开作品集", shareNow: "分享 ↗", shareText: "Emanuel Borges 的作品集——用 AI 构建产品的高级全栈开发工程师" },
    ru: { close: "Закрыть", copy: "Копировать", copied: "Скопировано!", note: "Этот сайт нельзя показать внутри портфолио — откройте, когда захотите.", whatsTitle: "Написать в WhatsApp", scan: "Наведите камеру телефона на код", openWhats: "Открыть чат ↗", linkedinTitle: "Профиль LinkedIn", openLinkedin: "Открыть в LinkedIn ↗", mailTitle: "Эл. почта", openMail: "Написать письмо ↗", siteTitle: "Внешний сайт", openSite: "Открыть сайт ↗", headline: "Senior Full Stack разработчик · прикладной ИИ", location: "Манаус, Бразилия", stack: "Технологии", compras: "Портал закупок и тендеров мэрии Манауса, разработанный Emanuel в SEMEF.", contratos: "Система управления контрактами мэрии Манауса, разработанная Emanuel в SEMEF / SEMAD.", shareKind: "Поделиться", shareTitle: "Поделитесь этим портфолио", shareScan: "Наведите камеру телефона на код, чтобы открыть портфолио", shareNow: "Поделиться ↗", shareText: "Портфолио Emanuel Borges — Senior Full Stack разработчик, создающий продукты с ИИ" },
  };
  const linkText = () => LINK_LABELS[pageLang()] ?? LINK_LABELS.en;
  const KNOWN_SITES = {
    "compras.manaus.am.gov.br": { name: "ComprasManaus", key: "compras", stack: "ASP Classic · ASP.NET Web Forms · VB.NET · jQuery · Bootstrap · Highcharts" },
    "contratos.manaus.am.gov.br": { name: "ContratosManaus", key: "contratos", stack: "PHP · jQuery · Bootstrap · Chart.js · Select2" },
    "sistemaspmm.manaus.am.gov.br": { name: "ContratosManaus", key: "contratos", stack: "PHP · jQuery · Bootstrap · Chart.js · Select2" },
  };

  // Tipo do link: whatsapp | linkedin | email | site; null = deixa o navegador seguir.
  const linkKind = (link) => {
    if (link.hasAttribute("download")) return null;
    let url;
    try {
      url = new URL(link.href, location.href);
    } catch {
      return null;
    }
    if (url.protocol === "mailto:") return "email";
    if (!/^https?:$/.test(url.protocol) || url.host === location.host) return null;
    if (url.hostname === "wa.me" || url.hostname.endsWith("whatsapp.com")) return "whatsapp";
    if (url.hostname.endsWith("linkedin.com")) return "linkedin";
    return "site";
  };

  const LINK_STYLE = `
    html:has(.link-card[open]) { overflow: hidden; }
    .link-card { width: min(460px, calc(100% - 32px)); max-height: calc(100dvh - 48px); margin: auto; padding: 0; border: 1px solid rgba(var(--accent-rgb),.35); border-radius: 20px; background: var(--surface); color: var(--text); box-shadow: 0 30px 90px rgba(0,0,0,.45), 0 0 40px rgba(var(--accent-rgb),.12); font-family: Manrope, sans-serif; overflow: auto; }
    .link-card::backdrop { background: rgba(0,0,0,.6); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
    .link-card[open] { animation: link-card-in .18s ease-out; }
    @keyframes link-card-in { from { opacity: 0; transform: translateY(8px) scale(.98); } }
    .link-card-bar { display: flex; align-items: center; gap: 10px; padding: 14px 14px 0 20px; }
    .link-card-kind { flex: 1; color: var(--accent-text); font: 500 11px "DM Mono", monospace; letter-spacing: .08em; text-transform: uppercase; }
    .link-card-close { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid var(--line); border-radius: 50%; background: var(--surface-2); color: var(--text); font-size: 18px; line-height: 1; cursor: pointer; }
    .link-card-body { display: grid; grid-template-columns: minmax(0, 1fr); justify-items: center; gap: 14px; padding: 10px 24px 24px; text-align: center; }
    .link-card-body h2 { margin: 0; font-size: 22px; letter-spacing: -.03em; }
    .link-card-body p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.6; }
    .link-card-photo { width: 92px; height: 92px; border: 2px solid rgba(var(--accent-rgb),.6); border-radius: 50%; object-fit: cover; box-shadow: 0 0 24px rgba(var(--accent-rgb),.25); }
    .link-card-qr { padding: 12px; border-radius: 14px; background: #fff; line-height: 0; }
    .link-card-qr svg { width: 188px; height: 188px; }
    .link-card-copy { display: flex; align-items: center; gap: 8px; max-width: 100%; min-width: 0; padding: 6px 6px 6px 14px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface-2); font: 500 13px "DM Mono", monospace; }
    .link-card-copy span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .link-card-copy button { flex: none; padding: 6px 12px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); color: var(--text); font: 600 12px Manrope, sans-serif; cursor: pointer; }
    .link-card-stack { color: var(--accent-text) !important; font: 500 12px "DM Mono", monospace !important; }
    .link-card-open { display: inline-flex; justify-content: center; width: 100%; padding: 13px 18px; border-radius: 12px; background: linear-gradient(90deg, var(--accent), var(--accent-2)); color: #0b130e; font: 800 14px Manrope, sans-serif; text-decoration: none; }
    .link-card-open:hover { filter: brightness(1.05); }
    .link-card-note { font-size: 12px !important; }
    .link-card button:focus-visible, .link-card a:focus-visible { outline: 2px solid var(--accent-text); outline-offset: 2px; }
    .link-card-via { display: flex; gap: 8px; width: 100%; }
    .link-card-via a { flex: 1; padding: 10px 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface-2); color: var(--text); font: 600 13px Manrope, sans-serif; text-decoration: none; }
    .link-card-via a:hover { border-color: rgba(var(--accent-rgb),.5); }
    button.link-card-open { border: 0; cursor: pointer; }
    @media (max-width: 420px) { .link-card-body { padding: 8px 16px 20px; } .link-card-qr svg { width: 160px; height: 160px; } }
    @media (pointer: coarse), (max-width: 760px) { .link-card-qr:not(.is-share), .link-card-scan:not(.is-share) { display: none; } }
  `;

  const loadQr = () => loadVendor("qrcode.min.js", "qrcode");
  const qrSvg = (qrcode, text) => {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    let path = "";
    for (let y = 0; y < n; y += 1) for (let x = 0; x < n; x += 1) if (qr.isDark(y, x)) path += `M${x} ${y}h1v1h-1z`;
    return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" role="img" aria-label="QR code" shape-rendering="crispEdges"><path d="${path}" fill="#000"/></svg>`;
  };
  // 5592999771376 → +55 (92) 99977-1376
  const formatPhone = (digits) => (digits.length === 13 ? `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}` : `+${digits}`);

  let linkDialog = null;
  const linkBuild = () => {
    const style = document.createElement("style");
    style.textContent = LINK_STYLE;
    document.head.append(style);
    linkDialog = document.createElement("dialog");
    linkDialog.className = "link-card";
    linkDialog.setAttribute("aria-labelledby", "link-card-title");
    linkDialog.innerHTML = '<div class="link-card-bar"><span class="link-card-kind"></span><button type="button" class="link-card-close">×</button></div><div class="link-card-body"></div>';
    document.body.append(linkDialog);
    linkDialog.querySelector(".link-card-close").addEventListener("click", () => linkDialog.close());
    linkDialog.addEventListener("click", (event) => event.target === linkDialog && linkDialog.close());
  };

  const copyRow = (value) => {
    const row = el("div", "link-card-copy");
    const button = el("button", null, linkText().copy);
    button.type = "button";
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = linkText().copied;
        setTimeout(() => (button.textContent = linkText().copy), 1800);
      } catch {
        /* sem permissão de área de transferência */
      }
    });
    row.append(el("span", null, value), button);
    return row;
  };

  const openLink = (href, label = "") => {
    const probe = Object.assign(document.createElement("a"), { href });
    const kind = linkKind(probe);
    if (!kind) return false;
    if (!linkDialog) linkBuild();
    const text = linkText();
    const url = new URL(probe.href);
    const body = linkDialog.querySelector(".link-card-body");
    const action = el("a", "link-card-open");
    action.href = url.href;
    if (kind !== "email") {
      action.target = "_blank";
      action.rel = "noopener";
    }
    action.addEventListener("click", () => linkDialog.close());
    linkDialog.querySelector(".link-card-close").setAttribute("aria-label", text.close);
    body.replaceChildren();

    if (kind === "whatsapp") {
      const digits = (url.pathname.match(/\d{8,}/) ?? [url.searchParams.get("phone") ?? ""])[0].replace(/\D/g, "");
      linkDialog.querySelector(".link-card-kind").textContent = "WhatsApp";
      const qr = el("div", "link-card-qr");
      loadQr().then((qrcode) => (qr.innerHTML = qrSvg(qrcode, url.href))).catch(() => qr.remove());
      action.textContent = text.openWhats;
      body.append(el("h2", null, text.whatsTitle), qr, el("p", "link-card-scan", text.scan), copyRow(formatPhone(digits)), action);
    } else if (kind === "linkedin") {
      linkDialog.querySelector(".link-card-kind").textContent = text.linkedinTitle;
      const photo = el("img", "link-card-photo");
      photo.src = new URL("imagens/emanuel-borges.jpg", SITE_ROOT).href;
      photo.alt = "";
      action.textContent = text.openLinkedin;
      body.append(photo, el("h2", null, "Emanuel Borges"), el("p", null, `${text.headline}\n${text.location}`), copyRow(`${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}`), action);
      body.querySelector("p").style.whiteSpace = "pre-line";
    } else if (kind === "email") {
      linkDialog.querySelector(".link-card-kind").textContent = text.mailTitle;
      action.textContent = text.openMail;
      body.append(el("h2", null, "Emanuel Borges"), copyRow(decodeURIComponent(url.pathname)), action);
    } else {
      const known = KNOWN_SITES[url.hostname];
      linkDialog.querySelector(".link-card-kind").textContent = text.siteTitle;
      action.textContent = text.openSite;
      const title = known?.name ?? (label.replace(/[↗→]/g, "").trim() || url.hostname.replace(/^www\./, ""));
      body.append(el("h2", null, title));
      if (known) body.append(el("p", null, text[known.key]), el("p", "link-card-stack", known.stack));
      body.append(copyRow(url.href.replace(/^https?:\/\//, "").replace(/\/$/, "")), el("p", "link-card-note", text.note), action);
    }
    linkDialog.querySelector(".link-card-kind").id = "";
    body.querySelector("h2").id = "link-card-title";
    if (!linkDialog.open) linkDialog.showModal();
    action.focus();
    return true;
  };
  window.portfolioLink = { open: openLink };

  // "Compartilhar portfólio" ([data-share]): QR code e link do site no idioma atual, botão de copiar,
  // compartilhamento nativo do aparelho (quando houver) e atalhos para WhatsApp, LinkedIn e e-mail.
  const openShare = () => {
    if (!linkDialog) linkBuild();
    const text = linkText();
    const lang = pageLang();
    const url = `https://emanueleborges.github.io/${lang !== "en" ? `?lang=${lang}` : ""}`;
    const body = linkDialog.querySelector(".link-card-body");
    linkDialog.querySelector(".link-card-kind").textContent = text.shareKind;
    linkDialog.querySelector(".link-card-close").setAttribute("aria-label", text.close);
    const qr = el("div", "link-card-qr is-share");
    loadQr().then((qrcode) => (qr.innerHTML = qrSvg(qrcode, url))).catch(() => qr.remove());
    const via = el("div", "link-card-via");
    [
      ["WhatsApp", `https://wa.me/?text=${encodeURIComponent(`${text.shareText}\n${url}`)}`],
      ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`],
      [text.mailTitle, `mailto:?subject=${encodeURIComponent(text.shareText)}&body=${encodeURIComponent(url)}`],
    ].forEach(([label, href]) => {
      const link = el("a", null, label);
      link.href = href;
      if (!href.startsWith("mailto:")) {
        link.target = "_blank";
        link.rel = "noopener";
      }
      via.append(link);
    });
    const title = el("h2", null, text.shareTitle);
    title.id = "link-card-title";
    body.replaceChildren(title, qr, el("p", "link-card-scan is-share", text.shareScan), copyRow(url));
    if (navigator.share) {
      const native = el("button", "link-card-open", text.shareNow);
      native.type = "button";
      native.addEventListener("click", () => navigator.share({ title: "Emanuel Borges", text: text.shareText, url }).catch(() => {}));
      body.append(native);
    }
    body.append(via);
    if (!linkDialog.open) linkDialog.showModal();
    body.querySelector(".link-card-copy button").focus();
  };
  window.portfolioShare = { open: openShare };

  document.addEventListener("click", (event) => {
    if (!event.target.closest?.("[data-share]")) return;
    event.preventDefault();
    try {
      if (window.top !== window && window.top.portfolioShare) return window.top.portfolioShare.open();
    } catch {
      /* janela principal de outra origem */
    }
    openShare();
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // Botões que já são o pedido explícito de abrir fora ("GITHUB ↗" do visualizador) seguem direto.
    if (link.closest(".link-card, .gh-external") || link.classList.contains("gh-external") || !linkKind(link)) return;
    event.preventDefault();
    try {
      if (window.top !== window && window.top.portfolioLink?.open(link.href, link.textContent)) return;
    } catch {
      /* janela principal de outra origem */
    }
    openLink(link.href, link.textContent);
  });

  /* ---------- <share-button> ---------- */

  // Ícone de compartilhar no cabeçalho: abre o modal "Compartilhar" ([data-share], tratado acima).
  const SHARE_ICON =
    '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.8l7.4-4.3M8.3 13.2l7.4 4.3"/></svg>';

  class ShareButton extends HTMLElement {
    connectedCallback() {
      if (this.button) return;
      this.innerHTML = `<button class="sound-toggle share-toggle" type="button" data-share data-track="header-share">${SHARE_ICON}</button>`;
      this.button = this.querySelector("button");
      this.refresh = () => {
        const label = linkText().shareTitle;
        this.button.setAttribute("aria-label", label);
        this.button.title = label;
      };
      document.addEventListener("languagechange", this.refresh);
      this.refresh();
    }

    disconnectedCallback() {
      document.removeEventListener("languagechange", this.refresh);
    }
  }

  customElements.define("site-logo", SiteLogo);
  customElements.define("theme-toggle", ThemeToggle);
  customElements.define("sound-toggle", SoundToggle);
  customElements.define("share-button", ShareButton);
})();
