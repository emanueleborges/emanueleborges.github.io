import test from "node:test";
import assert from "node:assert/strict";
import { handleChat, textoVisivel } from "../src/rotas/chat.js";
import { GATEWAY, aiState } from "../src/comum.js";
import Worker from "../src/index.js";

const ORIGIN = "https://exemplo.github.io";

// Turnstile aprovado e limite liberado; o Workers AI falha com a mensagem informada.
function setup(aiError) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true }));
  const env = {
    TURNSTILE_SECRET: "segredo",
    CHAT_LIMITER: { limit: async () => ({ success: true }) },
    AI: { run: async () => { throw new Error(aiError); } },
    VECTORIZE: { query: async () => ({ matches: [] }) },
  };
  return { env, restore: () => (globalThis.fetch = realFetch) };
}

const ask = (env, extra = {}) => handleChat({ question: "Qual a experiência com Kafka?", lang: "pt", turnstileToken: "token", ...extra }, "1.2.3.4", env, ORIGIN);

// SSE como o Workers AI devolve: cada evento pode vir partido em pedaços de rede.
const sse = (partes, { falhaNoFim = false } = {}) => {
  const texto = `${partes.map((content) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`).join("")}${falhaNoFim ? "" : "data: [DONE]\n\n"}`;
  const bytes = new TextEncoder().encode(texto);
  let i = 0;
  return new ReadableStream({
    pull(controle) {
      if (i < bytes.length) controle.enqueue(bytes.slice(i, (i += 7)));
      else if (falhaNoFim) controle.error(new Error("AiError: conexão perdida"));
      else controle.close();
    },
  });
};

// Turnstile aprovado e modelo que gera as partes indicadas; guarda opções e métricas para conferir.
function setupModelo(partes, opcoes) {
  const { env, restore } = setup("");
  const pontos = [];
  const chamadas = [];
  env.METRICAS = { writeDataPoint: (ponto) => pontos.push(ponto.blobs) };
  env.VECTORIZE = { query: async () => ({ matches: [{ id: "a", score: 0.6, metadata: { title: "Trecho A", text: "texto A" } }] }) };
  env.AI = {
    run: async (modelo, entrada, config) => {
      chamadas.push({ modelo, entrada, config });
      return entrada.stream ? sse(partes, opcoes) : { data: [[0.1, 0.2]] };
    },
  };
  return { env, restore, pontos, chamadas };
}

test("answers in parts when the site asks for it, without thinking or Markdown", async () => {
  const { env, restore } = setupModelo(["<think>\n\n</think>\n\n", "**Kafka", "** é ", "*", "*usado*", "*.\n\n", "# Fim"]);
  try {
    const response = await ask(env, { stream: true });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("Content-Type"), /^text\/plain/);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
    assert.equal(await response.text(), "Kafka é usado.\n\nFim");
  } finally {
    restore();
  }
});

test("without the stream flag the whole answer comes as JSON, for older pages", async () => {
  const { env, restore } = setupModelo(["Kafka ", "é usado."]);
  try {
    const response = await ask(env);
    assert.deepEqual(await response.json(), { answer: "Kafka é usado." });
  } finally {
    restore();
  }
});

test("a model that generates no visible text answers 502, so the site falls back to local search", async () => {
  const { env, restore } = setupModelo(["<think>\n\n</think>", "\n\n"]);
  try {
    const response = await ask(env, { stream: true });
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "empty_answer" });
  } finally {
    restore();
  }
});

test("a failure in the middle of the answer keeps what was sent and records a metric", async () => {
  const { env, restore, pontos } = setupModelo(["Kafka ", "é usado."], { falhaNoFim: true });
  try {
    const response = await ask(env, { stream: true });
    assert.equal(await response.text(), "Kafka é usado.");
    assert.ok(pontos.some(([rota, resultado]) => rota === "/" && resultado === "interrompida"));
  } finally {
    restore();
  }
});

test("AI Gateway never caches or logs the visitor's text", async () => {
  const { env, restore, chamadas } = setupModelo(["ok"]);
  try {
    await ask(env);
    assert.equal(chamadas.length, 2);
    for (const { config } of chamadas) assert.deepEqual(config.gateway, GATEWAY);
    assert.equal(GATEWAY.skipCache, true);
    assert.equal(GATEWAY.collectLog, false);
  } finally {
    restore();
  }
});

test("each step's time becomes a metric with no visitor text, and the context mixes both searches", async () => {
  const { env, restore, pontos, chamadas } = setupModelo(["ok"]);
  try {
    await ask(env);
    const etapas = pontos.filter(([rota]) => rota === "/chat/etapa").map(([, etapa]) => etapa);
    assert.deepEqual(etapas, ["turnstile", "embedding", "vectorize", "llm_primeiro_texto", "llm_total"]);
    assert.ok(!JSON.stringify(pontos).includes("Kafka"));
    const sistema = chamadas[1].entrada.messages[0].content;
    assert.match(sistema, /## Trecho A/);
    assert.match(sistema, /## Skills: DevOps/);
  } finally {
    restore();
  }
});

test("textoVisivel holds back what may still become markup", () => {
  assert.equal(textoVisivel("olá *"), "olá");
  assert.equal(textoVisivel("olá **"), "olá");
  assert.equal(textoVisivel("olá <thi"), "olá");
  assert.equal(textoVisivel("olá <think>raciocínio"), "olá");
  assert.equal(textoVisivel("olá *", true), "olá *");
  assert.equal(textoVisivel("3 * 4 < 5"), "3 * 4 < 5");
});

test("other Workers AI failures answer 503 unavailable, so the site falls back to local search", async () => {
  const { env, restore } = setup("AiError: 5007: model temporarily unavailable");
  try {
    const response = await ask(env);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "unavailable" });
    assert.equal(aiState(), "online");
  } finally {
    restore();
  }
});

test("daily quota (error 3036) answers 503 quota and /status reports it until 00:00 UTC", async () => {
  const { env, restore } = setup("AiError: 3036: Account limited: you have used up your daily free allocation of 10,000 neurons");
  try {
    const response = await ask(env);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "quota" });
    assert.equal(aiState(), "quota");

    const status = await Worker.fetch(new Request("https://worker.test/status", { headers: { Origin: ORIGIN } }), { ALLOWED_ORIGIN: ORIGIN }, {});
    assert.equal((await status.json()).ai, "quota");
  } finally {
    restore();
  }
});
