import test from "node:test";
import assert from "node:assert/strict";
import { handleChat } from "../src/rotas/chat.js";
import { aiState } from "../src/comum.js";
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

const ask = (env) => handleChat({ question: "Qual a experiência com Kafka?", lang: "pt", turnstileToken: "token" }, "1.2.3.4", env, ORIGIN);

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
