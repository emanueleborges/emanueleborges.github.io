// POST /click → clique em um link do site (LinkedIn, GitHub, currículo…), somente após consentimento;
//               salva só o total diário por alvo, sem IP, página, idioma ou identificadores.
import { isHuman, json, rateLimited } from "../comum.js";

// Alvos fixos do site; projetos usam "code:<repositório>" ou "demo:<demo>".
export const CLICK_TARGETS = new Set([
  "nav-contact",
  "hero-projects",
  "hero-contact",
  "hero-cv",
  "hero-chat",
  "chat-image",
  "projects-github",
  "contact-email",
  "contact-cv",
  "contact-whatsapp",
  "contact-github",
  "contact-linkedin",
]);
const PROJECT_TARGET = /^(code|demo):[a-z0-9._-]{1,50}$/;

export const isClickTarget = (target) => typeof target === "string" && (CLICK_TARGETS.has(target) || PROJECT_TARGET.test(target));

export async function handleClick(payload, ip, env, origin) {
  const limited = await rateLimited(env.CLICK_LIMITER, ip, origin);
  if (limited) return limited;

  const target = payload?.target;
  if (!isClickTarget(target)) return json({ error: "invalid_fields" }, 400, origin);

  try {
    await env.DB.prepare(
      "INSERT INTO click_daily (target, total) VALUES (?, 1) ON CONFLICT (click_date, target) DO UPDATE SET total = total + 1",
    )
      .bind(target)
      .run();
    return json({ ok: true }, 200, origin);
  } catch (error) {
    console.error("Erro ao salvar clique:", error?.message ?? error);
    return json({ error: "unavailable" }, 503, origin);
  }
}
