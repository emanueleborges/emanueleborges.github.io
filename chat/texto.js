// Assistente (1/4) — texto: normalização, palavras e tolerância a erros de digitação.
// Funções puras, sem acesso à página (só ao perfil.js, para o nome); usadas pelas regras, pela busca e pela interface.

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
    "der die das den dem des und ist er sie es hat mit fur von zu ein eine einen einer was wie wo welche welcher welches auf im an auch nicht als bei oder aus wer kann kennt gibt hast schon " +
    // o nome da pessoa do portfólio (perfil.js) não ajuda a busca: está em toda parte
    normalize(globalThis.PERFIL.nomeCompleto)
  ).split(" "),
);

const isCjk = (char) => /[㐀-鿿]/.test(char);

// Palavras longas viram prefixos para casar variações (projeto/projetos, проекты/проектов).
const stem = (word) => (word.length >= 6 ? word.slice(0, word.length - 2) : word);

const wordsOf = (text) => normalize(text).match(/[\p{L}\p{N}+#.]+/gu) || [];

// As regras passam pela mesma normalização das perguntas (ex.: "й" → "и", sem acentos).
const fold = (pattern) => new RegExp(normalize(pattern.source), pattern.flags);

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

export { normalize, stopwords, isCjk, stem, wordsOf, fold, correctWord, matches };
