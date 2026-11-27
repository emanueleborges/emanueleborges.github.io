// Avaliação só da busca do RAG (`npm run avaliar:busca`): sem o LLM, mede se os trechos esperados chegam
// ao contexto. Usa o bge-m3 e o Vectorize reais via API (um lote de embeddings, ~1 neurônio no total),
// então pode rodar a cada mudança em src/rag.js. Perguntas: as de perguntas.json que têm "trechos"
// (as mesmas da avaliação completa) e as de busca.json (mais difíceis: espanhol, paráfrases, erros de
// digitação e perguntas que pedem mais de um trecho).
//
// Uso:  cd worker && npm run avaliar:busca [-- --vetor]
//       --vetor também mostra a busca só vetorial (top TOP_K), para comparar com a combinação atual.
//
// Métricas: recall = trechos esperados que entraram no contexto; completas = perguntas com todos os
// esperados; MRR = 1 / posição do primeiro trecho esperado (1,0 = sempre em primeiro).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contaCloudflare } from "../conta-cloudflare.mjs";
import { EMBEDDING_MODEL } from "../src/comum.js";
import { CHUNKS } from "../src/conhecimento.js";
import { CANDIDATOS, TOP_K, buscaLexical, combinarTrechos, termosRaros } from "../src/rag.js";

const DIR = dirname(fileURLToPath(import.meta.url));
const INDICE = JSON.parse(readFileSync(join(DIR, "..", "wrangler.jsonc"), "utf8").replace(/^\s*\/\/.*$/gm, "")).vectorize[0].index_name;
const ler = (arquivo) => JSON.parse(readFileSync(join(DIR, arquivo), "utf8")).filter(({ trechos }) => trechos?.length);
const conjuntos = [
  ["perguntas.json", ler("perguntas.json")],
  ["busca.json", ler("busca.json")],
];

const existentes = new Set(CHUNKS.map(({ id }) => id));
const invalidos = conjuntos.flatMap(([, perguntas]) => perguntas.flatMap(({ trechos }) => trechos)).filter((id) => !existentes.has(id));
if (invalidos.length) {
  console.error(`Trechos esperados que não existem em conhecimento.js: ${[...new Set(invalidos)].join(", ")}`);
  process.exit(1);
}

const { accountId, oauth, apiToken } = contaCloudflare();
const api = async (caminho, corpo) => {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}${caminho}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiToken || oauth}`, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const { success, result, errors } = await response.json();
  if (!success) throw new Error(`${caminho}: ${JSON.stringify(errors)}`);
  return result;
};

const todas = conjuntos.flatMap(([, perguntas]) => perguntas);
const { data: vetores } = await api(`/ai/run/${EMBEDDING_MODEL}`, { text: todas.map(({ q }) => q) });
const resultados = await Promise.all(
  vetores.map((vector) => api(`/vectorize/v2/indexes/${INDICE}/query`, { vector, topK: CANDIDATOS, returnMetadata: "all" })),
);
const candidatos = new Map(todas.map((pergunta, i) => [pergunta, resultados[i].matches ?? []]));

const estrategias = {
  atual: (pergunta, matches) => combinarTrechos(matches, buscaLexical(pergunta.q), termosRaros(pergunta.q)).map(({ id }) => id),
  ...(process.argv.includes("--vetor") && { vetor: (_pergunta, matches) => matches.slice(0, TOP_K).map(({ id }) => id) }),
};

const pct = (parte, total) => `${((parte / total) * 100).toFixed(1)}%`;
for (const [nome, recuperar] of Object.entries(estrategias)) {
  console.log(`\n== ${nome}${nome === "atual" ? " (vetor + palavras exatas, RRF)" : ` (só vetor, top ${TOP_K})`}`);
  for (const [arquivo, perguntas] of conjuntos) {
    let achados = 0;
    let esperados = 0;
    let completas = 0;
    let mrr = 0;
    let usados = 0;
    const faltas = [];
    for (const pergunta of perguntas) {
      const ids = recuperar(pergunta, candidatos.get(pergunta));
      const faltando = pergunta.trechos.filter((id) => !ids.includes(id));
      const primeiro = ids.findIndex((id) => pergunta.trechos.includes(id));
      achados += pergunta.trechos.length - faltando.length;
      esperados += pergunta.trechos.length;
      completas += faltando.length === 0;
      mrr += primeiro >= 0 ? 1 / (primeiro + 1) : 0;
      usados += ids.length;
      if (faltando.length) faltas.push(`   falta ${faltando.join(", ")} em [${pergunta.lang}] ${pergunta.q}  → ${ids.join(", ")}`);
    }
    console.log(
      `${arquivo.padEnd(15)} recall ${pct(achados, esperados).padStart(6)}  completas ${completas}/${perguntas.length}` +
        `  MRR ${(mrr / perguntas.length).toFixed(3)}  trechos médios ${(usados / perguntas.length).toFixed(1)}`,
    );
    faltas.forEach((falta) => console.log(falta));
  }
}
