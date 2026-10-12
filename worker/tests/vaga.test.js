import test from "node:test";
import assert from "node:assert/strict";
import { buildMatch } from "../src/rotas/vaga.js";

const match = (requirements, grades) => buildMatch(
  { lang: "pt", role: "Desenvolvedor", requirements },
  { grades, pitch: "Resumo do perfil." },
);

test("Python listed in the profile cannot be marked as not found by the AI", () => {
  const result = match(
    [{ requirement: "Python para dados e machine learning", importance: "must" }],
    [{ index: 1, level: "none", evidence: [], reason: "Não encontrado." }],
  );

  assert.equal(result.requirements[0].requirement, "Python para dados e machine learning");
  assert.equal(result.requirements[0].level, "partial");
  assert.deepEqual(result.requirements[0].evidence, ["skills-backend"]);
  assert.match(result.requirements[0].reason, /habilidades do perfil/i);
  assert.equal(result.score, 50);
});

test("technology bundles are split so a listed skill cannot hide a missing one", () => {
  const result = match(
    [{ requirement: "Python, Go e PyTorch", importance: "must" }],
    [
      { index: 1, level: "strong", evidence: ["skills-backend"], reason: "Conhece Python." },
      { index: 2, level: "strong", evidence: ["skills-backend"], reason: "Conhece Go." },
      { index: 3, level: "strong", evidence: ["skills-ai"], reason: "Conhece PyTorch." },
    ],
  );

  assert.deepEqual(result.requirements.map(({ requirement, level }) => [requirement, level]), [
    ["Python", "partial"],
    ["Go", "none"],
    ["PyTorch", "none"],
  ]);
  assert.deepEqual(result.requirements[0].evidence, ["skills-backend"]);
  assert.equal(result.score, 17);
});

test("an unrelated AI citation cannot support a listed technology", () => {
  const result = match(
    [{ requirement: "Python", importance: "nice" }],
    [{ index: 1, level: "strong", evidence: ["job1"], reason: "Uses Python at INDT." }],
  );

  assert.equal(result.requirements[0].level, "partial");
  assert.deepEqual(result.requirements[0].evidence, ["skills-backend"]);
  assert.match(result.requirements[0].reason, /habilidades do perfil/i);
});

test("specific project evidence can support a strong React Native match", () => {
  const result = match(
    [{ requirement: "React Native", importance: "must" }],
    [{ index: 1, level: "strong", evidence: ["job1"], reason: "Builds React Native apps at INDT." }],
  );

  assert.equal(result.requirements.length, 1);
  assert.equal(result.requirements[0].level, "strong");
  assert.deepEqual(result.requirements[0].evidence, ["job1"]);
});
