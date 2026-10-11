// Painel privado de estatísticas: avaliações do chat, mensagens do formulário e visitas.
// Busca os dados no D1 (e no GoatCounter, se houver token), gera painel.html (fora do git,
// porque tem nomes e e-mails de visitantes) e abre no navegador. Nada é publicado.
//
// Uso:  cd worker && npm run painel
//       GOATCOUNTER_TOKEN=... npm run painel   (opcional: inclui as visitas)
//       ou guarde a chave em worker/.dev.vars (fora do git): GOATCOUNTER_TOKEN=...

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DIR = dirname(fileURLToPath(import.meta.url));
const OUT = join(DIR, "painel.html");

// Chave do GoatCounter: variável de ambiente ou worker/.dev.vars (arquivo fora do git).
const devVar = (name) => {
  const file = join(DIR, ".dev.vars");
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, "utf8").split("\n").find((l) => l.trim().startsWith(`${name}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "") || undefined;
};
const WEEKS = 12;
const LANGS = { en: "Inglês", pt: "Português", es: "Espanhol", fr: "Francês", it: "Italiano", de: "Alemão", zh: "Chinês", ru: "Russo" };

const d1 = (sql) => {
  const output = execFileSync("npx", ["wrangler", "d1", "execute", "portfolio-contact", "--remote", "--json", "--command", sql], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return JSON.parse(output)[0].results;
};

const escape = (text) => String(text ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const fmtDate = (utc) => new Date(`${utc.replace(" ", "T")}Z`).toLocaleString("pt-BR", { timeZone: "America/Manaus", dateStyle: "short", timeStyle: "short" });
const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0);

// Segunda-feira (UTC) da semana de uma data "AAAA-MM-DD HH:MM:SS".
const weekOf = (utc) => {
  const d = new Date(`${utc.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
const lastWeeks = () => {
  const weeks = [];
  const monday = new Date(`${weekOf(new Date().toISOString().replace("T", " "))}T00:00:00Z`);
  for (let i = WEEKS - 1; i >= 0; i -= 1) weeks.push(new Date(monday.getTime() - i * 7 * 86400000).toISOString().slice(0, 10));
  return weeks;
};
const weekLabel = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");

async function goatCounter() {
  const token = process.env.GOATCOUNTER_TOKEN || devVar("GOATCOUNTER_TOKEN");
  if (!token) return null;
  const end = new Date(Date.now() + 86400000); // inclui hoje
  const start = new Date(end.getTime() - 31 * 86400000);
  const range = `start=${start.toISOString().slice(0, 10)}&end=${end.toISOString().slice(0, 10)}`;
  const get = async (path) => {
    const response = await fetch(`https://emanueleborges.goatcounter.com/api/v0/${path}`, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
    if (!response.ok) throw new Error(`GoatCounter ${response.status}`);
    return response.json();
  };
  try {
    // Todas as páginas e eventos do período (a API devolve em lotes; exclude_paths pagina).
    const all = [];
    const seen = [];
    for (let page = 0; page < 30; page += 1) {
      const exclude = seen.length ? `&exclude_paths=${seen.join(",")}` : "";
      const batch = await get(`stats/hits?${range}&limit=100${exclude}`);
      for (const h of batch.hits ?? []) {
        seen.push(h.path_id);
        all.push({ path: h.path, title: h.title, event: h.event, count: h.count });
      }
      if (!batch.more || !(batch.hits ?? []).length) break;
    }
    const total = await get(`stats/total?${range}`);
    return { total: total.total, all, hits: [...all].sort((a, b) => b.count - a.count).slice(0, 15) };
  } catch (error) {
    return { error: String(error.message ?? error) };
  }
}

/* ---------- Gráficos de barras (desenhados no navegador, na largura real) ---------- */

const charts = [];
// Guarda a especificação; o script da página desenha o SVG (empilhado quando há 2 séries).
function bars(labels, series, { height = 220, labelEvery = 1 } = {}) {
  charts.push({ labels, series, height, labelEvery });
  return `<svg class="chart" data-chart="${charts.length - 1}" role="img"></svg>`;
}

const CHART_SCRIPT = `
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
function draw(svg, { labels, series, height, labelEvery }) {
  const W = Math.round(svg.getBoundingClientRect().width) || 600, H = height, pad = { l: 30, r: 6, t: 16, b: 24 };
  const totals = labels.map((_, i) => series.reduce((s, ser) => s + ser.values[i], 0));
  const max = Math.max(1, ...totals);
  const step = (W - pad.l - pad.r) / labels.length;
  const barW = Math.max(6, Math.min(36, step * 0.6));
  const every = Math.max(labelEvery, Math.ceil(64 / step));
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ticks = max <= 5 ? Array.from({ length: max + 1 }, (_, i) => i) : [0, Math.round(max / 2), max];
  let out = ticks.map((v) => '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="grid"/><text x="' + (pad.l - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '</text>').join("");
  labels.forEach((label, i) => {
    const x = pad.l + step * i + (step - barW) / 2;
    const tip = esc(label + ": " + series.map((s) => s.name + " " + s.values[i]).join(" · "));
    let base = 0;
    series.forEach((s, k) => {
      const v = s.values[i];
      if (!v) return;
      const top = y(base + v);
      const h = y(base) - top - (base > 0 ? 2 : 0);
      const isTop = series.slice(k + 1).every((t) => !t.values[i]);
      const r = isTop ? Math.min(4, barW / 2, h) : 0;
      out += '<path d="M' + x + ',' + (top + h) + ' V' + (top + r) + ' q0,-' + r + ' ' + r + ',-' + r + ' H' + (x + barW - r) + ' q' + r + ',0 ' + r + ',' + r + ' V' + (top + h) + ' Z" fill="' + s.color + '"></path>';
      base += v;
    });
    if (totals[i]) out += '<text x="' + (x + barW / 2) + '" y="' + (y(totals[i]) - 5) + '" text-anchor="middle" class="value">' + totals[i] + '</text>';
    if ((labels.length - 1 - i) % every === 0) {
      const last = i === labels.length - 1 && labels.length > 3;
      out += '<text x="' + (last ? x + barW : x + barW / 2) + '" y="' + (H - 6) + '" text-anchor="' + (last ? "end" : "middle") + '">' + esc(label) + '</text>';
    }
    out += '<rect x="' + (pad.l + step * i) + '" y="' + pad.t + '" width="' + step + '" height="' + (H - pad.t - pad.b) + '" fill="transparent"><title>' + tip + '</title></rect>';
  });
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  svg.innerHTML = out;
}
const render = () => document.querySelectorAll("[data-chart]").forEach((svg) => draw(svg, CHARTS[svg.dataset.chart]));
render();
let width = innerWidth;
addEventListener("resize", () => { if (innerWidth !== width) { width = innerWidth; render(); } });
`;

const legend = (series) => `<div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${escape(s.name)}</span>`).join("")}</div>`;

/* ---------- Dados ---------- */

console.log("Buscando avaliações e mensagens no D1…");
const feedback = d1("SELECT created_at, rating, lang, question, answer FROM feedback ORDER BY id DESC LIMIT 1000");
const messages = d1("SELECT created_at, name, email, lang, message FROM messages ORDER BY id DESC LIMIT 1000");
const visits = await goatCounter();

const up = feedback.filter((f) => f.rating === 1).length;
const down = feedback.filter((f) => f.rating === -1).length;
const weeks = lastWeeks();
const byWeek = (rows, filter = () => true) => weeks.map((w) => rows.filter((r) => filter(r) && weekOf(r.created_at) === w).length);
const since30 = (rows) => rows.filter((r) => Date.now() - new Date(`${r.created_at.replace(" ", "T")}Z`) < 30 * 86400000).length;
const UP = { name: "👍 Positivas", color: "var(--s1)" };
const DOWN = { name: "👎 Negativas", color: "var(--s2)" };

const langs = Object.keys(LANGS).filter((l) => feedback.some((f) => f.lang === l));
const ratingsWeek = [
  { ...UP, values: byWeek(feedback, (f) => f.rating === 1) },
  { ...DOWN, values: byWeek(feedback, (f) => f.rating === -1) },
];
const ratingsLang = [
  { ...UP, values: langs.map((l) => feedback.filter((f) => f.lang === l && f.rating === 1).length) },
  { ...DOWN, values: langs.map((l) => feedback.filter((f) => f.lang === l && f.rating === -1).length) },
];
const messagesWeek = [{ name: "Mensagens", color: "var(--s1)", values: byWeek(messages) }];

/* ---------- Mapa de cliques (eventos "clique/<área>/<elemento>" e "secao/<id>" do site) ---------- */

const SECTIONS = { inicio: "Topo", sobre: "Sobre", experiencia: "Experiência", projetos: "Projetos", habilidades: "Habilidades", formacao: "Formação", contato: "Contato" };
const AREAS = { ...SECTIONS, cabecalho: "Cabeçalho", rodape: "Rodapé", chat: "Chat", "demos-lstm": "Demo LSTM", "demos-face": "Demo facial", "demos-filmes": "Demo filmes", vaga: "Match de vaga" };

// Elementos clicáveis que existem no site (lidos do index.html), para achar os que ninguém clicou.
function siteCatalog() {
  const html = readFileSync(join(DIR, "..", "index.html"), "utf8");
  const uniq = (list) => [...new Set(list)];
  const grab = (re) => uniq([...html.matchAll(re)].map((m) => m[1]));
  const catalog = [
    ...[...(html.match(/class="nav-links"[\s\S]*?<\/div>/)?.[0] ?? "").matchAll(/href="#([^"]+)"/g)].map((m) => `menu/${m[1]}`),
    ...grab(/data-demo="([^"]+)"/g).map((d) => `demo/${d}`),
    ...grab(/data-repo="([^"]+)"/g).map((r) => `codigo/${r}`),
    ...grab(/data-repo="([^"]+)"/g).map((r) => `card/${r}`),
    ...[...html.matchAll(/data-filter-group="([^"]+)"[\s\S]*?<\/div>/g)].flatMap((m) => [...m[0].matchAll(/data-filter="([^"]+)"/g)].map((f) => `filtro/${m[1]}/${f[1]}`)),
    "match-vaga", "curriculo", "email", "whatsapp", "linkedin", "github", "tema", "pergunte-ia", "abrir", "logo",
  ];
  return uniq(catalog);
}

// Barras horizontais em HTML (nomes longos de categoria ficam legíveis em qualquer largura).
const hbars = (rows) => {
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return `<div class="hbars">${rows.map(([name, n]) => `<div class="hbar"><span>${escape(name)}</span><i style="width:${(n / max) * 100}%"></i><b>${n}</b></div>`).join("")}</div>`;
};

function clickMap(all) {
  if (!all) return "";
  const events = all.filter((h) => h.event);
  const views = Object.fromEntries(Object.keys(SECTIONS).map((id) => [id, 0]));
  const byArea = {};
  const byElement = {};
  const byLabel = {};
  for (const h of events) {
    const parts = h.path.split("/");
    if (parts[0] === "secao" && parts[1] in views) views[parts[1]] += h.count;
    if (parts[0] !== "clique" || parts.length < 3) continue;
    const area = parts[1];
    const label = parts.slice(2).join("/");
    byArea[area] = (byArea[area] ?? 0) + h.count;
    byElement[`${area} › ${label}`] = (byElement[`${area} › ${label}`] ?? 0) + h.count;
    const key = label.startsWith("curriculo/") ? "curriculo" : label;
    byLabel[key] = (byLabel[key] ?? 0) + h.count;
  }
  const totalClicks = Object.values(byArea).reduce((a, b) => a + b, 0);
  if (!totalClicks && !views.inicio) {
    return '<p class="muted">Ainda não há dados de cliques. O rastreamento começa a contar a partir da publicação desta versão do site — volte em alguns dias.</p>';
  }
  const top = Object.entries(byElement).sort((a, b) => b[1] - a[1]);
  const catalog = siteCatalog();
  const zero = catalog.filter((label) => !byLabel[label]);
  // "Menos clicados": os que ninguém clicou + os clicados abaixo da mediana.
  const clicked = Object.entries(byLabel).filter(([label]) => catalog.includes(label)).sort((a, b) => a[1] - b[1]);
  const median = clicked.length ? clicked[Math.floor(clicked.length / 2)][1] : 0;
  const low = clicked.filter(([, n]) => n < median).slice(0, 10);
  const sectionIds = Object.keys(SECTIONS);
  const reach = (id) => (views.inicio ? Math.round((views[id] / views.inicio) * 100) : 0);
  const areaRows = Object.entries(byArea).sort((a, b) => b[1] - a[1]);

  return `
  <div class="tiles">
    ${tile("Cliques (30 dias)", totalClicks.toLocaleString("pt-BR"))}
    ${tile("Visitas ao topo", views.inicio.toLocaleString("pt-BR"), "base do funil")}
    ${tile("Chegam ao Contato", `${reach("contato")}%`, "das visitas ao topo")}
    ${tile("Elementos sem clique", zero.length, `de ${catalog.length} no site`)}
  </div>
  <div class="grid2" style="margin-top:12px">
    <div class="card"><h3>Até onde as pessoas rolam (visualizações por seção)</h3>${bars(sectionIds.map((id) => SECTIONS[id]), [{ name: "Visualizações", color: "var(--s1)", values: sectionIds.map((id) => views[id]) }], { height: 220 })}</div>
    <div class="card"><h3>Cliques por área</h3>${areaRows.length ? hbars(areaRows.slice(0, 10).map(([a, n]) => [AREAS[a] ?? a, n])) : '<p class="muted">Sem cliques ainda.</p>'}</div>
  </div>
  <h3 style="margin-top:22px">Interesse por seção</h3>
  <div class="table-wrap"><table><thead><tr><th>Seção</th><th class="num">Visualizações</th><th class="num">Alcance</th><th class="num">Cliques</th><th class="num">Cliques por 100 visualizações</th></tr></thead><tbody>
    ${sectionIds.map((id) => `<tr><td>${SECTIONS[id]}</td><td class="num">${views[id]}</td><td class="num">${reach(id)}%</td><td class="num">${byArea[id] ?? 0}</td><td class="num">${views[id] ? Math.round(((byArea[id] ?? 0) / views[id]) * 100) : "—"}</td></tr>`).join("")}
  </tbody></table></div>
  <p class="muted" style="font-size:13px">Alcance = visualizações da seção ÷ visitas ao topo. Seção pouco clicada mas muito vista = conteúdo que não convida à ação; seção pouco vista = está "abaixo da dobra" para a maioria.</p>
  <div class="grid2" style="margin-top:16px">
    <div><h3>Mais clicados</h3><div class="table-wrap"><table><thead><tr><th>Elemento (área › elemento)</th><th class="num">Cliques</th></tr></thead><tbody>
      ${top.slice(0, 20).map(([name, n]) => `<tr><td>${escape(name)}</td><td class="num">${n}</td></tr>`).join("") || '<tr><td colspan="2" class="muted">Sem cliques ainda.</td></tr>'}
    </tbody></table></div></div>
    <div><h3>Menos clicados</h3><div class="table-wrap"><table><thead><tr><th>Elemento</th><th class="num">Cliques</th></tr></thead><tbody>
      ${zero.slice(0, 25).map((label) => `<tr><td>${escape(label)}</td><td class="num">0</td></tr>`).join("")}
      ${low.map(([label, n]) => `<tr><td>${escape(label)}</td><td class="num">${n}</td></tr>`).join("")}
    </tbody></table></div></div>
  </div>`;
}

const tile = (label, value, note = "") => `<div class="tile"><span>${label}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ""}</div>`;

const visitsHtml = !visits
  ? `<p class="muted">Para ver as visitas aqui, crie um token em <a href="https://emanueleborges.goatcounter.com/user/api" target="_blank" rel="noopener">GoatCounter → API</a> (permissão de leitura) e guarde-o em <code>worker/.dev.vars</code> como <code>GOATCOUNTER_TOKEN=seu_token</code> (ou rode <code>GOATCOUNTER_TOKEN=seu_token npm run painel</code>). Enquanto isso: <a href="https://emanueleborges.goatcounter.com" target="_blank" rel="noopener">painel do GoatCounter</a>.</p>`
  : visits.error
    ? `<p class="muted">Não foi possível ler o GoatCounter (${escape(visits.error)}).</p>`
    : `<div class="tiles">${tile("Visitas (30 dias)", visits.total.toLocaleString("pt-BR"))}</div>
       <table><thead><tr><th>Página ou evento</th><th>Tipo</th><th class="num">Contagem</th></tr></thead><tbody>
       ${visits.hits.map((h) => `<tr><td>${escape(h.title || h.path)}</td><td>${h.event ? "Evento" : "Página"}</td><td class="num">${h.count}</td></tr>`).join("")}
       </tbody></table>`;

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex" />
<title>Painel do portfólio</title>
<style>
  :root { --bg: #090811; --surface: #100e1a; --text: #f4f1fa; --muted: #aaa5b8; --line: rgba(222,212,255,.12); --grid: rgba(222,212,255,.08); --s1: #3987e5; --s2: #d95926; color-scheme: dark; }
  @media (prefers-color-scheme: light) { :root { --bg: #f6f5f9; --surface: #fcfcfb; --text: #1c1830; --muted: #5d5870; --line: rgba(28,24,48,.12); --grid: rgba(28,24,48,.08); --s1: #2a78d6; --s2: #eb6834; color-scheme: light; } }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px 16px 56px; background: var(--bg); color: var(--text); font: 15px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 980px; margin: 0 auto; }
  h1 { margin: 0; font-size: 28px; letter-spacing: -.03em; }
  h2 { margin: 36px 0 12px; font-size: 19px; }
  .muted, small { color: var(--muted); }
  a { color: var(--s1); }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-top: 20px; }
  .tile { display: grid; gap: 2px; padding: 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
  .tile span { font-size: 13px; color: var(--muted); }
  .tile strong { font-size: 30px; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
  .card { padding: 18px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
  .grid2 { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
  .chart { width: 100%; height: auto; display: block; }
  .chart text { fill: var(--muted); font-size: 11px; }
  .chart .value { fill: var(--text); font-weight: 600; }
  .chart .grid { stroke: var(--grid); }
  .legend { display: flex; gap: 16px; margin-top: 8px; font-size: 13px; color: var(--muted); }
  .legend i { display: inline-block; width: 12px; height: 12px; margin-right: 6px; border-radius: 3px; vertical-align: -1px; }
  h3 { margin: 0 0 8px; font-size: 14px; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { padding: 8px 10px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
  th { font-size: 12px; color: var(--muted); font-weight: 600; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.text { min-width: 260px; }
  .hbars { display: grid; gap: 8px; margin-top: 6px; }
  .hbar { display: grid; grid-template-columns: 110px 1fr 40px; align-items: center; gap: 10px; font-size: 13px; }
  .hbar span { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hbar i { display: block; height: 14px; min-width: 2px; border-radius: 0 4px 4px 0; background: var(--s1); }
  .hbar b { font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; }
  details summary { cursor: pointer; color: var(--muted); font-size: 13px; margin-top: 8px; }
  @media (max-width: 720px) { .grid2 { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<main>
  <h1>Painel do portfólio</h1>
  <p class="muted">Gerado em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Manaus" })} (horário de Manaus) · arquivo local, não publicado · contém dados pessoais de visitantes (LGPD).</p>

  <div class="tiles">
    ${tile("Avaliações do chat", feedback.length, `${up} 👍 · ${down} 👎`)}
    ${tile("Aprovação", `${pct(up, feedback.length)}%`, "avaliações positivas")}
    ${tile("Mensagens recebidas", messages.length, `${since30(messages)} nos últimos 30 dias`)}
    ${tile("Avaliações (30 dias)", since30(feedback))}
  </div>

  <h2>Avaliações do chat</h2>
  <div class="grid2">
    <div class="card"><h3>Por semana (últimas ${WEEKS})</h3>${bars(weeks.map(weekLabel), ratingsWeek, { labelEvery: 2 })}${legend(ratingsWeek)}</div>
    <div class="card"><h3>Por idioma</h3>${langs.length ? bars(langs.map((l) => l.toUpperCase()), ratingsLang) + legend(ratingsLang) : '<p class="muted">Sem avaliações ainda.</p>'}</div>
  </div>
  <details><summary>Ver como tabela</summary><div class="table-wrap"><table>
    <thead><tr><th>Semana de</th><th class="num">👍</th><th class="num">👎</th></tr></thead>
    <tbody>${weeks.map((w, i) => `<tr><td>${weekLabel(w)}</td><td class="num">${ratingsWeek[0].values[i]}</td><td class="num">${ratingsWeek[1].values[i]}</td></tr>`).join("")}</tbody>
  </table></div></details>

  <h2>Respostas avaliadas com 👎 (para melhorar)</h2>
  ${down ? `<div class="table-wrap"><table><thead><tr><th>Data</th><th>Idioma</th><th>Pergunta</th><th>Resposta da IA</th></tr></thead><tbody>
    ${feedback.filter((f) => f.rating === -1).slice(0, 30).map((f) => `<tr><td>${fmtDate(f.created_at)}</td><td>${escape(f.lang)}</td><td class="text">${escape(f.question)}</td><td class="text">${escape(f.answer)}</td></tr>`).join("")}
  </tbody></table></div>` : '<p class="muted">Nenhuma resposta mal avaliada. 🎉</p>'}

  <h2>Últimas respostas avaliadas com 👍</h2>
  ${up ? `<div class="table-wrap"><table><thead><tr><th>Data</th><th>Idioma</th><th>Pergunta</th></tr></thead><tbody>
    ${feedback.filter((f) => f.rating === 1).slice(0, 10).map((f) => `<tr><td>${fmtDate(f.created_at)}</td><td>${escape(f.lang)}</td><td class="text">${escape(f.question)}</td></tr>`).join("")}
  </tbody></table></div>` : '<p class="muted">Nenhuma ainda.</p>'}

  <h2>Mensagens do formulário</h2>
  <div class="card"><h3>Por semana (últimas ${WEEKS})</h3>${bars(weeks.map(weekLabel), messagesWeek, { labelEvery: 2, height: 180 })}</div>
  ${messages.length ? `<div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Data</th><th>Nome</th><th>E-mail</th><th>Idioma</th><th>Mensagem</th></tr></thead><tbody>
    ${messages.slice(0, 30).map((m) => `<tr><td>${fmtDate(m.created_at)}</td><td>${escape(m.name)}</td><td><a href="mailto:${escape(m.email)}">${escape(m.email)}</a></td><td>${escape(m.lang)}</td><td class="text">${escape(m.message)}</td></tr>`).join("")}
  </tbody></table></div>` : ""}

  <h2>Mapa de cliques (últimos 30 dias)</h2>
  ${visits && !visits.error ? clickMap(visits.all) : '<p class="muted">Precisa da chave do GoatCounter (veja abaixo).</p>'}

  <h2>Visitas (GoatCounter)</h2>
  ${visitsHtml}
</main>
<script>
const CHARTS = ${JSON.stringify(charts).replace(/</g, "\\u003c")};
${CHART_SCRIPT}
</script>
</body>
</html>`;

writeFileSync(OUT, html);
console.log(`Painel gerado: ${OUT}`);
if (process.platform === "darwin" && !process.env.NAO_ABRIR) execFileSync("open", [OUT]);
