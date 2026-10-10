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
3. Make contact easy (email, WhatsApp, LinkedIn, contact form, PDF résumé).
4. Demonstrate front-end, serverless back-end and applied AI skills on the site itself.
5. Run at **zero cost**.

### 1.3 Out of scope
- Web admin area (messages are read via the terminal or the Cloudflare dashboard).
- Blog, user accounts or payments.

---

## 2. Personas

| Persona | Need | How the product helps |
|---|---|---|
| **Technical recruiter** | Quickly check technologies and experience | Organized sections, filters, AI chat, PDF résumé |
| **International recruiter** | Read in their own language; understand the hiring model | 8 languages (English by default), answers about remote work, time zone and employee/contractor arrangements |
| **Hiring manager / tech lead** | Assess technical depth and projects | Projects with technical descriptions, measured results (87%, top 5%, 1.1–2.2% MAPE vs. a baseline), **live AI demos** and the site itself as a demo |
| **Emanuel (owner)** | Update content and track interest | Single source of text (`i18n.js`), publishing scripts, analytics and contact-form messages |

---

## 3. Functional requirements

### FR-01 — Profile content
The site must present: hero (name, role, summary, location, years of experience), About (with photo), Experience (timeline), Projects, Skills, Education (with certifications and languages) and Contact.
- FR-01.1 Each project card has a "View code" link to its repository and shows language, stars (if any) and last-update date from the public GitHub API.
- FR-01.2 Projects with a live demo have a "Live demo" button (LSTM, face recognition, movie recommender and the assistant itself).
- FR-01.3 Results cited on the cards must be verifiable (same number shown in the demo or repository).

### FR-02 — Languages
- FR-02.1 Available in **English (default)**, Portuguese, Spanish, French, Italian, German, Simplified Chinese and Russian.
- FR-02.2 Visitors switch language with a selector in the header; the choice is remembered.
- FR-02.3 The language can be set via the link (`?lang=xx`).
- FR-02.4 All visible text, accessibility attributes, chat, contact form and résumé follow the selected language.

### FR-03 — Filters
- FR-03.1 Projects can be filtered by category (All, AI/ML, Backend & APIs, Web & Apps).
- FR-03.2 Skills can be filtered by category, with a "showing X of Y" counter.

### FR-04 — PDF résumé
- FR-04.1 One PDF per language, generated from the same text source as the site.
- FR-04.2 The "Download résumé" button delivers the PDF for the current language.

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
- FR-05.10 AI answers can be rated 👍/👎; a rating (question + answer) is stored only when the visitor clicks, with a notice next to the buttons.

### FR-06 — Contact form
- FR-06.1 Fields: name, email and message (required), with a character counter.
- FR-06.2 Validation in the browser and on the server.
- FR-06.3 Valid messages are stored; the visitor sees a confirmation ("Message sent!").
- FR-06.4 The owner reads messages with a command or in the Cloudflare dashboard.
- FR-06.5 For each new message, the owner receives an email notification, with "Reply" addressed to the visitor.
- FR-06.6 The visitor receives an automatic confirmation in the language of the message.

### FR-07 — Direct contacts
Email, WhatsApp, LinkedIn and GitHub visible in the contact section and in the assistant.

### FR-08 — Analytics
Record visits and events (chat opened, question answered by the AI, résumé download by language, contact clicks, language change, form submission, ratings, "View code" and "Live demo" clicks, demo usage) **without cookies and without the text of the questions**.

### FR-09 — SEO and sharing
- FR-09.1 When the link is shared (LinkedIn, WhatsApp, X), show a preview with image, title and description.
- FR-09.2 Tell Google about the 8 language versions (`hreflang`) and who the site is about (`Person` structured data).
- FR-09.3 Publish `sitemap.xml` (page in 8 languages, 8 PDFs and 3 demos) and `robots.txt`; the site is verified in Google Search Console.

### FR-10 — Weekly summary
Every Monday the owner receives an email with the week's messages, chat ratings (including poorly rated answers) and the health of the AI, vector index and database; visits too, if a GoatCounter token is set.

### FR-11 — Not-found page
Unknown addresses show a 404 page in the site's style, with links to the portfolio and the assistant.

### FR-12 — AI demos
Dedicated pages (`/demos/…`) in 8 languages, in the site's style, linking back to the portfolio and the code:
- FR-12.1 **Stock forecasting (LSTM):** the visitor picks one of 15 stocks (8 from B3 and 7 from NASDAQ, priced in each exchange's currency) and 1–10 business days; sees the forecast (chart and table), the out-of-sample test metrics **compared with a naive baseline** and the actual × predicted chart. Up-to-date prices when possible; otherwise the last saved copy, with its date. "Not investment advice" notice.
- FR-12.2 **Face recognition:** via webcam or photo; the visitor registers faces with a name and sees recognition with the distance. **No image leaves the device** and nothing is stored; the page says so.
- FR-12.3 **Movie recommender:** from a chosen film or a free description (in English), showing for each result the similarity and **the terms behind the recommendation**. Freely licensed movie data, crediting the sources.
- FR-12.4 Demos run in the visitor's browser; none requires an account, sign-up or paid server.

### FR-13 — Installable, offline app
The site can be installed as an app (manifest and icons) and, after the first visit, opens offline with the last saved version; the chat uses local search when offline.

---

## 4. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | **Cost** | Zero-cost infrastructure: free tiers only, **with no payment method on file** (the owner cannot incur costs). When a free limit is reached, the feature must pause and the site keep working (graceful degradation), never generate a charge. New services are added only if they have a free plan with no card required. AI demos run in the visitor's browser (no server cost). |
| NFR-02 | **Performance** | Static site with no build step; first image preloaded (smaller on mobile) and the rest on demand; non-blocking fonts; third-party scripts (Turnstile) loaded on demand; repeated AI answers served from cache. Target: Lighthouse (mobile) ≥ 75 performance and 100 accessibility, best practices and SEO. |
| NFR-03 | **Availability** | The chat must remain useful without AI (local search); the form fails with a clear message. |
| NFR-04 | **Security** | The backend only accepts the site's origin; bot protection on every call that stores data or uses AI; per-IP limits; input validation; no secrets in the repository. The (read-only) prices route only accepts the site's origin and the demo's 15 stocks, with a per-IP limit and caching. |
| NFR-05 | **Privacy (LGPD/GDPR-style)** | No tracking cookies; the form stores the minimum (no IP address); notices about AI use and the purpose of the data. In the face recognition demo, camera and photos are processed only on the device. |
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

### Contact form
- [x] Submitting an empty form shows a required-fields notice and highlights the fields.
- [x] A valid submission shows the confirmation card and is saved in the database.
- [x] A submission with the honeypot field filled in saves nothing.
- [ ] More than 3 submissions per minute from the same IP return "too many messages in a row" (implemented; not yet tested in production).

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
- [x] Clicking 👎 on an AI answer shows "Thanks for your feedback!" and stores the record in the database.

### SEO and performance
- [x] `sitemap.xml` and `robots.txt` return HTTP 200; the sitemap is valid XML with 20 URLs.
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

### Emails
- [x] A new contact-form message triggers a notification to the owner's Gmail, with "Reply" addressed to the visitor.
- [ ] The visitor receives a confirmation in the message's language (waiting for the Apps Script web app to be set to "Anyone").
- [ ] The weekly summary arrives on Monday (test run completed without errors; delivery to be confirmed).
