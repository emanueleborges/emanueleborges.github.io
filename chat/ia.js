// Assistente (4/4) — IA: perguntas ao Worker e avaliações 👍/👎.
// Em qualquer falha devolve null/false, e a interface segue com a busca local.

import { PortfolioApi as api } from "../api.js";

// IA ligada quando o Worker está configurado em api.js (sem ele, só busca local).
const enabled = Boolean(api.enabled);

const ask = async (question, lang) => {
  const { ok, data } = await api.post("/", { question, lang });
  const text = ok ? data?.answer : null;
  return typeof text === "string" && text.trim() ? text.trim() : null;
};

// Salva a avaliação no D1 (só quando o visitante clica).
const rate = async ({ question, answer, rating, lang }) => (await api.post("/feedback", { question, answer, rating, lang })).ok;

const prepare = () => (enabled ? api.loadTurnstile().catch(() => {}) : undefined);

export { enabled, ask, rate, prepare };
