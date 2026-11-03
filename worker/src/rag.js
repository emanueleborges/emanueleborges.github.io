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

const palavras = (texto) => new Set(
  texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? [],
);

const indice = CHUNKS.map((trecho) => ({ trecho, titulo: palavras(trecho.title), termos: palavras(`${trecho.title} ${trecho.text}`) }));
const frequencia = new Map();
indice.forEach(({ termos }) => termos.forEach((termo) => frequencia.set(termo, (frequencia.get(termo) ?? 0) + 1)));

// Trechos que contêm as palavras raras da pergunta, das mais às menos distintivas; no título, valem o dobro.
export function buscaLexical(pergunta) {
  const termos = [...palavras(pergunta)].filter((termo) => {
    const vezes = frequencia.get(termo);
    return vezes && vezes / indice.length <= FRACAO_MAXIMA;
  });
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
export function combinarTrechos(matches, lexicais) {
  const validos = matches.filter((match) => match.metadata?.text);
  const piso = (validos[0]?.score ?? 0) - MARGEM;
  const notas = new Map();
  const somar = (trecho, posicao) => {
    const atual = notas.get(trecho.id) ?? { trecho, nota: 0 };
    atual.nota += 1 / (RRF + posicao);
    notas.set(trecho.id, atual);
  };
  validos
    .filter((match) => match.score >= piso)
    .forEach((match, posicao) => somar({ id: match.id, title: match.metadata.title, text: match.metadata.text }, posicao + 1));
  lexicais.forEach((trecho, posicao) => somar(trecho, posicao + 1));
  return [...notas.values()]
    .sort((a, b) => b.nota - a.nota)
    .slice(0, TOP_K)
    .map(({ trecho }) => trecho);
}
