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

const normalizar = (texto) => texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const palavras = (texto) => new Set((normalizar(texto).match(/[\p{L}\p{N}]{3,}/gu) ?? []).filter((palavra) => !COMUNS.has(palavra)));

// Conceitos que visitantes descrevem com outras palavras (ou em pt/es) e os termos que os trechos usam.
// Conferido com `npm run avaliar:busca`: só entra sinônimo que uma pergunta da avaliação precisa.
const SINONIMOS = [
  [/\b(mensageria|mensajeria|messaging|message broker|filas?|colas?|queues?)\b/, "kafka rabbitmq messaging"],
  [/\bamazon\b/, "aws"],
  [/\b(visao computacional|vision (por )?(computadora|computacional|artificial)|computer vision)\b/, "face recognition webcam"],
];

// Texto atual de cada trecho (o do deploy); o Vectorize só é reindexado no fim do `npm run deploy`.
const porId = new Map(CHUNKS.map((trecho) => [trecho.id, trecho]));

const indice = CHUNKS.map((trecho) => ({ trecho, titulo: palavras(trecho.title), termos: palavras(`${trecho.title} ${trecho.text}`) }));
const frequencia = new Map();
indice.forEach(({ termos }) => termos.forEach((termo) => frequencia.set(termo, (frequencia.get(termo) ?? 0) + 1)));

// Distância de edição até 1 (troca, inclusão, exclusão ou inversão de duas letras vizinhas).
function quaseIgual(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i += 1;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  return a.length < b.length ? a.slice(i) === b.slice(i + 1) : a.slice(i + 1) === b.slice(i);
}

// Palavra digitada com erro ("kubernets", "postgress") vira a do perfil, quando só uma está a um erro dela.
// Palavras com menos de 7 letras ficam como estão: nelas, "um erro" costuma ser outra palavra em pt/es
// ("testes" → "tests", "modelo" → "model"), o que traz trechos errados para o contexto.
const MINIMO_CORRECAO = 7;
function corrigir(palavra) {
  if (frequencia.has(palavra) || palavra.length < MINIMO_CORRECAO) return palavra;
  const parecidas = [...frequencia.keys()].filter((termo) => quaseIgual(palavra, termo));
  return parecidas.length === 1 ? parecidas[0] : palavra;
}

// Palavras da pergunta, com erros de digitação corrigidos e os sinônimos do perfil acrescentados.
const palavrasDaPergunta = (pergunta) => {
  const texto = normalizar(pergunta);
  const extras = SINONIMOS.filter(([padrao]) => padrao.test(texto)).map(([, termos]) => termos);
  return new Set([...palavras(texto)].map(corrigir).concat(...extras.map((termos) => termos.split(" "))));
};

// Palavras da pergunta que existem no perfil e distinguem poucos trechos.
export const termosRaros = (pergunta) => [...palavrasDaPergunta(pergunta)].filter((termo) => {
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
