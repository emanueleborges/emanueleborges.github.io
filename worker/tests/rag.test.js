import test from "node:test";
import assert from "node:assert/strict";
import { TOP_K, buscaLexical, combinarTrechos } from "../src/rag.js";

const match = (id, score) => ({ id, score, metadata: { title: id, text: `texto de ${id}` } });
const ids = (trechos) => trechos.map((trecho) => trecho.id);

test("exact-word search finds the chunks that name a technology or employer", () => {
  const kafka = ids(buscaLexical("qual a experiência com kafka"));
  assert.ok(kafka.includes("skills-devops"));
  assert.ok(kafka.includes("p5"));
  assert.ok(ids(buscaLexical("what was his role at icct")).includes("job2"));
});

test("exact-word search ignores accents and words common to many chunks", () => {
  assert.deepEqual(buscaLexical("com the and"), []);
  assert.deepEqual(buscaLexical("palavra inexistente rust"), []);
  assert.ok(ids(buscaLexical("Prefeitura de MANAUS sémef")).includes("job3"));
});

test("chunks far below the best vector score are dropped", () => {
  const trechos = combinarTrechos([match("a", 0.7), match("b", 0.56), match("c", 0.5)], []);
  assert.deepEqual(ids(trechos), ["a", "b"]);
});

test("an exact-word chunk joins the context even when the vector search missed it", () => {
  const lexical = { id: "p5", title: "Financial Hub", text: "Kafka" };
  const trechos = combinarTrechos([match("a", 0.5), match("b", 0.49)], [lexical]);
  assert.ok(ids(trechos).includes("p5"));
});

test("a chunk found by both searches ranks first, and the context has at most TOP_K chunks", () => {
  const vetor = ["a", "b", "c", "d", "e", "f", "g", "h"].map((id, i) => match(id, 0.5 - i / 100));
  const trechos = combinarTrechos(vetor, [{ id: "c", title: "c", text: "texto de c" }]);
  assert.equal(trechos.length, TOP_K);
  assert.equal(trechos[0].id, "c");
});

test("matches without text are ignored", () => {
  assert.deepEqual(combinarTrechos([{ id: "x", score: 0.9, metadata: {} }], []), []);
});
