// Assistente (4/4) — IA: perguntas ao Worker e avaliações 👍/👎 agregadas.
// Em qualquer falha devolve null/false, e a interface segue com a busca local.

import { PortfolioApi as api } from "../api.js";

// IA ligada quando o Worker está configurado em api.js (sem ele, só busca local).
const enabled = Boolean(api.enabled);

// { answer } ou { error }: "quota" (cota gratuita do dia esgotada) ou "unavailable" (qualquer outra falha).
const ask = async (question, lang) => {
  const { ok, data } = await api.post("/", { question, lang });
  const text = ok ? data?.answer : null;
  if (typeof text === "string" && text.trim()) return { answer: text.trim() };
  return { error: data?.error === "quota" ? "quota" : "unavailable" };
};

// Registra apenas o total diário de avaliações positivas ou negativas.
const rate = async ({ rating }) => (await api.post("/feedback", { rating })).ok;

const prepare = () => (enabled ? api.loadTurnstile().catch(() => {}) : undefined);

export { enabled, ask, rate, prepare };
