import test from "node:test";
import assert from "node:assert/strict";
import { PortfolioApi } from "../../api.js";
import { handleClick, handleScore, isClickTarget } from "../src/rotas/metricas.js";

function setup({ limited = false, human = true } = {}) {
  const calls = [];
  const limiter = {
    async limit({ key }) {
      calls.push({ type: "limit", key });
      return { success: !limited };
    },
  };
  const env = {
    FEEDBACK_LIMITER: limiter,
    CLICK_LIMITER: limiter,
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
  globalThis.fetch = async () =>
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

test("stores only the score in the daily aggregate", async () => {
  const { calls, env, restoreFetch } = setup();
  try {
    const response = await handleScore({ score: 73, turnstileToken: "valid" }, "192.0.2.4", env, "https://example.com");

    assert.equal(response.status, 200);
    assert.deepEqual(calls, [
      { type: "limit", key: "192.0.2.4" },
      {
        type: "prepare",
        sql: "INSERT INTO score_daily (score, total) VALUES (?, 1) ON CONFLICT (score_date, score) DO UPDATE SET total = total + 1",
      },
      { type: "bind", values: [73] },
      { type: "run" },
    ]);
  } finally {
    restoreFetch();
  }
});

test("accepts both ends of the score bar", async () => {
  for (const score of [0, 100]) {
    const { env, restoreFetch } = setup();
    try {
      const response = await handleScore({ score, turnstileToken: "valid" }, "192.0.2.4", env, "https://example.com");
      assert.equal(response.status, 200);
    } finally {
      restoreFetch();
    }
  }
});

test("rejects scores outside 0–100 or not integers without writing to D1", async () => {
  for (const score of [-1, 101, 50.5, "50", null]) {
    const { calls, env, restoreFetch } = setup();
    try {
      const response = await handleScore({ score, turnstileToken: "valid" }, "192.0.2.4", env, "https://example.com");
      assert.equal(response.status, 400, String(score));
      assert.equal(calls.some(({ type }) => type === "prepare"), false);
    } finally {
      restoreFetch();
    }
  }
});

test("does not store a score when Turnstile fails", async () => {
  const { calls, env, restoreFetch } = setup({ human: false });
  try {
    const response = await handleScore({ score: 80, turnstileToken: "bad" }, "192.0.2.4", env, "https://example.com");
    assert.equal(response.status, 403);
    assert.equal(calls.some(({ type }) => type === "prepare"), false);
  } finally {
    restoreFetch();
  }
});

test("stores only the link target in the daily click aggregate", async () => {
  const { calls, env, restoreFetch } = setup();
  try {
    const response = await handleClick({ target: "contact-linkedin" }, "192.0.2.4", env, "https://example.com");

    assert.equal(response.status, 200);
    assert.deepEqual(calls, [
      { type: "limit", key: "192.0.2.4" },
      {
        type: "prepare",
        sql: "INSERT INTO click_daily (target, total) VALUES (?, 1) ON CONFLICT (click_date, target) DO UPDATE SET total = total + 1",
      },
      { type: "bind", values: ["contact-linkedin"] },
      { type: "run" },
    ]);
  } finally {
    restoreFetch();
  }
});

test("accepts project targets and rejects unknown ones", () => {
  assert.equal(isClickTarget("code:nest_typeorm_postgres_redis_kafka"), true);
  assert.equal(isClickTarget("code:emanueleborges.github.io"), true);
  assert.equal(isClickTarget("demo:lstm"), true);
  assert.equal(isClickTarget("https://example.com"), false);
  assert.equal(isClickTarget("contact-LinkedIn"), false);
  assert.equal(isClickTarget(`code:${"a".repeat(51)}`), false);
  assert.equal(isClickTarget(42), false);
});

test("does not write a click when rate limited or the target is unknown", async () => {
  for (const [options, target, status] of [[{ limited: true }, "contact-github", 429], [{}, "<script>", 400]]) {
    const { calls, env, restoreFetch } = setup(options);
    try {
      const response = await handleClick({ target }, "192.0.2.4", env, "https://example.com");
      assert.equal(response.status, status);
      assert.equal(calls.some(({ type }) => type === "prepare"), false);
    } finally {
      restoreFetch();
    }
  }
});

test("client sends only the link target, without credentials or referrer", async () => {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (...args) => {
    captured = args;
    return new Response(null, { status: 204 });
  };

  try {
    await PortfolioApi.recordClick("contact-github");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(captured[0], "https://emanuel-portfolio-chat.emanuel-portfolio-chat.workers.dev/click");
  assert.deepEqual(captured[1], {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ target: "contact-github" }),
    credentials: "omit",
    referrerPolicy: "no-referrer",
    cache: "no-store",
    keepalive: true,
  });
});
