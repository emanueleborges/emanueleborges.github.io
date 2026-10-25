// Gera, a partir das fontes únicas, as partes estáticas do site:
//   - index.html: cards de projetos (data/projetos.json), caixa de ferramentas (data/habilidades.json),
//     SEO do <head> (data/perfil.json) e os textos em português de todo [data-i18n] (i18n/pt.js);
//   - todas as páginas: atributos data-perfil="{campo}" (conteúdo) e data-perfil-<atributo>="{campo}";
//   - perfil.js (cópia de data/perfil.json para o navegador) e as variáveis do worker/wrangler.jsonc;
//   - manifest.webmanifest, robots.txt e sitemap.xml (nome e endereço do site, do perfil);
//   - temas (data/temas.json): temas.css, o bloco de temas do components/boot.js e as cores do navegador.
// O HTML continua estático (bom para SEO, funciona sem JavaScript e a busca do chat lê a página).
//
// Uso:  node scripts/gerar-secoes.mjs           → atualiza os arquivos
//       node scripts/gerar-secoes.mjs --check   → só confere (sai com erro se estiver desatualizado; usado no CI)

import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, read, IDIOMAS, LANGS, perfil, perfilScript, i18n, preencher } from "./dados.mjs";

const pt = i18n.pt;
const ptText = (key) => {
  if (!(key in pt)) throw new Error(`Chave "${key}" não existe no i18n/pt.js`);
  return pt[key]; // já é HTML (ex.: "&amp;"), escrito por nós
};
const escape = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// Campo de texto do JSON: { key } busca no i18n/pt.js; { text } é escrito como está (escapado).
const plain = (html) => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");
const field = (value) => (value.key ? { attr: ` data-i18n="${value.key}"`, html: ptText(value.key) } : { attr: "", html: escape(value.text) });

function projectCard(p, position) {
  const type = field(p.type);
  const title = field(p.title);
  const repo = preencher(p.repo);
  const repoUrl = `${perfil.links.github}/${repo}${p.path ? `/${p.path}` : ""}`;
  const code = `<a class="project-link" href="${escape(repoUrl)}" target="_blank" rel="noopener" data-repo="${escape(repo)}"><span data-i18n="proj.code">${ptText("proj.code")}</span> <span aria-hidden="true">↗</span></a>`;
  const demo = p.demo
    ? `<a class="project-link project-demo" href="${escape(p.demo.href)}"${p.demo.openChat ? " data-open-chat" : ""} data-demo="${escape(p.demo.name)}"><span data-i18n="proj.demo">${ptText("proj.demo")}</span> <span aria-hidden="true">▶</span></a>`
    : "";
  const arch = p.arquitetura
    ? `<a class="project-link" href="${escape(p.arquitetura)}" data-arq><span data-i18n="proj.arch">${ptText("proj.arch")}</span> <span aria-hidden="true">◇</span></a>`
    : "";
  const metrics = p.metrics?.length
    ? `            <ul class="project-metrics">${p.metrics.map((m) => { const value = field(m.value); const label = field(m.label); return `<li><strong class="mono"${value.attr}>${value.html}</strong><span${label.attr}>${label.html}</span></li>`; }).join("")}</ul>`
    : "";
  const actions = demo || arch ? `<span class="project-actions">${demo}${arch}${code}</span>` : code;
  return [
    `          <article data-category="${p.categories.join(" ")}" class="project-card${p.featured ? " project-featured" : ""}">`,
    `            <span class="art-number mono">${String(position + 1).padStart(2, "0")} / ${escape(p.label)}</span>`,
    `            <p class="mono project-type"${type.attr}>${type.html}</p>`,
    `            <h3${title.attr}>${title.html}</h3>`,
    `            <p class="muted" data-i18n="${p.desc.key}">${ptText(p.desc.key)}</p>`,
    metrics,
    `            <div class="project-footer">${actions}<span class="project-meta mono" data-repo-meta="${escape(repo)}"></span></div>`,
    "          </article>",
  ]
    .filter(Boolean)
    .join("\n");
}

function skillChip(s) {
  const name = s.key ? `<strong data-i18n="${s.key}">${ptText(s.key)}</strong>` : `<strong>${escape(s.name)}</strong>`;
  return `            <li data-category="${s.category}" class="skill-chip"><img class="skill-icon" src="${escape(s.icon)}" alt="" loading="lazy" />${name}<span class="mono" data-i18n="cat.${s.category}">${ptText(`cat.${s.category}`)}</span></li>`;
}

const projects = JSON.parse(read("data/projetos.json")).projects;
const skills = JSON.parse(read("data/habilidades.json")).skills;
const jobs = JSON.parse(read("data/experiencia.json")).jobs;
const courses = JSON.parse(read("data/formacao.json")).courses;

// Tópicos de cada experiência: chaves <id>.b1, <id>.b2… que existem no i18n/pt.js.
const bulletKeys = (job) =>
  Object.keys(pt)
    .filter((key) => new RegExp(`^${job.id}\\.b\\d+$`).test(key))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

function jobItem(job) {
  const company = field(job.company);
  return [
    '          <li class="job">',
    `            <p class="mono job-period" data-i18n="${job.id}.period">${ptText(`${job.id}.period`)}</p>`,
    `            <h3 data-i18n="${job.id}.title">${ptText(`${job.id}.title`)}</h3>`,
    `            <p class="job-company"${company.attr}>${company.html}</p>`,
    '            <ul class="muted">',
    ...bulletKeys(job).map((key) => `              <li data-i18n="${key}">${ptText(key)}</li>`),
    "            </ul>",
    "          </li>",
  ].join("\n");
}

function courseItem(c) {
  const img = `<img${c.manterCores ? ' class="logo-keep"' : ""} src="${escape(c.logo)}" alt="${escape(c.alt)}" loading="lazy" />`;
  return `            <li><span class="edu-logo">${img}</span><span class="edu-text"><strong data-i18n="${c.key}">${ptText(c.key)}</strong><span>${escape(c.school)} · ${escape(c.period)}${c.emAndamento ? ` <span data-i18n="edu.inProgress">${ptText("edu.inProgress")}</span>` : ""}</span></span></li>`;
}

// Dados do currículo (curriculo.html monta o A4 no navegador, em qualquer idioma): só chaves e textos fixos.
function cvData() {
  const byCategory = new Map();
  for (const skill of skills) {
    if (!byCategory.has(skill.category)) byCategory.set(skill.category, []);
    byCategory.get(skill.category).push(skill.key ? { key: skill.key } : { text: skill.full ?? skill.name });
  }
  const data = {
    jobs: jobs.map((job) => ({ title: `${job.id}.title`, period: `${job.id}.period`, company: job.company, bullets: bulletKeys(job) })),
    projects: projects.filter((p) => p.cv).map((p) => ({ title: p.title.key, name: p.cv.name, stack: p.cv.stack, desc: p.desc.key })),
    skills: [...byCategory].map(([category, items]) => ({ title: `skills.tab.${category}`, items })),
    education: courses.map((c) => ({ key: c.key, school: c.school, period: c.period, emAndamento: Boolean(c.emAndamento), logo: c.logoImpresso ?? c.logo, manterCores: Boolean(c.manterCores) })),
  };
  return `    <script>\n      window.CURRICULO = ${JSON.stringify(data).replace(/</g, "\\u003c")};\n    </script>`;
}

// Substitui o conteúdo entre <!-- gerado: nome --> e <!-- /gerado: nome -->.
function replaceBlock(html, name, content, source = "data/") {
  const start = `<!-- gerado: ${name} (não edite aqui: ${source} + node scripts/gerar-secoes.mjs) -->`;
  const end = `<!-- /gerado: ${name} -->`;
  const i = html.indexOf(start);
  const j = html.indexOf(end);
  if (i < 0 || j < i) throw new Error(`Marcadores do bloco "${name}" não encontrados`);
  return `${html.slice(0, i + start.length)}\n${content}\n${html.slice(j - html.slice(0, j).match(/[ ]*$/)[0].length)}`;
}

// Troca o valor de um atributo dentro de uma tag de abertura (o atributo precisa existir).
function setAttr(tag, name, value, where) {
  const re = new RegExp(`(\\s${name}=")[^"]*(")`);
  if (!re.test(tag)) throw new Error(`${where}: a tag não tem o atributo ${name}: ${tag.slice(0, 90)}`);
  return tag.replace(re, (_, before, after) => `${before}${value}${after}`);
}

/* ---------- SEO do <head> (data/perfil.json) ---------- */

if (!perfil.site.endsWith("/")) throw new Error('perfil.site precisa terminar com "/"');
const abs = (path) => new URL(path, perfil.site).href;

function seoHead() {
  const p = perfil;
  const share = p.compartilhamento;
  const title = `${p.nomeCompleto} — ${p.titulo}`;
  const meta = (attr, name, content) => `    <meta ${attr}="${name}" content="${escape(content)}" />`;
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.nomeCompleto,
    alternateName: p.nomeCivil,
    url: p.site,
    image: abs(p.foto),
    jobTitle: p.cargo,
    description: p.resumo,
    worksFor: { "@type": "Organization", name: plain(field(jobs[0].company).html) },
    address: { "@type": "PostalAddress", addressLocality: p.endereco.cidade, addressRegion: p.endereco.estado, addressCountry: p.endereco.pais },
    alumniOf: courses.map((c) => ({ "@type": "CollegeOrUniversity", name: c.school })),
    knowsAbout: p.conhecimentos,
    knowsLanguage: p.idiomasFalados,
    sameAs: [p.links.linkedin, p.links.github],
  };
  return [
    "    <!-- Verificação do Google Search Console -->",
    meta("name", "google-site-verification", p.googleVerificacao),
    ...LANGS.map((lang) => `    <link rel="alternate" hreflang="${IDIOMAS[lang].html}" href="${abs(`?lang=${lang}`)}" />`),
    `    <link rel="alternate" hreflang="x-default" href="${p.site}" />`,
    "    <!-- Prévia ao compartilhar o link (LinkedIn, WhatsApp, X…) -->",
    meta("property", "og:type", "profile"),
    meta("property", "og:site_name", p.nomeCompleto),
    meta("property", "og:title", title),
    meta("property", "og:description", share.descricao),
    meta("property", "og:url", p.site),
    meta("property", "og:image", abs(share.imagem)),
    meta("property", "og:image:width", "1200"),
    meta("property", "og:image:height", "630"),
    meta("property", "og:image:alt", `${p.nomeCompleto} — ${share.imagemAlt}`),
    meta("property", "og:locale", IDIOMAS[LANGS[0]].og),
    ...LANGS.slice(1).map((lang) => meta("property", "og:locale:alternate", IDIOMAS[lang].og)),
    meta("property", "profile:first_name", p.nome),
    meta("property", "profile:last_name", p.sobrenome),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", title),
    meta("name", "twitter:description", share.descricaoCurta),
    meta("name", "twitter:image", abs(share.imagem)),
    meta("name", "author", p.nomeCompleto),
    "    <!-- Dados estruturados: ajudam o Google a entender quem é a pessoa do site -->",
    '    <script type="application/ld+json">',
    JSON.stringify(person, null, 2).replace(/</g, "\\u003c"),
    "    </script>",
  ].join("\n");
}

/* ---------- Textos em português do index.html (i18n/pt.js) ---------- */

// O HTML estático em português é cópia do i18n/pt.js: [data-i18n] no conteúdo, [data-i18n-*] nos atributos.
const I18N_ATTRS = { content: "content", alt: "alt", aria: "aria-label", title: "title", placeholder: "placeholder" };

function syncPt(html) {
  html = html.replace(/<(\w+)\b([^>]*\sdata-i18n="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g, (all, tag, attrs, key, inner) => {
    if (new RegExp(`<${tag}[\\s>]`).test(inner)) throw new Error(`[data-i18n="${key}"]: <${tag}> dentro de <${tag}> não é suportado`);
    return `<${tag}${attrs}>${ptText(key)}</${tag}>`;
  });
  return html.replace(/<\w+\b[^>]*\sdata-i18n-(?:content|alt|aria|title|placeholder)="[^"]+"[^>]*>/g, (tag) => {
    for (const [, kind, key] of tag.matchAll(/\sdata-i18n-(\w+)="([^"]+)"/g)) {
      if (I18N_ATTRS[kind]) tag = setAttr(tag, I18N_ATTRS[kind], ptText(key).replace(/"/g, "&quot;"), `[data-i18n-${kind}="${key}"]`);
    }
    return tag;
  });
}

/* ---------- Dados pessoais em qualquer página (data/perfil.json) ---------- */

// data-perfil="…{campo}…" → conteúdo do elemento; data-perfil-<atributo>="…{campo}…" → valor do atributo.
function applyPerfil(html, file) {
  html = html.replace(/<[a-z][\w-]*\b[^>]*\sdata-perfil-[\w-]+="[^"]*"[^>]*>/g, (tag) => {
    for (const [, name, template] of tag.matchAll(/\sdata-perfil-([\w-]+)="([^"]*)"/g)) {
      tag = setAttr(tag, name, escape(preencher(template)), `${file} [data-perfil-${name}]`);
    }
    return tag;
  });
  return html.replace(/<(\w+)\b([^>]*\sdata-perfil="([^"]*)"[^>]*)>[\s\S]*?<\/\1>/g, (all, tag, attrs, template) => `<${tag}${attrs}>${escape(preencher(template))}</${tag}>`);
}

/* ---------- Seletor de idioma (idiomas.js) ---------- */

// <select data-lang> / <select data-lang-select>: uma <option> por idioma, na ordem do idiomas.js.
function langOptions(html) {
  return html.replace(/(<select\b[^>]*\sdata-lang(?:-select)?>)(\s*)[\s\S]*?(\s*<\/select>)/g, (all, open, indent, close) =>
    open + Object.entries(IDIOMAS).map(([code, idioma]) => `${indent}<option value="${code}" lang="${idioma.html}">${escape(idioma.nome)}</option>`).join("") + close,
  );
}

/* ---------- Temas (data/temas.json) ---------- */

const temas = JSON.parse(read("data/temas.json"));
if (!temas.temas[temas.padrao]) throw new Error(`Tema padrão "${temas.padrao}" não existe em data/temas.json`);
const fundoPadrao = temas.temas[temas.padrao].cores["--bg"];

// Variáveis CSS de cada tema. O padrão vale também sem data-theme e serve de base: os outros
// temas só precisam declarar o que muda.
// Intensidade (barra ao lado do botão de tema): cada cor do tema passa por oklch(from …), que multiplica
// a saturação (croma) por --intensidade e mantém tom e transparência. Acima de 1 (do meio para o fim da
// barra), as cores também escurecem na proporção do croma: verdes e azuis ficam mais profundos, enquanto
// textos claros e fundos (pouco croma) quase não mudam. Navegadores sem suporte a essa sintaxe ficam com
// as cores originais (bloco @supports).
const escurecer = temas.intensidade.escurecer ?? 0;
const comIntensidade = (valor) =>
  valor.replace(
    /#[0-9a-f]{3,8}\b|rgba?\([^()]*\)/gi,
    (cor) => `oklch(from ${cor} calc(l - max(0, var(--intensidade) - 1) * c * ${escurecer}) calc(c * var(--intensidade)) h)`,
  );

function temasCss() {
  const ordem = [temas.padrao, ...Object.keys(temas.temas).filter((id) => id !== temas.padrao)];
  const seletor = (id) => (id === temas.padrao ? `:root, :root[data-theme="${id}"]` : `:root[data-theme="${id}"]`);
  const blocos = ordem.map((id) => {
    const tema = temas.temas[id];
    const linhas = Object.entries(tema.cores).map(([nome, valor]) => `  ${nome}: ${valor};`);
    return `${seletor(id)} {\n  color-scheme: ${tema.esquema};\n${linhas.join("\n")}\n}`;
  });
  const intensos = ordem.map((id) => {
    const linhas = Object.entries(temas.temas[id].cores)
      .filter(([, valor]) => comIntensidade(valor) !== valor)
      .map(([nome, valor]) => `    ${nome}: ${comIntensidade(valor)};`);
    return `  ${seletor(id)} {\n${linhas.join("\n")}\n  }`;
  });
  return [
    "/* Gerado por scripts/gerar-secoes.mjs a partir de data/temas.json — não edite aqui. */",
    ":root { --intensidade: 1; }",
    ...blocos,
    `@supports (color: oklch(from red l c h)) {\n${intensos.join("\n\n")}\n}`,
  ].join("\n\n") + "\n";
}

// No boot.js (roda antes da pintura): lista de temas, padrão, nome no seletor e cor da barra do navegador.
function bootTemas(js) {
  const dados = {
    padrao: temas.padrao,
    intensidade: temas.intensidade,
    temas: Object.fromEntries(Object.entries(temas.temas).map(([id, tema]) => [id, { nome: tema.nome, fundo: tema.cores["--bg"] }])),
  };
  const start = "  // gerado: temas (não edite aqui: data/temas.json + node scripts/gerar-secoes.mjs)\n";
  const end = "  // /gerado: temas\n";
  const i = js.indexOf(start);
  const j = js.indexOf(end);
  if (i < 0 || j < i) throw new Error("Marcadores do bloco de temas não encontrados no components/boot.js");
  return `${js.slice(0, i + start.length)}  var TEMAS = (window.TEMAS = ${JSON.stringify(dados)});\n${js.slice(j)}`;
}

// <meta name="theme-color"> estático (antes do boot.js trocar pelo tema salvo): o do tema padrão.
// CSP de cada página: o endereço do Worker (data/perfil.json → servicos.worker) em connect-src.
const workerOrigin = new URL(perfil.servicos.worker).origin;
const themeColor = (html) =>
  html
    .replace(/(<meta name="theme-color" content=")[^"]*/, (_, before) => before + fundoPadrao)
    .replace(/(<meta http-equiv="Content-Security-Policy" content="[^"]*connect-src[^";]*?)https:\/\/[\w.-]+\.workers\.dev/, (_, before) => before + workerOrigin);

/* ---------- Arquivos gerados ---------- */

const files = new Map();

files.set("perfil.js", perfilScript());
// Worker: só o site publicado pode chamá-lo; o resumo semanal vai para o e-mail do perfil.
files.set(
  "worker/wrangler.jsonc",
  read("worker/wrangler.jsonc")
    .replace(/("ALLOWED_ORIGIN": )"[^"]*"/, (_, key) => `${key}${JSON.stringify(new URL(perfil.site).origin)}`)
    .replace(/("NOTIFY_EMAIL": )"[^"]*"/, (_, key) => `${key}${JSON.stringify(perfil.email)}`),
);

// Projetos em destaque (featured) em cards grandes; os demais em "Mais projetos", compactos.
const featured = projects.filter((p) => p.featured);
const others = projects.filter((p) => !p.featured);
let index = replaceBlock(read("index.html"), "projetos", featured.map((p, i) => projectCard(p, i)).join("\n"));
index = replaceBlock(index, "projetos-mais", others.map((p, i) => projectCard(p, featured.length + i)).join("\n"));
index = replaceBlock(index, "habilidades", skills.map(skillChip).join("\n"));
index = replaceBlock(index, "experiencia", jobs.map(jobItem).join("\n"));
index = replaceBlock(index, "formacao", courses.map(courseItem).join("\n"));
index = replaceBlock(index, "seo", seoHead(), "data/perfil.json");
// Números do hero que dependem dos dados: total de projetos e de demos de IA (páginas em demos/).
const counts = { projects: projects.length, demos: projects.filter((p) => p.demo?.href.startsWith("demos/")).length };
index = index.replace(/(data-count="(\w+)">)\d+/g, (all, start, name) => (name in counts ? `${start}${counts[name]}` : all));
files.set("index.html", themeColor(langOptions(applyPerfil(syncPt(index), "index.html"))));

const demoPages = readdirSync(join(ROOT, "demos"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `demos/${entry.name}/index.html`);
files.set("curriculo.html", themeColor(langOptions(applyPerfil(replaceBlock(read("curriculo.html"), "dados", cvData()), "curriculo.html"))));
for (const file of ["404.html", "como-construi/index.html", "arquitetura/index.html", ...demoPages]) {
  files.set(file, themeColor(langOptions(applyPerfil(read(file), file))));
}

const manifest = JSON.parse(read("manifest.webmanifest"));
Object.assign(manifest, {
  name: `${perfil.nomeCompleto} — Portfolio`,
  short_name: perfil.nomeCompleto,
  description: plain(i18n.en["meta.description"]),
  background_color: fundoPadrao,
  theme_color: fundoPadrao,
});
files.set("temas.css", temasCss());
files.set("components/boot.js", bootTemas(read("components/boot.js")));
files.set("manifest.webmanifest", `${JSON.stringify(manifest, null, 2)}\n`);
files.set("robots.txt", read("robots.txt").replace(/^# .*/, `# Portfólio de ${perfil.nomeCompleto}`).replace(/^Sitemap: .*/m, `Sitemap: ${abs("sitemap.xml")}`));
// sitemap.xml: as páginas e datas continuam editadas à mão; o endereço do site vem do perfil.
files.set("sitemap.xml", read("sitemap.xml").replace(/(<loc>|href=")https?:\/\/[^/"<\s]+\//g, (_, before) => before + perfil.site));
// Logo e favicon: nome acessível do SVG.
for (const file of ["imagens/logo.svg", "imagens/favicon.svg"]) {
  files.set(file, read(file).replace(/(<svg\b[^>]*\saria-label=")[^"]*/, (_, before) => before + escape(perfil.nomeCompleto)));
}

const exists = (file) => { try { read(file); return true; } catch { return false; } };
const outdated = [...files].filter(([file, content]) => !exists(file) || read(file) !== content).map(([file]) => file);
const summary = `${projects.length} projetos, ${skills.length} habilidades, ${jobs.length} experiências, ${courses.length} cursos, ${files.size} arquivos`;
if (process.argv.includes("--check")) {
  if (outdated.length) {
    console.error(`Desatualizado em relação a data/, idiomas.js ou i18n/pt.js: ${outdated.join(", ")}. Rode: node scripts/gerar-secoes.mjs`);
    process.exit(1);
  }
  console.log(`Em dia: ${summary}`);
} else {
  for (const file of outdated) writeFileSync(join(ROOT, file), files.get(file));
  console.log(`Atualizado (${outdated.join(", ") || "nada mudou"}): ${summary}`);
}
