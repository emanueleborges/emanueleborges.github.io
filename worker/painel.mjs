// Painel local de dados operacionais: avaliações do chat, cliques por link
// e visitas por continente.
// Busca os agregados no D1, gera painel.html fora do git e abre no navegador. Nada é publicado.
//
// Uso:  cd worker && npm run painel

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CLICK_TARGETS } from "./src/rotas/metricas.js";

const DIR = dirname(fileURLToPath(import.meta.url));
const OUT = join(DIR, "painel.html");

const WEEKS = 12;
const d1 = (sql) => {
  const output = execFileSync("npx", ["wrangler", "d1", "execute", "portfolio-contact", "--remote", "--json", "--command", sql], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return JSON.parse(output)[0].results;
};

const escape = (text) => String(text ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
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

console.log("Buscando totais agregados de avaliações, cliques e acessos no D1…");
const feedback = d1("SELECT feedback_date, rating, total FROM feedback_daily ORDER BY feedback_date DESC");
const visits = d1("SELECT continent, SUM(total) AS total FROM regional_visits WHERE access_date > date('now', '-29 days') GROUP BY continent ORDER BY total DESC");
const visitTotal = visits.reduce((sum, row) => sum + Number(row.total), 0);
const clicks = d1("SELECT target, SUM(total) AS total FROM click_daily WHERE click_date > date('now', '-29 days') GROUP BY target");

const up = feedback.filter((f) => f.rating === 1).reduce((sum, f) => sum + Number(f.total), 0);
const down = feedback.filter((f) => f.rating === -1).reduce((sum, f) => sum + Number(f.total), 0);
const feedbackTotal = up + down;
const weeks = lastWeeks();
const ratingsByWeek = (rating) => weeks.map((w) =>
  feedback
    .filter((row) => row.rating === rating && weekOf(`${row.feedback_date} 00:00:00`) === w)
    .reduce((sum, row) => sum + Number(row.total), 0),
);
const UP = { name: "👍 Positivas", color: "var(--s1)" };
const DOWN = { name: "👎 Negativas", color: "var(--s2)" };

const ratingsWeek = [
  { ...UP, values: ratingsByWeek(1) },
  { ...DOWN, values: ratingsByWeek(-1) },
];

const tile = (label, value, note = "") => `<div class="tile"><span>${label}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ""}</div>`;

/* ---------- Cliques por link ---------- */

const clickNames = {
  "nav-contact": "Menu · Vamos conversar",
  "hero-projects": "Topo · Explorar projetos",
  "hero-contact": "Topo · Entre em contato",
  "hero-cv": "Topo · Baixar currículo",
  "hero-chat": "Topo · Pergunte à minha IA",
  "projects-github": "Projetos · Ver todos no GitHub",
  "contact-email": "Contato · E-mail",
  "contact-cv": "Contato · Baixar currículo",
  "contact-whatsapp": "Contato · WhatsApp",
  "contact-github": "Contato · GitHub",
  "contact-linkedin": "Contato · LinkedIn",
};
const clickName = (target) => {
  if (clickNames[target]) return clickNames[target];
  const [kind, name] = target.split(":");
  return `${kind === "demo" ? "Demo" : "Código"} · ${name}`;
};
// Links fixos sem nenhum clique também aparecem (com 0), para mostrar o que menos atrai.
const clickTotals = new Map([...CLICK_TARGETS].map((target) => [target, 0]));
clicks.forEach((row) => clickTotals.set(row.target, Number(row.total)));
const clickRows = [...clickTotals].sort((a, b) => b[1] - a[1] || clickName(a[0]).localeCompare(clickName(b[0]), "pt-BR"));
const clickTotal = clickRows.reduce((sum, [, total]) => sum + total, 0);
const clickMax = Math.max(1, ...clickRows.map(([, total]) => total));
const clicksHtml = `<div class="tiles">${tile("Cliques consentidos (30 dias)", clickTotal.toLocaleString("pt-BR"))}</div>
  <div class="card" style="margin-top:12px"><h3>Do mais ao menos clicado</h3><div class="hbars">
    ${clickRows.map(([target, total]) => `<div class="hbar"><span title="${escape(clickName(target))}">${escape(clickName(target))}</span><i style="width:${(total / clickMax) * 100}%"></i><b>${total}</b></div>`).join("")}
  </div></div>
  <p class="muted">Somente totais diários por link, após consentimento, sem IP, página, idioma ou identificadores. Projetos aparecem quando recebem o primeiro clique.</p>`;

const continentNames = { AF: "África", AN: "Antártida", AS: "Ásia", EU: "Europa", NA: "América do Norte", OC: "Oceania", SA: "América do Sul" };
const visitsHtml = `<div class="tiles">${tile("Acessos regionais consentidos (30 dias)", visitTotal.toLocaleString("pt-BR"))}</div>
  <div class="table-wrap"><table><thead><tr><th>Continente</th><th class="num">Acessos</th></tr></thead><tbody>
    ${visits.map((row) => `<tr><td>${continentNames[row.continent] ?? "Desconhecido"}</td><td class="num">${Number(row.total).toLocaleString("pt-BR")}</td></tr>`).join("") || '<tr><td colspan="2">Nenhum acesso consentido registrado.</td></tr>'}
  </tbody></table></div>
  <p class="muted">Somente totais diários por continente, sem IP, URL, idioma, cliques ou identificadores. Os agregados são removidos antes de completar 30 dias.</p>`;

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
  .hbar { display: grid; grid-template-columns: minmax(110px, 240px) 1fr 40px; align-items: center; gap: 10px; font-size: 13px; }
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
  <p class="muted">Gerado em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Manaus" })} (horário de Manaus) · arquivo local, não publicado.</p>

  <div class="tiles">
    ${tile("Avaliações de IA (30 dias)", feedbackTotal.toLocaleString("pt-BR"), `${up} 👍 · ${down} 👎`)}
    ${tile("Aprovação", `${pct(up, feedbackTotal)}%`, "avaliações positivas")}
  </div>

  <h2>Avaliações do chat</h2>
  <div class="card"><h3>Por semana (últimas ${WEEKS})</h3>${bars(weeks.map(weekLabel), ratingsWeek, { labelEvery: 2 })}${legend(ratingsWeek)}</div>
  <details><summary>Ver como tabela</summary><div class="table-wrap"><table>
    <thead><tr><th>Semana de</th><th class="num">👍</th><th class="num">👎</th></tr></thead>
    <tbody>${weeks.map((w, i) => `<tr><td>${weekLabel(w)}</td><td class="num">${ratingsWeek[0].values[i]}</td><td class="num">${ratingsWeek[1].values[i]}</td></tr>`).join("")}</tbody>
  </table></div></details>
  <p class="muted">São armazenados somente totais diários de 👍/👎 por até 30 dias; perguntas, respostas e idiomas não são guardados junto à avaliação.</p>

  <h2>Cliques por link</h2>
  ${clicksHtml}

  <h2>Acessos por continente</h2>
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
