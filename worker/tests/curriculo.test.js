import test from "node:test";
import assert from "node:assert/strict";
import { handleCv } from "../src/rotas/curriculo.js";
import { VERSION } from "../src/conhecimento.js";

const ORIGIN = "https://exemplo.github.io";

// D1 simulado com a tabela cv_pdf; limite por IP configurável.
function setup({ limited = false } = {}) {
  const rows = new Map();
  const env = {
    CV_LIMITER: { limit: async () => ({ success: !limited }) },
    DB: {
      prepare(sql) {
        return {
          bind: (...values) => ({
            first: async () => (sql.startsWith("SELECT") ? (rows.has(values.join("|")) ? { pdf: [...rows.get(values.join("|"))] } : null) : null),
            run: async () => rows.set(`${values[0]}|${values[1]}`, values[2]),
          }),
        };
      },
    },
  };
  return { env, rows };
}
const request = (lang) => new Request(`https://worker.test/cv?lang=${lang}`);
const fakePdf = (calls) => async (url) => {
  calls.push(url);
  return new TextEncoder().encode("%PDF-1.7 currículo");
};

test("renders the published résumé once per language and version, then serves it from D1", async () => {
  const { env, rows } = setup();
  const calls = [];
  const first = await handleCv(request("pt"), env, ORIGIN, fakePdf(calls));
  assert.equal(first.status, 200);
  assert.equal(first.headers.get("Content-Type"), "application/pdf");
  assert.match(first.headers.get("Content-Disposition"), /^attachment; filename="curriculo-[a-z-]+-pt\.pdf"$/);
  assert.deepEqual(calls, [`${ORIGIN}/curriculo.html?lang=pt`]);
  assert.ok(rows.has(`pt|${VERSION}`));

  const second = await handleCv(request("pt"), env, ORIGIN, fakePdf(calls));
  assert.equal(second.status, 200);
  assert.equal(new TextDecoder().decode(await second.arrayBuffer()), "%PDF-1.7 currículo");
  assert.equal(calls.length, 1); // não abriu o navegador de novo
});

test("falls back to the print version when the browser is unavailable or the IP is rate limited", async () => {
  const failing = async () => {
    throw new Error("429 Browser time limit exceeded for today");
  };
  const down = await handleCv(request("de"), setup().env, ORIGIN, failing);
  assert.equal(down.status, 302);
  assert.equal(down.headers.get("Location"), `${ORIGIN}/curriculo.html?lang=de&pdf=1`);

  const limited = await handleCv(request("de"), setup({ limited: true }).env, ORIGIN, fakePdf([]));
  assert.equal(limited.status, 302);
});

test("unknown languages get the English résumé", async () => {
  const calls = [];
  await handleCv(request("xx"), setup().env, ORIGIN, fakePdf(calls));
  assert.deepEqual(calls, [`${ORIGIN}/curriculo.html?lang=en`]);
});
