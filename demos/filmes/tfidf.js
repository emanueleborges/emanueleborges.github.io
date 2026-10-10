// TF-IDF + similaridade de cosseno em JavaScript puro (mesma fórmula do TfidfVectorizer do
// scikit-learn: tf bruto × idf suavizado = ln((1 + n) / (1 + df)) + 1, vetores normalizados L2).
(function (root) {
  const STOPWORDS = new Set((
    "a about above after again against all also am an and any are as at be because been before being below between both but by " +
    "can could did do does doing down during each few for from further had has have having he her here hers herself him himself his " +
    "how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out " +
    "over own same she should so some such than that the their theirs them themselves then there these they this those through to too " +
    "under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves " +
    "one two three first second new later many much well however although including several since though became become becomes " +
    // Palavras de "ficha técnica" que aparecem em quase toda introdução da Wikipédia.
    "film films movie movies directed director written writer screenplay produced producer production starring stars star stared " +
    "released release grossed gross box office million billion worldwide budget received reviews critics critical acclaim praised " +
    "award awards academy nominated nominations nomination won winning best picture year years american british based story " +
    "series sequel cast role roles performance performances considered greatest time times highest also"
  ).split(/\s+/));

  const tokenize = (text) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .split(/[^a-z]+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  function build(texts) {
    const n = texts.length;
    const counts = texts.map((text) => {
      const tf = new Map();
      for (const w of tokenize(text)) tf.set(w, (tf.get(w) ?? 0) + 1);
      return tf;
    });
    const df = new Map();
    for (const tf of counts) for (const w of tf.keys()) df.set(w, (df.get(w) ?? 0) + 1);
    const idf = new Map([...df].map(([w, d]) => [w, Math.log((1 + n) / (1 + d)) + 1]));

    const vectorize = (tf) => {
      const vec = new Map();
      let norm = 0;
      for (const [w, c] of tf) {
        if (!idf.has(w)) continue;
        const v = c * idf.get(w);
        vec.set(w, v);
        norm += v * v;
      }
      norm = Math.sqrt(norm) || 1;
      for (const [w, v] of vec) vec.set(w, v / norm);
      return vec;
    };
    const vectors = counts.map(vectorize);

    // Cosseno entre vetores normalizados = produto escalar; guarda os termos que mais contribuíram.
    const rank = (query, k, skip = -1) => {
      const scores = [];
      vectors.forEach((vec, i) => {
        if (i === skip) return;
        let score = 0;
        const [small, big] = query.size < vec.size ? [query, vec] : [vec, query];
        for (const [w, v] of small) if (big.has(w)) score += v * big.get(w);
        if (score > 0) scores.push({ index: i, score });
      });
      scores.sort((a, b) => b.score - a.score);
      return scores.slice(0, k).map((r) => ({
        ...r,
        terms: [...query]
          .filter(([w]) => vectors[r.index].has(w))
          .map(([w, v]) => [w, v * vectors[r.index].get(w)])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([w]) => w),
      }));
    };

    return {
      size: n,
      vocabulary: idf.size,
      similarTo: (index, k = 8) => (vectors[index] ? rank(vectors[index], k, index) : []),
      search: (text, k = 8) => {
        const tf = new Map();
        for (const w of tokenize(text)) tf.set(w, (tf.get(w) ?? 0) + 1);
        return rank(vectorize(tf), k);
      },
    };
  }

  root.TfIdf = { build, tokenize };
})(typeof module !== "undefined" ? module.exports : window);
