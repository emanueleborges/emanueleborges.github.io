// Avaliação do chat com IA real (`npm run avaliar`): latência, custo, trechos esperados e regressões de
// resposta. Gasta cota gratuita (~6 neurônios por pergunta), por isso roda à mão, antes do deploy, e não
// no CI. O Faithfulness precisa de leitura: compare cada resposta de resultado.json com os trechos usados.
//
// Uso:  cd worker && npm run avaliar [-- passadas [filtro]]    (sai com erro se alguma conferência falhar)
//       O filtro é uma expressão regular sobre o texto da pergunta, para repetir só as que interessam.

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const PORTA = 8799;
const URL_LOCAL = `http://127.0.0.1:${PORTA}`;
const DOLAR_POR_NEURONIO = 0.011 / 1000;
const COTA_DIARIA = 10000;
const passadas = Number(process.argv[2]) || 2;
const filtro = new RegExp(process.argv[3] ?? "", "i");
const perguntas = JSON.parse(readFileSync(join(DIR, "perguntas.json"), "utf8")).filter(({ q }) => filtro.test(q));

const servidor = spawn("npx", ["wrangler", "dev", "--config", join(DIR, "wrangler.jsonc"), "--port", String(PORTA)], {
  cwd: join(DIR, ".."),
  stdio: "ignore",
  detached: true,
});
const encerrar = () => {
  try {
    process.kill(-servidor.pid);
  } catch {
    // já encerrado
  }
};

const perguntar = async ({ q, lang }) => {
  const response = await fetch(URL_LOCAL, { method: "POST", body: JSON.stringify({ q, lang }) });
  if (!response.ok) throw new Error(`avaliação local respondeu ${response.status}: ${(await response.text()).slice(0, 200)}`);
  return response.json();
};

async function aguardarServidor() {
  for (let i = 0; i < 90; i += 1) {
    try {
      await fetch(URL_LOCAL, { method: "POST", body: '{"q":""}' });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("wrangler dev não respondeu; confira o login com `npx wrangler whoami`.");
}

const percentil = (valores, p) => [...valores].sort((a, b) => a - b)[Math.max(0, Math.ceil((p / 100) * valores.length) - 1)];
const media = (valores) => valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
const linhaTempo = (nome, valores) =>
  console.log(`${nome.padEnd(22)} média ${media(valores).toFixed(0).padStart(5)}  p50 ${String(percentil(valores, 50)).padStart(5)}  p95 ${String(percentil(valores, 95)).padStart(5)}`);

try {
  await aguardarServidor();
  const resultados = [];
  const falhas = [];
  for (let passada = 1; passada <= passadas; passada += 1) {
    for (const pergunta of perguntas) {
      const r = await perguntar(pergunta);
      resultados.push({ passada, ...pergunta, ...r });
      const faltando = (pergunta.trechos ?? []).filter((id) => !r.trechos.includes(id));
      if (r.status !== 200) falhas.push(`[${pergunta.q}] status ${r.status}`);
      if (faltando.length) falhas.push(`[${pergunta.q}] sem os trechos: ${faltando.join(", ")}`);
      if (pergunta.proibido && new RegExp(pergunta.proibido, "i").test(r.resposta)) falhas.push(`[${pergunta.q}] resposta proibida: ${r.resposta}`);
      if (pergunta.exige && !new RegExp(pergunta.exige, "i").test(r.resposta)) falhas.push(`[${pergunta.q}] faltou "${pergunta.exige}": ${r.resposta}`);
      process.stdout.write(".");
    }
  }
  console.log();
  writeFileSync(join(DIR, "resultado.json"), JSON.stringify(resultados, null, 1));

  const ok = resultados.filter((r) => r.status === 200);
  linhaTempo("até o primeiro texto", ok.map((r) => r.primeiro));
  linhaTempo("total", ok.map((r) => r.total));
  for (const etapa of ["embedding", "vectorize", "llm_primeiro_texto", "llm_total"]) linhaTempo(etapa, ok.map((r) => r.etapas[etapa]));

  const neuronios = media(ok.map((r) => r.uso.neuronios));
  console.log(`tokens médios          entrada ${media(ok.map((r) => r.uso.entrada)).toFixed(0)}  saída ${media(ok.map((r) => r.uso.saida)).toFixed(0)}`);
  console.log(`trechos médios         ${media(ok.map((r) => r.trechos.length)).toFixed(1)}`);
  console.log(`custo médio do Qwen3   ${neuronios.toFixed(2)} neurônios = US$ ${(neuronios * DOLAR_POR_NEURONIO).toFixed(7)} (${Math.floor(COTA_DIARIA / neuronios)} perguntas/dia na cota)`);
  console.log(`respostas em           ${join(DIR, "resultado.json")}`);

  if (falhas.length) {
    console.log(`\n${falhas.length} conferência(s) falharam:`);
    falhas.forEach((falha) => console.log(`- ${falha}`));
    process.exitCode = 1;
  } else {
    console.log("\nTodas as conferências passaram.");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  encerrar();
}
