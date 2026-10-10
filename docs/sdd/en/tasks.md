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
- ✅ **T11** Icons for the 45 skills (Simple Icons + generic icons) — FR-01

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
- ✅ **T20** AI Gateway with 24 h cache and a versioned key — NFR-02
- ✅ **T21** Invisible Turnstile — NFR-04
- ✅ **T22** RAG with Vectorize + BGE-M3 (32 excerpts) — FR-05.4, NFR-09
- ✅ **T23** Education with a verified ready-made answer — NFR-08
- ✅ **T24** 92 automated chat tests — Acceptance criteria

### Contact and analytics
- ✅ **T25** WhatsApp, email, LinkedIn, GitHub — FR-07
- ✅ **T26** Contact form with D1, Turnstile, honeypot, per-IP limit, counter and confirmation — FR-06
- ✅ **T27** `ver-mensagens.sh` — FR-06.4
- ✅ **T28** GoatCounter with events — FR-08
- ✅ **T29** Last-updated date in the footer and automatic `?v=` versioning (hook) — NFR-10

### Documentation
- ✅ **T30** README and SDD documents (spec, plan, tasks) in Portuguese and English
- ✅ **T38** Email notification for new messages (Resend, free) — FR-06.5
- ✅ **T36** 👍/👎 rating of AI answers stored in D1 + `ver-avaliacoes.sh` — NFR-08
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
- ✅ **T44** Automatic confirmation to the visitor in the message's language (Google Apps Script) — FR-06.6
- ✅ **T52** German as the 8th language: site, chat (ready-made answers and search), PDF résumé, AI, email confirmation and 13 tests — FR-02
- ✅ **T31** "View code" link on the 9 project cards, pointing to each repository (8 languages) — FR-01
- ✅ **T32** Cards show language, stars and last-update date from the public GitHub API (no key, cached per session) — FR-01
- ✅ **T53** Installable, offline app (PWA): manifest, 192/512/maskable icons and a service worker — NFR-02
- ✅ **T54** Lighthouse in GitHub Actions with minimum scores (accessibility 95, best practices 90, SEO 95) — NFR-02, NFR-06

---

## Pending

| ID | Task | Depends on | Requirement |
|---|---|---|---|
| ⏳ **T33** | Impact numbers in the experience section (e.g. deployment time, % fewer bugs) | Data from Emanuel | FR-01 |
| ⏳ **T35** | Translation review by native speakers (priority: Chinese and Russian) | Reviewer | FR-02 |
| ⏳ **T37** | Test the contact form's 3-per-minute limit in production | — | NFR-04 |
| ⏳ **T46** | Set the Apps Script web app access to "Anyone" and test the confirmation | Emanuel | FR-06.6 |
| ⏳ **T47** | GoatCounter token (`GOATCOUNTER_TOKEN`) to include visits in the weekly summary | Emanuel | FR-08 |

## Ideas

- 💡 A card for the portfolio itself in the Projects section.
- 💡 Recommendations from colleagues (LinkedIn).
- 💡 Custom domain (paid) — more professional address and emails from your own sender.
