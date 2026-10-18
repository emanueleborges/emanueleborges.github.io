// Busca rápida (estilo Spotlight/Raycast): "/" ou Ctrl/⌘+K abre uma barra que encontra projetos,
// experiências, habilidades, seções e ações da página — com a mesma busca local do chat (chat/busca.js),
// sem enviar nada a servidor. "Filtrar projetos" mostra só os cards do assunto; "Perguntar à IA"
// leva a pergunta ao assistente (evento portfolio:ask, tratado em chat.js).

import { prefersReducedMotion, t } from "./script.js";
import { text, search } from "./chat/busca.js";
import { normalize, matches } from "./chat/texto.js";

const dialog = document.querySelector("[data-spotlight]");

if (dialog?.showModal) {
  const input = dialog.querySelector("[data-spotlight-input]");
  const list = dialog.querySelector("[data-spotlight-list]");
  const projectCards = [...document.querySelectorAll(".project-card")];
  const filterBar = document.querySelector("[data-query-filter]");
  let options = [];
  let active = 0;
  let lastFocus = null;

  const plain = (html) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const scrollTo = (el) => el?.scrollIntoView({ behavior: prefersReducedMotion ? "instant" : "smooth", block: "center" });

  // Destaca um elemento por alguns segundos depois de pular até ele.
  const flash = (el) => {
    if (!el) return;
    if (el.hidden) document.querySelector('[data-filter-group="projetos"] [data-filter="todos"]')?.click();
    scrollTo(el);
    el.setAttribute("data-spotlight-hit", "");
    setTimeout(() => el.removeAttribute("data-spotlight-hit"), 2400);
  };

  const askAi = (question) => document.dispatchEvent(new CustomEvent("portfolio:ask", { detail: { question } }));

  /* ---------- Filtro dos projetos por assunto ---------- */

  const cardText = (card) =>
    normalize(`${text(card)} ${card.dataset.category.split(" ").includes("ia") ? "ia ai machine learning nlp" : ""}`);

  // Cards que contêm algum dos termos principais da busca (ex.: "rag" em "Quais projetos usam RAG?").
  const matchingCards = (terms) => (terms.length ? projectCards.filter((card) => terms.some((term) => matches(cardText(card), term))) : []);

  const clearQueryFilter = () => {
    if (!filterBar || filterBar.hidden) return;
    filterBar.hidden = true;
    document.querySelector('[data-filter-group="projetos"] [data-filter="todos"]')?.click();
  };

  const applyQueryFilter = (query, cards) => {
    document.querySelector('[data-filter-group="projetos"] [data-filter="todos"]')?.click();
    projectCards.forEach((card) => (card.hidden = !cards.includes(card)));
    filterBar.querySelector("[data-query-filter-text]").textContent = t("search.filtering", { q: query, n: cards.length });
    filterBar.dataset.query = query;
    filterBar.hidden = false;
    scrollTo(document.querySelector("#projetos"));
  };

  if (filterBar) {
    filterBar.querySelector("[data-query-filter-clear]").addEventListener("click", clearQueryFilter);
    filterBar.querySelector("[data-query-filter-ask]").addEventListener("click", () =>
      askAi(t("search.aboutProjects", { q: filterBar.dataset.query })),
    );
    document.querySelector('[data-filter-group="projetos"]')?.addEventListener("click", (event) => {
      if (event.isTrusted && event.target.closest("[data-filter]")) filterBar.hidden = true;
    });
    document.addEventListener("languagechange", () => (filterBar.hidden = true));
  }

  /* ---------- Opções da lista ---------- */

  const sections = () =>
    [...document.querySelectorAll(".nav-links a[href^='#']")].map((link) => ({
      kind: t("search.kindSection"),
      label: text(link),
      run: () => flash(document.querySelector(link.getAttribute("href"))),
    }));

  const actions = () => [
    { kind: t("search.kindAction"), label: t("search.actTheme"), run: () => document.querySelector("[data-theme-toggle]")?.click() },
    { kind: t("search.kindAction"), label: t("search.actSound"), run: () => document.querySelector("[data-sound-toggle]")?.click() },
    { kind: t("search.kindAction"), label: plain(t("cv.download")), run: () => document.querySelector("[data-cv-link]")?.click() },
    { kind: t("search.kindAction"), label: t("search.actMatch"), run: () => document.querySelector("[data-match-link]")?.click() },
    { kind: t("search.kindAction"), label: t("guide.open"), run: () => document.querySelector("[data-guide-open]")?.click() },
    { kind: t("search.kindAction"), label: t("search.actShare"), run: () => window.portfolioShare?.open() },
  ];

  const commands = () => [...sections(), ...actions()];

  const build = (query) => {
    const q = query.trim();
    if (!q) {
      const examples = t("hero.askExamples").split("|").slice(0, 3);
      return [
        ...examples.map((example) => ({ kind: t("search.kindAi"), label: example, run: () => askAi(example), ai: true })),
        ...commands(),
      ];
    }

    const ask = { kind: t("search.kindAi"), label: t("search.ask", { q }), run: () => askAi(q), ai: true };
    const { results, main } = search(q);
    const cards = matchingCards(main);
    const filter = cards.length > 1 && {
      kind: t("search.kindFilter"),
      label: t("search.filter", { q: main.join(" + "), n: cards.length }),
      run: () => applyQueryFilter(q, cards),
    };
    const hits = results.map((result) => ({
      kind: result.section,
      label: result.item || plain(result.body).slice(0, 70),
      detail: result.item ? plain(result.body).slice(0, 90) : "",
      run: () => flash(result.target),
    }));
    const needle = normalize(q);
    const named = commands().filter((command) => normalize(command.label).includes(needle));

    // Pergunta (com "?" ou várias palavras) → IA primeiro; palavra-chave → resultados primeiro.
    const isQuestion = /[?？]$/.test(q) || q.split(/\s+/).length >= 4;
    const found = [...named, filter, ...hits].filter(Boolean);
    return isQuestion ? [ask, ...found] : [...found, ask];
  };

  const select = (index) => {
    active = (index + options.length) % options.length;
    list.querySelectorAll("[role=option]").forEach((el, i) => el.setAttribute("aria-selected", String(i === active)));
    const current = list.children[active];
    input.setAttribute("aria-activedescendant", current?.id ?? "");
    current?.scrollIntoView({ block: "nearest" });
  };

  const render = () => {
    options = build(input.value);
    list.replaceChildren(
      ...options.map((option, i) => {
        const li = document.createElement("li");
        li.id = `spotlight-option-${i}`;
        li.setAttribute("role", "option");
        li.className = option.ai ? "spotlight-option is-ai" : "spotlight-option";
        const kind = document.createElement("span");
        kind.className = "spotlight-kind mono";
        kind.textContent = option.kind;
        const label = document.createElement("span");
        label.className = "spotlight-label";
        label.textContent = option.label;
        li.append(kind, label);
        if (option.detail) {
          const detail = document.createElement("span");
          detail.className = "spotlight-detail";
          detail.textContent = option.detail;
          li.append(detail);
        }
        li.addEventListener("pointermove", () => active !== i && select(i));
        li.addEventListener("click", () => run(i));
        return li;
      }),
    );
    select(0);
  };

  const close = () => {
    if (dialog.open) dialog.close();
  };

  const run = (index) => {
    const option = options[index];
    close();
    option?.run();
  };

  const open = (initial = "") => {
    if (dialog.open) return;
    lastFocus = document.activeElement;
    document.querySelector(".nav-links.is-open") && document.querySelector(".menu-toggle")?.click();
    input.value = initial;
    render();
    dialog.showModal();
    input.focus();
  };

  dialog.addEventListener("close", () => {
    // Volta o foco para onde estava, exceto quando a ação já moveu o foco (ex.: chat aberto).
    if (document.activeElement === document.body) lastFocus?.focus?.({ preventScroll: true });
  });
  // Clique no fundo escurecido fecha.
  dialog.addEventListener("click", (event) => event.target === dialog && close());

  input.addEventListener("input", render);
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      select(active + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Enter" && !event.isComposing) {
      event.preventDefault();
      run(active);
    }
  });

  document.addEventListener("keydown", (event) => {
    const typing = event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable='true']");
    if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      dialog.open ? close() : open();
    } else if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      open();
    }
  });

  document.querySelectorAll("[data-spotlight-open]").forEach((button) => {
    button.hidden = false;
    button.addEventListener("click", () => open());
  });
  document.addEventListener("languagechange", () => dialog.open && render());
}
