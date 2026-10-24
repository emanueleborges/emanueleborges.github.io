// Peças compartilhadas pelas rotas do Worker: modelos, idiomas, CORS/JSON, Turnstile e e-mail.

// Modelo aberto multilíngue com bom custo na cota gratuita (~15 "neurônios" por pergunta).
export const MODEL = "@cf/qwen/qwen3-30b-a3b-fp8";
// Modelo de embeddings multilíngue: a pergunta em qualquer idioma encontra os trechos em inglês.
export const EMBEDDING_MODEL = "@cf/baai/bge-m3";
export const MAX_QUESTION_LENGTH = 500;
import "../../idiomas.js"; // idiomas do site (globalThis.IDIOMAS), os mesmos da página

export const LANGUAGES = Object.fromEntries(Object.entries(globalThis.IDIOMAS).map(([code, idioma]) => [code, idioma.ia]));

// Idioma pedido pelo site; qualquer valor desconhecido vira inglês.
export const languageOf = (payload) => (LANGUAGES[payload?.lang] ? payload.lang : "en");

// Texto gerado pelo Workers AI (o formato muda conforme o modelo).
export const aiText = (result) => result?.response ?? result?.choices?.[0]?.message?.content ?? "";

export const corsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
});

export const json = (body, status, origin) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin) },
  });

// Valida o token do Turnstile no Cloudflare (gratuito).
export async function isHuman(token, ip, env) {
  if (typeof token !== "string" || !token) return false;
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", token);
  form.append("remoteip", ip);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const outcome = await response.json();
    return outcome.success === true;
  } catch {
    return false;
  }
}

// Limite de pedidos por IP (Rate Limiting do Cloudflare); devolve a resposta 429 ou null.
// Estado da IA: a cota gratuita diária do Workers AI (erro 3036) renova às 00:00 UTC. Fica na memória
// desta instância do Worker (cada data center tem a sua), então é uma indicação, não um registro global.
let quotaUntil = 0;

export function aiErrorKind(error) {
  if (!/\b3036\b|daily free allocation/i.test(String(error?.message ?? error))) return "unavailable";
  const now = new Date();
  quotaUntil = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return "quota";
}

export const aiState = () => (Date.now() < quotaUntil ? "quota" : "online");

export async function rateLimited(limiter, ip, origin) {
  const { success } = await limiter.limit({ key: ip });
  return success ? null : json({ error: "rate_limited" }, 429, origin);
}

export const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

// E-mail pelo Resend (plano gratuito). Sem domínio próprio, o remetente de testes
// onboarding@resend.dev só entrega para o e-mail da conta do Resend — que é o da pessoa do portfólio.
export const emailEnabled = (env) => Boolean(env.RESEND_API_KEY && env.NOTIFY_EMAIL);

export async function sendEmail(env, { subject, html, text, replyTo }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "User-Agent": "portfolio-chat" },
    body: JSON.stringify({ from: "Portfólio <onboarding@resend.dev>", to: [env.NOTIFY_EMAIL], reply_to: replyTo, subject, text, html }),
  });
  if (!response.ok) console.error(`Resend respondeu ${response.status}: ${await response.text()}`);
  return response.ok;
}
