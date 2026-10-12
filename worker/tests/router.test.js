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
