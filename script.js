const { PERFIL } = globalThis; // dados pessoais (perfil.js)
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Idiomas ---------- */

// Os textos vêm de i18n/<idioma>.js (dados em window.I18N, também lidos pelo currículo e pelos geradores).
const translations = window.I18N || {};
const htmlLang = Object.fromEntries(Object.entries(globalThis.IDIOMAS).map(([code, idioma]) => [code, idioma.html])); // idiomas.js
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

// Idioma escolhido por último: se o visitante trocar de novo antes do download, vale o mais recente.
let requestedLang = null;

const applyLanguage = (lang) => {
  requestedLang = lang;
  // Idioma ainda não baixado (só pt e en vêm na página): busca o arquivo e aplica quando chegar.
  if (!translations[lang]) {
    translations.load(lang).then((ok) => {
      if (ok && requestedLang === lang) applyLanguage(lang);
      else if (!ok) langSelect.value = currentLang;
    });
    return;
  }
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
    link.href = PERFIL.cv(lang);
  });

  updateMenuLabel();
  formatUpdatedDate();
  document.dispatchEvent(new CustomEvent("languagechange"));
};

const langSelect = document.querySelector("[data-lang-select]");
langSelect.addEventListener("change", () => {
  storeLang(langSelect.value);
  applyLanguage(langSelect.value);
});

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
    const response = await fetch(`https://api.github.com/users/${PERFIL.github}/repos?per_page=100`);
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

/* ---------- Guia rápido do portfólio ---------- */

const guide = document.querySelector("[data-quick-guide]");
const guideOpen = document.querySelector("[data-guide-open]");
const guideText = document.querySelector("[data-guide-text]");
const guideProgress = document.querySelector("[data-guide-progress]");
const guidePrevious = document.querySelector("[data-guide-previous]");
const guideNext = document.querySelector("[data-guide-next]");
const guideDemo = document.querySelector("[data-guide-demo]");
// Passos com "demo" destacam o card do projeto e mostram o botão "Abrir demo".
const guideSteps = [
  { target: "#inicio .hero-actions", key: "guide.step1" },
  { target: ".site-header .nav", key: "guide.step2" },
  { target: "#projetos .section-topline", key: "guide.step3" },
  { demo: "lstm", key: "guide.demoLstm" },
  { demo: "filmes", key: "guide.demoFilmes" },
  { demo: "face", key: "guide.demoFace" },
  { demo: "guardrail", key: "guide.demoGuardrail" },
  { target: ".chat-toggle, [data-hero-ask]:not([hidden]), .hero-match", key: "guide.step4" },
  { target: "#contato .contact-inner h2", key: "guide.step5" },
];
let guideIndex = 0;
let guideTarget = null;

const clearGuideTarget = () => {
  guideTarget?.removeAttribute("data-guide-highlight");
  guideTarget = null;
};

const demoLink = (demo) => document.querySelector(`.project-card [data-demo="${demo}"]`);

// Card do projeto da demo; se um filtro de categoria o esconde, volta para "Todos".
const demoCard = (demo) => {
  const card = demoLink(demo)?.closest(".project-card");
  if (card?.hidden) document.querySelector('[data-filter-group="projetos"] [data-filter="todos"]')?.click();
  return card;
};

const renderGuideStep = () => {
  const step = guideSteps[guideIndex];
  clearGuideTarget();
  guideTarget = step.demo ? demoCard(step.demo) : document.querySelector(step.target);
  guideDemo.hidden = !step.demo;
  guideTarget?.setAttribute("data-guide-highlight", "");
  guideText.textContent = t(step.key);
  guideProgress.textContent = t("guide.progress", { current: guideIndex + 1, total: guideSteps.length });
  guidePrevious.disabled = guideIndex === 0;
  guideNext.textContent = t(guideIndex === guideSteps.length - 1 ? "guide.finish" : "guide.next");
  guideTarget?.scrollIntoView({ behavior: prefersReducedMotion ? "instant" : "smooth", block: "center" });
};

const closeGuide = () => {
  guide.hidden = true;
  clearGuideTarget();
  try {
    localStorage.setItem("portfolio-guide-seen", "true");
  } catch {
    /* navegação privada: o guia continua disponível pelo botão */
  }
  guideOpen.focus();
};

guideOpen.hidden = false;
guideOpen.addEventListener("click", () => {
  guideIndex = 0;
  guide.hidden = false;
  renderGuideStep();
  guideNext.focus();
});

guidePrevious.addEventListener("click", () => {
  if (guideIndex === 0) return;
  guideIndex -= 1;
  renderGuideStep();
});

guideNext.addEventListener("click", () => {
  if (guideIndex === guideSteps.length - 1) {
    closeGuide();
    return;
  }
  guideIndex += 1;
  renderGuideStep();
});

// Abre a demo pelo próprio link do card (navegação e contagem de cliques iguais às do card).
guideDemo.addEventListener("click", () => {
  const link = demoLink(guideSteps[guideIndex].demo);
  closeGuide();
  link?.click();
});

guide.querySelector("[data-guide-close]").addEventListener("click", closeGuide);
guide.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeGuide();
});
document.addEventListener("languagechange", () => {
  if (!guide.hidden) renderGuideStep();
});

try {
  if (!localStorage.getItem("portfolio-guide-seen") && !location.hash) {
    setTimeout(() => {
      guide.hidden = false;
      renderGuideStep();
      guideNext.focus();
    }, 1200);
  }
} catch {
  /* navegação privada: o guia continua disponível pelo botão */
}

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

// Usado pelo assistente (chat.js) e pelo formulário (contact.js). currentLang acompanha a troca de idioma.
export { currentLang, prefersReducedMotion, t };
