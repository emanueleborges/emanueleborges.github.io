// Recomendação de filmes por conteúdo (TF-IDF + cosseno), calculada no navegador.
// Base: filmes.json (Wikidata + resumos da Wikipédia), gerada por scripts/gerar-dados-filmes.py.

const EXAMPLES = ["The Matrix", "Toy Story", "The Godfather", "Shrek", "Titanic", "Interstellar"];
const QUERIES = ["space adventure with robots", "mafia family crime", "haunted house horror", "superhero team"];

const T = {
  en: {
    "meta.title": "Movie Recommender with TF-IDF — Emanuel Borges",
    "meta.description": "Content-based movie recommendations with TF-IDF and cosine similarity over 1,500 films, computed in your browser, with the terms that explain each match.",
    lang: "Language",
    kicker: "// AI DEMO · RUNS IN YOUR BROWSER",
    title: "Movie recommendations <span>with TF-IDF.</span>",
    lead: "Content-based recommender: each film's summary becomes a TF-IDF vector and the closest films by cosine similarity are recommended — the same technique as my Movie Recommender System, now computed in your browser over 1,500 films, showing <em>why</em> each one was chosen.",
    back: "← Back to portfolio",
    code: "View code ↗",
    pickLabel: "Pick a movie you like",
    pickPh: "e.g. The Matrix",
    recommend: "Recommend",
    searchLabel: "Or describe what you want to watch (in English)",
    searchPh: "e.g. space adventure with robots",
    search: "Search",
    loading: "Loading 1,500 films…",
    ready: "{n} films and {v} terms indexed in {ms} ms, in your browser.",
    error: "Could not load the films. Please reload the page.",
    notFound: "Movie not found — pick one from the list.",
    noResults: "Nothing similar. Try other words (in English).",
    because: "Because of:",
    similarTo: "Similar to",
    resultsFor: "Results for",
    moreLike: "More like this",
    wiki: "Wikipedia ↗",
    similarity: "similarity",
    directedBy: "Directed by",
    how: "<strong>How it works:</strong> each summary (plus genres and director) is split into words, common words are removed, and each film becomes a vector where rare, specific words weigh more (TF-IDF, same formula as scikit-learn). Two films are similar when their vectors point in the same direction (cosine similarity). It's a content-based approach: no user ratings, so it recommends by theme, genre, director and characters.",
    credits: "Data: <a href=\"https://www.wikidata.org\" target=\"_blank\" rel=\"noopener\">Wikidata</a> (CC0) and English <a href=\"https://en.wikipedia.org\" target=\"_blank\" rel=\"noopener\">Wikipedia</a> summaries (CC BY-SA 4.0), shortened. Each card links to its article.",
  },
  pt: {
    "meta.title": "Recomendação de Filmes com TF-IDF — Emanuel Borges",
    "meta.description": "Recomendação de filmes por conteúdo com TF-IDF e similaridade de cosseno sobre 1.500 filmes, calculada no seu navegador, mostrando os termos que explicam cada resultado.",
    lang: "Idioma",
    kicker: "// DEMO DE IA · RODA NO SEU NAVEGADOR",
    title: "Recomendação de filmes <span>com TF-IDF.</span>",
    lead: "Recomendação por conteúdo: o resumo de cada filme vira um vetor TF-IDF e são recomendados os filmes mais próximos pela similaridade de cosseno — a mesma técnica do meu Movie Recommender System, agora calculada no seu navegador sobre 1.500 filmes e mostrando <em>por que</em> cada um foi escolhido.",
    back: "← Voltar ao portfólio",
    code: "Ver código ↗",
    pickLabel: "Escolha um filme que você gosta",
    pickPh: "Ex.: The Matrix",
    recommend: "Recomendar",
    searchLabel: "Ou descreva o que quer assistir (em inglês)",
    searchPh: "Ex.: space adventure with robots",
    search: "Buscar",
    loading: "Carregando 1.500 filmes…",
    ready: "{n} filmes e {v} termos indexados em {ms} ms, no seu navegador.",
    error: "Não foi possível carregar os filmes. Recarregue a página.",
    notFound: "Filme não encontrado — escolha um da lista.",
    noResults: "Nada parecido. Tente outras palavras (em inglês).",
    because: "Por causa de:",
    similarTo: "Parecidos com",
    resultsFor: "Resultados para",
    moreLike: "Mais parecidos com este",
    wiki: "Wikipédia ↗",
    similarity: "similaridade",
    directedBy: "Direção:",
    how: "<strong>Como funciona:</strong> cada resumo (mais gêneros e direção) é dividido em palavras, as palavras comuns são removidas e cada filme vira um vetor em que palavras raras e específicas pesam mais (TF-IDF, mesma fórmula do scikit-learn). Dois filmes são parecidos quando seus vetores apontam na mesma direção (similaridade de cosseno). É uma abordagem por conteúdo: sem notas de usuários, recomenda por tema, gênero, direção e personagens.",
    credits: "Dados: <a href=\"https://www.wikidata.org\" target=\"_blank\" rel=\"noopener\">Wikidata</a> (CC0) e resumos da <a href=\"https://en.wikipedia.org\" target=\"_blank\" rel=\"noopener\">Wikipédia</a> em inglês (CC BY-SA 4.0), encurtados. Cada card leva ao artigo original.",
  },
  es: {
    "meta.title": "Recomendación de Películas con TF-IDF — Emanuel Borges",
    "meta.description": "Recomendación de películas por contenido con TF-IDF y similitud de coseno sobre 1.500 películas, calculada en tu navegador, mostrando los términos que explican cada resultado.",
    lang: "Idioma",
    kicker: "// DEMO DE IA · SE EJECUTA EN TU NAVEGADOR",
    title: "Recomendación de películas <span>con TF-IDF.</span>",
    lead: "Recomendación por contenido: el resumen de cada película se convierte en un vector TF-IDF y se recomiendan las más cercanas por similitud de coseno — la misma técnica de mi Movie Recommender System, ahora calculada en tu navegador sobre 1.500 películas y mostrando <em>por qué</em> se eligió cada una.",
    back: "← Volver al portafolio",
    code: "Ver código ↗",
    pickLabel: "Elige una película que te guste",
    pickPh: "Ej.: The Matrix",
    recommend: "Recomendar",
    searchLabel: "O describe lo que quieres ver (en inglés)",
    searchPh: "Ej.: space adventure with robots",
    search: "Buscar",
    loading: "Cargando 1.500 películas…",
    ready: "{n} películas y {v} términos indexados en {ms} ms, en tu navegador.",
    error: "No se pudieron cargar las películas. Recarga la página.",
    notFound: "Película no encontrada — elige una de la lista.",
    noResults: "Nada parecido. Prueba otras palabras (en inglés).",
    because: "Por:",
    similarTo: "Parecidas a",
    resultsFor: "Resultados para",
    moreLike: "Más parecidas a esta",
    wiki: "Wikipedia ↗",
    similarity: "similitud",
    directedBy: "Dirección:",
    how: "<strong>Cómo funciona:</strong> cada resumen (más géneros y dirección) se divide en palabras, se eliminan las palabras comunes y cada película se convierte en un vector en el que las palabras raras y específicas pesan más (TF-IDF, misma fórmula que scikit-learn). Dos películas se parecen cuando sus vectores apuntan en la misma dirección (similitud de coseno). Es un enfoque por contenido: sin calificaciones de usuarios, recomienda por tema, género, dirección y personajes.",
    credits: "Datos: <a href=\"https://www.wikidata.org\" target=\"_blank\" rel=\"noopener\">Wikidata</a> (CC0) y resúmenes de la <a href=\"https://en.wikipedia.org\" target=\"_blank\" rel=\"noopener\">Wikipedia</a> en inglés (CC BY-SA 4.0), acortados. Cada tarjeta enlaza a su artículo.",
  },
  fr: {
    "meta.title": "Recommandation de Films avec TF-IDF — Emanuel Borges",
    "meta.description": "Recommandation de films basée sur le contenu avec TF-IDF et similarité cosinus sur 1 500 films, calculée dans votre navigateur, avec les termes qui expliquent chaque résultat.",
    lang: "Langue",
    kicker: "// DÉMO D'IA · S'EXÉCUTE DANS VOTRE NAVIGATEUR",
    title: "Recommandation de films <span>avec TF-IDF.</span>",
    lead: "Recommandation basée sur le contenu : le résumé de chaque film devient un vecteur TF-IDF et les films les plus proches par similarité cosinus sont recommandés — la même technique que mon Movie Recommender System, désormais calculée dans votre navigateur sur 1 500 films, en montrant <em>pourquoi</em> chacun a été choisi.",
    back: "← Retour au portfolio",
    code: "Voir le code ↗",
    pickLabel: "Choisissez un film que vous aimez",
    pickPh: "Ex. : The Matrix",
    recommend: "Recommander",
    searchLabel: "Ou décrivez ce que vous voulez regarder (en anglais)",
    searchPh: "Ex. : space adventure with robots",
    search: "Rechercher",
    loading: "Chargement de 1 500 films…",
    ready: "{n} films et {v} termes indexés en {ms} ms, dans votre navigateur.",
    error: "Impossible de charger les films. Rechargez la page.",
    notFound: "Film introuvable — choisissez-en un dans la liste.",
    noResults: "Rien de similaire. Essayez d'autres mots (en anglais).",
    because: "Grâce à :",
    similarTo: "Similaires à",
    resultsFor: "Résultats pour",
    moreLike: "Plus de films comme celui-ci",
    wiki: "Wikipédia ↗",
    similarity: "similarité",
    directedBy: "Réalisation :",
    how: "<strong>Fonctionnement :</strong> chaque résumé (avec genres et réalisation) est découpé en mots, les mots courants sont retirés et chaque film devient un vecteur où les mots rares et spécifiques pèsent davantage (TF-IDF, même formule que scikit-learn). Deux films se ressemblent quand leurs vecteurs pointent dans la même direction (similarité cosinus). C'est une approche par contenu : sans notes d'utilisateurs, elle recommande par thème, genre, réalisation et personnages.",
    credits: "Données : <a href=\"https://www.wikidata.org\" target=\"_blank\" rel=\"noopener\">Wikidata</a> (CC0) et résumés de <a href=\"https://en.wikipedia.org\" target=\"_blank\" rel=\"noopener\">Wikipédia</a> en anglais (CC BY-SA 4.0), raccourcis. Chaque carte renvoie à son article.",
  },
  it: {
    "meta.title": "Raccomandazione di Film con TF-IDF — Emanuel Borges",
    "meta.description": "Raccomandazione di film basata sui contenuti con TF-IDF e similarità del coseno su 1.500 film, calcolata nel tuo browser, con i termini che spiegano ogni risultato.",
    lang: "Lingua",
    kicker: "// DEMO DI IA · GIRA NEL TUO BROWSER",
    title: "Raccomandazione di film <span>con TF-IDF.</span>",
    lead: "Raccomandazione basata sui contenuti: la trama di ogni film diventa un vettore TF-IDF e vengono consigliati i film più vicini per similarità del coseno — la stessa tecnica del mio Movie Recommender System, ora calcolata nel tuo browser su 1.500 film, mostrando <em>perché</em> ognuno è stato scelto.",
    back: "← Torna al portfolio",
    code: "Vedi il codice ↗",
    pickLabel: "Scegli un film che ti piace",
    pickPh: "Es.: The Matrix",
    recommend: "Consiglia",
    searchLabel: "Oppure descrivi cosa vuoi guardare (in inglese)",
    searchPh: "Es.: space adventure with robots",
    search: "Cerca",
    loading: "Caricamento di 1.500 film…",
    ready: "{n} film e {v} termini indicizzati in {ms} ms, nel tuo browser.",
    error: "Impossibile caricare i film. Ricarica la pagina.",
    notFound: "Film non trovato — scegline uno dall'elenco.",
    noResults: "Niente di simile. Prova altre parole (in inglese).",
    because: "Per via di:",
    similarTo: "Simili a",
    resultsFor: "Risultati per",
    moreLike: "Altri simili a questo",
    wiki: "Wikipedia ↗",
    similarity: "similarità",
    directedBy: "Regia:",
    how: "<strong>Come funziona:</strong> ogni trama (più generi e regia) viene divisa in parole, le parole comuni vengono rimosse e ogni film diventa un vettore in cui le parole rare e specifiche pesano di più (TF-IDF, stessa formula di scikit-learn). Due film sono simili quando i loro vettori puntano nella stessa direzione (similarità del coseno). È un approccio basato sui contenuti: senza voti degli utenti, consiglia per tema, genere, regia e personaggi.",
    credits: "Dati: <a href=\"https://www.wikidata.org\" target=\"_blank\" rel=\"noopener\">Wikidata</a> (CC0) e trame di <a href=\"https://en.wikipedia.org\" target=\"_blank\" rel=\"noopener\">Wikipedia</a> in inglese (CC BY-SA 4.0), accorciate. Ogni scheda rimanda alla sua voce.",
  },
  de: {
    "meta.title": "Filmempfehlungen mit TF-IDF — Emanuel Borges",
    "meta.description": "Inhaltsbasierte Filmempfehlungen mit TF-IDF und Kosinus-Ähnlichkeit über 1.500 Filme, berechnet in Ihrem Browser, mit den Begriffen, die jeden Treffer erklären.",
    lang: "Sprache",
    kicker: "// KI-DEMO · LÄUFT IN IHREM BROWSER",
    title: "Filmempfehlungen <span>mit TF-IDF.</span>",
    lead: "Inhaltsbasierte Empfehlung: Die Zusammenfassung jedes Films wird zu einem TF-IDF-Vektor, und die nach Kosinus-Ähnlichkeit nächsten Filme werden empfohlen – dieselbe Technik wie in meinem Movie Recommender System, jetzt in Ihrem Browser über 1.500 Filme berechnet und mit der Erklärung, <em>warum</em> jeder gewählt wurde.",
    back: "← Zurück zum Portfolio",
    code: "Code ansehen ↗",
    pickLabel: "Wählen Sie einen Film, den Sie mögen",
    pickPh: "z. B. The Matrix",
    recommend: "Empfehlen",
    searchLabel: "Oder beschreiben Sie, was Sie sehen möchten (auf Englisch)",
    searchPh: "z. B. space adventure with robots",
    search: "Suchen",
    loading: "1.500 Filme werden geladen…",
    ready: "{n} Filme und {v} Begriffe in {ms} ms indexiert, in Ihrem Browser.",
    error: "Die Filme konnten nicht geladen werden. Bitte laden Sie die Seite neu.",
    notFound: "Film nicht gefunden – wählen Sie einen aus der Liste.",
    noResults: "Nichts Ähnliches. Versuchen Sie andere Wörter (auf Englisch).",
    because: "Wegen:",
    similarTo: "Ähnlich wie",
    resultsFor: "Ergebnisse für",
    moreLike: "Mehr wie dieser",
    wiki: "Wikipedia ↗",
    similarity: "Ähnlichkeit",
    directedBy: "Regie:",
    how: "<strong>So funktioniert es:</strong> Jede Zusammenfassung (plus Genres und Regie) wird in Wörter zerlegt, häufige Wörter werden entfernt, und jeder Film wird zu einem Vektor, in dem seltene, spezifische Wörter mehr Gewicht haben (TF-IDF, gleiche Formel wie scikit-learn). Zwei Filme sind ähnlich, wenn ihre Vektoren in dieselbe Richtung zeigen (Kosinus-Ähnlichkeit). Ein inhaltsbasierter Ansatz: ohne Nutzerbewertungen, Empfehlungen nach Thema, Genre, Regie und Figuren.",
    credits: "Daten: <a href=\"https://www.wikidata.org\" target=\"_blank\" rel=\"noopener\">Wikidata</a> (CC0) und gekürzte Zusammenfassungen aus der englischen <a href=\"https://en.wikipedia.org\" target=\"_blank\" rel=\"noopener\">Wikipedia</a> (CC BY-SA 4.0). Jede Karte verlinkt auf ihren Artikel.",
  },
  zh: {
    "meta.title": "基于 TF-IDF 的电影推荐 — Emanuel Borges",
    "meta.description": "基于内容的电影推荐：在浏览器中对 1,500 部电影计算 TF-IDF 与余弦相似度，并展示解释每个结果的关键词。",
    lang: "语言",
    kicker: "// AI 演示 · 在你的浏览器中运行",
    title: "电影推荐 <span>基于 TF-IDF。</span>",
    lead: "基于内容的推荐：每部电影的简介被转换为 TF-IDF 向量，按余弦相似度推荐最接近的电影——与我的 Movie Recommender System 相同的技术，现在在你的浏览器中对 1,500 部电影进行计算，并展示每部电影<em>为什么</em>被推荐。",
    back: "← 返回作品集",
    code: "查看代码 ↗",
    pickLabel: "选择一部你喜欢的电影",
    pickPh: "例如：The Matrix",
    recommend: "推荐",
    searchLabel: "或描述你想看的内容（英文）",
    searchPh: "例如：space adventure with robots",
    search: "搜索",
    loading: "正在加载 1,500 部电影…",
    ready: "已在你的浏览器中用 {ms} 毫秒索引 {n} 部电影和 {v} 个词项。",
    error: "无法加载电影数据，请刷新页面。",
    notFound: "未找到该电影——请从列表中选择。",
    noResults: "没有相似结果。请尝试其他（英文）词语。",
    because: "关键词：",
    similarTo: "相似于",
    resultsFor: "搜索结果：",
    moreLike: "更多类似电影",
    wiki: "维基百科 ↗",
    similarity: "相似度",
    directedBy: "导演：",
    how: "<strong>工作原理：</strong>每段简介（加上类型和导演）被拆分为词语，去除常见词后，每部电影成为一个向量，其中少见且具体的词权重更高（TF-IDF，与 scikit-learn 公式相同）。当两个向量指向相同方向时，两部电影就相似（余弦相似度）。这是基于内容的方法：不使用用户评分，而是按主题、类型、导演和角色推荐。",
    credits: "数据：<a href=\"https://www.wikidata.org\" target=\"_blank\" rel=\"noopener\">Wikidata</a>（CC0）和英文<a href=\"https://en.wikipedia.org\" target=\"_blank\" rel=\"noopener\">维基百科</a>简介（CC BY-SA 4.0，已缩短）。每张卡片都链接到原文。",
  },
  ru: {
    "meta.title": "Рекомендации фильмов с TF-IDF — Emanuel Borges",
    "meta.description": "Контентные рекомендации фильмов на основе TF-IDF и косинусного сходства по 1500 фильмам, вычисляемые в вашем браузере, с терминами, объясняющими каждый результат.",
    lang: "Язык",
    kicker: "// ДЕМО ИИ · РАБОТАЕТ В ВАШЕМ БРАУЗЕРЕ",
    title: "Рекомендации фильмов <span>с TF-IDF.</span>",
    lead: "Контентные рекомендации: описание каждого фильма превращается в вектор TF-IDF, и рекомендуются ближайшие фильмы по косинусному сходству — та же техника, что в моём Movie Recommender System, теперь в вашем браузере на 1500 фильмах и с объяснением, <em>почему</em> выбран каждый.",
    back: "← Назад к портфолио",
    code: "Смотреть код ↗",
    pickLabel: "Выберите фильм, который вам нравится",
    pickPh: "Напр.: The Matrix",
    recommend: "Рекомендовать",
    searchLabel: "Или опишите, что хотите посмотреть (по-английски)",
    searchPh: "Напр.: space adventure with robots",
    search: "Искать",
    loading: "Загрузка 1500 фильмов…",
    ready: "{n} фильмов и {v} терминов проиндексированы за {ms} мс в вашем браузере.",
    error: "Не удалось загрузить фильмы. Обновите страницу.",
    notFound: "Фильм не найден — выберите из списка.",
    noResults: "Ничего похожего. Попробуйте другие слова (по-английски).",
    because: "Благодаря:",
    similarTo: "Похожие на",
    resultsFor: "Результаты для",
    moreLike: "Ещё похожие",
    wiki: "Википедия ↗",
    similarity: "сходство",
    directedBy: "Режиссёр:",
    how: "<strong>Как это работает:</strong> каждое описание (плюс жанры и режиссёр) делится на слова, частые слова удаляются, и каждый фильм становится вектором, где редкие и характерные слова весят больше (TF-IDF, та же формула, что в scikit-learn). Два фильма похожи, когда их векторы смотрят в одном направлении (косинусное сходство). Это контентный подход: без оценок пользователей он рекомендует по теме, жанру, режиссёру и персонажам.",
    credits: "Данные: <a href=\"https://www.wikidata.org\" target=\"_blank\" rel=\"noopener\">Wikidata</a> (CC0) и сокращённые описания из английской <a href=\"https://en.wikipedia.org\" target=\"_blank\" rel=\"noopener\">Википедии</a> (CC BY-SA 4.0). Каждая карточка ведёт на свою статью.",
  },
};

const { t, escape, track } = Demo;
const $ = (selector) => document.querySelector(selector);
let films = [];
let engine = null;
let byTitle = new Map();
let current = null; // { type: "film", index } ou { type: "search", text }
let indexMs = 0;

// Texto que representa o filme: resumo + gêneros (peso dobrado) + direção como uma palavra só.
const docText = (f) => `${f.x} ${f.g.join(" ")} ${f.g.join(" ")} ${f.d.map((d) => d.replace(/[^\p{L}]/gu, "")).join(" ")}`;
const label = (f) => (f.y ? `${f.t} (${f.y})` : f.t);
const wikiUrl = (f) => `https://en.wikipedia.org/wiki/${encodeURIComponent(f.w.replace(/ /g, "_"))}`;

function card(result) {
  const f = films[result.index];
  const pct = Math.round(result.score * 100);
  return `<article class="movie">
    <h4>${escape(f.t)} <small>${f.y ?? ""}</small></h4>
    <span class="meta">${escape(f.g.slice(0, 4).join(" · "))}${f.d.length ? ` — ${t("directedBy")} ${escape(f.d.join(", "))}` : ""}</span>
    <span class="score"><span class="bar"><span style="width:${Math.min(pct * 1.6, 100)}%"></span></span>${pct}% ${t("similarity")}</span>
    <span class="terms">${t("because")} ${result.terms.map((w) => `<b>${escape(w)}</b>`).join(", ")}</span>
    <p>${escape(f.x.slice(0, 180))}${f.x.length > 180 ? "…" : ""}</p>
    <div class="actions"><button class="linklike" type="button" data-more="${result.index}">${t("moreLike")}</button><a href="${wikiUrl(f)}" target="_blank" rel="noopener">${t("wiki")}</a></div>
  </article>`;
}

function render() {
  if (!engine || !current) return;
  const results = current.type === "film" ? engine.similarTo(current.index) : engine.search(current.text);
  if (current.type === "film") {
    const f = films[current.index];
    $("[data-picked]").innerHTML = `<div class="picked"><strong>${t("similarTo")} ${escape(label(f))}</strong><br /><span class="meta">${escape(f.g.join(" · "))}</span></div>`;
  } else {
    $("[data-picked]").innerHTML = `<div class="picked"><strong>${t("resultsFor")} “${escape(current.text)}”</strong></div>`;
  }
  $("[data-results]").innerHTML = results.length ? results.map(card).join("") : `<p class="note">${t("noResults")}</p>`;
}

function pick(title) {
  const index = byTitle.get(title.trim().toLowerCase());
  if (index === undefined) {
    $("[data-status]").textContent = t("notFound");
    return;
  }
  current = { type: "film", index };
  $("[data-pick]").value = label(films[index]);
  render();
  track("demo-filmes-recomendar", "Demo filmes: recomendou por filme");
}

function search(text) {
  if (!text.trim()) return;
  current = { type: "search", text: text.trim() };
  $("[data-search]").value = current.text;
  render();
  track("demo-filmes-buscar", "Demo filmes: buscou por descrição");
}

async function init() {
  Demo.setup(T, () => {
    showReady();
    renderChips();
    render();
  });
  $("[data-status]").textContent = t("loading");
  try {
    films = await (await fetch("filmes.json")).json();
  } catch {
    $("[data-status]").textContent = t("error");
    return;
  }
  const t0 = performance.now();
  engine = TfIdf.build(films.map(docText));
  indexMs = Math.round(performance.now() - t0);
  films.forEach((f, i) => {
    byTitle.set(label(f).toLowerCase(), i);
    if (!byTitle.has(f.t.toLowerCase())) byTitle.set(f.t.toLowerCase(), i);
  });
  $("#titles").innerHTML = films.map((f) => `<option value="${escape(label(f))}"></option>`).join("");

  showReady();
  renderChips();

  $("[data-pick-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    pick($("[data-pick]").value);
  });
  $("[data-search-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    search($("[data-search]").value);
  });
  document.addEventListener("click", (event) => {
    const example = event.target.closest("[data-example]");
    const query = event.target.closest("[data-query]");
    const more = event.target.closest("[data-more]");
    if (example) pick(example.dataset.example);
    if (query) search(query.dataset.query);
    if (more) {
      current = { type: "film", index: Number(more.dataset.more) };
      $("[data-pick]").value = label(films[current.index]);
      render();
      $("[data-picked]").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  pick("The Matrix");
}

function showReady() {
  if (!engine) return;
  const n = films.length.toLocaleString(Demo.locale());
  const v = engine.vocabulary.toLocaleString(Demo.locale());
  $("[data-status]").textContent = t("ready", { n, v, ms: indexMs });
}

function renderChips() {
  $("[data-examples]").innerHTML = EXAMPLES.map((e) => `<button class="chip" type="button" data-example="${escape(e)}">${escape(e)}</button>`).join("");
  $("[data-queries]").innerHTML = QUERIES.map((q) => `<button class="chip" type="button" data-query="${escape(q)}">${escape(q)}</button>`).join("");
}

init();
