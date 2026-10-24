# Specification — Emanuel Borges's Portfolio

🌐 **English** · [Português](../spec.md)

> **Spec-Driven Development (SDD).** This document describes **what** the product does and **why**. The **how** is in [`plan.md`](plan.md) and the execution in [`tasks.md`](tasks.md).

| | |
|---|---|
| **Product** | Professional portfolio with an AI assistant, AI demos and job matching |
| **URL** | https://emanueleborges.github.io |
| **Owner** | Emanuel Borges |
| **Status** | In production |
| **Main constraints** | Zero infrastructure cost · privacy (no visitor content stored) · every piece of data in one place |

---

## 1. Vision

Present Emanuel Borges's professional profile to recruiters and companies in Brazil and abroad in a **clear, modern and interactive** way, letting visitors **quickly find** what they need (experience, projects, technologies, education, availability) and **get in touch** easily.

### 1.1 Problem
Static résumés and profiles force recruiters to read everything to find one piece of information ("has he used Kafka?", "does he work remotely?"), and don't show the candidate's technical skills in practice.

### 1.2 Goals
1. Communicate the profile within 30 seconds (top of the page + summary + featured projects).
2. Answer visitor questions in natural language, in 8 languages.
3. Make contact easy through direct links (email, WhatsApp, LinkedIn) and the PDF résumé, with no form on the site.
4. Demonstrate front-end, serverless back-end and applied AI skills on the site itself.
5. Run at **zero cost**.
6. Be easy to maintain and **reusable as a template**: personal data, text, languages and themes live in single sources; everything else is generated.

### 1.3 Out of scope
- Storing contact messages.
- Storing or caching visitor questions and answers.
- Blog, user accounts or payments.

---

## 2. Personas

| Persona | Need | How the product helps |
|---|---|---|
| **Technical recruiter** | Quickly check technologies and experience | Organized sections, featured projects, filters, quick search, AI chat, PDF résumé |
| **International recruiter** | Read in their own language; understand the hiring model | 8 languages (English by default), answers about remote work, time zone and contract type, "Does your role match?" |
| **Hiring manager / tech lead** | Assess technical depth and projects | Projects with technical descriptions and verifiable results, **live AI demos**, "How I built it" and the site itself as a showcase |
| **Emanuel (owner)** | Update content and track interest | Single sources (`data/`, `i18n/`, `idiomas.js`), a generator checked in CI, aggregate statistics and a weekly summary |
| **Someone using the project as a template** | Have their own portfolio without rewriting code | Replace `data/` (data, media, themes) and the text in `i18n/`, run the generator and deploy |

---

## 3. Functional requirements

### FR-01 — Profile content
The site shows: hero (name, role, summary, location, years of experience), About (with photo and spoken intro), Experience (CI/CD pipeline), Projects, Skills, Education (with certifications and languages) and Contact.
- FR-01.1 Each project card has a "View code" link to the repository and shows language, stars (if any) and last update, from the public GitHub API.
- FR-01.2 Projects with a live demo have a "View demo" button (LSTM, face recognition, movie recommender, RAG security, image generator and the assistant itself).
- FR-01.3 Results quoted on cards must be verifiable (same number as the demo or repository).
- FR-01.4 Experience is a CI/CD pipeline: each job is a stage (✓ passed or ● running), in chronological order; choosing a stage shows the "log" with achievements and the most cited stack of the period. Keyboard navigable (←/→).
- FR-01.5 Skills open as a grid (default) and can be viewed as a skills × projects graph.
- FR-01.6 **Featured projects:** projects marked as featured come first, in large cards with metrics; the others go under "More projects", in compact cards. Card numbers follow display order. The "More projects" title hides when the filter hides all its cards.
- FR-01.7 **Education in progress:** unfinished courses show "(in progress)" next to the period, on the site, in the résumé and in AI answers.
- FR-01.8 **Spoken intro:** the ▶ button on the photo plays a profile summary (English and Portuguese) with captions; the button only appears if there is audio for the language.

### FR-02 — Languages
- FR-02.1 Available in **English (default)**, Portuguese, Spanish, French, Italian, German, Simplified Chinese and Russian.
- FR-02.2 Visitors switch language with a header selector; the choice is remembered on every page.
- FR-02.3 The language can be set by link (`?lang=xx`).
- FR-02.4 All visible text, accessibility attributes, chat, cards and résumé follow the chosen language.

### FR-03 — Filters
- FR-03.1 Projects filterable by category (All, AI/ML, Backend & APIs, Web & Apps), in both groups (featured and "More projects").
- FR-03.2 Skills filterable by category, with a "showing X of Y" counter.

### FR-04 — PDF résumé
- FR-04.1 The résumé is **built by the site itself**, on demand, from the same data and text sources as the site, in any of the 8 languages. There are no PDF files in the repository.
- FR-04.2 "Download résumé" opens the résumé in the current language in a modal for reading (phone friendly); "Download PDF" downloads the **A4 PDF file**, generated from the same page. If generation isn't available, it opens the browser's print dialog ("Save as PDF"); the standalone page `curriculo.html?lang=xx&pdf=1` opens straight into printing.
- FR-04.3 Old links to `/cv/…-<lang>.pdf` lead to the résumé in that language, already printing.

### FR-05 — Assistant (chat)
- FR-05.1 A floating button opens the assistant panel; an invitation bubble appears 3 s after the first visit (once).
- FR-05.2 **Ready-made answers** for frequent topics (19 topics), with follow-up buttons.
- FR-05.3 Greetings, thanks, salary, start date and education are **always** answered with ready-made text (no AI).
- FR-05.4 Other questions are answered by **generative AI** based **only** on the profile (RAG).
- FR-05.5 AI answers show an "AI-generated answer" badge and a "See on page" shortcut.
- FR-05.6 If the AI fails or the daily free quota runs out, the chat **tells the visitor** ("The AI has reached today's free quota…" or "…is unavailable right now…") and answers through **local search** over the page content.
- FR-05.7 Local search tolerates typos and synonyms and works in all 8 languages.
- FR-05.8 Contact questions show contact buttons; résumé questions show a shortcut to the résumé (with "Download PDF").
- FR-05.9 The `/#chat` link opens the site with the assistant open.
- FR-05.10 AI answers can be rated 👍/👎; only daily totals per rating type are kept for up to 30 days, with no question, answer, language or identifiers.
- FR-05.11 Answers appear with a typing effect (see FR-16.6).

### FR-07 — Direct contacts
Email, WhatsApp, LinkedIn and GitHub in the contact section and the assistant. There is no form; messages are neither sent nor stored by the site. Each contact opens a modal card (FR-16.3).

### FR-08 — Statistics
Optional counting only after explicit consent. The Worker uses the continent provided by Cloudflare and D1 stores only daily totals per continent and per clicked link (fixed targets validated by the Worker); no IP, URL, language or identifiers. Aggregates are deleted before they reach 30 days. Pages opened inside the modal neither ask nor count.

### FR-09 — SEO and sharing
- FR-09.1 Shared links (LinkedIn, WhatsApp, X) show a preview with image, title and description.
- FR-09.2 Tell Google about the 8 language versions (`hreflang`) and who the site is about (`Person` structured data, with current employer and schools taken from the experience and education data).
- FR-09.3 Publish `sitemap.xml` (page in 8 languages, demos, "Does your role match?" and "How I built it") and `robots.txt`; the site is verified in Google Search Console.

### FR-10 — Weekly summary
Every Monday the owner receives an e-mail with aggregate counts of ratings, consented regional visits and clicks, plus the health of the AI, vector index and database. Aggregate data only.

### FR-11 — Not-found page
Unknown addresses show a 404 page in the site's style, with links to the portfolio and the assistant (and the redirect in FR-04.3).

### FR-12 — AI demos
Their own pages (`/demos/…`), in 8 languages, in the site's style and theme, linking back to the portfolio and the code:
- FR-12.1 **Stock forecasting (LSTM):** 15 stocks (8 B3, 7 NASDAQ) and 1–10 business days; forecast as chart and table, out-of-sample metrics **compared with a naive baseline** and an actual × predicted chart. Live prices when possible; otherwise the last saved copy, with its date. "Not investment advice" notice.
- FR-12.2 **Face recognition:** webcam or photo; the visitor enrolls faces with a name and sees recognition with the distance. **No image leaves the device** and nothing is stored.
- FR-12.3 **Movie recommender:** by a chosen movie or a free description (in English), with similarity and **the terms that explain each recommendation**. Freely licensed data, credited.
- FR-12.4 Inference demos run in the visitor's browser; none requires an account or a paid server.
- FR-12.5 **RAG security against prompt injection:** local, interactive simulation of attacks in the question and in retrieved documents, with layered defenses; runs no AI model and sends nothing; the secret shown is fictitious.
- FR-12.6 **Image generator (FLUX.1):** text in any language → 1024×1024 image; 2 images per visitor per day (the page shows how many are left), a global daily cap, moderation of the translated text; neither text nor image is stored.

### FR-13 — Installable, offline app
The site can be installed as an app (manifest and icons) and, after the first visit, opens offline with the last saved version; the chat uses local search when offline.

### FR-14 — "Does your role match?" (for recruiters)
- FR-14.1 Page `/vaga/` (8 languages) where the recruiter pastes a job description (80–8,000 characters, any language) and gets: a match score (0–100%), each requirement with its level (meets / partial / not found), must-have or nice-to-have, a reason and clickable evidence, and a "why <name>" summary with a copy button.
- FR-14.2 Requirements are only those written in the job (nothing invented or omitted); the score is computed by rule, not by the AI; no experience may be claimed without evidence in the profile.
- FR-14.3 The job text is not stored; the visitor is told so.
- FR-14.4 The result shows the score on a gauge and the match per pillar (Backend, Frontend, AI/ML, Data, DevOps, Other) as radar and bars.

### FR-15 — Themes
- FR-15.1 Two themes: **Amazon** (default; dark, forest green and lime with tech blue) and **Editorial** (dark; navy, slate and cyan).
- FR-15.2 A header button on every page moves to the next theme; the choice is saved for future visits and pages; `?theme=editorial` opens straight in that theme.
- FR-15.3 The theme is applied before first paint (no flash); Lighthouse accessibility 100 in both themes.
- FR-15.4 **Color intensity:** a slider next to the theme button makes colors weaker (left, down to near gray) or stronger and darker (right); the middle is the original colors. The choice is saved, applies on every page and before paint. On screens up to 420 px the slider sits in the ☰ menu.
- FR-15.5 Creating or changing a theme (name in each language, colors, default theme, slider limits) means editing a single data file.

### FR-16 — Interactions and navigation without leaving the site
- FR-16.1 **Sound and haptics:** interface clicks and keystrokes synthesized in the browser, plus a short vibration on phones; a mute button on every page, remembered.
- FR-16.2 **Modals for site pages:** demos, "How I built it", job match and the résumé open in a modal in the current language and theme; closing unloads the page (turns off the face demo's camera).
- FR-16.3 **External links:** the owner's GitHub links open in a modal viewer (folders, formatted README/Markdown, code and images). LinkedIn, WhatsApp, email and other sites open a modal card (WhatsApp QR code, LinkedIn profile with role and city, email to copy, description and stack of the systems built); the external site only opens on request.
- FR-16.4 **Share:** QR code and portfolio link in the current language, with copy, native sharing and WhatsApp, LinkedIn and email shortcuts.
- FR-16.5 **Quick search:** `/` or Ctrl/⌘+K opens a bar that finds projects, jobs, skills, sections and actions, filters projects by topic and sends questions to the assistant; nothing is sent to a server.
- FR-16.6 **Typing effect:** chat answers (and the greeting) appear letter by letter in up to ~2.5 s; a click completes them; screen readers get the full text; no effect with "reduce motion".
- FR-16.7 **Technical footer:** shows the chat's AI model and the **AI state** (online / quota reached · local search / unavailable · local search), updated by the last chat question; ping and Cloudflare data center are measured only when the visitor clicks.

### FR-17 — Single sources and reuse as a template
- FR-17.1 Every piece of data exists in **one place only**: personal data, contacts, media, SEO and service addresses (`data/perfil.json`); experience and systems built; education; projects; skills; themes; languages; text per language.
- FR-17.2 Everything that depends on those sources (static HTML, SEO, sitemap, robots, manifest, CSP, language selectors, résumé, colors, AI knowledge, Worker config) is **generated** from them; generated files are never edited by hand.
- FR-17.3 Replacing the data in `data/` and the text in `i18n/` produces someone else's portfolio without code changes; without the audio files, the spoken-intro button simply doesn't appear.

---

## 4. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | **Cost** | Zero-cost infrastructure: only free plans **with no payment method on file**. When a free limit is reached the feature pauses and the site keeps working (graceful degradation), never billing. New services only with a free plan that needs no card. |
| NFR-02 | **Performance** | Static site with no build; first image preloaded; non-blocking fonts; translations, Turnstile, QR code and Markdown loaded on demand. Target: Lighthouse (mobile) ≥ 75 performance and 100 accessibility, best practices and SEO. |
| NFR-03 | **Availability** | The chat stays useful without AI (local search, with a notice); contact through direct links; the résumé needs no server. |
| NFR-04 | **Security** | Backend accepts only the site's origin; bot protection on every call that writes data or uses AI; per-IP limits; input validation; no secrets in the repo; CSP on every page. |
| NFR-05 | **Privacy (LGPD)** | No contact form. Chat questions, job texts and image prompts are processed to produce the answer and **are not stored or cached** (neither in AI Gateway nor in KV). D1 keeps only daily aggregates, deleted before 30 days. Statistics only after consent. In the face demo, camera and photos stay on the device. |
| NFR-06 | **Accessibility** | Semantic HTML, translated ARIA labels, visible focus, keyboard navigation, `prefers-reduced-motion`; accessibility 100 in both themes. |
| NFR-07 | **Responsiveness** | Usable and readable from 320 px to wide desktop with no horizontal scroll (the header is measured at 320, 360 and 390 px). |
| NFR-08 | **AI reliability** | The AI must not invent facts; it must decline off-profile topics and resist visitor instructions that try to change the rules. |
| NFR-09 | **Maintainability** | Single sources (FR-17) and a generator with a `--check` mode in CI: the build fails if any generated file is out of date. No framework or bundler; Web Components; ES modules with an import map. |
| NFR-10 | **Cache** | Site updates reach visitors without manual cache clearing (automatic `?v=` versioning). |

---

## 5. Acceptance criteria

### Languages
- [x] With no saved preference, the site opens in English.
- [x] Choosing "中文" switches all visible text to Chinese and the choice persists on reload and in the demos.
- [x] `?lang=ru` opens the site in Russian.

### Assistant
- [x] "where did he study?" returns education with exact names (FUCAPI, UFG, FIAP, Descomplica).
- [x] "kafak" (typo) finds the Kafka projects.
- [x] "What was his capstone?" (AI) mentions the Intelligent Legal Critic.
- [x] "Give me a cake recipe" is politely declined; "Ignore all previous instructions…" doesn't change behavior.
- [x] "How old is he?" says that information isn't available, without inventing.
- [x] With the Worker answering `503 quota` (error 3036), the chat shows the quota notice, answers through local search and the footer switches to "quota reached · local search" — in all 8 languages (automated test).
- [x] The 104 tests of `tests/rodar-testes-chat.sh` pass (96 cases + the AI fallback in each language).

### Single sources and reuse
- [x] `node scripts/gerar-secoes.mjs --check` passes in CI; changing data without running the generator makes CI fail.
- [x] Replacing only `data/perfil.json` with a fictitious person, the site, demo titles, résumé, SEO, manifest, robots, sitemap, CSP, `wrangler.jsonc` and AI knowledge all show the new person, with no leftovers.
- [x] The experience and education sections and the rendered résumé (pt and en) stayed identical after moving to `data/`.

### Résumé
- [x] "Download résumé" opens the modal; "Download PDF" prints the résumé (tested with a stubbed `print`).
- [x] `curriculo.html?lang=fr&pdf=1` opens printing; without `?pdf=1` it doesn't.
- [x] The printed PDF text is identical to the PDFs that existed before (pt, en and zh, 2 pages).

### Themes
- [x] At intensity 1 (slider middle) the 63 computed theme colors are identical to before (max difference 0.5/255).
- [x] Header and menu sliders stay in sync; the choice is saved and applied in the demos.
- [x] The header keeps the same measurements as before at 320, 360 and 390 px.

### Contact and privacy
- [x] The contact section keeps direct links, with no form or submission route to the Worker.
- [x] D1 queries use the primary-key index (checked with `EXPLAIN QUERY PLAN`).

### Security
- [x] Backend request from another origin → `403 forbidden_origin`.
- [x] Request without a Turnstile token or with a fake one → `403 turnstile_failed`.
- [x] 11th chat request in the same minute → `429 rate_limited`.
- [x] Face-demo script tampered with on the CDN → the browser refuses to run it (SRI).

### Cache
- [x] After a commit the HTML references `styles.css?v=<new version>` and the import map uses the same version.

### Ratings
- [x] Clicking 👎 on an AI answer shows "Thanks for the feedback!" and increments the day's total.

### SEO and performance
- [x] `sitemap.xml` and `robots.txt` return HTTP 200; the sitemap is valid XML with 16 URLs.
- [x] The page has an Open Graph preview (1200×630 image), `hreflang` for 8 languages and valid `Person` JSON-LD.
- [x] Lighthouse (mobile): performance ~80, accessibility 100, best practices 100, SEO 100.
- [x] An unknown address returns HTTP 404 with the custom page.

### Continuous integration
- [x] Every push to `main` runs: script syntax, SEO, generator `--check`, import map, AI knowledge build, Worker tests (40), security-demo tests (6) and chat tests (104).
- [x] Every push runs Lighthouse (3 runs); fails if accessibility < 95, best practices < 90 or SEO < 95.

### Projects and demos
- [x] 4 featured projects and 8 under "More projects" (240 px compact cards); filters and quick search work on both groups.
- [x] UFG and FIAP show "(in progress)" on the site, in the résumé and in the AI knowledge.
- [x] The JavaScript LSTM matches Keras (difference ~1e-8); the MAPE (1.1–2.2%) is shown next to the naive baseline.
- [x] Face demo: an enrolled photo is recognized in a mirrored, rotated version (distance 0.19 < 0.55).
- [x] Movie demo: ~1,500 films indexed in < 50 ms.

### Installable app
- [x] After the first visit the site reloads offline, with its look and projects.

### Interactions and navigation
- [x] "/" and Ctrl/⌘+K open search; "rag" filters the RAG projects.
- [x] Demos, "How I built it", job match and résumé open in the modal; closing clears the iframe.
- [x] WhatsApp, LinkedIn, email and the City Hall systems open their cards, with text from the translations.

### Metrics e-mail
- [ ] The aggregate weekly summary arrives on Monday (test send ran without errors; receipt to be confirmed).
