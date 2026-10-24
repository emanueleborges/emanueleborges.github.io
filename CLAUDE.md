# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Static portfolio site (GitHub Pages, no framework, no build step) plus a Cloudflare Worker (`worker/`) for the AI chat, job match, image demo and consented stats. Code, comments, commit messages and data keys are in **Portuguese**; keep that style. Specs live in `docs/sdd/` (pt) and `docs/sdd/en/`.

## Commands

```bash
python3 -m http.server 8000                 # serve the site locally (no build); AI calls only work from the published origin
node scripts/gerar-secoes.mjs               # regenerate everything derived from data/, idiomas.js and i18n/pt.js
node scripts/gerar-secoes.mjs --check       # CI: fails if any generated file is out of date
node scripts/conferir-modulos.mjs           # CI: every ES module imported by index.html is in its importmap
./tests/rodar-testes-chat.sh                # chat tests in headless Chrome, all 8 languages (CHROME=... to override path)
node --test worker/tests/*.test.js          # Worker unit tests
node --test worker/tests/chat.test.js       # a single test file (add --test-name-pattern "quota" for one test)
node --test demos/guardrail/core.test.js    # RAG security demo tests
cd worker && npm run conhecimento           # regenerate worker/src/conhecimento.js (AI knowledge)
cd worker && npm run dev                    # local Worker
cd worker && npm run deploy                 # knowledge + wrangler deploy + Vectorize reindex (publishes!)
```

Chat test cases are data in `tests/chat-casos.json` (`[question, expected]` per language; `answer:` prefix checks the ready-made answer text); `tests/runner.js` also runs an "AI out of quota" fallback check. CI (`.github/workflows/testes.yml`) runs `node --check` on all JS, the generator `--check`, module check, knowledge build, Worker tests, guardrail tests and the chat tests. Install the git hook with `cp scripts/pre-commit .git/hooks/pre-commit`: it stamps the footer date and bumps every `?v=` in `index.html` (and so the importmap) on commit.

If `wrangler` fails with "installed workerd on another platform", the workerd binary was deleted: run `npm ci` in `worker/`. Don't run `npm audit fix --force` there: it downgrades wrangler to an older, more vulnerable major; `worker/package.json` instead pins a patched `undici` through `overrides` (re-check it when upgrading wrangler).

## Single sources of truth → generated files

Every piece of information lives in one place; `scripts/gerar-secoes.mjs` (via `scripts/dados.mjs`, which loads the classic scripts in a Node `vm`) writes the rest. **Never hand-edit generated output**; edit the source and rerun the generator.

| Source | Holds | Generated / consumed |
|---|---|---|
| `data/perfil.json` | name, contacts, links, site URL, photo/audio paths, SEO text, Worker URL + Turnstile key (`servicos`) | `perfil.js` (generated, `globalThis.PERFIL` with derived `nomeCompleto`, `links`, `cv()`, `sistemas`), SEO block in `index.html`, `data-perfil*` attributes on every page, CSP `connect-src`, `manifest.webmanifest`, `robots.txt`, `sitemap.xml` origin, `worker/wrangler.jsonc` vars |
| `data/experiencia.json`, `formacao.json`, `projetos.json`, `habilidades.json` | jobs (+ sites built), courses, projects (`featured`, `cv`), skills | generated blocks in `index.html` (`<!-- gerado: … -->` … `<!-- /gerado: … -->`), `window.CURRICULO` block in `curriculo.html`, AI knowledge |
| `data/temas.json` | themes (names per language, CSS vars, default, intensity-slider limits) | `temas.css` (incl. an `oklch(from …)` layer driven by `--intensidade`), the `// gerado: temas` block in `components/boot.js`, manifest colors, `<meta name="theme-color">` |
| `idiomas.js` | site languages (`html`, `og`, `nome`, `ia`) | language `<select>`s on every page, hreflang/og:locale, i18n loader, Worker `LANGUAGES` |
| `i18n/<lang>.js` | all site/chat/résumé text; each file is `((P) => ({…}))(globalThis.PERFIL)` so names come from the profile | the Portuguese static text of every `[data-i18n]` / `[data-i18n-*]` in `index.html` is **copied from `i18n/pt.js`** by the generator — edit `pt.js`, not the HTML |

`data-perfil="…{campo}…"` fills an element's text and `data-perfil-<attr>="…"` fills an attribute, in any page listed in the generator. After changing `data/` or `i18n/`, also run `npm run deploy` in `worker/` so the AI knowledge (`worker/gerar-conhecimento.mjs` → `worker/src/conhecimento.js`, a generated file) and the Vectorize index follow.

## Browser runtime: globals and load order

Data are classic scripts (not JSON/modules) so they run before paint, in `file://`, in the service worker (`importScripts`) and in Node. Order matters on every page:

1. `idiomas.js` (sync) → `globalThis.IDIOMAS`
2. `components/boot.js` (sync, in `<head>`) → applies theme and saved `--intensidade`, sets `window.TEMAS` and `window.IDIOMA_INICIAL` (`?lang=` → saved → first language). Language detection lives only here.
3. `perfil.js` (defer) → `globalThis.PERFIL`; must come **before** `i18n/*.js` and before any module that imports `api.js` (it reads `PERFIL.servicos` at import time).
4. `i18n/pt.js`, `i18n/en.js` (defer); other languages are fetched on demand by `i18n.js`.
5. ES modules (`script.js` exports `t`/`currentLang`; `chat.js`, `busca-rapida.js`, …) and `components/components.js` (defer).

`index.html` ES modules must be listed in its `importmap` with the same `?v=` (checked by `conferir-modulos.mjs`). Each page has its own CSP `<meta>`; a new external domain must be added there.

## Page families and their text systems

- **Main site** (`index.html`, `script.js`): `t(key)` over `window.I18N`; `[data-i18n*]` attributes are translated in place.
- **Demos, `vaga/`, `como-construi/`**: each page passes its own 8-language dictionary to `Demo.setup()` (`demos/demos.js`), whose `t()` fills `{nome}`/`{nomeCompleto}` from the profile and appends ` — <full name>` to the tab title (don't repeat it in texts).
- **Shared UI** (`components/components.js`, classic script, all pages): Web Components (`<site-logo>`, `<theme-toggle>` containing `<theme-intensity>`, `<sound-toggle>`), GitHub viewer, external-link cards, share dialog. Keeps small UI label tables and loads `i18n/<lang>.js` on demand (`siteTexts`) when a card needs profile text on pages without i18n.
- **Résumé** (`curriculo.html`): built at runtime from `window.CURRICULO` + `PERFIL` + `I18N`; "Download PDF" links to `PERFIL.cvPdf(lang)` = Worker `GET /cv?lang=` (`src/rotas/curriculo.js`: Browser Run renders the published `curriculo.html` to A4, cached in D1 table `cv_pdf` per language + knowledge `VERSION`; on any failure it redirects to `curriculo.html?pdf=1`, which opens the browser's print dialog). There are no PDF files in the repo; old `/cv/*.pdf` links are redirected by `404.html`. Opened inside the main page via `demo-modal.js` (iframe, `?embed=1`).

## Chat pipeline

`chat.js` (UI) → `chat/regras.js` (ready-made intents; `LOCAL_ONLY` topics never call the AI) → `chat/ia.js` → Worker `POST /` (Turnstile → BGE-M3 embedding → Vectorize top 6 → Qwen3 with a fixed profile summary) → on any failure, `chat/busca.js` local TF-IDF-style search over the page. Voice questions: `chat/voz.js` records with MediaRecorder (≤ 20 s) → `chat/ia.js` `transcribe()` → Worker `POST /transcribe` (Whisper turbo, site language as hint) → text goes into the input for the visitor to review. AI errors come back as `{ error: "quota" | "unavailable" }` (3036 = daily free quota); the chat shows a notice, answers locally and dispatches `aistate`, which `sistema.js` shows in the footer (`GET /status` also returns `ai`).

## Worker

`worker/src/index.js` routes to `src/rotas/*` (chat, avaliacao, vaga, imagem, precos, visitas, metricas, status) and records one technical metric per response (route, result, ms → Analytics Engine `METRICAS`; unknown paths as `outra`); shared helpers in `src/comum.js` (models, CORS, Turnstile, rate limits, AI error kind, `registrarMetrica`); Workers Logs is on but only for the Worker's own `console` output (`invocation_logs: false`) — never log visitor text; cron in `src/agendado.js` (hourly retention purge, Monday summary e-mail). D1 stores only daily aggregate tables keyed by date (migrations in `worker/migrations/`). Tests import route handlers directly and mock `env`/`fetch`; tests that import the site's `api.js` must `import "../../perfil.js"` first.

## Project constraints

- **Zero cost:** only free plans, no payment method anywhere; don't add paid services or anything that needs a card.
- **Privacy:** visitor questions and job texts are not stored (no AI Gateway cache, no KV of answers); D1 keeps only daily aggregates for < 30 days; stats only after explicit consent. Keep it that way unless the owner decides otherwise.
- **Git:** stage explicit paths, never `git add -A` — the owner keeps personal files in the repo folder.
