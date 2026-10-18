# Tasks — Emanuel Borges's Portfolio

🌐 **English** · [Português](../tasks.md)

> **Spec-Driven Development (SDD).** Execution list derived from the [specification](spec.md) and the [technical plan](plan.md). Each task references the requirements it addresses.

Legend: ✅ done · ⏳ pending · 💡 idea

---

## Done

### Foundation
- ✅ **T01** Site structure (hero, About, Experience, Projects, Skills, Education, Contact) — FR-01
- ✅ **T02** Publishing on GitHub Pages with deployment on every `git push` — NFR-01
- ✅ **T03** Sticky header with reading-progress bar — NFR-06
- ✅ **T04** Favicon and iPhone/iPad icon with the "E." logo

### Content and visuals
- ✅ **T05** Content from the résumé and LinkedIn — FR-01
- ✅ **T06** Oval photo with zoom on hover — FR-01
- ✅ **T07** AI/tech palette (purple + cyan), full-screen duotone background images — NFR-07
- ✅ **T08** Particles (Canvas), light blobs, scroll animations, respects "reduce motion" — NFR-06
- ✅ **T09** Project and skill filters with a counter — FR-03
- ✅ **T10** Institution logos (light and dark background versions) — FR-01
- ✅ **T11** Icons for the 46 skills (Simple Icons + generic icons) — FR-01

### Languages
- ✅ **T12** i18n in 8 languages, header selector, `?lang=`, English by default — FR-02

### Résumé
- ✅ **T13** `curriculo.html` + `gerar-curriculos.sh` → 8 PDFs — FR-04
- ✅ **T14** Download button per language — FR-04.2

### Assistant
- ✅ **T15** Local search (TF-IDF, synonyms, Chinese) — FR-05.6, FR-05.7
- ✅ **T16** Typo tolerance (Damerau-Levenshtein) — FR-05.7
- ✅ **T17** 19 ready-made answer topics with follow-up buttons — FR-05.2
- ✅ **T18** Invitation bubble (3 s, once) — FR-05.1
- ✅ **T19** Worker with Workers AI (Qwen3 30B), CORS and per-IP limit — FR-05.4, NFR-01, NFR-04
- ✅ **T20** AI Gateway 24 h cache initially implemented; prompt/answer caching removed in a later privacy review — NFR-02
- ✅ **T21** Invisible Turnstile — NFR-04
- ✅ **T22** RAG with Vectorize + BGE-M3 (32 excerpts) — FR-05.4, NFR-09
- ✅ **T23** Education with a verified ready-made answer — NFR-08
- ✅ **T24** 92 automated chat tests — Acceptance criteria

### Contact and analytics
- ✅ **T25** WhatsApp, email, LinkedIn, GitHub — FR-07
- ✅ **T26** Contact form retired during the privacy review; direct links kept and old D1 messages removed — FR-07, NFR-05
- ✅ **T27** Contact-message reader removed after dropping the old table — NFR-05
- ✅ **T28** Aggregate website access count — FR-08
- ✅ **T29** Last-updated date in the footer and automatic `?v=` versioning (hook) — NFR-10

### Documentation
- ✅ **T30** README and SDD documents (spec, plan, tasks) in Portuguese and English
- ✅ **T38** New-message notification retired with the contact form — NFR-05
- ✅ **T36** Daily aggregate 👍/👎 ratings in D1 + `ver-avaliacoes.sh`; no individual question/answer — NFR-05
- ✅ **T34** Link previews (Open Graph/Twitter), `hreflang`, `Person` JSON-LD, `sitemap.xml` and `robots.txt` — NFR-02
- ✅ **T39** English README (main) + Portuguese — documentation
- ✅ **T40** GitHub Actions: syntax, SEO, AI knowledge build and 92 tests on every push — Acceptance criteria
- ✅ **T41** Lighthouse: on-demand responsive images, non-blocking fonts, contrast (performance 69 → ~80; accessibility, best practices and SEO 100) — NFR-02, NFR-06
- ✅ **T42** Weekly summary email (Cron) with AI, Vectorize and D1 health check — FR-08
- ✅ **T43** Custom 404 page and `#chat` link that opens the assistant
- ✅ **T45** Google Search Console: HTML-tag verification and `sitemap.xml` submission — FR-09.3
- ✅ **T48** New "E." logo (gradient + AI node) in favicon, header, footer, chat, 404 and iPhone icon
- ✅ **T49** Assistant highlight: "Ask my AI" bar in the hero (auto-typed example question) and labeled chat button on desktop — FR-05
- ✅ **T50** Responsiveness validated on smartphone (390 px), tablet (768 px), laptop (1366 px) and desktop (1920 px): ☰ menu up to 1,100 px, no horizontal scroll — NFR-07
- ✅ **T51** Zero-cost rules documented (README and NFR-01); verified: Workers Free, no card in any service — NFR-01
- ✅ **T44** Automatic visitor confirmation retired with the contact form — NFR-05
- ✅ **T52** German as the 8th language: site, chat (ready-made answers and search), PDF résumé, AI and 13 tests — FR-02
- ✅ **T31** "View code" link on the 9 project cards, pointing to each repository (8 languages) — FR-01
- ✅ **T32** Cards show language, stars and last-update date from the public GitHub API (no key, cached per session) — FR-01
- ✅ **T53** Installable, offline app (PWA): manifest, 192/512/maskable icons and a service worker — NFR-02
- ✅ **T54** Lighthouse in GitHub Actions with minimum scores (accessibility 95, best practices 90, SEO 95) — NFR-02, NFR-06
- ✅ **T55** AI demo `/demos/lstm/`: LSTM retrained without leakage, plain-JavaScript inference in the browser, naive-baseline comparison, 8 languages and a `GET /prices` Worker route — FR-01
- ✅ **T56** AI demo `/demos/face/`: in-browser face recognition with face-api.js (webcam or photo, nothing leaves the device), 8 languages — FR-01
- ✅ **T57** AI demo `/demos/filmes/`: TF-IDF + cosine recommender in plain JS over ~1,500 freely licensed films, with the terms behind each result — FR-01
- ✅ **T58** Card 10: the portfolio assistant as a project (RAG with Workers AI and Vectorize), with a button that opens the chat — FR-01
- ✅ **T59** Documentation updated (README, spec FR-12/FR-13, plan §2.6–2.8, `GET /prices`, ADR-24 to 26) and LSTM training scripts brought into `scripts/lstm/` — NFR-09
- ✅ **T60** Security: per-IP limit on `GET /prices` (30/min) and SRI on the face demo's face-api.js (tested with a tampered file) — NFR-04
- ✅ **T61** Local dashboard (`npm run painel` in `worker/`): aggregate rating totals and regional visits only — FR-08, NFR-05
- ✅ **T62** LSTM demo with 15 stocks (8 from B3, 7 from NASDAQ), menu by exchange and prices in each exchange's currency; card updated to the 1.1–2.2% MAPE — FR-12
- ✅ **T63** "Does your role match?" (`/vaga/` + `POST /match`): two-step job match with Worker checks, rule-based score, clickable evidence, 8 languages and an invite at the top of the site — FR-14
- ✅ **T64** Amazon (default) and Editorial themes: colors as CSS variables, a button on every page (8 languages), no flash, charts validated for color-vision deficiency, Lighthouse accessibility 100 in both — FR-15
- ✅ **T65** New per-theme "E." logo (green/lime in Amazon, orange in Editorial), with draw-in animation, AI-node pulse and hover effect; favicon and app icons rebuilt — FR-15
- ✅ **T66** Click map removed during a privacy review; do not collect events, pages or sections.
- ✅ **T67** First-party regional count by continent/day after consent; no IP, URL or event is persisted.
- ✅ **T68** Audit (2026-10-11) and fixes: face demo loads the AI only on first use (4.7 MB → 103 KB, performance 55 → 92), initial automatic data retention (12/6 months; reduced to 30 days in a later review), CSP and referrer policy on every page, no layout shift at the top (CLS 0.121 → 0.004), heading order in demos (accessibility 100 everywhere), default links on the job page, movie data preload and a numeric match score — NFR-02, NFR-04, NFR-05, NFR-06
- ✅ **T69** Componentization in 5 stages: `<site-logo>`/`<theme-toggle>` Web Components and `boot.js`; projects and skills in `data/` with an HTML generator (checked in CI); chat split into modules (`chat/`) and one Worker file per route; one translation file per language, loaded on demand (~42 KB → ~13 KB on first visit); ES modules with an import map instead of globals. Images gathered in `imagens/` — NFR-02, NFR-09
- ✅ **T70** External-provider-free analytics: consent refreshed, continent/day aggregates in D1, per-IP limit, purge before 30 days, and dashboard/summary migrated — FR-08, LGPD
- ✅ **T72** English updated to basic (A2), progressing to intermediate (B1), on the site, chat, Worker and PDFs; the job analysis now sends the languages excerpt when a language requirement is written in a language other than English (previously "Inglês fluente" got no evidence) — FR-01, FR-14
- ✅ **T73** SDD (Spec-Driven Development) under practices: toolbox card, résumé in all 8 languages (PDFs regenerated) and the Worker knowledge base — FR-01, FR-04
- ✅ **T74** Interface and keystroke sounds (Web Audio) with haptics on phones and a mute button on every page — FR-16.1
- ✅ **T75** Spotlight-style quick search (`/`, Ctrl/⌘+K) with topic filtering of projects and "Ask the AI"; typing effect in the chat; technical footer with `GET /status` only on click — FR-16.5, FR-16.6, FR-16.7
- ✅ **T76** Experience as a CI/CD pipeline (log and stack per stage) and a skills × projects graph (grid remains the default) — FR-01.4, FR-01.5
- ✅ **T77** Job match: score gauge, match by pillar (radar and bars) and a scan line over the text while analyzing — FR-14.4
- ✅ **T78** Browsing without leaving the site: demos, "How I built it", job match and résumé in a modal; GitHub viewer; cards for LinkedIn, WhatsApp (QR code), email and external sites — FR-16.2, FR-16.3, FR-04.2
- ✅ **T79** "Share portfolio": QR code, link, native sharing and shortcuts — FR-16.4
- ✅ **T80** Java at ICCT and the City Hall; ASP.NET Web Forms and Bootstrap at the City Hall (site, 8 languages, PDFs and AI knowledge); accessibility 100 in both themes (Editorial contrast, pipeline without tab roles, quick guide in a `<div>`) — FR-01, accessibility NFR

---

## Pending

| ID | Task | Depends on | Requirement |
|---|---|---|---|
| ⏳ **T33** | Impact numbers in the experience section (e.g. deployment time, % fewer bugs) | Data from Emanuel | FR-01 |
| ⏳ **T35** | Translation review by native speakers (priority: Chinese and Russian) | Reviewer | FR-02 |

## Ideas

- 💡 RAG Agent / Legal Critic demo (questions about a PDF) with Workers AI, within the free quota.
- 💡 Also move `scripts/lstm/` to the `fiaptech4` repository, next to the original project.
- 💡 Recommendations from colleagues (LinkedIn).
- 💡 Custom domain (paid) — more professional address and emails from your own sender.
