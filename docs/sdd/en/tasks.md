# Tasks — Emanuel Borges's Portfolio

🌐 **English** · [Português](../tasks.md)

> **Spec-Driven Development (SDD).** Execution list derived from the [specification](spec.md) and the [technical plan](plan.md). Each task references the requirements it covers.

Legend: ✅ done · ⏳ pending · 💡 idea

---

## Done

### Foundation
- ✅ **T01** Site structure (hero, About, Experience, Projects, Skills, Education, Contact) — FR-01
- ✅ **T02** GitHub Pages deployment on every `git push` — NFR-01
- ✅ **T03** Sticky header with reading-progress bar — NFR-06
- ✅ **T04** Favicon and iPhone/iPad icon with the "E." logo

### Content and visuals
- ✅ **T05** Content from the résumé and LinkedIn — FR-01
- ✅ **T06** Oval photo with hover zoom — FR-01
- ✅ **T07** Full-screen duotone background images — NFR-07
- ✅ **T08** Particles (Canvas), light blobs, scroll animations, "reduce motion" respected — NFR-06
- ✅ **T09** Project and skill filters with counter — FR-03
- ✅ **T10** Institution logos (light and dark versions) — FR-01
- ✅ **T11** Icons for the 46 skills (Simple Icons + generic) — FR-01

### Languages
- ✅ **T12** i18n in 8 languages, header selector, `?lang=`, English by default — FR-02
- ✅ **T52** German as the 8th language: site, chat, résumé, AI and tests — FR-02

### Résumé
- ✅ **T13** `curriculo.html` as the A4 résumé template in 8 languages — FR-04 *(the PDFs generated on the Mac were replaced by T86)*
- ✅ **T14** "Download résumé" button per language — FR-04.2

### Assistant
- ✅ **T15** Local search (TF-IDF, synonyms, Chinese) — FR-05.6, FR-05.7
- ✅ **T16** Typo correction (Damerau-Levenshtein) — FR-05.7
- ✅ **T17** 19 ready-made topics with follow-up buttons — FR-05.2
- ✅ **T18** Invitation bubble (3 s, once) — FR-05.1
- ✅ **T19** Worker with Workers AI (Qwen3 30B), CORS and per-IP limit — FR-05.4, NFR-01, NFR-04
- ✅ **T20** AI Gateway; prompt/answer cache removed in a privacy review — NFR-05
- ✅ **T21** Invisible Turnstile — NFR-04
- ✅ **T22** RAG with Vectorize + BGE-M3 — FR-05.4
- ✅ **T23** Education with checked ready-made answer — NFR-08
- ✅ **T24** Automated chat tests — Acceptance criteria
- ✅ **T49** "Ask my AI" bar at the top and labeled chat button on desktop — FR-05

### Contact, metrics and privacy
- ✅ **T25** WhatsApp, email, LinkedIn, GitHub — FR-07
- ✅ **T26** Contact form retired; direct links kept and old messages removed — FR-07, NFR-05
- ✅ **T36** 👍/👎 ratings aggregated per day in D1 — NFR-05
- ✅ **T42** Weekly summary e-mail (Cron) with AI, Vectorize and D1 health — FR-10
- ✅ **T61** Local dashboard (`npm run painel`) with aggregates only — FR-08, NFR-05
- ✅ **T66** Click map removed in a privacy review
- ✅ **T67** Regional counting per continent/day, after consent — FR-08
- ✅ **T70** Statistics with no external provider, purge before 30 days — FR-08, LGPD

### SEO, performance and quality
- ✅ **T29** Last-updated date in the footer and automatic `?v=` (hook) — NFR-10
- ✅ **T34** Open Graph/Twitter, `hreflang`, `Person` JSON-LD, `sitemap.xml` and `robots.txt` — FR-09
- ✅ **T40** GitHub Actions on every push — Acceptance criteria
- ✅ **T41** Lighthouse: on-demand images, non-blocking fonts, contrast — NFR-02, NFR-06
- ✅ **T43** Custom 404 page and `#chat` link — FR-11
- ✅ **T45** Google Search Console — FR-09.3
- ✅ **T50** Responsiveness validated from 390 px to 1920 px — NFR-07
- ✅ **T51** Zero-cost rules documented and verified — NFR-01
- ✅ **T53** Installable, offline app (PWA) — FR-13
- ✅ **T54** Lighthouse in CI with minimum scores — NFR-02, NFR-06
- ✅ **T60** Per-IP limit on `GET /prices` and SRI on face-api.js — NFR-04
- ✅ **T68** Audit of 2026-10-11: face-demo performance, CSP on every page, CLS, accessibility — NFR-02, NFR-04, NFR-05, NFR-06

### Projects and demos
- ✅ **T31** "View code" on every card — FR-01.1
- ✅ **T32** Language, stars and last update from the GitHub API — FR-01.1
- ✅ **T55** In-browser LSTM demo, with naive baseline and `GET /prices` — FR-12.1
- ✅ **T56** In-browser face recognition demo — FR-12.2
- ✅ **T57** Movie recommender demo (TF-IDF) — FR-12.3
- ✅ **T58** The portfolio assistant as a project, with a button that opens the chat — FR-01.2
- ✅ **T62** LSTM with 15 stocks (B3 and NASDAQ) — FR-12.1
- ✅ **T63** "Does your role match?" (`/vaga/` + `POST /match`) — FR-14
- ✅ **T77** Job match: gauge and match per pillar — FR-14.4

### Themes, interactions and componentization
- ✅ **T64** Amazon (default) and Editorial themes — FR-15
- ✅ **T65** Per-theme "E." logo, animated — FR-15
- ✅ **T69** Componentization: Web Components, data + HTML generator, chat in modules, one file per Worker route, on-demand translations, import map — NFR-02, NFR-09
- ✅ **T74** Interface sounds and haptics, with mute button — FR-16.1
- ✅ **T75** Quick search, typing effect and technical footer — FR-16.5, FR-16.6, FR-16.7
- ✅ **T76** Experience as a CI/CD pipeline and skills × projects graph — FR-01.4, FR-01.5
- ✅ **T78** Demos, job match, "How I built it" and résumé in a modal; GitHub viewer; external-link cards — FR-16.2, FR-16.3
- ✅ **T79** "Share portfolio" — FR-16.4
- ✅ **T81** GitHub viewer without the 60/h limit — FR-16.3

### Content
- ✅ **T72** English described as basic (A2), progressing to intermediate (B1) — FR-01, FR-14
- ✅ **T73** SDD among practices (toolbox, résumé, AI) — FR-01
- ✅ **T80** Java at ICCT and the City Hall; ASP.NET Web Forms and Bootstrap at the City Hall — FR-01

### Single sources and reuse (October 2026)
- ✅ **T82** Typing effect on the chat greeting too — FR-16.6
- ✅ **T83** Personal data in `data/perfil.json` (generates `perfil.js`); translations take the name from the profile; `data-perfil*` on every page; SEO, manifest, robots, sitemap, CSP and `wrangler.jsonc` generated; full swap tested with a fictitious person — FR-17
- ✅ **T84** Static Portuguese in `index.html` copied from `i18n/pt.js` by the generator; `scripts/dados.mjs` as the single Node loader — FR-17, NFR-09
- ✅ **T85** Experience and education in `data/`; résumé and AI read the same data; languages in `idiomas.js` (generated selectors); card and system texts from the translations and `data/experiencia.json` — FR-17
- ✅ **T86** Résumé PDF generated by the site itself (browser print, `?pdf=1`); `cv/` folder, `gerar-curriculos.sh` and PDFs removed; old links redirected by the 404 — FR-04
- ✅ **T87** Themes in `data/temas.json` (generates `temas.css` and the `boot.js` block); colors copied in three CSS files removed — FR-15.5
- ✅ **T88** Color intensity slider (`<theme-intensity>`), stronger and darker at the end, in the ☰ menu on narrow screens — FR-15.4
- ✅ **T89** Worker URL and Turnstile key in `servicos` (`data/perfil.json`); initial language decided only in `boot.js` — FR-17
- ✅ **T90** Photo, share image, audio and reference voice in `data/imagens` and `data/audio`; spoken-intro generator reads the profile — FR-01.8, FR-17
- ✅ **T91** D1 audit (`EXPLAIN QUERY PLAN`): every query uses the primary-key index — NFR-02
- ✅ **T92** Visible AI fallback: `503 quota`/`unavailable`, chat notice, AI state in the footer and on `/status`, Worker and browser tests (8 languages) — FR-05.6, FR-16.7
- ✅ **T93** Featured projects (4) and compact "More projects"; numbering generated from display order — FR-01.6
- ✅ **T94** Education "(in progress)" on the site, in the résumé and in the AI — FR-01.7
- ✅ **T95** Worker dependencies: workerd binary restored (`npm ci`); wrangler 4.152 with a patched `undici` through `overrides` (0 vulnerabilities) — NFR-04
- ✅ **T96** `CLAUDE.md` and SDD updated for the whole application — NFR-09
- ✅ **T97** Worker deployed (wrangler 4.152): knowledge with education "in progress", `ai` on `/status`, 33 excerpts reindexed in Vectorize — FR-05.6, FR-01.7
- ✅ **T100** AI knowledge base reviewed: outdated facts fixed (contact form, PDFs), project p11 added, current role, public sector and "what visitors can do" excerpts, verifiable metrics and code/demo links per project, City Hall systems; nothing hand-written in the generator (37 excerpts) — FR-05.4, FR-17

---

## Pending

| ID | Task | Depends on | Requirement |
|---|---|---|---|
| ⏳ **T98** | Refresh the LinkedIn link preview (Post Inspector), since the share image moved | Emanuel | FR-09.1 |
| ⏳ **T99** | Decide whether institution logos move to `data/imagens/logos/` (technology icons stay in `imagens/`) | Emanuel | FR-17 |
| ⏳ **T33** | Impact numbers in the jobs (e.g. deploy time, % of bugs) | Emanuel's data | FR-01 |
| ⏳ **T35** | Native-speaker review of translations (priority: Chinese and Russian) | Reviewer | FR-02 |

## Ideas

- 💡 Glows and shadows (`*-rgb` variables) following the intensity slider.
- 💡 Shift the green hue toward blue at the end of the intensity slider.
- 💡 RAG Agent / Legal Critic demo (questions about a PDF) with Workers AI, within the free quota.
- 💡 Generate the portfolio from an uploaded résumé (extract the data into `data/` with AI and review before publishing).
- 💡 Recommendations from colleagues (LinkedIn).
- 💡 Custom domain (paid) — more professional address and e-mails from an own sender.
