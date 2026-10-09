// Assistente de busca local: procura as respostas no conteúdo da própria página,
// no idioma atual. Nada é enviado para fora do navegador.
// Usa `t`, `currentLang`, `prefersReducedMotion` e `track`, definidos em script.js.

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
      "o a os as de da do das dos e em no na nos nas com para por que qual quais como tem ter voce ele seu sua um uma onde quando sobre ja algum alguma sabe conhece usa usou " +
      "the an of and in on with for what which how does do is are he his has have where when about any some know knows use used " +
      "el la los las del y en con para que cual cuales como tiene usted su un una donde algun alguna conoce " +
      "le les des du et avec pour quel quelle quels comment est il son sa une ou sur connait " +
      "il lo gli di del con per che quale quali come ha lui suo un una dove sul conosce " +
      "и в на с по что как какой какие у он его есть ли о для знает " +
      "emanuel borges"
    ).split(" "),
  );

  const isCjk = (char) => /[㐀-鿿]/.test(char);

  // Palavras longas viram prefixos para casar variações (projeto/projetos, проекты/проектов).
  const stem = (word) => (word.length >= 6 ? word.slice(0, word.length - 2) : word);

  const wordsOf = (text) => normalize(text).match(/[\p{L}\p{N}+#.]+/gu) || [];

  /* ---------- Sinônimos: expressões que viram termos existentes no site ---------- */

  const programmingContext = /program|programac|编程|программ/;
  const synonyms = [
    [programmingContext, ["java", "kotlin", "python", "typescript", "javascript", "php"]],
    [/banco de dados|database|base de datos|base de donnees|banca dati|数据库|баз[аы] данных|\bsql\b|\bdb\b/, ["postgresql", "oracle", "mysql", "mongodb", "sql server"]],
    [/celular|mobile|movil|cellulare|手机|移动|мобил|\bapps?\b|android|\bios\b/, ["react native", "kotlin", "mobile"]],
    [/nuvem|cloud|nube|nuage|nuvola|云|облак/, ["aws", "serverless", "lambda"]],
    [/front|interface|\bui\b|\bux\b|前端|фронт/, ["react", "angular", "vue", "frontend"]],
    [/chat ?bot|\bllm|gpt|genai|generativ|生成式|聊天机器人|чат-?бот/, ["rag", "langchain", "llm", "ollama"]],
    [/micro-?s+ervi|微服务|микросервис/, ["kafka", "rabbitmq", "docker", "kubernetes", "hexagonal"]],
    [/mensageria|messaging|mensajeria|messagerie|messaggistica|fila|queue|消息|очеред/, ["kafka", "rabbitmq"]],
    [/devops|deploy|pipeline|container|contene?dor|容器|部署|контейнер/, ["docker", "kubernetes", "ci/cd", "gitlab"]],
    [/qualidade|quality|calidad|qualite|qualita|teste?s?\b|testing|测试|质量|тест|качеств/, ["sonarqube", "tdd", "code review"]],
    [/machine learning|aprendizado de maquina|aprendizaje automatico|apprentissage automatique|apprendimento automatico|机器学习|машинн/, ["machine learning", "scikit", "tensorflow", "xgboost"]],
    [/financ|banco digital|pagamento|payment|pago|paiement|pagament|支付|金融|платеж|финанс/, ["financial", "p2p"]],
    [/governo|government|gobierno|gouvernement|governo|政府|государ|prefeitura|setor publico|public sector/, ["manaus", "semef"]],
  ];

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

  /* ---------- Respostas prontas (perguntas frequentes) ---------- */

  // `unless`: evita confundir, por ex., "linguagens de programação" com idiomas falados.
  const faqs = [
    {
      key: "salary",
      pattern: /salari|salary|sueldo|remunera|pretens|quanto (cobra|ganha)|how much|cuanto cobra|tarif|hourly|薪|工资|зарплат|оплат/,
      contacts: true,
    },
    {
      key: "years",
      pattern: /quantos anos|anos de experiencia|how many years|years of experience|how long|cuantos anos|combien d.?annees|annees d.?experience|quanti anni|anni di esperienza|多少年|几年|сколько лет|лет опыта/,
      target: "#experiencia",
    },
    {
      key: "seeking",
      pattern: /tipo de vaga|qual vaga|que vaga|quais vagas|vaga (que|de) (procura|busca)|procura (qual|que|vaga|emprego|trabalho|oportunidade|posi)|busca (vaga|vacante|empleo|trabajo|puesto)|tipo de (puesto|vacante|empleo|trabajo|cargo)|looking for|seeking|what (kind of |type of )?(roles?|jobs?|positions?)|open to (roles|positions|jobs)|quel (type de )?poste|cherche (un )?(poste|emploi)|che tipo di (lavoro|posizione|ruolo)|cerca (lavoro|posizion)|寻找|什么职位|求职|ищет|какую (работу|вакансию|должность)|ваканс/,
      contacts: true,
    },
    {
      key: "work",
      pattern: /remot|home ?office|presencial|hibrid|hybrid|on-?site|fuso|timezone|time zone|zona horaria|fuseau|fuso orario|utc|gmt|onde mora|where .*(live|based|located)|donde vive|ou habite|dove vive|internaciona|internationa|exterior|abroad|estero|etranger|relocat|visa|clt|pj|contrat|freelanc|autonom|disponib|availab|远程|时区|国际|合同|удален|пояс|междунар|контракт|релокац/,
      contacts: true,
    },
    {
      key: "languages",
      pattern: /idioma|lingua|language|langue|lengua|ingles|english|espanhol|spanish|espanol|frances|anglais|inglese|fala|speak|habla|parle|parla|语言|英语|язык|английск/,
      unless: /program|codigo|code|codice|编程|программ|tecnolog|technolog/,
      target: ".education-extra",
    },
  ];

  /* ---------- Índice do conteúdo (no idioma atual) ---------- */

  const text = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  const sectionLabel = (key) => text(document.querySelector(`[data-i18n="${key}"]`));

  const buildIndex = () => {
    const docs = [];
    const add = ({ section, item = "", body, target, title = "", hidden = "" }) =>
      docs.push({
        section,
        item,
        label: item ? `${section} · ${item}` : section,
        body,
        target,
        title: normalize(title),
        haystack: normalize(`${section} ${item} ${title} ${body} ${hidden}`),
      });

    const about = sectionLabel("nav.about");
    add({ section: about, body: text(document.querySelector(".hero-description")), target: document.querySelector("#inicio") });
    add({ section: about, body: `${text(document.querySelector(".about-lead"))} ${text(document.querySelector(".about-content > .muted"))}`, target: document.querySelector("#sobre") });
    document.querySelectorAll(".fact").forEach((fact) => {
      const title = text(fact.querySelector("strong"));
      add({ section: about, body: `${title}: ${text(fact.querySelector("small"))}`, target: fact, title });
    });

    const experience = sectionLabel("nav.experience");
    document.querySelectorAll(".job").forEach((job) => {
      const title = text(job.querySelector("h3"));
      add({ section: experience, item: text(job.querySelector(".job-company")), body: `${title} (${text(job.querySelector(".job-period"))}). ${text(job.querySelector("ul"))}`, target: job, title });
    });

    const projects = sectionLabel("nav.projects");
    document.querySelectorAll(".project-card").forEach((card) => {
      const title = text(card.querySelector("h3"));
      // Projetos da categoria "IA / ML" também respondem a buscas por IA.
      const hidden = card.dataset.category.split(" ").includes("ia") ? "ia ai machine learning nlp ии 人工智能" : "";
      add({ section: projects, item: title, body: `${text(card.querySelector(".project-type"))} — ${text(card.querySelector(".muted"))}`, target: card, title, hidden });
    });

    const skills = sectionLabel("nav.skills");
    document.querySelectorAll('[data-filter-group="habilidades"] [data-filter]:not([data-filter="todos"])').forEach((tab) => {
      const chips = [...document.querySelectorAll(`.skill-chip[data-category~="${tab.dataset.filter}"] strong`)].map(text);
      add({ section: skills, item: text(tab), body: chips.join(", "), target: document.querySelector("#habilidades"), title: text(tab) });
    });

    const education = sectionLabel("nav.education");
    document.querySelectorAll(".education-list li").forEach((li) => {
      const title = text(li.querySelector("strong"));
      add({ section: education, item: title, body: `${title} — ${text(li.querySelector(".edu-text > span"))}`, target: li, title });
    });
    document.querySelectorAll(".education-extra > div").forEach((block) => {
      const title = text(block.querySelector(".section-kicker"));
      add({ section: education, item: title, body: text(block.querySelector(".muted")), target: block, title });
    });

    return docs;
  };

  /* ---------- Tolerância a erros de digitação ---------- */

  // Distância de edição com troca de letras vizinhas (kafak → kafka).
  const editDistance = (a, b) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j += 1) d[0][j] = j;
    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[a.length][b.length];
  };

  const correctWord = (word, vocabulary) => {
    if (word.length < 4 || stopwords.has(word) || [...word].some(isCjk) || vocabulary.has(word)) return word;
    if ([...vocabulary].some((known) => known.startsWith(word) || word.startsWith(known))) return word;
    const limit = word.length >= 7 ? 2 : 1;
    let best = word;
    let bestDistance = limit + 1;
    for (const known of vocabulary) {
      if (Math.abs(known.length - word.length) > limit) continue;
      const distance = editDistance(word, known);
      if (distance < bestDistance) {
        best = known;
        bestDistance = distance;
      }
    }
    return best;
  };

  /* ---------- Busca ---------- */

  // Termos curtos (ex.: "ai", "ia") só contam como palavra inteira.
  const matches = (haystack, term) =>
    term.length <= 3 && !isCjk(term[0])
      ? new RegExp(`(^|[^\\p{L}])${term.replace(/[.+#/]/g, "\\$&")}($|[^\\p{L}])`, "u").test(haystack)
      : haystack.includes(term);

  const isTopicWord = (term) => topics.some(([, pattern]) => pattern.test(term));

  const search = (query) => {
    const docs = buildIndex();
    const vocabulary = new Set(docs.flatMap((doc) => doc.haystack.match(/[\p{L}\p{N}+#.]{4,}/gu) || []));

    // 1. Corrige erros de digitação palavra por palavra.
    const corrected = wordsOf(query).map((word) => correctWord(word.replace(/[.?]+$/, ""), vocabulary)).join(" ");
    const q = normalize(corrected);

    // 2. Termos principais (o que a pessoa digitou) e termos de apoio (sinônimos).
    const mainTerms = new Set();
    for (const word of q.match(/[\p{L}\p{N}+#./]+/gu) || []) {
      const clean = word.replace(/^[.]+|[.?]+$/g, "");
      if ([...clean].some(isCjk)) {
        const chars = [...clean].filter(isCjk);
        if (chars.length === 1) mainTerms.add(chars[0]);
        for (let i = 0; i < chars.length - 1; i += 1) mainTerms.add(chars[i] + chars[i + 1]);
        clean.replace(/[㐀-鿿]/g, " ").trim().split(/\s+/).filter((w) => w.length >= 2).forEach((w) => mainTerms.add(w));
      } else if (clean.length >= 2 && !stopwords.has(clean)) {
        mainTerms.add(stem(clean));
      }
    }
    if (mainTerms.has("ai") || mainTerms.has("ии")) mainTerms.add("ia");
    const extraTerms = new Set();
    if (mainTerms.has("ia")) ["ai", "machine learning", "nlp"].forEach((term) => extraTerms.add(term));
    for (const [pattern, expansion] of synonyms) if (pattern.test(q)) expansion.forEach((term) => extraTerms.add(term));

    // Palavras de assunto ("projetos", "estudou"…) contam só como assunto, não como termo.
    const topicLabels = topics.filter(([, pattern]) => pattern.test(q)).map(([key]) => normalize(sectionLabel(key)));
    // Em "linguagens de programação", "linguagens"/"programação" não são termos de busca.
    const programmingWords = /^(languag|langag|lingu|lengu|язык|语言|编程|program)/;
    const main = [...mainTerms].filter((term) => !isTopicWord(term) && !(programmingContext.test(q) && programmingWords.test(term)));
    const extra = [...extraTerms].filter((term) => !mainTerms.has(term));
    const terms = [...main, ...extra];
    if (!terms.length && !topicLabels.length) return { results: [], main: [] };

    // 3. Termos raros (ex.: "kafka") pesam mais que termos comuns (ex.: "experiência").
    const weight = Object.fromEntries(
      terms.map((term) => {
        const df = docs.filter((doc) => matches(doc.haystack, term)).length;
        const idf = df ? Math.log(1 + docs.length / df) : 0;
        return [term, extraTerms.has(term) && !mainTerms.has(term) ? idf * 0.6 : idf];
      }),
    );

    const scored = docs
      .map((doc) => {
        let score = 0;
        for (const term of terms) {
          if (matches(doc.haystack, term)) score += weight[term] * (matches(doc.title, term) ? 2 : 1);
        }
        if (topicLabels.some((label) => normalize(doc.section).startsWith(label))) score += 1.5;
        return { doc, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    const best = scored[0]?.score ?? 0;
    const results = scored
      .filter(({ score }) => score >= best * 0.5)
      .slice(0, 4)
      .map(({ doc }) => ({ ...doc, terms }));
    return { results, main: main.filter((term) => results.some((r) => matches(r.haystack, term))) };
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
        <input type="text" autocomplete="off" maxlength="200" />
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
  const tc = (key, vars) => t(`chat.${key}`, vars);

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

  // Forma como o termo aparece na página (ex.: "kafka" → "Kafka").
  // Prefere a forma com letras minúsculas/maiúsculas normais a rótulos em CAIXA ALTA.
  const displayTerm = (term, results) => {
    const found = [];
    for (const result of results) {
      const lower = normalize(result.body);
      for (let at = lower.indexOf(term); at >= 0; at = lower.indexOf(term, at + 1)) {
        const match = result.body.slice(at).match(/^[\p{L}\p{N}+#./-]+/u);
        if (match) found.push(match[0]);
      }
    }
    return found.find((word) => word !== word.toUpperCase()) ?? found[0] ?? term;
  };

  // Frase-resumo: "Sobre “Kafka”, encontrei:" + resultados agrupados por seção.
  const summary = (results, main) => {
    const groups = new Map();
    for (const result of results) {
      if (!groups.has(result.section)) groups.set(result.section, []);
      if (result.item) groups.get(result.section).push(result.item);
    }
    const nodes = [];
    nodes.push(
      el("p", null, main.length ? tc("summary", { q: main.map((term) => `“${displayTerm(term, results)}”`).join(" + ") }) : tc("found")),
    );
    const list = el("p", "chat-summary");
    [...groups].forEach(([section, items], index) => {
      if (index) list.append(" · ");
      list.append(el("strong", null, section));
      if (items.length) list.append(`: ${items.join(", ")}`);
    });
    nodes.push(list);
    return nodes;
  };

  // Sugestões de continuação: outras tecnologias que aparecem nos resultados.
  const relatedSuggestions = (results, terms) => {
    const names = [...document.querySelectorAll(".skill-chip strong")].map(text);
    const counts = new Map();
    for (const name of names) {
      const key = normalize(name);
      if (terms.some((term) => key.includes(term) || term.includes(key))) continue;
      const hitsCount = results.filter((result) => result.haystack.includes(key)).length;
      if (hitsCount) counts.set(name, hitsCount);
    }
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
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

  const chipButton = (label, query = label) => {
    const chip = el("button", "chat-chip", label);
    chip.type = "button";
    chip.addEventListener("click", () => ask(query));
    return chip;
  };

  // Monta a resposta (lista de elementos) para uma pergunta.
  const answer = (query) => {
    const q = normalize(query);
    if (intents.cv.test(q)) {
      const box = el("div", "chat-links");
      box.append(linkButton(text(document.querySelector('[data-i18n="cv.download"]')).replace(/[↓]/g, "").trim(), `cv/curriculo-emanuel-borges-${currentLang}.pdf`));
      return [el("p", null, tc("cv")), box];
    }
    const faq = faqs.find(({ pattern, unless }) => pattern.test(q) && !(unless && unless.test(q)));
    if (faq) {
      const nodes = [el("p", null, tc(`faq.${faq.key}`))];
      if (faq.contacts) nodes.push(contactLinks());
      const target = faq.target && document.querySelector(faq.target);
      if (target) {
        const button = el("button", "chat-goto", `${tc("goTo")} →`);
        button.type = "button";
        button.addEventListener("click", () => goTo(target));
        nodes.push(button);
      }
      return nodes;
    }
    if (intents.contact.test(q)) return [el("p", null, tc("contact")), contactLinks()];

    const { results, main } = search(query);
    if (!results.length) return [el("p", null, tc("none")), contactLinks()];

    const cards = results.map((result) => {
      const card = el("div", "chat-result");
      const button = el("button", "chat-goto", `${tc("goTo")} →`);
      button.type = "button";
      button.addEventListener("click", () => goTo(result.target));
      card.append(el("strong", null, result.label), snippet(result.body, result.terms), button);
      return card;
    });

    const nodes = [...summary(results, main), ...cards];
    const related = relatedSuggestions(results, results[0].terms);
    if (related.length) {
      const box = el("div", "chat-related");
      box.append(el("p", null, tc("related")), ...related.map((name) => chipButton(name)));
      nodes.push(box);
    }
    return nodes;
  };

  const renderTexts = () => {
    root.querySelectorAll("[data-chat]").forEach((node) => (node.textContent = tc(node.dataset.chat)));
    root.querySelectorAll("[data-chat-aria]").forEach((node) => node.setAttribute("aria-label", tc(node.dataset.chatAria)));
    input.placeholder = tc("placeholder");
    toggle.setAttribute("aria-label", tc("open"));
    suggestions.setAttribute("aria-label", tc("suggestions"));
    suggestions.replaceChildren(...["s1", "s2", "s3", "s4"].map((key) => chipButton(tc(key))));
  };

  // Mostra "digitando…" por um instante antes da resposta.
  const ask = (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    addMessage("user", el("p", null, trimmed));
    const reply = answer(trimmed);
    if (prefersReducedMotion) {
      addMessage("bot", ...reply);
      return;
    }
    const typing = addMessage("bot", el("span", "chat-typing", ""));
    typing.querySelector(".chat-typing").append(el("i"), el("i"), el("i"));
    typing.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      typing.removeAttribute("aria-hidden");
      typing.replaceChildren(...reply);
      messages.scrollTop = messages.scrollHeight;
    }, 550);
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
  if (!prefersReducedMotion && !hintSeen()) setTimeout(showHint, 3000);

  function setOpen(open) {
    if (open) {
      hideHint();
      markHintSeen();
      // Só conta a abertura; o texto digitado nunca sai do navegador.
      if (panel.hidden) track("chat-aberto", "Abriu o assistente");
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

  // Usado pelos testes automáticos (tests/): devolve a resposta em texto.
  window.portfolioChat = {
    answerText: (query) =>
      answer(query)
        .map((node) => node.textContent)
        .join(" | "),
    search: (query) => search(query).results.map((result) => result.label),
  };
})();
