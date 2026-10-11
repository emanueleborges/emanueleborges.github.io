// Cloudflare Worker do portfólio (tudo no plano gratuito do Cloudflare):
//   POST /         → chat com IA (Workers AI), usando só o perfil do Emanuel (src/conhecimento.js)
//   POST /contact  → formulário de contato, salvo no banco D1 + aviso por e-mail (Resend)
//                    + confirmação ao visitante (Google Apps Script)
//   POST /feedback → avaliação 👍/👎 das respostas da IA, salva no banco D1
//   POST /match    → "Essa vaga combina?": requisitos da vaga × perfil, com evidências e nota
//   GET  /prices   → preços das ações da demo do LSTM (Yahoo Finance)
//   Cron (segunda 12:00 UTC) → resumo semanal por e-mail com saúde do sistema
//
// Cada rota fica em src/rotas/; as peças comuns em src/comum.js; o cron em src/agendado.js.
import { corsHeaders, json } from "./comum.js";
import { handleChat } from "./rotas/chat.js";
import { handleContact } from "./rotas/contato.js";
import { handleFeedback } from "./rotas/avaliacao.js";
import { handleMatch } from "./rotas/vaga.js";
import { handlePrices } from "./rotas/precos.js";
import { purgeOldData, sendWeeklySummary } from "./agendado.js";

// Rotas POST: caminho → função (payload, ip, env, origin, ctx).
const POST_ROUTES = {
  "/": handleChat,
  "/contact": handleContact,
  "/feedback": handleFeedback,
  "/match": handleMatch,
};

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(Promise.all([sendWeeklySummary(env), purgeOldData(env)]));
  },

  async fetch(request, env, ctx) {
    const origin = env.ALLOWED_ORIGIN;
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method === "GET" && new URL(request.url).pathname === "/prices") {
      if (request.headers.get("Origin") !== origin) return json({ error: "forbidden_origin" }, 403, origin);
      return handlePrices(request, request.headers.get("CF-Connecting-IP") ?? "unknown", env, origin);
    }
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, origin);
    if (request.headers.get("Origin") !== origin) return json({ error: "forbidden_origin" }, 403, origin);

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "invalid_json" }, 400, origin);
    }
    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const { pathname } = new URL(request.url);
    const handler = Object.hasOwn(POST_ROUTES, pathname) ? POST_ROUTES[pathname] : null;
    if (!handler) return json({ error: "not_found" }, 404, origin);
    return handler(payload, ip, env, origin, ctx);
  },
};
