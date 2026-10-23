// Gera src/conhecimento.js a partir das traduções do site (../i18n/en.js; pt como reserva),
// para que a IA responda com as mesmas informações do portfólio:
//   CORE    → resumo curto, enviado em toda pergunta
//   CHUNKS  → trechos do perfil, indexados no Vectorize (RAG) por indexar-vectorize.mjs
//   PROFILE → perfil completo, usado se a busca no Vectorize falhar
// Rodado automaticamente por `npm run dev` e `npm run deploy`.
import fs from "node:fs";
import crypto from "node:crypto";

import { perfil as P, i18n } from "../scripts/dados.mjs";

const { en, pt } = i18n;
const semProtocolo = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

const get = (key) => (en[key] ?? pt[key] ?? "").replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
const backendSkills = JSON.parse(fs.readFileSync(new URL("../data/habilidades.json", import.meta.url), "utf8"))
  .skills.filter((skill) => skill.category === "backend")
  .map((skill) => skill.name)
  .join(", ");

const CORE = `${P.nomeCompleto} is a Senior Full Stack Developer (Java/Kotlin, Node.js, React, React Native) based in Manaus, Brazil (UTC−4), with 10+ years of experience, currently at INDT and specializing in applied AI (Machine Learning and NLP). Contact: ${P.email} · WhatsApp ${P.telefone} · ${semProtocolo(P.links.linkedin)} · ${semProtocolo(P.links.github)} · ${semProtocolo(P.site)}. Salary and start date are not public — visitors should contact him directly.`;

// Experiência e formação: as mesmas do site e do currículo (data/).
const readData = (file) => JSON.parse(fs.readFileSync(new URL(`../data/${file}`, import.meta.url), "utf8"));
const jobs = readData("experiencia.json").jobs.map(({ id, company }) => {
  // "INDT — Instituto…" vira "INDT (Instituto…)": lê melhor no meio da frase.
  const name = company.key ? get(company.key) : company.text.replace(/ — (.+)$/, " ($1)");
  const bullets = Object.keys(pt).filter((key) => new RegExp(`^${id}\\.b\\d+$`).test(key)).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  return { id, title: `Experience: ${get(`${id}.title`)} at ${name}`, text: `${get(`${id}.title`)} — ${name}, ${get(`${id}.period`)}. ${bullets.map(get).join(" ")}` };
});
const plainPt = (key) => pt[key].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");
const education = readData("formacao.json").courses.map(({ key, school, period, ia = {} }, i) => ({
  id: `edu${i + 1}`,
  title: `Education: ${get(key)}`,
  text: `${get(key)}${ia.grau ? ` — ${ia.grau}` : ""} (in Portuguese: ${plainPt(key)}${ia.nota ? `; ${ia.nota}` : ""}) — ${school}${ia.sobre ? `, ${ia.sobre}` : ""}, ${period.replace(" — ", "–")}.`,
}));

const CHUNKS = [
  { id: "summary", title: "Professional summary", text: `${get("about.lead")} ${get("about.body")}` },
  { id: "differential", title: "Strengths and why hire him", text: get("chat.faq.differential") },
  { id: "seeking", title: "Roles he is looking for", text: get("chat.faq.seeking") },
  { id: "availability", title: "Availability, remote work, contract and location", text: `${get("chat.faq.work")} Location: Manaus, Amazonas, Brazil (UTC−4). Salary and start date are not public; contact ${P.nome} directly.` },
  { id: "contact", title: "Contact", text: `E-mail: ${P.email}. WhatsApp: ${P.telefone} (${P.links.whatsapp}). LinkedIn: ${P.links.linkedin}. GitHub: ${P.links.github}. Portfolio with résumé PDF in 8 languages and a contact form: ${P.site.replace(/\/$/, "")}.` },
  ...jobs,
  { id: "years", title: "Years of experience and career timeline", text: get("chat.faq.years") },
  { id: "p1", title: `Project: ${get("p1.title")} — final postgraduate project (TCC) at UFG`, text: `${get("p1.title")} is ${P.nome}'s final postgraduate project (TCC, capstone thesis) for the Natural Language Processing postgraduate program at UFG (Universidade Federal de Goiás, Brazil) (${get("p1.type")}): ${get("p1.desc")}` },
  { id: "p2", title: `Project: ${get("p2.title")}`, text: `${get("p2.title")} (machine learning, Scikit-learn, Docker): ${get("p2.desc")}` },
  { id: "p3", title: `Project: ${get("p3.title")}`, text: `${get("p3.title")} (deep learning, LSTM, TensorFlow, Flask): ${get("p3.desc")}` },
  { id: "p4", title: `Project: ${get("p4.title")}`, text: `${get("p4.title")} (RAG, ChromaDB, FastAPI, Streamlit): ${get("p4.desc")}` },
  { id: "p5", title: `Project: ${get("p5.title")}`, text: `${get("p5.title")} (Java 17, Spring Boot, Kafka, Redis): ${get("p5.desc")}` },
  { id: "p6", title: "Project: Products API", text: `Products API (NestJS, TypeORM, Kafka, Redis): ${get("p6.desc")}` },
  { id: "p7", title: "Project: Movie Recommender System", text: `Movie Recommender System (FastAPI, PostgreSQL, Scikit-learn): ${get("p7.desc")}` },
  { id: "p8", title: "Project: Face Recognition POC", text: `Face Recognition POC (face-api.js, Node.js, SQLite): ${get("p8.desc")}` },
  { id: "p9", title: "Project: Kotlin Desktop CRUD", text: `Kotlin Desktop CRUD (Kotlin, Jetpack Compose, Retrofit): ${get("p9.desc")}` },
  { id: "p12", title: `Project: ${get("p12.title")}`, text: `${get("p12.title")} (FLUX.1 [schnell], Llama Guard 3, Cloudflare Workers AI, Turnstile): ${get("p12.desc")}` },
  { id: "portfolio", title: "Project: this portfolio website", text: "This portfolio itself: static site (HTML, CSS, vanilla JavaScript, Canvas) in 8 languages, local search assistant (TF-IDF, typo tolerance), AI chat with Cloudflare Workers AI and RAG over Vectorize, contact form stored in Cloudflare D1, Turnstile bot protection, PDF résumés generated with headless Chrome, hosted on GitHub Pages." },
  { id: "skills-backend", title: "Skills: backend", text: `Backend skills listed in the portfolio: ${backendSkills}.` },
  { id: "skills-frontend", title: "Skills: frontend and mobile", text: `Frontend and mobile: TypeScript, JavaScript, React, React Native, Vue.js, Angular, HTML & CSS. ${get("chat.faq.mobile")}` },
  { id: "skills-ai", title: "Skills: AI and machine learning", text: `AI and ML: NLP, LLM, RAG, LangChain, TensorFlow, Scikit-learn, Pandas, Hugging Face. ${get("chat.faq.ai")}` },
  { id: "skills-data", title: "Skills: databases", text: `Data: PostgreSQL, Oracle, MySQL, MongoDB, SQL Server, Redis. ${get("chat.faq.databases")}` },
  { id: "skills-devops", title: "Skills: DevOps and cloud", text: `DevOps: Docker, Kubernetes, AWS, Kafka, RabbitMQ, CI/CD, GitLab. ${get("chat.faq.devops")}` },
  { id: "skills-practices", title: "Skills: engineering practices", text: "Practices: Clean Architecture, Clean Code, TDD, SDD (spec-driven development), unit testing, code review, SonarQube, Scrum." },
  { id: "soft-skills", title: "Soft skills", text: get("chat.faq.soft") },
  ...education,
  { id: "certifications", title: "Certifications", text: `Certifications: ${get("edu.certList")}` },
  { id: "languages", title: "Languages spoken", text: `Languages spoken: ${get("edu.langList")}` },
];

for (const chunk of CHUNKS) {
  if (!chunk.text || chunk.text.length < 20) throw new Error(`Trecho vazio ou curto demais: ${chunk.id}`);
}

const PROFILE = `# ${P.nomeCompleto} — professional profile\n\n${CORE}\n\n${CHUNKS.map((chunk) => `## ${chunk.title}\n${chunk.text}`).join("\n\n")}`;

// Versão do conhecimento: muda quando o perfil muda, invalidando o cache de respostas da IA.
const VERSION = crypto.createHash("sha1").update(PROFILE).digest("hex").slice(0, 10);

fs.writeFileSync(
  new URL("./src/conhecimento.js", import.meta.url),
  `// Arquivo gerado por gerar-conhecimento.mjs — não edite à mão.\nexport const VERSION = ${JSON.stringify(VERSION)};\nexport const NOME = ${JSON.stringify(P.nomeCompleto)};\nexport const PRIMEIRO_NOME = ${JSON.stringify(P.nome)};\nexport const CORE = ${JSON.stringify(CORE)};\nexport const CHUNKS = ${JSON.stringify(CHUNKS, null, 2)};\nexport const PROFILE = ${JSON.stringify(PROFILE)};\n`,
);
console.log(`src/conhecimento.js gerado: ${CHUNKS.length} trechos, perfil com ${PROFILE.length} caracteres, versão ${VERSION}`);
