// Assistente (4/5) — IA: perguntas ao Worker e avaliações 👍/👎 agregadas.
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

// Pergunta falada → texto: { text } ou { error: "no_speech" | "quota" | "unavailable" | … }.
const transcribe = async (audio, lang) => {
  const { ok, data } = await api.post("/transcribe", { audio, lang });
  return ok && data?.text ? { text: data.text } : { error: data?.error ?? "unavailable" };
};

// Registra apenas o total diário de avaliações positivas ou negativas.
const rate = async ({ rating }) => (await api.post("/feedback", { rating })).ok;

const prepare = () => (enabled ? api.loadTurnstile().catch(() => {}) : undefined);

export { enabled, ask, transcribe, rate, prepare };
