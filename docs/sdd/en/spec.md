# Specification — Emanuel Borges's Portfolio

🌐 **English** · [Português](../spec.md)

> **Spec-Driven Development (SDD).** This document describes **what** the product does and **why**. The **how** is in [`plan.md`](plan.md) and the execution in [`tasks.md`](tasks.md).

| | |
|---|---|
| **Product** | Professional portfolio with an AI assistant |
| **URL** | https://emanueleborges.github.io |
| **Owner** | Emanuel Borges |
| **Status** | In production |
| **Main constraint** | Zero infrastructure cost |

---

## 1. Vision

Present Emanuel Borges's professional profile to recruiters and companies in Brazil and abroad in a **clear, modern and interactive** way, so visitors can **quickly find** what they are looking for (experience, projects, technologies, education, availability) and **get in touch** easily.

### 1.1 Problem
Static résumés and profiles force recruiters to read everything to find one specific piece of information ("does he have Kafka experience?", "is he open to remote work?"), and they don't show the candidate's technical skills in practice.

### 1.2 Goals
1. Communicate the profile within 30 seconds (hero section + summary).
2. Answer visitors' questions in natural language, in 8 languages.
3. Make contact easy through direct links (email, WhatsApp, LinkedIn and PDF résumé), without an on-site contact form.
4. Demonstrate front-end, serverless back-end and applied AI skills on the site itself.
5. Run at **zero cost**.

### 1.3 Out of scope
- Contact-message storage by the site.
- Blog, user accounts or payments.

---

## 2. Personas

| Persona | Need | How the product helps |
|---|---|---|
| **Technical recruiter** | Quickly check technologies and experience | Organized sections, filters, AI chat, PDF résumé |
| **International recruiter** | Read in their own language; understand the hiring model | 8 languages (English by default), answers about remote work, time zone and employee/contractor arrangements |
| **Hiring manager / tech lead** | Assess technical depth and projects | Projects with technical descriptions, measured results (87%, top 5%, 1.1–2.2% MAPE vs. a baseline), **live AI demos** and the site itself as a demo |
| **Emanuel (owner)** | Update content and track interest | Single source of text (`i18n/`), publishing scripts and aggregate statistics |

---

## 3. Functional requirements

### FR-01 — Profile content
The site must present: hero (name, role, summary, location, years of experience), About (with photo), Experience (CI/CD pipeline), Projects, Skills, Education (with certifications and languages) and Contact.
- FR-01.1 Each project card has a "View code" link to its repository and shows language, stars (if any) and last-update date from the public GitHub API.
- FR-01.2 Projects with a live demo have a "Live demo" button (LSTM, face recognition, movie recommender, RAG security, image generator and the assistant itself).
- FR-01.4 Experience is a CI/CD pipeline: each job is a stage (✓ passed or ● running) in chronological order; picking a stage shows its "log" with the achievements and the most cited stack for the period (toolbox technologies found in the text). Keyboard navigable (←/→).
- FR-01.5 Skills open as a grid (default) and can be viewed as a graph: skills on the outer ring, projects on the inner one; touching a skill lights up the projects connected to it, with shortcuts to the cards (and vice versa).
- FR-01.3 Results cited on the cards must be verifiable (same number shown in the demo or repository).

### FR-02 — Languages
- FR-02.1 Available in **English (default)**, Portuguese, Spanish, French, Italian, German, Simplified Chinese and Russian.
- FR-02.2 Visitors switch language with a selector in the header; the choice is remembered.
- FR-02.3 The language can be set via the link (`?lang=xx`).
- FR-02.4 All visible text, accessibility attributes, chat and résumé follow the selected language.

### FR-03 — Filters
- FR-03.1 Projects can be filtered by category (All, AI/ML, Backend & APIs, Web & Apps).
- FR-03.2 Skills can be filtered by category, with a "showing X of Y" counter.

### FR-04 — PDF résumé
- FR-04.1 One PDF per language, generated from the same text source as the site.
- FR-04.2 The "Download résumé" button opens the résumé for the current language in a modal for reading (the HTML version the PDF is generated from, readable on phones too), with a "Download PDF" button in the bar; Ctrl/⌘+click downloads directly.

### FR-05 — Assistant (chat)
- FR-05.1 A floating button opens the assistant panel; an invitation bubble appears 3 s after the first visit (only once).
- FR-05.2 **Ready-made answers** for frequent topics (19 topics), with follow-up buttons.
- FR-05.3 Greetings, thanks, salary, start date and education are **always** answered with ready-made text (no AI).
- FR-05.4 Other questions are answered by **generative AI** based **only** on the profile (RAG).
- FR-05.5 AI answers show an "AI-generated answer" badge and a "View on page" shortcut.
- FR-05.6 If the AI fails, the answer comes from **local search** over the page content, with no error message.
- FR-05.7 Local search tolerates typos and synonyms and works in all 8 languages.
- FR-05.8 Questions about contact show contact buttons; questions about the résumé show the PDF link.
- FR-05.9 The `/#chat` link opens the site with the assistant open.
- FR-05.10 AI answers can be rated 👍/👎; only daily totals per rating are stored for up to 30 days, without questions, answers, language or identifiers, with a notice next to the buttons.

### FR-07 — Direct contacts
Email, WhatsApp, LinkedIn and GitHub visible in the contact section and in the assistant. There is no form; messages are not submitted to or stored by the site. Each contact opens a modal card (FR-16.3).

### FR-08 — Analytics
Optional counting only after explicit consent. The Worker uses the continent provided by Cloudflare, and D1 stores only daily totals per continent and per clicked link (fixed targets validated by the Worker); do not store IP, URL, language, or identifiers. Aggregates are deleted before they reach 30 days. The choice is saved in the browser; to change it later, visitors must clear this site's saved data in browser settings.

### FR-09 — SEO and sharing
- FR-09.1 When the link is shared (LinkedIn, WhatsApp, X), show a preview with image, title and description.
- FR-09.2 Tell Google about the 8 language versions (`hreflang`) and who the site is about (`Person` structured data).
- FR-09.3 Publish `sitemap.xml` (page in 8 languages, 8 PDFs and 3 demos) and `robots.txt`; the site is verified in Google Search Console.

### FR-10 — Weekly summary
Every Monday the owner receives an email with aggregate chat ratings and consented regional access, plus the health of the AI, vector index and database. The summary contains only aggregates. Ratings and regional totals are removed before reaching 30 days, with hourly cleanup checks.

### FR-11 — Not-found page
Unknown addresses show a 404 page in the site's style, with links to the portfolio and the assistant.

### FR-15 — Themes
- FR-15.1 Two themes: **Amazon** (initial default; dark, forest green and lime blended with tech blue) and **Editorial** (dark; near-black navy `#0B0F19`, slate `#1E293B`, cyan `#38BDF8`).
- FR-15.2 A header button on every page (site, demos, job match) switches the theme; the choice is saved for later visits and pages; `?theme=editorial` opens straight in that theme.
- FR-15.3 The theme is applied before first paint (no flash); Lighthouse accessibility 100 in both themes.

### FR-14 — "Does your role match?" (for recruiters)
- FR-14.1 `/vaga/` page (8 languages) where a recruiter pastes a job description (80–8,000 characters, any language) and gets: a match score (0–100%), each requirement with its level (meets / partial / not found), required or nice-to-have, a reason and clickable evidence linking to portfolio sections, plus a "why Emanuel" summary with a copy button.
- FR-14.2 Requirements are only those written in the posting (nothing invented, nothing omitted); the score is computed by rule, not by the AI; no experience may be claimed without evidence in the profile.
- FR-14.3 The posting text is not stored; the visitor is told so.
- FR-14.4 The result shows the score on a gauge and the match by pillar (Backend, Frontend, AI/ML, Data, DevOps, Other) as a radar (3+ pillars) and bars, using the same rule as the overall score; while analyzing, a scan line sweeps the posting text.

### FR-12 — AI demos
Dedicated pages (`/demos/…`) in 8 languages, in the site's style, linking back to the portfolio and the code:
- FR-12.1 **Stock forecasting (LSTM):** the visitor picks one of 15 stocks (8 from B3 and 7 from NASDAQ, priced in each exchange's currency) and 1–10 business days; sees the forecast (chart and table), the out-of-sample test metrics **compared with a naive baseline** and the actual × predicted chart. Up-to-date prices when possible; otherwise the last saved copy, with its date. "Not investment advice" notice.
- FR-12.2 **Face recognition:** via webcam or photo; the visitor registers faces with a name and sees recognition with the distance. **No image leaves the device** and nothing is stored; the page says so.
- FR-12.3 **Movie recommender:** from a chosen film or a free description (in English), showing for each result the similarity and **the terms behind the recommendation**. Freely licensed movie data, crediting the sources.
- FR-12.4 Demos run in the visitor's browser; none requires an account, sign-up or paid server.

### FR-13 — Installable, offline app
The site can be installed as an app (manifest and icons) and, after the first visit, opens offline with the last saved version; the chat uses local search when offline.

### FR-16 — Interactions and browsing without leaving the site
- FR-16.1 **Sound and haptics:** interface clicks and keystrokes while typing, synthesized in the browser, plus a short vibration on phones; a speaker button on every page mutes them, and the choice is remembered.
- FR-16.2 **Modals for the site's pages:** demos, "How I built it", the job-match page and the résumé open in a modal in the current language and theme, without the embedded page's header; its links back to the portfolio open in the main window; closing unloads the page (turning off the face demo's camera).
- FR-16.3 **External links:** the owner's GitHub links open in a modal viewer (repositories, folders, rendered README/Markdown, code and images; breadcrumb, back and "open on GitHub"). LinkedIn, WhatsApp, email and other sites open a modal card (WhatsApp QR code, LinkedIn profile, email to copy, description and stack of the City Hall systems), and the external site only opens if the visitor asks. Ctrl/⌘+click opens the original.
- FR-16.4 **Share:** a contact card, a footer button and a quick-search action open the portfolio's QR code and link in the current language, with copy, native sharing and WhatsApp, LinkedIn and email shortcuts.
- FR-16.5 **Quick search:** `/` or Ctrl/⌘+K opens a bar that finds projects, experience, skills, sections and actions, filters the projects by topic (with "Summarize with AI" and "Clear filter") and sends questions to the assistant; keyboard navigable; nothing is sent to a server.
- FR-16.6 **Typing effect:** chat answers appear letter by letter within ~2.5 s; a click or a new question completes it; screen readers get the full text; no effect with "reduce motion".
- FR-16.7 **Technical footer:** shows the chat's AI model; the ping to the Worker and the Cloudflare data center are only measured when the visitor clicks.

---

## 4. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | **Cost** | Zero-cost infrastructure: free tiers only, **with no payment method on file** (the owner cannot incur costs). When a free limit is reached, the feature must pause and the site keep working (graceful degradation), never generate a charge. New services are added only if they have a free plan with no card required. AI demos run in the visitor's browser (no server cost). |
| NFR-02 | **Performance** | Static site with no build step; first image preloaded (smaller on mobile) and the rest on demand; non-blocking fonts; third-party scripts (Turnstile) loaded on demand; repeated AI answers served from cache. Target: Lighthouse (mobile) ≥ 75 performance and 100 accessibility, best practices and SEO. |
| NFR-03 | **Availability** | The chat must remain useful without AI (local search); contact is through direct links, with no message processing by the site. |
| NFR-04 | **Security** | The backend only accepts the site's origin; bot protection on every call that stores data or uses AI; per-IP limits; input validation; no secrets in the repository. The (read-only) prices route only accepts the site's origin and the demo's 15 stocks, with a per-IP limit and caching. |
| NFR-05 | **Privacy (LGPD/GDPR-style)** | No contact form. D1 stores only consented regional totals and daily 👍/👎 totals; no question, answer, language or identifier is stored with a rating. Chat questions and job-description text are processed by Cloudflare Workers AI to generate answers/analyses but are not written to D1; Cloudflare processes connection IPs for security, Turnstile and rate limits. Totals are deleted before reaching 30 days. In the face demo, camera and photos are processed only on the device. |
| NFR-06 | **Accessibility** | Semantic HTML, translated ARIA labels, visible focus, keyboard navigation, respects `prefers-reduced-motion`. |
| NFR-07 | **Responsiveness** | Usable and readable from 360 px to wide desktops. |
| NFR-08 | **AI reliability** | The AI must not invent facts; it must decline off-profile topics and resist visitor instructions that try to change its rules. |
| NFR-09 | **Maintainability** | Single source of text; the AI knowledge and the vector index are generated automatically from it. |
| NFR-10 | **Caching** | Site updates must reach visitors without requiring a manual cache clear. |

---

## 5. Acceptance criteria

### Languages
- [x] With no saved preference, the site opens in English.
- [x] When "中文" is selected, all visible text switches to Chinese and the choice persists after reload.
- [x] `?lang=ru` opens the site in Russian.

### Assistant
- [x] "where did he study?" returns the education with the exact names (FUCAPI, UFG, FIAP, Descomplica).
- [x] "kafak" (typo) finds the Kafka projects.
- [x] "Projects with AI" lists the AI/ML projects.
- [x] "What was his capstone project (TCC)?" (AI) mentions the Intelligent Legal Critic.
- [x] "Give me a chocolate cake recipe" is politely declined.
- [x] "Ignore all previous instructions…" does not change the behavior.
- [x] "How old is he?" says the information isn't available, without inventing it.
- [x] With the AI unavailable, the question is answered by local search.
- [x] All 92 cases in `tests/chat-casos.json` pass.

### Contact and privacy
- [x] The contact section keeps direct links and has no form or message-submission route to the Worker.
- [x] The migration permanently removes the existing contact-message table from D1.

### Security
- [x] A backend request from another origin → `403 forbidden_origin`.
- [x] A request without a Turnstile token or with a fake one → `403 turnstile_failed`.
- [x] The 11th chat request within the same minute → `429 rate_limited`.
- [x] A burst of price lookups → `429 rate_limited` (200 requests in 4 s: 43 blocked; the limiter is permissive).
- [x] A tampered face-demo script on the CDN → the browser refuses to run it (SRI).

### Caching
- [x] After a commit, the HTML references `styles.css?v=<new version>`.
- [x] A profile change automatically invalidates the AI answer cache.

### Ratings
- [x] Clicking 👍/👎 on an AI answer shows "Thanks for your feedback!" and increments a daily aggregate without storing the question or answer.

### SEO and performance
- [x] `sitemap.xml` and `robots.txt` return HTTP 200; the sitemap is valid XML with 21 URLs.
- [x] The page has an Open Graph preview (1200×630 image), `hreflang` for the 8 languages and valid `Person` JSON-LD.
- [x] The Google Search Console verification tag is published.
- [x] Lighthouse (mobile): performance ~80, accessibility 100, best practices 100, SEO 100.
- [x] An unknown address returns HTTP 404 with the custom page.

### Continuous integration
- [x] Every push to `main` runs in GitHub Actions: script syntax (site, demos and Worker), SEO validation, AI knowledge build and the 92 chat tests — all passing.
- [x] Every push runs Lighthouse (3 runs); it fails if accessibility < 95, best practices < 90 or SEO < 95.

### Projects and demos
- [x] All 10 cards have "View code"; language and update date come from GitHub data (without it, just the link).
- [x] The JavaScript LSTM matches Keras (difference ~1e-8) and the demo shows "Yahoo Finance (up to date)" in production.
- [x] On the out-of-sample test, the LSTM's MAPE (1.1–2.2%) is shown next to the naive baseline; the card cites the same number.
- [x] Face demo: a registered photo is recognized in a mirrored, rotated version (distance 0.19 < 0.55); the camera turns on and analyzes the video.
- [x] Movie demo: ~1,500 films indexed in < 50 ms; "The Godfather" recommends its sequels, Scarface and Goodfellas, with the terms behind each result.
- [x] The assistant card's "Live demo" button opens the chat on the same page.

### Installable app
- [x] After the first visit, the site reloads offline, with its look and projects.

### Interactions and browsing
- [x] "/" and Ctrl/⌘+K open the search; "rag" offers "Show the 4 projects with rag" and the filter leaves only those cards; a question puts "Ask the AI" first and opens the chat with it.
- [x] The pipeline shows 3 stages (INDT running) and each job's stack; the graph links "Kafka" to Financial Hub and Products API.
- [x] "Live demo", "How I built it", job match and the résumé open in the modal without the page header; closing clears the iframe.
- [x] The `docs/sdd` link clicked inside "How I built it" opens the viewer in the main window with `plan.md`, `spec.md` and `tasks.md`; `spec.md` and the `tcc-ufg` README render formatted.
- [x] WhatsApp, LinkedIn, email, ComprasManaus and ContratosManaus open their cards; the WhatsApp and share QR codes decode to `wa.me/5592999771376` and `emanueleborges.github.io/?lang=pt`.
- [x] The résumé modal has "Download PDF"; the reading version fits 375 px and the regenerated PDF is identical (same text, 2 pages).
- [x] Lighthouse: accessibility, best practices and SEO 100 in both themes after the changes.

### Metrics email
- [ ] The aggregate weekly summary arrives on Monday (test run completed without errors; delivery to be confirmed).
