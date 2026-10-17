import test from "node:test";
import assert from "node:assert/strict";
import { DAILY_IMAGE_LIMIT, GUARD_MODEL, IMAGE_MODEL, PER_VISITOR_LIMIT, handleImage, isSafeVerdict, visitorKey } from "../src/rotas/imagem.js";

const ORIGIN = "https://emanueleborges.github.io";

// D1 de mentira: guarda a cota por visitante em memória e conta o total global.
function setup({ limited = false, human = true, verdict = { response: "safe" }, global = 1, image = "aGVsbG8=", imageError = null, quota = new Map() } = {}) {
  const calls = [];
  const env = {
    TURNSTILE_SECRET: "test-secret",
    IMAGE_LIMITER: { async limit() { return { success: !limited }; } },
    AI: {
      async run(model, input) {
        calls.push({ model, input });
        if (model === GUARD_MODEL) return verdict;
        if (imageError) throw new Error(imageError);
        return { image };
      },
    },
    DB: {
      prepare(sql) {
        calls.push({ sql });
        let args = [];
        const statement = {
          bind(...values) {
            args = values;
            return statement;
          },
          async first() {
            if (sql.includes("image_visitor_daily")) {
              const key = args.join("|");
              quota.set(key, (quota.get(key) ?? 0) + 1);
              return { total: quota.get(key) };
            }
            return { total: global };
          },
          async run() {
            const key = args.join("|");
            if (sql.startsWith("UPDATE") && quota.get(key) > 0) quota.set(key, quota.get(key) - 1);
          },
        };
        return statement;
      },
    },
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ success: human }), { headers: { "Content-Type": "application/json" } });
  return { env, calls, quota, restore: () => (globalThis.fetch = originalFetch) };
}

const run = async (payload, options, ip = "1.2.3.4") => {
  const ctx = setup(options);
  try {
    const response = await handleImage({ turnstileToken: "token", ...payload }, ip, ctx.env, ORIGIN);
    return { ...ctx, status: response.status, body: await response.json() };
  } finally {
    ctx.restore();
  }
};

test("generates an image after moderation and reports the visitor's remaining quota", async () => {
  const { status, body, calls } = await run({ prompt: "a lighthouse in the Amazon at sunset" });
  assert.equal(status, 200);
  assert.equal(body.image, "aGVsbG8=");
  assert.equal(body.remaining, PER_VISITOR_LIMIT - 1);
  assert.deepEqual(calls.filter((c) => c.model).map((c) => c.model), [GUARD_MODEL, IMAGE_MODEL]);
  // O FLUX.1 [schnell] do Workers AI recusa campos fora do schema (ex.: seed).
  assert.deepEqual(calls.find((c) => c.model === IMAGE_MODEL).input, { prompt: "a lighthouse in the Amazon at sunset", steps: 4 });
});

test("allows 2 images per visitor per day, then refuses without spending AI", async () => {
  const quota = new Map();
  const results = [];
  for (let i = 0; i < 3; i++) results.push(await run({ prompt: "a cat" }, { quota }));
  assert.deepEqual(results.map((r) => r.status), [200, 200, 429]);
  assert.deepEqual(results.map((r) => r.body.remaining), [1, 0, 0]);
  assert.equal(results[2].body.error, "visitor_limit");
  assert.equal(results[2].calls.some((c) => c.model), false);
  // Outro visitante continua com a cota cheia.
  assert.equal((await run({ prompt: "a cat" }, { quota }, "5.6.7.8")).status, 200);
});

test("gives the attempt back when the failure is on the server side", async () => {
  const quota = new Map();
  assert.equal((await run({ prompt: "a cat" }, { quota, imageError: "boom" })).status, 503);
  assert.equal((await run({ prompt: "a cat" }, { quota, global: DAILY_IMAGE_LIMIT + 1 })).status, 429);
  assert.deepEqual([...quota.values()], [0]);
});

test("a prompt refused by moderation counts as an attempt", async () => {
  const quota = new Map();
  const { status, body, calls } = await run({ prompt: "something harmful" }, { quota, verdict: { response: "unsafe\nS1" } });
  assert.equal(status, 422);
  assert.equal(body.remaining, 1);
  assert.equal(calls.some((c) => c.model === IMAGE_MODEL), false);
});

test("stores a daily HMAC of the IP, never the IP itself", async () => {
  const { calls } = await run({ prompt: "a cat" });
  assert.equal(JSON.stringify(calls).includes("1.2.3.4"), false);
  const a = await visitorKey("1.2.3.4", "2026-10-17", "s");
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(a, await visitorKey("1.2.3.4", "2026-10-17", "s"));
  assert.notEqual(a, await visitorKey("1.2.3.4", "2026-10-18", "s"));
  assert.notEqual(a, await visitorKey("1.2.3.4", "2026-10-17", "other"));
});

test("rejects short or long prompts before spending AI quota", async () => {
  for (const prompt of ["ab", "x".repeat(301), 42]) {
    const { status, calls } = await run({ prompt });
    assert.equal(status, 400);
    assert.equal(calls.length, 0);
  }
});

test("requires Turnstile and respects the per-minute limit", async () => {
  assert.equal((await run({ prompt: "a cat" }, { human: false })).status, 403);
  assert.equal((await run({ prompt: "a cat" }, { limited: true })).status, 429);
});

test("blocks explicit terms locally in several languages without touching the quota", async () => {
  for (const prompt of ["a naked person", "mulher pelada", "голая девушка", "裸体的女人", "NSFW art"]) {
    const { status, calls } = await run({ prompt });
    assert.equal(status, 422, prompt);
    assert.equal(calls.length, 0, prompt);
  }
  // Palavras que só contêm um termo bloqueado não são barradas.
  assert.equal((await run({ prompt: "a nuclear power plant" })).status, 200);
});

test("reads Llama Guard verdicts conservatively", () => {
  assert.equal(isSafeVerdict({ response: "safe" }), true);
  assert.equal(isSafeVerdict({ response: { safe: true, categories: [] } }), true);
  assert.equal(isSafeVerdict({ response: "unsafe\nS10" }), false);
  assert.equal(isSafeVerdict({ response: { safe: false } }), false);
  assert.equal(isSafeVerdict({}), false);
  assert.equal(isSafeVerdict(null), false);
});
