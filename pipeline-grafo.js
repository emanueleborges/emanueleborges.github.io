// Seções interativas (melhoria progressiva: sem JS, a página continua com a linha do tempo e a grade):
//   1. Experiência como pipeline de CI/CD — cada emprego é uma etapa (concluída / em execução); ao
//      escolher uma, abre o "log" com as conquistas e a stack mais citada naquele período.
//   2. Grafo de habilidades — habilidades no anel externo, projetos no interno; tocar numa habilidade
//      acende os projetos ligados a ela (e vice-versa). As ligações saem do próprio texto da página.

import { prefersReducedMotion, t } from "./script.js";
import { normalize } from "./chat/texto.js";

const text = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
const scrollTo = (el) => el?.scrollIntoView({ behavior: prefersReducedMotion ? "instant" : "smooth", block: "center" });

// Destaca um card de projeto (volta o filtro para "Todos" se ele estiver escondido).
const flash = (el) => {
  if (!el) return;
  if (el.hidden) document.querySelector('[data-filter-group="projetos"] [data-filter="todos"]')?.click();
  scrollTo(el);
  el.setAttribute("data-spotlight-hit", "");
  setTimeout(() => el.removeAttribute("data-spotlight-hit"), 2400);
};

/* ---------- Habilidade × texto ---------- */

// "PHP/Laravel" → ["php", "laravel"]; "Node.js" → ["node"]; "HTML & CSS" → ["html", "css"].
const aliases = (name) =>
  normalize(name)
    .split(/\s*[/&]\s*/)
    .map((part) => part.replace(/\.js$/, "").trim())
    .filter((part) => part.length > 1);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const matcher = (name) => {
  const patterns = aliases(name).map((alias) => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(alias)}(s|\\.js)?(?=$|[^\\p{L}\\p{N}])`, "u"));
  return (haystack) => patterns.some((pattern) => pattern.test(haystack));
};

const skillList = () =>
  [...document.querySelectorAll(".skills-grid .skill-chip")].map((chip) => ({
    name: text(chip.querySelector("strong")),
    category: chip.dataset.category.split(" ")[0],
    test: matcher(text(chip.querySelector("strong"))),
  }));

/* ---------- 1. Experiência como pipeline ---------- */

const timeline = document.querySelector(".experience-section .timeline");

if (timeline) {
  const jobs = [...timeline.querySelectorAll(".job")];
  // Na página, o emprego atual vem primeiro; na esteira, da etapa mais antiga para a atual.
  const stages = [...jobs].reverse();
  const pipeline = document.createElement("div");
  pipeline.className = "pipeline";
  pipeline.setAttribute("role", "group");
  // A seção é uma grade de 2 colunas: esteira e etapas ficam juntas na coluna da direita.
  const column = document.createElement("div");
  column.className = "pipeline-column";
  timeline.before(column);
  column.append(pipeline, timeline);
  timeline.classList.add("is-pipeline");
  let selected = jobs[0];

  const shortName = (job) => {
    const [before, after] = text(job.querySelector(".job-company")).split(/\s+—\s+/);
    return before.length <= 12 || !after ? before : after;
  };
  const years = (job) => {
    const [start, end] = text(job.querySelector(".job-period")).match(/\d{4}/g) ?? [];
    return { start, end };
  };

  const render = () => {
    pipeline.setAttribute("aria-label", t("exp.pipeAria"));
    const skills = skillList();
    pipeline.replaceChildren(
      ...stages.flatMap((job, i) => {
        const { start, end } = years(job);
        const running = !end;
        job.id ||= `job-${i + 1}`;
        const tab = document.createElement("button");
        tab.type = "button";
        tab.id = `${job.id}-tab`;
        tab.className = `pipe-stage ${running ? "is-running" : "is-passed"}`;
        tab.setAttribute("aria-controls", job.id);
        tab.setAttribute("aria-pressed", String(job === selected));
        tab.innerHTML = `<span class="pipe-icon" aria-hidden="true">${running ? "●" : "✓"}</span><span class="pipe-name"></span><span class="pipe-meta mono"></span>`;
        tab.querySelector(".pipe-name").textContent = shortName(job);
        tab.querySelector(".pipe-meta").textContent = `${start ?? ""} → ${end ?? t("exp.now")}`;
        tab.addEventListener("click", () => select(job, true));

        // Cabeçalho de "log" e stack mais citada no período (habilidades que aparecem no texto do emprego).
        job.querySelector(".job-log")?.remove();
        job.querySelector(".job-stack")?.remove();
        const head = document.createElement("p");
        head.className = "job-log mono";
        head.textContent = `$ job ${i + 1}/${stages.length} · ${t(running ? "exp.running" : "exp.passed")}`;
        head.dataset.state = running ? "running" : "passed";
        job.prepend(head);
        const haystack = normalize(text(job));
        const stack = skills.filter((skill) => skill.test(haystack)).slice(0, 8);
        if (stack.length) {
          const list = document.createElement("ul");
          list.className = "job-stack mono";
          list.setAttribute("aria-label", t("exp.stack"));
          list.dataset.label = t("exp.stack");
          list.append(...stack.map((skill) => Object.assign(document.createElement("li"), { textContent: skill.name })));
          job.append(list);
        }

        if (i === stages.length - 1) return [tab];
        const link = document.createElement("span");
        link.className = "pipe-link";
        link.setAttribute("aria-hidden", "true");
        return [tab, link];
      }),
    );
    jobs.forEach((job) => (job.hidden = job !== selected));
  };

  const select = (job, focus) => {
    selected = job;
    pipeline.querySelectorAll(".pipe-stage").forEach((tab) => {
      const on = tab.getAttribute("aria-controls") === job.id;
      tab.setAttribute("aria-pressed", String(on));
      if (on && focus) tab.focus();
    });
    jobs.forEach((item) => (item.hidden = item !== job));
    job.classList.add("is-visible");
  };

  // Setas ←/→ trocam de etapa.
  pipeline.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const i = stages.indexOf(selected);
    const next = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: stages.length - 1 }[event.key];
    select(stages[(next + stages.length) % stages.length], true);
  });

  document.addEventListener("languagechange", render);
  render();
}

/* ---------- 2. Grafo de habilidades ---------- */

const panel = document.querySelector(".skills-panel");
const projectCards = [...document.querySelectorAll(".project-card")];

if (panel && projectCards.length) {
  const SVG = "http://www.w3.org/2000/svg";
  const CATEGORY_ORDER = ["backend", "frontend", "ia", "dados", "devops", "praticas"];
  const R_SKILL = 290;
  const R_PROJECT = 140;
  const svgEl = (tag, attrs = {}) => {
    const node = document.createElementNS(SVG, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  };

  // Alternância Grade / Grafo (padrão: grade).
  const views = document.createElement("div");
  views.className = "skills-views";
  views.setAttribute("role", "group");
  views.innerHTML =
    '<button type="button" class="skills-view" data-view="grid" aria-pressed="false"><span aria-hidden="true">▦</span> <span data-label></span></button><button type="button" class="skills-view" data-view="graph" aria-pressed="false"><span aria-hidden="true">◎</span> <span data-label></span></button>';
  panel.prepend(views);

  const figure = document.createElement("figure");
  figure.className = "skills-graph";
  figure.innerHTML = '<svg viewBox="-470 -470 940 940" role="group"></svg><figcaption class="graph-info" aria-live="polite"></figcaption>';
  panel.append(figure);
  const svg = figure.querySelector("svg");
  const info = figure.querySelector(".graph-info");

  let view = "grid";
  let selected = null; // nó fixado por clique
  let nodes = [];
  let edges = [];

  const setView = (next) => {
    view = next;
    panel.classList.toggle("is-graph", view === "graph");
    views.querySelectorAll("[data-view]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.view === view)));
  };
  views.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (button) setView(button.dataset.view);
  });

  const neighbors = (node) => edges.filter((edge) => edge.skill === node || edge.project === node).map((edge) => (edge.skill === node ? edge.project : edge.skill));

  const describe = (node) => {
    if (!node) {
      info.textContent = t("skills.graphHint");
      return;
    }
    const linked = neighbors(node);
    info.replaceChildren();
    const title = document.createElement("strong");
    if (node.kind === "skill") {
      title.textContent = linked.length ? t("skills.graphSkill", { name: node.name, n: linked.length }) : t("skills.graphNone", { name: node.name });
      info.append(title);
      linked.forEach((project) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "graph-chip";
        button.textContent = `${project.number} · ${project.name}`;
        button.addEventListener("click", () => flash(project.card));
        info.append(button);
      });
    } else {
      title.textContent = t("skills.graphProject", { name: `${node.number} · ${node.name}`, n: linked.length });
      const button = document.createElement("button");
      button.type = "button";
      button.className = "graph-chip is-primary";
      button.textContent = t("skills.graphOpen");
      button.addEventListener("click", () => flash(node.card));
      const names = document.createElement("span");
      names.className = "graph-skills mono";
      names.textContent = linked.map((skill) => skill.name).join(" · ");
      info.append(title, names, button);
    }
  };

  const highlight = (node) => {
    const linked = new Set(node ? [node, ...neighbors(node)] : []);
    svg.classList.toggle("has-focus", Boolean(node));
    nodes.forEach((item) => item.el.classList.toggle("is-on", linked.has(item)));
    edges.forEach((edge) => edge.el.classList.toggle("is-on", Boolean(node) && (edge.skill === node || edge.project === node)));
    const center = svg.querySelector(".graph-center");
    center.querySelector("tspan:first-child").textContent = node ? (node.kind === "skill" ? node.name : node.number) : String(edges.length);
    center.querySelector("tspan:last-child").textContent = node
      ? node.kind === "skill"
        ? t("skills.graphProjects", { n: neighbors(node).length })
        : node.name.length > 26
          ? `${node.name.slice(0, 25)}…`
          : node.name
      : t("skills.graphLinks");
    describe(node);
  };

  const render = () => {
    views.querySelector('[data-view="graph"] [data-label]').textContent = t("skills.viewGraph");
    views.querySelector('[data-view="grid"] [data-label]').textContent = t("skills.viewGrid");
    views.setAttribute("aria-label", t("skills.viewAria"));
    svg.setAttribute("aria-label", t("skills.graphAria"));

    const skills = skillList().sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
    const projects = projectCards.map((card) => ({
      kind: "project",
      card,
      name: text(card.querySelector("h3")),
      number: text(card.querySelector(".art-number")).split("/")[0].trim(),
      haystack: normalize(`${text(card.querySelector(".project-type"))} ${text(card.querySelector("h3"))} ${text(card.querySelector(".muted"))}`),
    }));

    // Anel externo: habilidades agrupadas por categoria, com um respiro entre os grupos.
    const groups = CATEGORY_ORDER.filter((category) => skills.some((skill) => skill.category === category));
    const slots = skills.length + groups.length;
    let slot = 0;
    let previous = null;
    const skillNodes = skills.map((skill) => {
      if (skill.category !== previous) slot += 1;
      previous = skill.category;
      const angle = ((slot++ / slots) * 360 - 90) * (Math.PI / 180);
      return { ...skill, kind: "skill", angle, x: Math.cos(angle) * R_SKILL, y: Math.sin(angle) * R_SKILL };
    });
    const projectNodes = projects.map((project, i) => {
      const angle = ((i / projects.length) * 360 - 90) * (Math.PI / 180);
      return { ...project, angle, x: Math.cos(angle) * R_PROJECT, y: Math.sin(angle) * R_PROJECT };
    });
    nodes = [...skillNodes, ...projectNodes];
    edges = skillNodes.flatMap((skill) => projectNodes.filter((project) => skill.test(project.haystack)).map((project) => ({ skill, project })));

    svg.replaceChildren();
    const edgeLayer = svgEl("g", { class: "graph-edges" });
    const nodeLayer = svgEl("g", { class: "graph-nodes" });
    svg.append(svgEl("circle", { class: "graph-ring", r: R_SKILL }), svgEl("circle", { class: "graph-ring", r: R_PROJECT }), edgeLayer, nodeLayer);

    // Curvas puxadas para o centro: parecem feixes de uma rede neural.
    edges.forEach((edge) => {
      const cx = (edge.skill.x + edge.project.x) * 0.3;
      const cy = (edge.skill.y + edge.project.y) * 0.3;
      edge.el = svgEl("path", { d: `M${edge.skill.x.toFixed(1)},${edge.skill.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${edge.project.x.toFixed(1)},${edge.project.y.toFixed(1)}`, class: `graph-edge cat-${edge.skill.category}` });
      edgeLayer.append(edge.el);
    });

    nodes.forEach((node) => {
      const degree = edges.filter((edge) => edge.skill === node || edge.project === node).length;
      const g = svgEl("g", {
        class: `graph-node is-${node.kind} cat-${node.category ?? "project"}${degree ? "" : " is-isolated"}`,
        tabindex: "0",
        role: "button",
        "aria-pressed": "false",
        "aria-label": node.kind === "skill" ? t("skills.graphSkill", { name: node.name, n: degree }) : t("skills.graphProject", { name: node.name, n: degree }),
      });
      if (node.kind === "skill") {
        const deg = (node.angle * 180) / Math.PI;
        const flip = deg > 90 && deg < 270;
        g.append(svgEl("circle", { cx: node.x, cy: node.y, r: 4 + Math.min(degree, 6) }));
        const label = svgEl("text", {
          x: node.x + Math.cos(node.angle) * 16,
          y: node.y + Math.sin(node.angle) * 16,
          transform: `rotate(${flip ? deg - 180 : deg} ${node.x + Math.cos(node.angle) * 16} ${node.y + Math.sin(node.angle) * 16})`,
          "text-anchor": flip ? "end" : "start",
          "dominant-baseline": "central",
        });
        label.textContent = node.name;
        g.append(label);
      } else {
        g.append(svgEl("circle", { cx: node.x, cy: node.y, r: 17 }));
        const label = svgEl("text", { x: node.x, y: node.y, "text-anchor": "middle", "dominant-baseline": "central" });
        label.textContent = node.number;
        g.append(label);
      }
      const title = svgEl("title");
      title.textContent = node.name;
      g.append(title);
      node.el = g;

      g.addEventListener("pointerenter", () => highlight(node));
      g.addEventListener("pointerleave", () => highlight(selected));
      g.addEventListener("focus", () => highlight(node));
      g.addEventListener("blur", () => highlight(selected));
      const toggle = () => {
        selected = selected === node ? null : node;
        nodes.forEach((item) => item.el.setAttribute("aria-pressed", String(item === selected)));
        highlight(selected ?? node);
      };
      g.addEventListener("click", toggle);
      g.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle();
        }
      });
      nodeLayer.append(g);
    });

    const center = svgEl("text", { class: "graph-center", "text-anchor": "middle" });
    center.append(svgEl("tspan", { x: 0, y: -6 }), svgEl("tspan", { x: 0, dy: 26 }));
    svg.append(center);
    selected = selected && nodes.find((node) => node.name === selected.name && node.kind === selected.kind);
    highlight(selected);
  };

  // Clique fora dos nós solta a seleção.
  svg.addEventListener("click", (event) => {
    if (event.target.closest(".graph-node")) return;
    selected = null;
    nodes.forEach((item) => item.el.setAttribute("aria-pressed", "false"));
    highlight(null);
  });

  document.addEventListener("languagechange", render);
  render();
  setView(view);
}
