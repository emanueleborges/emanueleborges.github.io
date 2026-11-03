// Worker local da avaliação: chama o handleChat de verdade com IA e Vectorize reais, dispensando só o
// Turnstile e o limite por IP, e devolve resposta, trechos usados, tempos e tokens.
import { CHUNKS } from "../src/conhecimento.js";
import { handleChat } from "../src/rotas/chat.js";

const fetchOriginal = globalThis.fetch;
globalThis.fetch = (url, opcoes) =>
  (String(url).includes("challenges.cloudflare.com") ? Promise.resolve(new Response('{"success":true}')) : fetchOriginal(url, opcoes));

// Uso da resposta inteira: o último evento do streaming do modelo traz o total.
async function usoDoStream(stream) {
  let uso = null;
  let resto = "";
  const leitor = stream.pipeThrough(new TextDecoderStream()).getReader();
  for (;;) {
    const { value, done } = await leitor.read();
    if (done) return uso;
    const linhas = (resto + value).split("\n");
    resto = linhas.pop();
    for (const linha of linhas) {
      if (!linha.startsWith("data:") || linha.includes("[DONE]")) continue;
      const { usage } = JSON.parse(linha.slice(5));
      if (usage) uso = { entrada: usage.prompt_tokens, saida: usage.completion_tokens, neuronios: usage.neurons };
    }
  }
}

export default {
  async fetch(request, base) {
    const { q, lang } = await request.json();
    const etapas = {};
    let trechos = [];
    let uso = null;
    const env = {
      TURNSTILE_SECRET: "local",
      CHAT_LIMITER: { limit: async () => ({ success: true }) },
      METRICAS: { writeDataPoint: ({ blobs, doubles }) => { if (blobs[0] === "/chat/etapa") etapas[blobs[1]] = doubles[0]; } },
      VECTORIZE: base.VECTORIZE,
      AI: {
        run: async (modelo, entrada, opcoes) => {
          const resultado = await base.AI.run(modelo, entrada, opcoes);
          if (!entrada.stream) return resultado;
          const sistema = entrada.messages[0].content;
          trechos = CHUNKS.filter((trecho) => sistema.includes(`## ${trecho.title}\n`)).map((trecho) => trecho.id);
          const [modeloStream, copia] = resultado.tee();
          uso = usoDoStream(copia);
          return modeloStream;
        },
      },
    };

    const inicio = Date.now();
    const resposta = await handleChat({ question: q, lang, stream: true, turnstileToken: "local" }, "127.0.0.1", env, "http://local");
    const primeiro = Date.now() - inicio;
    const texto = await resposta.text();
    return Response.json({ status: resposta.status, primeiro, total: Date.now() - inicio, resposta: texto, trechos, etapas, uso: await uso });
  },
};
