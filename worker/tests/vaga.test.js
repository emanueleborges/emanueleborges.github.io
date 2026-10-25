import test from "node:test";
import assert from "node:assert/strict";
import { buildMatch, relevantProfileChunks } from "../src/rotas/vaga.js";

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

test("grading context contains only excerpts relevant to the extracted requirements", () => {
  const excerpts = relevantProfileChunks([
    { requirement: "Python", importance: "must" },
    { requirement: "remote work from Manaus", importance: "nice" },
    { requirement: "postgraduate in Natural Language Processing", importance: "must" },
  ]);
  const ids = excerpts.map(({ id }) => id);

  assert.ok(ids.includes("skills-backend"));
  assert.ok(ids.includes("availability") || ids.includes("seeking"));
  assert.ok(ids.includes("edu1"));
  assert.ok(excerpts.length < 32);
  assert.ok(!ids.includes("contact"));
});

test("spoken-language requirements in any site language get the languages excerpt", () => {
  for (const requirement of ["Inglês fluente", "Fluent English", "Inglés avanzado", "Englisch fließend", "英语流利", "Свободный английский"]) {
    assert.deepEqual(relevantProfileChunks([{ requirement, importance: "must" }]).map(({ id }) => id), ["languages"], requirement);
  }
});

test("work-model requirements in any language get the availability excerpt", () => {
  for (const requirement of ["Remota", "Trabalho 100% remoto", "Fully remote", "Teletrabajo", "Híbrido", "Contratação PJ", "远程工作", "Удалённая работа"]) {
    assert.deepEqual(relevantProfileChunks([{ requirement, importance: "must" }]).map(({ id }) => id), ["availability"], requirement);
  }
});

test("unrelated requirements do not send the full profile to the grading model", () => {
  assert.deepEqual(relevantProfileChunks([{ requirement: "work on Mars", importance: "must" }]), []);
});
