// POST /feedback — avaliação 👍/👎 de uma resposta da IA, salva no D1.
import { isHuman, json, rateLimited } from "../comum.js";

export async function handleFeedback(payload, ip, env, origin) {
  const limited = await rateLimited(env.FEEDBACK_LIMITER, ip, origin);
  if (limited) return limited;

  const rating = payload?.rating === 1 || payload?.rating === -1 ? payload.rating : 0;
  if (!rating) return json({ error: "invalid_fields" }, 400, origin);
  if (!(await isHuman(payload?.turnstileToken, ip, env))) return json({ error: "turnstile_failed" }, 403, origin);

  try {
    await env.DB.prepare(
      "INSERT INTO feedback_daily (rating, total) VALUES (?, 1) ON CONFLICT (feedback_date, rating) DO UPDATE SET total = total + 1",
    )
      .bind(rating)
      .run();
    return json({ ok: true }, 200, origin);
  } catch (error) {
    console.error("Erro ao salvar avaliação:", error?.message ?? error);
    return json({ error: "unavailable" }, 503, origin);
  }
}
