// Escolha dos trechos do perfil para o RAG: busca vetorial (sentido) + palavras exatas (nomes como
// "Kafka" ou "ICCT", que o vetor sozinho deixa escapar), combinadas por posição no ranking.
import { CHUNKS } from "./conhecimento.js";

export const TOP_K = 6;
export const CANDIDATOS = 12;
// Trechos com similaridade muito abaixo do melhor resultado da pergunta são descartados.
const MARGEM = 0.15;
const LIMITE_LEXICAL = 3;
// Palavra presente em mais de 1/4 dos trechos não distingue nada ("com" de github.com, "the"…).
const FRACAO_MAXIMA = 0.25;
const RRF = 60;
// Palavras gramaticais do inglês (idioma dos trechos) que aparecem em poucos trechos por acaso.
const COMUNS = new Set("about all also and any are can did does for from had has have her his how its not that the then this was were what when where which who why will with you your".split(" "));

const palavras = (texto) => new Set(
  (texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []).filter((palavra) => !COMUNS.has(palavra)),
);

// Texto atual de cada trecho (o do deploy); o Vectorize só é reindexado no fim do `npm run deploy`.
const porId = new Map(CHUNKS.map((trecho) => [trecho.id, trecho]));

const indice = CHUNKS.map((trecho) => ({ trecho, titulo: palavras(trecho.title), termos: palavras(`${trecho.title} ${trecho.text}`) }));
const frequencia = new Map();
indice.forEach(({ termos }) => termos.forEach((termo) => frequencia.set(termo, (frequencia.get(termo) ?? 0) + 1)));

// Palavras da pergunta que existem no perfil e distinguem poucos trechos.
export const termosRaros = (pergunta) => [...palavras(pergunta)].filter((termo) => {
  const vezes = frequencia.get(termo);
  return vezes && vezes / indice.length <= FRACAO_MAXIMA;
});

const temTermo = (id, termos) => {
  const doTrecho = indice.find(({ trecho }) => trecho.id === id)?.termos;
  return Boolean(doTrecho && termos.some((termo) => doTrecho.has(termo)));
};

// Trechos que contêm as palavras raras da pergunta, das mais às menos distintivas; no título, valem o dobro.
export function buscaLexical(pergunta) {
  const termos = termosRaros(pergunta);
  return indice
    .map(({ trecho, titulo, termos: doTrecho }) => ({
      trecho,
      nota: termos.reduce((soma, termo) => {
        if (!doTrecho.has(termo)) return soma;
        return soma + Math.log(indice.length / frequencia.get(termo)) * (titulo.has(termo) ? 2 : 1);
      }, 0),
    }))
    .filter(({ nota }) => nota > 0)
    .sort((a, b) => b.nota - a.nota)
    .slice(0, LIMITE_LEXICAL)
    .map(({ trecho }) => trecho);
}

// Reciprocal Rank Fusion dos dois rankings; devolve no máximo TOP_K trechos { id, title, text }.
// Quando a pergunta cita um termo raro do perfil (ex.: "Kafka"), os trechos que só "parecem" com ela
// ficam de fora — exceto o melhor do vetor —, para o modelo não atribuir o termo ao trecho vizinho.
export function combinarTrechos(matches, lexicais, termos = []) {
  const restringir = lexicais.length > 0 && termos.length > 0;
  const validos = matches.filter((match, posicao) => match.metadata?.text && (!restringir || posicao === 0 || temTermo(match.id, termos)));
  const piso = (validos[0]?.score ?? 0) - MARGEM;
  const notas = new Map();
  const somar = (trecho, posicao) => {
    const atual = notas.get(trecho.id) ?? { trecho, nota: 0 };
    atual.nota += 1 / (RRF + posicao);
    notas.set(trecho.id, atual);
  };
  validos
    .filter((match) => match.score >= piso)
    .forEach((match, posicao) => somar(porId.get(match.id) ?? { id: match.id, title: match.metadata.title, text: match.metadata.text }, posicao + 1));
  lexicais.forEach((trecho, posicao) => somar(trecho, posicao + 1));
  return [...notas.values()]
    .sort((a, b) => b.nota - a.nota)
    .slice(0, TOP_K)
    .map(({ trecho }) => trecho);
}
