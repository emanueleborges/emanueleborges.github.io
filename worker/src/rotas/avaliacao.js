// POST /feedback — avaliação 👍/👎 de uma resposta da IA, salva no D1.
import { MAX_QUESTION_LENGTH, isHuman, json, languageOf, rateLimited } from "../comum.js";
import { clean } from "./contato.js";

export async function handleFeedback(payload, ip, env, origin) {
  const limited = await rateLimited(env.FEEDBACK_LIMITER, ip, origin);
  if (limited) return limited;

  const rating = payload?.rating === 1 || payload?.rating === -1 ? payload.rating : 0;
  const question = clean(payload?.question, MAX_QUESTION_LENGTH);
  const answer = clean(payload?.answer, 3000);
  const lang = languageOf(payload);
  if (!rating || !question || question.length > MAX_QUESTION_LENGTH || !answer || answer.length > 3000) {
    return json({ error: "invalid_fields" }, 400, origin);
  }
  if (!(await isHuman(payload?.turnstileToken, ip, env))) return json({ error: "turnstile_failed" }, 403, origin);

  try {
    await env.DB.prepare("INSERT INTO feedback (rating, lang, question, answer) VALUES (?, ?, ?, ?)")
      .bind(rating, lang, question, answer)
      .run();
    return json({ ok: true }, 200, origin);
  } catch (error) {
    console.error("Erro ao salvar avaliação:", error?.message ?? error);
    return json({ error: "unavailable" }, 503, origin);
  }
}
