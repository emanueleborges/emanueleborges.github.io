import test from "node:test";
import assert from "node:assert/strict";
import { DAILY_IMAGE_LIMIT, GUARD_MODEL, IMAGE_MODEL, handleImage, isSafeVerdict } from "../src/rotas/imagem.js";

const ORIGIN = "https://emanueleborges.github.io";

function setup({ limited = false, human = true, verdict = { response: "safe" }, total = 1, image = "aGVsbG8=" } = {}) {
  const calls = [];
  const env = {
    IMAGE_LIMITER: { async limit() { return { success: !limited }; } },
    AI: {
      async run(model, input) {
        calls.push({ model, input });
        return model === GUARD_MODEL ? verdict : { image };
      },
    },
    DB: {
      prepare(sql) {
        calls.push({ sql });
        return { async first() { return { total }; } };
      },
    },
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ success: human }), { headers: { "Content-Type": "application/json" } });
  return { env, calls, restore: () => (globalThis.fetch = originalFetch) };
}

const run = async (payload, options) => {
  const ctx = setup(options);
  try {
    const response = await handleImage({ turnstileToken: "token", ...payload }, "1.2.3.4", ctx.env, ORIGIN);
    return { ...ctx, status: response.status, body: await response.json() };
  } finally {
    ctx.restore();
  }
};

test("generates an image after moderation and counts it", async () => {
  const { status, body, calls } = await run({ prompt: "a lighthouse in the Amazon at sunset" });
  assert.equal(status, 200);
  assert.equal(body.image, "aGVsbG8=");
  assert.deepEqual(calls.filter((c) => c.model).map((c) => c.model), [GUARD_MODEL, IMAGE_MODEL]);
  assert.match(calls.find((c) => c.sql).sql, /image_daily/);
  // O FLUX.1 [schnell] do Workers AI recusa campos fora do schema (ex.: seed).
  assert.deepEqual(calls.find((c) => c.model === IMAGE_MODEL).input, { prompt: "a lighthouse in the Amazon at sunset", steps: 4 });
});

test("rejects short or long prompts before spending AI quota", async () => {
  for (const prompt of ["ab", "x".repeat(301), 42]) {
    const { status, calls } = await run({ prompt });
    assert.equal(status, 400);
    assert.equal(calls.length, 0);
  }
});

test("requires Turnstile and respects the per-IP limit", async () => {
  assert.equal((await run({ prompt: "a cat" }, { human: false })).status, 403);
  assert.equal((await run({ prompt: "a cat" }, { limited: true })).status, 429);
});

test("blocks explicit terms locally in several languages without calling the AI", async () => {
  for (const prompt of ["a naked person", "mulher pelada", "голая девушка", "裸体的女人", "NSFW art"]) {
    const { status, calls } = await run({ prompt });
    assert.equal(status, 422, prompt);
    assert.equal(calls.length, 0, prompt);
  }
  // Palavras que só contêm um termo bloqueado não são barradas.
  assert.equal((await run({ prompt: "a nuclear power plant" })).status, 200);
});

test("refuses when Llama Guard flags the prompt, without counting it", async () => {
  const { status, calls } = await run({ prompt: "something harmful" }, { verdict: { response: "unsafe\nS1" } });
  assert.equal(status, 422);
  assert.equal(calls.some((c) => c.sql), false);
  assert.equal(calls.some((c) => c.model === IMAGE_MODEL), false);
});

test("stops at the daily ceiling", async () => {
  const { status, body, calls } = await run({ prompt: "a cat" }, { total: DAILY_IMAGE_LIMIT + 1 });
  assert.equal(status, 429);
  assert.equal(body.error, "daily_limit");
  assert.equal(calls.some((c) => c.model === IMAGE_MODEL), false);
});

test("reads Llama Guard verdicts conservatively", () => {
  assert.equal(isSafeVerdict({ response: "safe" }), true);
  assert.equal(isSafeVerdict({ response: { safe: true, categories: [] } }), true);
  assert.equal(isSafeVerdict({ response: "unsafe\nS10" }), false);
  assert.equal(isSafeVerdict({ response: { safe: false } }), false);
  assert.equal(isSafeVerdict({}), false);
  assert.equal(isSafeVerdict(null), false);
});
