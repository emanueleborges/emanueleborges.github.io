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
- ✅ **T12** i18n in 7 languages, header selector, `?lang=`, English by default — FR-02

### Résumé
- ✅ **T13** `curriculo.html` + `gerar-curriculos.sh` → 7 PDFs — FR-04
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
- ✅ **T24** 79 automated chat tests — Acceptance criteria

### Contact and analytics
- ✅ **T25** WhatsApp, email, LinkedIn, GitHub — FR-07
- ✅ **T26** Contact form with D1, Turnstile, honeypot, per-IP limit, counter and confirmation — FR-06
- ✅ **T27** `ver-mensagens.sh` — FR-06.4
- ✅ **T28** GoatCounter with events — FR-08
- ✅ **T29** Last-updated date in the footer and automatic `?v=` versioning (hook) — NFR-10

### Documentation
- ✅ **T30** README and SDD documents (spec, plan, tasks) in Portuguese and English

---

## Pending

| ID | Task | Depends on | Requirement |
|---|---|---|---|
| ⏳ **T31** | "Code" and "Demo" links on project cards | Repository links | FR-01 |
| ⏳ **T32** | Project cards with GitHub data (stars, last commit) via a Cron Trigger | T31 | FR-01 |
| ⏳ **T33** | Impact numbers in the experience section (e.g. deployment time, % fewer bugs) | Data from Emanuel | FR-01 |
| ⏳ **T34** | Social preview image (Open Graph) and per-language SEO metadata | — | NFR-02 |
| ⏳ **T35** | Translation review by native speakers (priority: Chinese and Russian) | Reviewer | FR-02 |
| ⏳ **T36** | 👍/👎 rating of AI answers (D1) to measure quality | — | NFR-08 |
| ⏳ **T37** | Test the contact form's 3-per-minute limit in production | — | NFR-04 |

## Ideas

- 💡 A card for the portfolio itself in the Projects section.
- 💡 Recommendations from colleagues (LinkedIn).
- 💡 Custom domain (paid) — would enable email notifications for the contact form.
- 💡 English version of the README.
- 💡 Performance audit (Lighthouse) and background image optimization.
