const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Estatísticas (GoatCounter) ---------- */

// Registra um evento no painel do GoatCounter (ignorado se o script não carregou).
const track = (path, title = path) => {
  window.goatcounter?.count?.({ path, title, event: true });
};

/* ---------- Idiomas ---------- */

const translations = window.I18N || {};
const htmlLang = { en: "en", pt: "pt-BR", es: "es", fr: "fr", it: "it", zh: "zh-CN", ru: "ru" };
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

// Cliques em currículo e contatos.
document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (!link) return;
  const href = link.getAttribute("href");
  if (link.hasAttribute("data-cv-link") || href.startsWith("cv/")) track(`curriculo-${currentLang}`, `Baixou currículo (${currentLang.toUpperCase()})`);
  else if (href.includes("wa.me")) track("contato-whatsapp", "Clicou no WhatsApp");
  else if (href.startsWith("mailto:")) track("contato-email", "Clicou no e-mail");
  else if (href.includes("linkedin.com")) track("contato-linkedin", "Clicou no LinkedIn");
  else if (href.includes("github.com")) track("contato-github", "Clicou no GitHub");
});

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
if (slides.length > 1 && !prefersReducedMotion) {
  let current = 0;
  setInterval(() => {
    slides[current].classList.remove("is-active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("is-active");
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
    ctx.fillStyle = p.cyan ? "rgba(103, 232, 249, 0.75)" : "rgba(195, 165, 255, 0.7)";
    ctx.fill();

    for (let j = i + 1; j < particles.length; j += 1) {
      const q = particles[j];
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < linkDistance) {
        const alpha = 0.22 * (1 - d / linkDistance);
        ctx.strokeStyle = p.cyan && q.cyan ? `rgba(34, 211, 238, ${alpha})` : `rgba(155, 112, 255, ${alpha})`;
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
