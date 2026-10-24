import test from "node:test";
import assert from "node:assert/strict";
import Worker from "../src/index.js";

test("removed contact route returns 404 without reading submitted fields", async () => {
  const request = new Request("https://worker.example/contact", {
    method: "POST",
    headers: {
      Origin: "https://emanueleborges.github.io",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "Visitor", email: "visitor@example.com", message: "Contact text" }),
  });

  const response = await Worker.fetch(request, { ALLOWED_ORIGIN: "https://emanueleborges.github.io" }, {});

  assert.equal(response.status, 404);
  assert.equal(request.bodyUsed, false);
});

test("status route reports the Cloudflare data center, chat model and AI state only to the site", async () => {
  const env = { ALLOWED_ORIGIN: "https://emanueleborges.github.io" };
  const request = new Request("https://worker.example/status", { headers: { Origin: env.ALLOWED_ORIGIN } });
  Object.defineProperty(request, "cf", { value: { colo: "GRU" } });

  const response = await Worker.fetch(request, env, {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { colo: "GRU", model: "qwen3-30b-a3b-fp8", ai: "online" });

  const foreign = await Worker.fetch(new Request("https://worker.example/status", { headers: { Origin: "https://evil.example" } }), env, {});
  assert.equal(foreign.status, 403);
});

test("every response becomes a technical metric (route, result, time) with no visitor data", async () => {
  const points = [];
  const env = { ALLOWED_ORIGIN: "https://emanueleborges.github.io", METRICAS: { writeDataPoint: (point) => points.push(point) } };
  const status = new Request("https://worker.example/status", { headers: { Origin: env.ALLOWED_ORIGIN } });
  await Worker.fetch(status, env, {});
  await Worker.fetch(new Request("https://worker.example/wp-admin?senha=1", { method: "POST", headers: { Origin: env.ALLOWED_ORIGIN } }), env, {});
  await Worker.fetch(new Request("https://worker.example/", { method: "POST", headers: { Origin: "https://evil.example" }, body: "{}" }), env, {});

  assert.deepEqual(points.map((p) => p.blobs), [["/status", "ok"], ["outra", "not_found"], ["/", "forbidden_origin"]]);
  for (const point of points) {
    assert.deepEqual(point.indexes, [point.blobs[0]]);
    assert.equal(point.doubles.length, 1);
  }
});
