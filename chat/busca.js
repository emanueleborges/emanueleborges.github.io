// Assistente (3/4) — busca local: indexa o conteúdo da página (no idioma atual) e ranqueia
// os trechos por termos raros (estilo TF-IDF). Nada sai do navegador.

(() => {
  const { normalize, stopwords, isCjk, stem, wordsOf, correctWord, matches } = window.ChatCore.text;
  const { programmingContext, synonyms, topics } = window.ChatCore.rules;

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
      // A marca do card (ex.: "01 / TCC · UFG") também é pesquisável.
      const hidden = `${text(card.querySelector(".art-number"))} ${card.dataset.category.split(" ").includes("ia") ? "ia ai ki machine learning nlp ии 人工智能" : ""}`;
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

  /* ---------- Busca ---------- */

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
    if (mainTerms.has("ai") || mainTerms.has("ki") || mainTerms.has("ии")) mainTerms.add("ia");
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

  window.ChatCore = { ...window.ChatCore, search: { text, search } };
})();
