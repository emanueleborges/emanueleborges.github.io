// Recomendação de filmes por conteúdo (TF-IDF + cosseno), calculada no navegador.
// Base: filmes.json (Wikidata + resumos da Wikipédia), gerada por scripts/gerar-dados-filmes.py.
import { Demo } from "../demos.js";
import { TfIdf } from "./tfidf.js";

const EXAMPLES = ["The Matrix", "Toy Story", "The Godfather", "Shrek", "Titanic", "Interstellar"];
const QUERIES = ["space adventure with robots", "mafia family crime", "haunted house horror", "superhero team"];

const T = {
  en: {
    "meta.title": "Movie Recommender with TF-IDF",
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
    "meta.title": "Recomendação de Filmes com TF-IDF",
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
    "meta.title": "Recomendación de Películas con TF-IDF",
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
};

const { t, escape } = Demo;
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
    <h2 class="movie-title">${escape(f.t)} <small>${f.y ?? ""}</small></h2>
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
}

function search(text) {
  if (!text.trim()) return;
  current = { type: "search", text: text.trim() };
  $("[data-search]").value = current.text;
  render();
}

async function init() {
  Demo.setup(T, () => {
    showReady();
    renderChips();
    render();
  });
  $("[data-status]").textContent = t("loading");
  renderChips(); // sugestões fixas: aparecem já, sem esperar a base (evita deslocar o layout)
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
