import test from "node:test";
import assert from "node:assert/strict";
import { handleFeedback } from "../src/rotas/avaliacao.js";

function setup({ limited = false, human = true } = {}) {
  const calls = [];
  const env = {
    FEEDBACK_LIMITER: {
      async limit({ key }) {
        calls.push({ type: "limit", key });
        return { success: !limited };
      },
    },
    DB: {
      prepare(sql) {
        calls.push({ type: "prepare", sql });
        return {
          bind(...values) {
            calls.push({ type: "bind", values });
            return {
              async run() {
                calls.push({ type: "run" });
              },
            };
          },
        };
      },
    },
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) =>
    new Response(JSON.stringify({ success: human }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  return {
    calls,
    env,
    restoreFetch: () => {
      globalThis.fetch = originalFetch;
    },
  };
}

test("stores only a rating in the daily aggregate", async () => {
  const { calls, env, restoreFetch } = setup();
  try {
    const response = await handleFeedback({ rating: -1, turnstileToken: "valid" }, "192.0.2.4", env, "https://example.com");

    assert.equal(response.status, 200);
    assert.deepEqual(calls, [
      { type: "limit", key: "192.0.2.4" },
      {
        type: "prepare",
        sql: "INSERT INTO feedback_daily (rating, total) VALUES (?, 1) ON CONFLICT (feedback_date, rating) DO UPDATE SET total = total + 1",
      },
      { type: "bind", values: [-1] },
      { type: "run" },
    ]);
  } finally {
    restoreFetch();
  }
});

test("rejects invalid ratings without writing to D1", async () => {
  const { calls, env, restoreFetch } = setup();
  try {
    const response = await handleFeedback({ rating: 0, turnstileToken: "valid" }, "192.0.2.4", env, "https://example.com");

    assert.equal(response.status, 400);
    assert.equal(calls.some(({ type }) => type === "prepare"), false);
  } finally {
    restoreFetch();
  }
});

test("does not write to D1 when rate limited", async () => {
  const { calls, env, restoreFetch } = setup({ limited: true });
  try {
    const response = await handleFeedback({ rating: 1, turnstileToken: "valid" }, "192.0.2.4", env, "https://example.com");

    assert.equal(response.status, 429);
    assert.equal(calls.some(({ type }) => type === "prepare"), false);
  } finally {
    restoreFetch();
  }
});
