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
2. Answer visitors' questions in natural language, in 7 languages.
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
| **International recruiter** | Read in their own language; understand the hiring model | 7 languages (English by default), answers about remote work, time zone and employee/contractor arrangements |
| **Hiring manager / tech lead** | Assess technical depth and projects | Projects with technical descriptions, results (87%, 89%, top 5%) and the site itself as a demo |
| **Emanuel (owner)** | Update content and track interest | Single source of text (`i18n.js`), publishing scripts, analytics and contact-form messages |

---

## 3. Functional requirements

### FR-01 — Profile content
The site must present: hero (name, role, summary, location, years of experience), About (with photo), Experience (timeline), Projects, Skills, Education (with certifications and languages) and Contact.

### FR-02 — Languages
- FR-02.1 Available in **English (default)**, Portuguese, Spanish, French, Italian, Simplified Chinese and Russian.
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
- FR-05.7 Local search tolerates typos and synonyms and works in all 7 languages.
- FR-05.8 Questions about contact show contact buttons; questions about the résumé show the PDF link.

### FR-06 — Contact form
- FR-06.1 Fields: name, email and message (required), with a character counter.
- FR-06.2 Validation in the browser and on the server.
- FR-06.3 Valid messages are stored; the visitor sees a confirmation ("Message sent!").
- FR-06.4 The owner reads messages with a command or in the Cloudflare dashboard.
- FR-06.5 For each new message, the owner receives an email notification, with "Reply" addressed to the visitor.

### FR-07 — Direct contacts
Email, WhatsApp, LinkedIn and GitHub visible in the contact section and in the assistant.

### FR-08 — Analytics
Record visits and events (chat opened, question answered by the AI, résumé download by language, contact clicks, language change, form submission) **without cookies and without the text of the questions**.

---

## 4. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | **Cost** | Zero-cost infrastructure (free tiers). |
| NFR-02 | **Performance** | Static site with no build step; third-party scripts (Turnstile) loaded on demand; repeated AI answers served from cache. |
| NFR-03 | **Availability** | The chat must remain useful without AI (local search); the form fails with a clear message. |
| NFR-04 | **Security** | The backend only accepts the site's origin; bot protection on every backend call; per-IP limits; input validation; no secrets in the repository. |
| NFR-05 | **Privacy (LGPD/GDPR-style)** | No tracking cookies; the form stores the minimum (no IP address); notices about AI use and the purpose of the data. |
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
- [x] All 79 cases in `tests/chat-casos.json` pass.

### Contact form
- [x] Submitting an empty form shows a required-fields notice and highlights the fields.
- [x] A valid submission shows the confirmation card and is saved in the database.
- [x] A submission with the honeypot field filled in saves nothing.
- [ ] More than 3 submissions per minute from the same IP return "too many messages in a row" (implemented; not yet tested in production).

### Security
- [x] A backend request from another origin → `403 forbidden_origin`.
- [x] A request without a Turnstile token or with a fake one → `403 turnstile_failed`.
- [x] The 11th chat request within the same minute → `429 rate_limited`.

### Caching
- [x] After a commit, the HTML references `styles.css?v=<new version>`.
- [x] A profile change automatically invalidates the AI answer cache.
