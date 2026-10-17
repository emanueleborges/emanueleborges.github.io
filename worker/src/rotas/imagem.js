// POST /image — demo "Gerador de imagens" (demos/imagem): texto → imagem com FLUX.1 [schnell] no Workers AI.
// Camadas: limite por IP, Turnstile, filtro local de termos, moderação com Llama Guard e teto diário
// global (protege a cota gratuita que o chat também usa). A imagem e o texto pedido não são salvos;
// o D1 guarda só o total de imagens do dia, apagado antes de 30 dias.
import { isHuman, json, rateLimited } from "../comum.js";

export const IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";
export const GUARD_MODEL = "@cf/meta/llama-guard-3-8b";
export const MIN_PROMPT_LENGTH = 3;
export const MAX_PROMPT_LENGTH = 300;
// ~58 neurônios por imagem (4 blocos 512x512 + 4 passos) + ~10 da moderação:
// 40 imagens ≈ 2.700 dos 10.000 neurônios grátis do dia; o restante fica para o chat.
export const DAILY_IMAGE_LIMIT = 40;
const STEPS = 4;

// Primeira barreira, sem custo: termos explícitos em vários idiomas. A moderação de verdade é o Llama Guard.
const BLOCKED = /(?<!\p{L})(nsfw|nudes?|naked|porn\p{L}*|hentai|sexy|sexual|nud[oa]s?|pelad[oa]s?|desnud[oa]s?|nackt|nue?s?|gore|голы[йе]|голая|порн\p{L}*)(?!\p{L})|裸|色情/iu;

export const promptOf = (payload) => (typeof payload?.prompt === "string" ? payload.prompt.replace(/\s+/g, " ").trim() : "");

// O Llama Guard responde "safe" ou "unsafe\nS1,…" (às vezes como objeto { safe }); na dúvida, recusa.
export const isSafeVerdict = (result) => {
  const response = result?.response ?? result;
  if (typeof response === "object" && response !== null && typeof response.safe === "boolean") return response.safe;
  return typeof response === "string" && /^\s*safe\b/i.test(response);
};

export async function handleImage(payload, ip, env, origin) {
  const limited = await rateLimited(env.IMAGE_LIMITER, ip, origin);
  if (limited) return limited;

  const prompt = promptOf(payload);
  if (prompt.length < MIN_PROMPT_LENGTH || prompt.length > MAX_PROMPT_LENGTH) return json({ error: "invalid_fields" }, 400, origin);
  if (!(await isHuman(payload.turnstileToken, ip, env))) return json({ error: "turnstile_failed" }, 403, origin);
  if (BLOCKED.test(prompt)) return json({ error: "unsafe_prompt" }, 422, origin);

  try {
    const verdict = await env.AI.run(GUARD_MODEL, { messages: [{ role: "user", content: `Generate an image of: ${prompt}` }], max_tokens: 20, temperature: 0 }, { gateway: { id: "default", skipCache: true } });
    if (!isSafeVerdict(verdict)) return json({ error: "unsafe_prompt" }, 422, origin);
  } catch (error) {
    console.error("Moderação indisponível:", error?.message ?? error);
    return json({ error: "unavailable" }, 503, origin);
  }

  // Conta antes de gerar (o teto vale mesmo se a geração falhar): um único UPSERT atômico.
  try {
    const row = await env.DB.prepare(
      "INSERT INTO image_daily (total) VALUES (1) ON CONFLICT (image_date) DO UPDATE SET total = total + 1 RETURNING total",
    ).first();
    if ((row?.total ?? 0) > DAILY_IMAGE_LIMIT) return json({ error: "daily_limit" }, 429, origin);
  } catch (error) {
    console.error("Erro ao contar imagens:", error?.message ?? error);
    return json({ error: "unavailable" }, 503, origin);
  }

  try {
    const seed = Math.floor(Math.random() * 2 ** 31);
    const result = await env.AI.run(IMAGE_MODEL, { prompt, steps: STEPS, seed }, { gateway: { id: "default", skipCache: true } });
    if (typeof result?.image !== "string" || !result.image) return json({ error: "unavailable" }, 503, origin);
    return json({ image: result.image, model: IMAGE_MODEL, steps: STEPS, seed }, 200, origin);
  } catch (error) {
    // 3036 = cota diária gratuita do Workers AI esgotada.
    const quota = String(error?.message ?? error).includes("3036");
    console.error("Geração de imagem falhou:", error?.message ?? error);
    return json({ error: quota ? "daily_limit" : "unavailable" }, quota ? 429 : 503, origin);
  }
}
