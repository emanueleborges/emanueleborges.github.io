const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Estatísticas (GoatCounter) ---------- */

// Registra um evento no painel do GoatCounter (ignorado se o script não carregou).
const track = (path, title = path) => {
  window.goatcounter?.count?.({ path, title, event: true });
};

/* ---------- Idiomas ---------- */

const translations = window.I18N || {};
const htmlLang = { en: "en", pt: "pt-BR", es: "es", fr: "fr", it: "it", de: "de", zh: "zh-CN", ru: "ru" };
const supportedLangs = Object.keys(htmlLang);
const defaultLang = "en";
let currentLang = "pt";

const t = (key, vars = {}) => {
  const text = translations[currentLang]?.[key] ?? translations.pt?.[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
};

// Guarda o texto original (português, escrito no HTML) de cada elemento traduzível.
const i18nTargets = [
  ["data-i18n", (el) => el.innerHTML, (el, value) => (el.innerHTML = value)],
  ["data-i18n-aria", (el) => el.getAttribute("aria-label"), (el, value) => el.setAttribute("aria-label", value)],
  ["data-i18n-content", (el) => el.getAttribute("content"), (el, value) => el.setAttribute("content", value)],
  ["data-i18n-alt", (el) => el.getAttribute("alt"), (el, value) => el.setAttribute("alt", value)],
  ["data-i18n-placeholder", (el) => el.getAttribute("placeholder"), (el, value) => el.setAttribute("placeholder", value)],
  ["data-i18n-title", (el) => el.getAttribute("title"), (el, value) => el.setAttribute("title", value)],
].map(([attr, read, write]) => ({
  attr,
  write,
  elements: [...document.querySelectorAll(`[${attr}]`)].map((el) => ({ el, original: read(el) })),
}));

const readStoredLang = () => {
  try {
    return localStorage.getItem("lang");
  } catch {
    return null;
  }
};

const storeLang = (lang) => {
  try {
    localStorage.setItem("lang", lang);
  } catch {
    /* navegação privada: segue sem salvar */
  }
};

const detectLang = () => {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (supportedLangs.includes(fromUrl)) return fromUrl;
  const stored = readStoredLang();
  if (supportedLangs.includes(stored)) return stored;
  return defaultLang;
};

const applyLanguage = (lang) => {
  currentLang = lang;
  document.documentElement.lang = htmlLang[lang];

  i18nTargets.forEach(({ attr, write, elements }) => {
    elements.forEach(({ el, original }) => {
      const translated = lang === "pt" ? null : translations[lang]?.[el.getAttribute(attr)];
      write(el, translated ?? original);
    });
  });

  langSelect.value = lang;
  document.querySelectorAll("[data-cv-link]").forEach((link) => {
    link.href = `cv/curriculo-emanuel-borges-${lang}.pdf`;
  });

  updateMenuLabel();
  formatUpdatedDate();
  document.dispatchEvent(new CustomEvent("languagechange"));
};

const langSelect = document.querySelector("[data-lang-select]");
langSelect.addEventListener("change", () => {
  storeLang(langSelect.value);
  applyLanguage(langSelect.value);
  track(`idioma-${langSelect.value}`, `Trocou idioma para ${langSelect.value.toUpperCase()}`);
});

/* ---------- Mapa de cliques e de atenção (GoatCounter, sem cookies) ---------- */

// Cada clique vira "clique/<área>/<elemento>" e cada seção vista vira "secao/<id>" (uma vez por
// visita à página). Os nomes são fixos — iguais nos 8 idiomas — e nada do que o visitante digita é enviado.
const slug = (text) =>
  String(text).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

function clickArea(el) {
  if (el.closest(".chat")) return "chat";
  if (el.closest(".site-header")) return "cabecalho";
  if (el.closest("footer")) return "rodape";
  return el.closest("section[id]")?.id ?? "outros";
}

function clickLabel(el) {
  const link = el.closest("a[href]");
  if (link) {
    const href = link.getAttribute("href");
    if (link.dataset.demo) return `demo/${link.dataset.demo}`;
    if (link.dataset.repo) return `codigo/${link.dataset.repo}`;
    if (link.hasAttribute("data-match-link")) return "match-vaga";
    if (link.hasAttribute("data-cv-link") || href.startsWith("cv/")) return `curriculo/${currentLang}`;
    if (href.startsWith("mailto:")) return "email";
    if (href.includes("wa.me")) return "whatsapp";
    if (href.includes("linkedin.com")) return "linkedin";
    if (href.includes("github.com")) return "github";
    if (link.classList.contains("brand")) return "logo";
    if (href.startsWith("#")) return `${link.closest(".nav-links") ? "menu" : "link"}/${href.slice(1) || "topo"}`;
    try {
      return `externo/${new URL(href, location.href).hostname}`;
    } catch {
      return "link";
    }
  }
  const button = el.closest("button");
  if (button) {
    if (button.matches("[data-filter]")) return `filtro/${button.closest("[data-filter-group]")?.dataset.filterGroup}/${button.dataset.filter}`;
    if (button.matches("[data-theme-toggle]")) return "tema";
    if (button.matches(".menu-toggle")) return "abrir-menu";
    if (button.matches("[data-hero-ask]")) return "pergunte-ia";
    if (button.matches(".chat-toggle")) return "abrir";
    if (button.matches(".chat-close")) return "fechar";
    if (button.matches(".chat-chip")) return "sugestao";
    if (button.matches(".chat-goto")) return "ver-na-pagina";
    if (button.matches(".chat-rate-button")) return "avaliar";
    if (button.matches(".chat-hint-text, .chat-hint-close")) return "convite";
    if (button.type === "submit") return "enviar";
    return `botao/${slug(button.className.split(" ")[0] || "sem-nome")}`;
  }
  // Cliques no que não é link também mostram interesse (ex.: card de projeto, habilidade).
  const card = el.closest(".project-card");
  if (card) return `card/${card.querySelector("[data-repo]")?.dataset.repo ?? "projeto"}`;
  const skill = el.closest(".skill-chip");
  if (skill) return `habilidade/${slug(skill.querySelector("strong")?.dataset.i18n ?? skill.querySelector("strong")?.textContent ?? "")}`;
  if (el.closest(".job")) return "emprego";
  if (el.closest(".education-list li")) return "formacao-item";
  if (el.closest(".about-photo")) return "foto";
  return null; // áreas vazias não contam
}

document.addEventListener(
  "click",
  (event) => {
    const label = clickLabel(event.target);
    if (!label) return;
    const area = clickArea(event.target);
    track(`clique/${area}/${label}`, `Clique: ${area} › ${label}`);
  },
  { capture: true },
);

// Seção "vista" quando cruza a faixa central da tela (vale para seções mais altas que a tela) ou quando
// metade dela aparece (vale para a última seção, que não chega ao meio da tela).
if ("IntersectionObserver" in window) {
  const seen = new Set();
  const markSeen = (entries) =>
    entries.forEach((entry) => {
      const id = entry.target.id;
      if (!entry.isIntersecting || seen.has(id)) return;
      seen.add(id);
      track(`secao/${id}`, `Viu a seção: ${id}`);
    });
  const band = new IntersectionObserver(markSeen, { rootMargin: "-45% 0px -45% 0px" });
  const half = new IntersectionObserver(markSeen, { threshold: 0.5 });
  document.querySelectorAll("main section[id]").forEach((section) => {
    band.observe(section);
    half.observe(section);
  });
}

/* O tema é aplicado por components/boot.js e trocado pelo componente <theme-toggle> (components/components.js). */

/* ---------- Menu mobile ---------- */

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav-links");

function updateMenuLabel() {
  const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-label", t(isExpanded ? "menu.close" : "menu.open"));
}

menuButton.addEventListener("click", () => {
  const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isExpanded));
  navigation.classList.toggle("is-open", !isExpanded);
  updateMenuLabel();
});

navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuButton.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
    updateMenuLabel();
  }
});

document.querySelector("#year").textContent = new Date().getFullYear();

// Data da última atualização (atualizada pelo hook de pre-commit do git).
function formatUpdatedDate() {
  const updated = document.querySelector("#updated");
  const [year, month, day] = updated.getAttribute("datetime").split("-").map(Number);
  updated.textContent = new Intl.DateTimeFormat(htmlLang[currentLang], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

/* ---------- Filtros por categoria ---------- */

document.querySelectorAll("[data-filter-group]").forEach((tabList) => {
  const group = tabList.dataset.filterGroup;
  const items = document.querySelectorAll(`[data-filter-items="${group}"] > [data-category]`);
  const counter = document.querySelector(`[data-filter-count="${group}"]`);
  let activeFilter = "todos";

  const applyFilter = (filter) => {
    activeFilter = filter;
    let visible = 0;
    items.forEach((item) => {
      const matches = filter === "todos" || item.dataset.category.split(" ").includes(filter);
      item.hidden = !matches;
      if (matches) visible += 1;
    });
    if (counter) counter.textContent = t("filter.count", { n: visible, total: items.length });
  };

  tabList.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-filter]");
    if (!tab) return;
    tabList.querySelectorAll("[data-filter]").forEach((button) => {
      const isActive = button === tab;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    applyFilter(tab.dataset.filter);
  });

  document.addEventListener("languagechange", () => applyFilter(activeFilter));
  applyFilter(activeFilter);
});

/* ---------- Dados dos repositórios (API pública do GitHub) ---------- */

// Uma única chamada traz todos os repositórios; sem chave (limite de 60/h por visitante).
// Fica guardada na sessão. Se falhar, os cards seguem só com o link "Ver código".
let repoData = null;

const relativeTime = (iso) => {
  const days = Math.round((new Date(iso) - Date.now()) / 86400000);
  const [value, unit] =
    Math.abs(days) >= 365 ? [Math.round(days / 365), "year"]
    : Math.abs(days) >= 30 ? [Math.round(days / 30), "month"]
    : Math.abs(days) >= 7 ? [Math.round(days / 7), "week"]
    : [days, "day"];
  return new Intl.RelativeTimeFormat(htmlLang[currentLang], { numeric: "auto" }).format(value, unit);
};

const renderRepoMeta = () => {
  if (!repoData) return;
  document.querySelectorAll("[data-repo-meta]").forEach((meta) => {
    const repo = repoData[meta.dataset.repoMeta];
    if (!repo) return;
    meta.textContent = [
      repo.language,
      repo.stars > 0 ? `★ ${repo.stars}` : null,
      t("proj.updated", { when: relativeTime(repo.pushed) }),
    ].filter(Boolean).join(" · ");
  });
};

const loadRepoData = async () => {
  try {
    repoData = JSON.parse(sessionStorage.getItem("repos"));
  } catch {
    /* sem sessionStorage: busca de novo */
  }
  if (!repoData) {
    const response = await fetch("https://api.github.com/users/emanueleborges/repos?per_page=100");
    if (!response.ok) return;
    repoData = Object.fromEntries(
      (await response.json()).map((r) => [r.name, { language: r.language, stars: r.stargazers_count, pushed: r.pushed_at }]),
    );
    try {
      sessionStorage.setItem("repos", JSON.stringify(repoData));
    } catch {
      /* navegação privada: segue sem guardar */
    }
  }
  renderRepoMeta();
};

document.addEventListener("languagechange", renderRepoMeta);
if (location.protocol.startsWith("http")) loadRepoData().catch(() => {});

applyLanguage(detectLang());

/* ---------- Cabeçalho: sombra e progresso de leitura ---------- */

const header = document.querySelector(".site-header");
const progress = document.querySelector(".scroll-progress");

const onScroll = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  header.classList.toggle("is-scrolled", scrollY > 10);
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
};
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Imagens do topo em rotação ---------- */

const slides = document.querySelectorAll(".hero-slide");

// As imagens seguintes só são baixadas quando vão aparecer (versão menor no celular).
const loadSlide = (slide) => {
  const url = matchMedia("(max-width: 760px)").matches ? slide.dataset.bgMobile : slide.dataset.bg;
  if (url && !slide.style.backgroundImage) slide.style.backgroundImage = `url('${url}')`;
};

if (slides.length > 1 && !prefersReducedMotion) {
  let current = 0;
  // Pré-carrega a próxima imagem alguns segundos antes da troca.
  setTimeout(() => loadSlide(slides[1]), 3000);
  setInterval(() => {
    slides[current].classList.remove("is-active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("is-active");
    loadSlide(slides[(current + 1) % slides.length]);
  }, 7000);
}

/* ---------- Elementos surgindo ao rolar ---------- */

const revealSelectors = [
  ".section-heading",
  ".skills-intro",
  ".about-content",
  ".section-aside",
  ".job",
  ".project-card",
  ".skill-chip",
  ".education-list li",
  ".education-extra > div",
  ".contact-inner",
];

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );

  document.querySelectorAll(revealSelectors.join(",")).forEach((el) => {
    const siblings = [...el.parentElement.children].filter((child) => child.matches(revealSelectors.join(",")));
    el.style.setProperty("--reveal-delay", `${Math.min(siblings.indexOf(el), 8) * 70}ms`);
    el.classList.add("reveal");
    observer.observe(el);
  });
}

/* ---------- Luz que segue o mouse nos cards ---------- */

document.querySelectorAll(".project-card, .skill-chip").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    card.style.setProperty("--my", `${event.clientY - rect.top}px`);
  });
});

/* ---------- Rede de partículas no fundo ---------- */

const canvas = document.querySelector(".bg-canvas");
const ctx = canvas.getContext("2d");
const pointer = { x: -9999, y: -9999 };
let particles = [];
// Cores das partículas vêm do tema (variáveis --particle-a/-b do CSS).
let particleColors = {};
const readParticleColors = () => {
  const style = getComputedStyle(document.documentElement);
  particleColors = { a: style.getPropertyValue("--particle-a").trim(), b: style.getPropertyValue("--particle-b").trim() };
};
readParticleColors();
document.addEventListener("themechange", () => {
  readParticleColors();
  if (prefersReducedMotion) drawParticles();
});
let animationId = null;

const resizeCanvas = () => {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * ratio;
  canvas.height = innerHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.round(Math.min(90, (innerWidth * innerHeight) / 16000));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: Math.random() * 1.6 + 0.6,
    cyan: Math.random() < 0.35,
  }));
  if (prefersReducedMotion) drawParticles();
};

function drawParticles() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  const linkDistance = 130;

  particles.forEach((p, i) => {
    if (!prefersReducedMotion) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > innerWidth) p.vx *= -1;
      if (p.y < 0 || p.y > innerHeight) p.vy *= -1;

      const dx = pointer.x - p.x;
      const dy = pointer.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 160 && dist > 0) {
        p.x -= (dx / dist) * 0.6;
        p.y -= (dy / dist) * 0.6;
      }
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.cyan ? `rgba(${particleColors.b}, 0.75)` : `rgba(${particleColors.a}, 0.7)`;
    ctx.fill();

    for (let j = i + 1; j < particles.length; j += 1) {
      const q = particles[j];
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < linkDistance) {
        const alpha = 0.22 * (1 - d / linkDistance);
        ctx.strokeStyle = p.cyan && q.cyan ? `rgba(${particleColors.b}, ${alpha})` : `rgba(${particleColors.a}, ${alpha})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
  });
}

const loop = () => {
  drawParticles();
  animationId = requestAnimationFrame(loop);
};

addEventListener("resize", resizeCanvas);
addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
});
document.addEventListener("pointerleave", () => {
  pointer.x = pointer.y = -9999;
});

resizeCanvas();
if (!prefersReducedMotion) {
  loop();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      loop();
    }
  });
}

/* ---------- App instalável e offline (service worker) ---------- */

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
