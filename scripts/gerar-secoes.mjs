// Gera, a partir dos dados, as partes repetitivas do index.html: os cards de projetos
// (data/projetos.json) e os itens da caixa de ferramentas (data/habilidades.json).
// O HTML continua estático (bom para SEO, funciona sem JavaScript e a busca do chat lê a página);
// os textos em português vêm do i18n.js pela chave — fonte única para site, chat e currículo.
//
// Uso:  node scripts/gerar-secoes.mjs           → atualiza o index.html
//       node scripts/gerar-secoes.mjs --check   → só confere (sai com erro se estiver desatualizado; usado no CI)

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(ROOT, file), "utf8");

// i18n.js define window.I18N; roda num contexto isolado só para ler os textos.
const sandbox = { window: {} };
vm.runInNewContext(read("i18n.js"), sandbox);
const pt = sandbox.window.I18N.pt;
const ptText = (key) => {
  if (!(key in pt)) throw new Error(`Chave "${key}" não existe no i18n.js (pt)`);
  return pt[key]; // já é HTML (ex.: "&amp;"), escrito por nós
};
const escape = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// Campo de texto do JSON: { key } busca no i18n.js; { text } é escrito como está (escapado).
const field = (value) => (value.key ? { attr: ` data-i18n="${value.key}"`, html: ptText(value.key) } : { attr: "", html: escape(value.text) });

function projectCard(p) {
  const type = field(p.type);
  const title = field(p.title);
  const code = `<a class="project-link" href="${escape(p.repoUrl)}" target="_blank" rel="noopener" data-repo="${escape(p.repo)}"><span data-i18n="proj.code">${ptText("proj.code")}</span> <span aria-hidden="true">↗</span></a>`;
  const demo = p.demo
    ? `<a class="project-link project-demo" href="${escape(p.demo.href)}"${p.demo.openChat ? " data-open-chat" : ""} data-demo="${escape(p.demo.name)}"><span data-i18n="proj.demo">${ptText("proj.demo")}</span> <span aria-hidden="true">▶</span></a>`
    : "";
  const actions = demo ? `<span class="project-actions">${demo}${code}</span>` : code;
  return [
    `          <article data-category="${p.categories.join(" ")}" class="project-card${p.featured ? " project-featured" : ""}">`,
    `            <span class="art-number mono">${escape(p.label)}</span>`,
    `            <p class="mono project-type"${type.attr}>${type.html}</p>`,
    `            <h3${title.attr}>${title.html}</h3>`,
    `            <p class="muted" data-i18n="${p.desc.key}">${ptText(p.desc.key)}</p>`,
    `            <div class="project-footer">${actions}<span class="project-meta mono" data-repo-meta="${escape(p.repo)}"></span></div>`,
    "          </article>",
  ].join("\n");
}

function skillChip(s) {
  const name = s.key ? `<strong data-i18n="${s.key}">${ptText(s.key)}</strong>` : `<strong>${escape(s.name)}</strong>`;
  return `            <li data-category="${s.category}" class="skill-chip"><img class="skill-icon" src="${escape(s.icon)}" alt="" loading="lazy" />${name}<span class="mono" data-i18n="cat.${s.category}">${ptText(`cat.${s.category}`)}</span></li>`;
}

const projects = JSON.parse(read("data/projetos.json")).projects;
const skills = JSON.parse(read("data/habilidades.json")).skills;

// Substitui o conteúdo entre <!-- gerado: nome --> e <!-- /gerado: nome -->.
function replaceBlock(html, name, content) {
  const start = `<!-- gerado: ${name} (não edite aqui: data/ + node scripts/gerar-secoes.mjs) -->`;
  const end = `<!-- /gerado: ${name} -->`;
  const i = html.indexOf(start);
  const j = html.indexOf(end);
  if (i < 0 || j < i) throw new Error(`Marcadores do bloco "${name}" não encontrados no index.html`);
  return `${html.slice(0, i + start.length)}\n${content}\n${html.slice(j - html.slice(0, j).match(/[ ]*$/)[0].length)}`;
}

const current = read("index.html");
let next = replaceBlock(current, "projetos", projects.map(projectCard).join("\n"));
next = replaceBlock(next, "habilidades", skills.map(skillChip).join("\n"));

if (process.argv.includes("--check")) {
  if (next !== current) {
    console.error("index.html está desatualizado em relação a data/. Rode: node scripts/gerar-secoes.mjs");
    process.exit(1);
  }
  console.log(`index.html em dia: ${projects.length} projetos e ${skills.length} habilidades`);
} else {
  writeFileSync(join(ROOT, "index.html"), next);
  console.log(`index.html atualizado: ${projects.length} projetos e ${skills.length} habilidades`);
}
