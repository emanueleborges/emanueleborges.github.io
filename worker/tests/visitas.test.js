import test from "node:test";
import assert from "node:assert/strict";
import { PortfolioApi } from "../../api.js";
import { handleVisit } from "../src/rotas/visitas.js";

function setup({ continent = "SA", limited = false } = {}) {
  const calls = [];
  const env = {
    VISIT_LIMITER: {
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
  const request = {
    headers: new Headers({ "CF-Connecting-IP": "192.0.2.4" }),
    cf: { continent },
  };
  return { calls, env, request };
}

test("stores only the continent in a daily aggregate after consented request", async () => {
  const { calls, env, request } = setup();
  const response = await handleVisit(request, env, "https://emanueleborges.github.io");

  assert.equal(response.status, 200);
  assert.deepEqual(calls, [
    { type: "limit", key: "192.0.2.4" },
    {
      type: "prepare",
      sql: "INSERT INTO regional_visits (continent, total) VALUES (?, 1) ON CONFLICT (access_date, continent) DO UPDATE SET total = total + 1",
    },
    { type: "bind", values: ["SA"] },
    { type: "run" },
  ]);
});

test("does not store a visit when Cloudflare cannot provide a known continent", async () => {
  const { calls, env, request } = setup({ continent: null });
  const response = await handleVisit(request, env, "https://emanueleborges.github.io");

  assert.equal(response.status, 422);
  assert.equal(calls.some(({ type }) => type === "prepare"), false);
});

test("does not write to D1 when rate limited", async () => {
  const { calls, env, request } = setup({ limited: true });
  const response = await handleVisit(request, env, "https://emanueleborges.github.io");

  assert.equal(response.status, 429);
  assert.equal(calls.some(({ type }) => type === "prepare"), false);
});

test("client submits no URL, referrer, credentials, or body to the visit endpoint", async () => {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (...args) => {
    captured = args;
    return new Response(null, { status: 204 });
  };

  try {
    await PortfolioApi.recordVisit();
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(captured[0], "https://emanuel-portfolio-chat.emanuel-portfolio-chat.workers.dev/visit");
  assert.deepEqual(captured[1], {
    method: "POST",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    cache: "no-store",
  });
});
