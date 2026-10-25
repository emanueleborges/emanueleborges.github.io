// Gera src/conhecimento.js a partir das mesmas fontes do site — data/ (perfil, experiência, formação,
// projetos, habilidades) e as traduções (../i18n/en.js; pt como reserva) —, para que a IA responda com
// as mesmas informações do portfólio, sem nada escrito à mão aqui:
//   CORE    → resumo curto, enviado em toda pergunta
//   CHUNKS  → trechos do perfil, indexados no Vectorize (RAG) por indexar-vectorize.mjs; os ids são
//             estáveis (o Vectorize atualiza cada trecho pelo id)
//   PROFILE → perfil completo, usado se a busca no Vectorize falhar
// Rodado automaticamente por `npm run dev` e `npm run deploy`.
import fs from "node:fs";
import crypto from "node:crypto";

import { perfil as P, i18n, IDIOMAS, preencher } from "../scripts/dados.mjs";

const { en, pt } = i18n;
const semProtocolo = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
const site = (path = "") => new URL(path, P.site).href.replace(/\/$/, "");

const get = (key) => (en[key] ?? pt[key] ?? "").replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
// Campo dos dados: { key } (tradução) ou { text } (igual em todos os idiomas).
const field = (value) => (value?.key ? get(value.key) : (value?.text ?? ""));
const readData = (file) => JSON.parse(fs.readFileSync(new URL(`../data/${file}`, import.meta.url), "utf8"));

/* ---------- Experiência ---------- */

const jobs = readData("experiencia.json").jobs.map(({ id, company, sistemas = [] }) => {
  // "INDT — Instituto…" vira "INDT (Instituto…)": lê melhor no meio da frase.
  const name = company.key ? get(company.key) : company.text.replace(/ — (.+)$/, " ($1)");
  const bullets = Object.keys(pt).filter((key) => new RegExp(`^${id}\\.b\\d+$`).test(key)).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  const built = sistemas.map((s) => `${s.nome} (${s.hosts[0]}): ${get(s.key)} Stack: ${s.stack}.`).join(" ");
  return {
    id,
    title: `Experience: ${get(`${id}.title`)} at ${name}`,
    text: `${get(`${id}.title`)} — ${name}, ${get(`${id}.period`)}. ${bullets.map(get).join(" ")}${built ? ` Systems built there: ${built}` : ""}`,
    company: name.replace(/ \(.*$/, ""),
  };
});

/* ---------- Formação ---------- */

const plainPt = (key) => pt[key].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");
const education = readData("formacao.json").courses.map(({ key, school, period, emAndamento, ia = {} }, i) => ({
  id: `edu${i + 1}`,
  title: `Education: ${get(key)}`,
  text: `${get(key)}${ia.grau ? ` — ${ia.grau}` : ""} (in Portuguese: ${plainPt(key)}${ia.nota ? `; ${ia.nota}` : ""}) — ${school}${ia.sobre ? `, ${ia.sobre}` : ""}, ${period.replace(" — ", "–")}${emAndamento ? " (in progress)" : ""}.`,
}));

/* ---------- Projetos ---------- */

const projects = readData("projetos.json").projects;
const projectTitle = (p) => p.cv?.name ?? field(p.title);
const projectChunk = (p) => {
  const title = projectTitle(p);
  const stack = p.cv?.stack ?? field(p.type);
  const results = (p.metrics ?? []).map((m) => `${field(m.value)} ${field(m.label)}`).join("; ");
  const code = `${P.links.github}/${preencher(p.repo)}${p.path ? `/${p.path}` : ""}`;
  const demo = !p.demo ? "" : p.demo.href.startsWith("#") ? " Live demo: the chat on this portfolio." : ` Live demo: ${site(p.demo.href)}.`;
  return {
    // O card do assistente (p10) é o próprio portfólio: id "portfolio".
    id: p.id === "p10" ? "portfolio" : p.id,
    title: `Project: ${title}${p.featured ? " (featured)" : ""}`,
    text: `${title}${p.ia ? ` — ${p.ia}` : ""}${stack ? ` (${stack})` : ""}: ${get(p.desc.key)}${results ? ` Verifiable results: ${results}.` : ""} Code: ${code}.${demo}`,
  };
};

/* ---------- Habilidades ---------- */

// Categoria → id estável do trecho e resposta pronta que complementa a lista.
const SKILL_CHUNKS = {
  backend: ["skills-backend", null],
  frontend: ["skills-frontend", "chat.faq.mobile"],
  ia: ["skills-ai", "chat.faq.ai"],
  dados: ["skills-data", "chat.faq.databases"],
  devops: ["skills-devops", "chat.faq.devops"],
  praticas: ["skills-practices", null],
};
const skillsByCategory = new Map();
for (const skill of readData("habilidades.json").skills) {
  if (!skillsByCategory.has(skill.category)) skillsByCategory.set(skill.category, []);
  skillsByCategory.get(skill.category).push(skill.key ? get(skill.key) : (skill.full ?? skill.name));
}
const skills = [...skillsByCategory].map(([category, names]) => {
  const [id, extra] = SKILL_CHUNKS[category];
  const label = get(`skills.tab.${category}`);
  return { id, title: `Skills: ${label}`, text: `Skills listed in the portfolio under "${label}": ${names.join(", ")}.${extra ? ` ${get(extra)}` : ""}` };
});

/* ---------- Resumo fixo e trechos gerais ---------- */

const country = new Intl.DisplayNames(["en"], { type: "region" }).of(P.endereco.pais);
const location = `${P.endereco.cidade}, ${P.endereco.estado}, ${country} (${P.endereco.fuso})`;
const contacts = `${P.email} · WhatsApp ${P.telefone} · ${semProtocolo(P.links.linkedin)} · ${semProtocolo(P.links.github)} · ${semProtocolo(P.site)}`;

const CORE = `${P.nomeCompleto}: ${P.resumo} Based in ${location}; currently at ${jobs[0].company}. Contact: ${contacts}.`;

const demos = projects.filter((p) => p.demo && !p.demo.href.startsWith("#")).map((p) => `${projectTitle(p)} (${site(p.demo.href)})`);
const siteChunk = {
  id: "site",
  title: "What visitors can do on this portfolio",
  text: `The portfolio (${site()}) is available in ${Object.keys(IDIOMAS).length} languages. Visitors can ask this AI assistant, download the résumé as a PDF in any of those languages ("Download résumé" button), try live AI demos — ${demos.join(", ")} —, read how the site was built at ${site("como-construi/")}, and get in touch by e-mail, WhatsApp or LinkedIn.`,
};

const CHUNKS = [
  { id: "summary", title: "Professional summary", text: `${get("about.lead")} ${get("about.body")}` },
  { id: "current", title: "Current role", text: get("chat.faq.current") },
  { id: "differential", title: "Strengths and why hire him", text: get("chat.faq.differential") },
  { id: "availability", title: "Remote work and location", text: `${get("chat.faq.work")} Location: ${location}.` },
  { id: "contact", title: "Contact", text: `E-mail: ${P.email}. WhatsApp: ${P.telefone} (${P.links.whatsapp}). LinkedIn: ${P.links.linkedin}. GitHub: ${P.links.github}. Portfolio: ${site()} (no contact form; direct links only).` },
  ...jobs.map(({ company, ...job }) => job),
  { id: "years", title: "Years of experience and career timeline", text: get("chat.faq.years") },
  { id: "public-sector", title: "Public-sector experience", text: get("chat.faq.public") },
  ...projects.map(projectChunk),
  siteChunk,
  ...skills,
  { id: "soft-skills", title: "Soft skills", text: get("chat.faq.soft") },
  ...education,
  { id: "certifications", title: "Certifications", text: `Certifications: ${get("edu.certList")}` },
  { id: "languages", title: "Languages spoken", text: `Languages spoken: ${get("edu.langList")}` },
];

const ids = new Set();
for (const chunk of CHUNKS) {
  if (!chunk.text || chunk.text.length < 20) throw new Error(`Trecho vazio ou curto demais: ${chunk.id}`);
  if (ids.has(chunk.id)) throw new Error(`Id de trecho repetido: ${chunk.id}`);
  ids.add(chunk.id);
}

const PROFILE = `# ${P.nomeCompleto} — professional profile\n\n${CORE}\n\n${CHUNKS.map((chunk) => `## ${chunk.title}\n${chunk.text}`).join("\n\n")}`;

// Versão do conhecimento: identifica o conteúdo publicado (muda sempre que o perfil muda).
const VERSION = crypto.createHash("sha1").update(PROFILE).digest("hex").slice(0, 10);

fs.writeFileSync(
  new URL("./src/conhecimento.js", import.meta.url),
  `// Arquivo gerado por gerar-conhecimento.mjs — não edite à mão.\nexport const VERSION = ${JSON.stringify(VERSION)};\nexport const NOME = ${JSON.stringify(P.nomeCompleto)};\nexport const PRIMEIRO_NOME = ${JSON.stringify(P.nome)};\nexport const CORE = ${JSON.stringify(CORE)};\nexport const CHUNKS = ${JSON.stringify(CHUNKS, null, 2)};\nexport const PROFILE = ${JSON.stringify(PROFILE)};\n`,
);
console.log(`src/conhecimento.js gerado: ${CHUNKS.length} trechos, perfil com ${PROFILE.length} caracteres, versão ${VERSION}`);
