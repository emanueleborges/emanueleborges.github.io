// Gera src/conhecimento.js a partir das traduções do site (../i18n.js, em inglês),
// para que a IA responda com as mesmas informações do portfólio.
// Rodado automaticamente por `npm run dev` e `npm run deploy`.
import fs from "node:fs";

const source = fs.readFileSync(new URL("../i18n.js", import.meta.url), "utf8");
globalThis.window = {};
new Function(source)();
const en = globalThis.window.I18N.en;
const pt = globalThis.window.I18N.pt;

const get = (key) => (en[key] ?? pt[key] ?? "").replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();

const profile = `
# Emanuel Borges — professional profile

## Summary
${get("about.lead")} ${get("about.body")}
${get("chat.faq.differential")}

## Availability and job search
- ${get("chat.faq.seeking")}
- ${get("chat.faq.work")}
- Location: Manaus, Amazonas, Brazil (UTC−4).
- Salary and start date: not public — the visitor should contact Emanuel directly.

## Contact
- E-mail: emanuel.eborges@gmail.com
- WhatsApp: +55 92 99977-1376 (https://wa.me/5592999771376)
- LinkedIn: https://www.linkedin.com/in/borgesemmanuell
- GitHub: https://github.com/emanueleborges
- Portfolio: https://emanueleborges.github.io (résumé PDF available there in 7 languages)

## Experience
### ${get("job1.title")} — INDT (Instituto de Desenvolvimento Tecnológico), ${get("job1.period")}
- ${get("job1.b1")}
- ${get("job1.b2")}
- ${get("job1.b3")}
### ${get("job2.title")} — ICCT (Instituto CAL-COMP de Tecnologia), ${get("job2.period")}
- ${get("job2.b1")}
- ${get("job2.b2")}
- ${get("job2.b3")}
### ${get("job3.title")} — ${get("job3.company")}, ${get("job3.period")}
- ${get("job3.b1")}
- ${get("job3.b2")}
- ${get("job3.b3")}

## Selected projects
- ${get("p1.title")} (${get("p1.type")}): ${get("p1.desc")}
- ${get("p2.title")}: ${get("p2.desc")}
- ${get("p3.title")}: ${get("p3.desc")}
- ${get("p4.title")}: ${get("p4.desc")}
- ${get("p5.title")}: ${get("p5.desc")}
- Products API (NestJS, TypeORM, Kafka, Redis): ${get("p6.desc")}
- Movie Recommender System: ${get("p7.desc")}
- Face Recognition POC: ${get("p8.desc")}
- Kotlin Desktop CRUD: ${get("p9.desc")}
- This portfolio itself: static site (HTML, CSS, vanilla JavaScript, Canvas), 7 languages, local search assistant, AI chat via Cloudflare Workers + Claude, PDF résumés generated with headless Chrome, hosted on GitHub Pages.

## Skills
- Backend: Java, Kotlin, Spring Boot, Node.js, NestJS, Express, PHP/Laravel, Python, Flask, FastAPI
- Frontend & mobile: TypeScript, JavaScript, React, React Native, Vue.js, Angular, HTML & CSS
- AI & ML: NLP, LLM, RAG, LangChain, TensorFlow, Scikit-learn, Pandas, Hugging Face
- Data: PostgreSQL, Oracle, MySQL, MongoDB, SQL Server, Redis
- DevOps: Docker, Kubernetes, AWS, Kafka, RabbitMQ, CI/CD, GitLab
- Practices: Clean Architecture, Clean Code, TDD, unit testing, code review, SonarQube, Scrum
- ${get("chat.faq.soft")}

## Education
- ${get("edu.d1")} — Universidade Federal de Goiás (UFG), 2025–2026
- ${get("edu.d2")} — FIAP, 2025–2026
- ${get("edu.d3")} — Descomplica, 2024–2025
- ${get("edu.d4")} — FUCAPI, 2000–2010
- Certifications: ${get("edu.certList")}
- Languages spoken: ${get("edu.langList")}
`.trim();

fs.writeFileSync(
  new URL("./src/conhecimento.js", import.meta.url),
  `// Arquivo gerado por gerar-conhecimento.mjs — não edite à mão.\nexport const PROFILE = ${JSON.stringify(profile)};\n`,
);
console.log(`src/conhecimento.js gerado (${profile.length} caracteres)`);
