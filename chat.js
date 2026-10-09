// Assistente de busca local: procura as respostas no conteúdo da própria página,
// no idioma atual. Nada é enviado para fora do navegador.
// Usa `t` e `currentLang`, definidos em script.js.

(() => {
  /* ---------- Normalização e termos de busca ---------- */

  const normalize = (text) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/ё/g, "е");

  const stopwords = new Set(
    (
      "o a os as de da do das dos e em no na nos nas com para por que qual quais como tem ter voce ele seu sua um uma onde quando sobre ja algum alguma " +
      "the an of and in on with for what which how does do is are he his has have where when about any some " +
      "el la los las del y en con para que cual cuales como tiene usted su un una donde algun alguna " +
      "le les des du et avec pour quel quelle quels comment est il son sa une ou sur " +
      "il lo gli di del con per che quale quali come ha lui suo un una dove sul " +
      "и в на с по что как какой какие у он его есть ли о для " +
      "emanuel borges"
    ).split(" "),
  );

  const isCjk = (char) => /[㐀-鿿]/.test(char);

  // Palavras longas viram prefixos para casar variações (projeto/projetos, проекты/проектов).
  const stem = (word) => (word.length >= 6 ? word.slice(0, word.length - 2) : word);

  const queryTerms = (query) => {
    const terms = new Set();
    const text = normalize(query);
    for (const word of text.match(/[\p{L}\p{N}+#.]+/gu) || []) {
      const clean = word.replace(/^[.]+|[.?]+$/g, "");
      if ([...clean].some(isCjk)) {
        const chars = [...clean].filter(isCjk);
        if (chars.length === 1) terms.add(chars[0]);
        for (let i = 0; i < chars.length - 1; i += 1) terms.add(chars[i] + chars[i + 1]);
        const latin = clean.replace(/[㐀-鿿]/g, " ").trim();
        latin.split(/\s+/).filter((w) => w.length >= 2).forEach((w) => terms.add(w));
      } else if (clean.length >= 2 && !stopwords.has(clean)) {
        terms.add(stem(clean));
      }
    }
    // Sinônimos simples entre idiomas.
    if (terms.has("ai") || terms.has("ия") || terms.has("ии")) terms.add("ia");
    if (terms.has("ia")) terms.add("ai").add("machine learning").add("nlp");
    return [...terms];
  };

  /* ---------- Assuntos que apontam para uma seção ---------- */

  const topics = [
    ["nav.education", /estud|study|studied|estudi|etudi|studi|universi|faculd|facult|colleg|gradua|diplom|degree|学|教育|毕业|учил|образов|универс|вуз/],
    ["nav.experience", /trabalh|work|trabaj|travail|lavor|job|emprego|empleo|empresa|company|career|carreira|carrera|工作|经历|公司|работ|опыт|компан/],
    ["nav.skills", /tecnolog|technolog|stack|skill|habilid|competen|ferrament|tool|herramient|outil|strument|技能|技术|навык|технолог/],
    ["nav.projects", /projet|project|proyect|progett|portf|作品|项目|проект/],
  ];

  /* ---------- Intenções especiais ---------- */

  const intents = {
    contact: /contat|contact|contacto|contatto|e-?mail|whats|telefon|phone|linkedin|github|falar|hablar|parler|parlare|联系|邮箱|电话|связ|почт|телефон|контакт/,
    cv: /curricul|\bcv\b|resum|pdf|download|baixar|descargar|telecharg|scaric|简历|резюме/,
  };

  /* ---------- Índice do conteúdo (no idioma atual) ---------- */

  const text = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  const sectionLabel = (key) => text(document.querySelector(`[data-i18n="${key}"]`));

  const buildIndex = () => {
    const docs = [];
    const add = (label, body, target, title = "", hidden = "") =>
      docs.push({ label, body, target, title: normalize(title), haystack: normalize(`${label} ${title} ${body} ${hidden}`) });

    const about = sectionLabel("nav.about");
    add(about, text(document.querySelector(".hero-description")), document.querySelector("#inicio"));
    add(about, `${text(document.querySelector(".about-lead"))} ${text(document.querySelector(".about-content > .muted"))}`, document.querySelector("#sobre"));
    document.querySelectorAll(".fact").forEach((fact) => {
      const title = text(fact.querySelector("strong"));
      add(about, `${title}: ${text(fact.querySelector("small"))}`, fact, title);
    });

    const experience = sectionLabel("nav.experience");
    document.querySelectorAll(".job").forEach((job) => {
      const title = text(job.querySelector("h3"));
      add(`${experience} · ${text(job.querySelector(".job-company"))}`, `${title} (${text(job.querySelector(".job-period"))}). ${text(job.querySelector("ul"))}`, job, title);
    });

    const projects = sectionLabel("nav.projects");
    document.querySelectorAll(".project-card").forEach((card) => {
      const title = text(card.querySelector("h3"));
      // Projetos da categoria "IA / ML" também respondem a buscas por IA.
      const hidden = card.dataset.category.split(" ").includes("ia") ? "ia ai machine learning nlp ии 人工智能" : "";
      add(`${projects} · ${title}`, `${text(card.querySelector(".project-type"))} — ${text(card.querySelector(".muted"))}`, card, title, hidden);
    });

    const skills = sectionLabel("nav.skills");
    document.querySelectorAll('[data-filter-group="habilidades"] [data-filter]:not([data-filter="todos"])').forEach((tab) => {
      const chips = [...document.querySelectorAll(`.skill-chip[data-category~="${tab.dataset.filter}"] strong`)].map(text);
      add(`${skills} · ${text(tab)}`, chips.join(", "), document.querySelector("#habilidades"), text(tab));
    });

    const education = sectionLabel("nav.education");
    document.querySelectorAll(".education-list li").forEach((li) => {
      const title = text(li.querySelector("strong"));
      add(education, `${title} — ${text(li.querySelector(".edu-text > span"))}`, li, title);
    });
    document.querySelectorAll(".education-extra > div").forEach((block) => {
      const title = text(block.querySelector(".section-kicker"));
      add(`${education} · ${title}`, text(block.querySelector(".muted")), block, title);
    });

    return docs;
  };

  // Termos curtos (ex.: "ai", "ia") só contam como palavra inteira.
  const matches = (haystack, term) =>
    term.length <= 3 && !isCjk(term[0])
      ? new RegExp(`(^|[^\\p{L}])${term.replace(/[.+#]/g, "\\$&")}($|[^\\p{L}])`, "u").test(haystack)
      : haystack.includes(term);

  const search = (query) => {
    const q = normalize(query);
    const topicLabels = topics.filter(([, pattern]) => pattern.test(q)).map(([key]) => normalize(sectionLabel(key)));
    // Palavras de assunto ("projetos", "estudou"…) contam só como assunto, não como termo.
    const terms = queryTerms(query).filter((term) => !topics.some(([, pattern]) => pattern.test(term)));
    if (!terms.length && !topicLabels.length) return [];

    const docs = buildIndex();
    // Termos raros (ex.: "kafka") pesam mais que termos comuns (ex.: "experiência").
    const weight = Object.fromEntries(
      terms.map((term) => {
        const df = docs.filter((doc) => matches(doc.haystack, term)).length;
        return [term, df ? Math.log(1 + docs.length / df) : 0];
      }),
    );

    const scored = docs
      .map((doc) => {
        let score = 0;
        for (const term of terms) {
          if (matches(doc.haystack, term)) score += weight[term] * (matches(doc.title, term) ? 2 : 1);
        }
        if (topicLabels.some((label) => normalize(doc.label).startsWith(label))) score += 1.5;
        return { doc, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    const best = scored[0]?.score ?? 0;
    return scored
      .filter(({ score }) => score >= best * 0.5)
      .slice(0, 4)
      .map(({ doc }) => ({ ...doc, terms }));
  };

  /* ---------- Interface ---------- */

  const root = document.createElement("div");
  root.className = "chat";
  root.innerHTML = `
    <button class="chat-toggle" type="button" aria-expanded="false" aria-controls="chat-panel">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4.4 21l4-2c1.1.3 2.3.5 3.6.5 5.5 0 10-3.8 10-8.5S17.5 3 12 3Zm-4 9.7a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"/></svg>
    </button>
    <section class="chat-panel" id="chat-panel" role="dialog" aria-labelledby="chat-title" hidden>
      <header class="chat-header">
        <span class="chat-avatar" aria-hidden="true">E<span>.</span></span>
        <div>
          <h2 id="chat-title" data-chat="title"></h2>
          <p data-chat="subtitle"></p>
        </div>
        <button class="chat-close" type="button" data-chat-aria="close">×</button>
      </header>
      <div class="chat-messages" aria-live="polite"></div>
      <div class="chat-suggestions" role="group"></div>
      <form class="chat-form">
        <input type="text" autocomplete="off" maxlength="200" data-chat-placeholder="placeholder" />
        <button type="submit" data-chat-aria="send">↑</button>
      </form>
      <p class="chat-note" data-chat="disclaimer"></p>
    </section>
    <div class="chat-hint" hidden>
      <button class="chat-hint-text" type="button" data-chat="hint"></button>
      <button class="chat-hint-close" type="button" data-chat-aria="hintClose">×</button>
    </div>`;
  document.body.append(root);

  const toggle = root.querySelector(".chat-toggle");
  const panel = root.querySelector(".chat-panel");
  const messages = root.querySelector(".chat-messages");
  const suggestions = root.querySelector(".chat-suggestions");
  const form = root.querySelector(".chat-form");
  const input = form.querySelector("input");
  const hint = root.querySelector(".chat-hint");
  const tc = (key) => t(`chat.${key}`);

  const el = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content != null) node.textContent = content;
    return node;
  };

  const addMessage = (from, ...children) => {
    const bubble = el("div", `chat-msg chat-msg-${from}`);
    bubble.append(...children);
    messages.append(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  };

  // Trecho com os termos encontrados destacados (sem usar innerHTML).
  const snippet = (body, terms) => {
    const normalized = normalize(body);
    const hits = terms.map((term) => normalized.indexOf(term)).filter((i) => i >= 0);
    const first = hits.length ? Math.min(...hits) : 0;
    const start = Math.max(0, first - 60);
    const cut = (start > 0 ? "…" : "") + body.slice(start, start + 220) + (start + 220 < body.length ? "…" : "");
    const p = el("p", "chat-snippet");
    const lower = normalize(cut);
    let i = 0;
    while (i < cut.length) {
      const hit = terms
        .map((term) => ({ term, at: lower.indexOf(term, i) }))
        .filter(({ at }) => at >= 0)
        .sort((a, b) => a.at - b.at)[0];
      if (!hit) {
        p.append(cut.slice(i));
        break;
      }
      p.append(cut.slice(i, hit.at), el("mark", null, cut.slice(hit.at, hit.at + hit.term.length)));
      i = hit.at + hit.term.length;
    }
    return p;
  };

  const goTo = (target) => {
    // Se o item estiver escondido por um filtro, volta para "todos".
    const group = target.closest("[data-filter-items]");
    if (target.hidden && group) {
      document.querySelector(`[data-filter-group="${group.dataset.filterItems}"] [data-filter="todos"]`).click();
    }
    if (matchMedia("(max-width: 760px)").matches) setOpen(false);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.remove("chat-highlight");
    void target.offsetWidth;
    target.classList.add("chat-highlight");
    setTimeout(() => target.classList.remove("chat-highlight"), 2400);
  };

  const linkButton = (label, href) => {
    const a = el("a", "chat-link", label);
    a.href = href;
    if (!href.startsWith("cv/")) {
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.setAttribute("download", "");
    }
    return a;
  };

  const contactLinks = () => {
    const box = el("div", "chat-links");
    box.append(
      linkButton("E-mail", "mailto:emanuel.eborges@gmail.com"),
      linkButton("WhatsApp", "https://wa.me/5592999771376"),
      linkButton("LinkedIn", "https://www.linkedin.com/in/borgesemmanuell"),
      linkButton("GitHub", "https://github.com/emanueleborges"),
    );
    return box;
  };

  const answer = (query) => {
    const q = normalize(query);
    if (intents.cv.test(q)) {
      const box = el("div", "chat-links");
      box.append(linkButton(text(document.querySelector('[data-i18n="cv.download"]')).replace(/[↓]/g, "").trim(), `cv/curriculo-emanuel-borges-${currentLang}.pdf`));
      addMessage("bot", el("p", null, tc("cv")), box);
      return;
    }
    if (intents.contact.test(q)) {
      addMessage("bot", el("p", null, tc("contact")), contactLinks());
      return;
    }

    const results = search(query);
    if (!results.length) {
      addMessage("bot", el("p", null, tc("none")), contactLinks());
      return;
    }
    const items = results.map((result) => {
      const card = el("div", "chat-result");
      const button = el("button", "chat-goto", `${tc("goTo")} →`);
      button.type = "button";
      button.addEventListener("click", () => goTo(result.target));
      card.append(el("strong", null, result.label), snippet(result.body, result.terms), button);
      return card;
    });
    addMessage("bot", el("p", null, tc("found")), ...items);
  };

  const renderTexts = () => {
    root.querySelectorAll("[data-chat]").forEach((node) => (node.textContent = tc(node.dataset.chat)));
    root.querySelectorAll("[data-chat-aria]").forEach((node) => node.setAttribute("aria-label", tc(node.dataset.chatAria)));
    input.placeholder = tc("placeholder");
    toggle.setAttribute("aria-label", tc("open"));
    suggestions.setAttribute("aria-label", tc("suggestions"));
    suggestions.replaceChildren(
      ...["s1", "s2", "s3", "s4"].map((key) => {
        const chip = el("button", "chat-chip", tc(key));
        chip.type = "button";
        chip.addEventListener("click", () => ask(tc(key)));
        return chip;
      }),
    );
  };

  const ask = (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    addMessage("user", el("p", null, trimmed));
    answer(trimmed);
  };

  /* ---------- Balão de convite (uma vez por visitante) ---------- */

  const hintStorageKey = "chatHintSeen";
  const hintSeen = () => {
    try {
      return localStorage.getItem(hintStorageKey) === "1";
    } catch {
      return false;
    }
  };
  const markHintSeen = () => {
    try {
      localStorage.setItem(hintStorageKey, "1");
    } catch {
      /* navegação privada: segue sem salvar */
    }
  };
  let hintTimer = null;

  const hideHint = () => {
    clearTimeout(hintTimer);
    hint.hidden = true;
  };

  const showHint = () => {
    if (!panel.hidden || hintSeen()) return;
    markHintSeen();
    hint.hidden = false;
    root.classList.add("is-nudging");
    setTimeout(() => root.classList.remove("is-nudging"), 1800);
    hintTimer = setTimeout(hideHint, 8000);
  };

  hint.querySelector(".chat-hint-text").addEventListener("click", () => setOpen(true));
  hint.querySelector(".chat-hint-close").addEventListener("click", hideHint);
  if (!prefersReducedMotion && !hintSeen()) setTimeout(showHint, 10000);

  function setOpen(open) {
    if (open) {
      hideHint();
      markHintSeen();
    }
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    root.classList.toggle("is-open", open);
    if (open) {
      if (!messages.children.length) addMessage("bot", el("p", null, tc("greeting")));
      input.focus();
    }
  }

  toggle.addEventListener("click", () => setOpen(panel.hidden));
  root.querySelector(".chat-close").addEventListener("click", () => {
    setOpen(false);
    toggle.focus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
    input.value = "";
  });

  document.addEventListener("languagechange", () => {
    renderTexts();
    messages.replaceChildren();
    if (!panel.hidden) addMessage("bot", el("p", null, tc("greeting")));
  });
  renderTexts();
})();
