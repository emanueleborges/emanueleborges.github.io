// Cloudflare Worker do portfólio (tudo no plano gratuito do Cloudflare):
//   POST /         → chat com IA (Workers AI), usando só o perfil do Emanuel (src/conhecimento.js)
//   POST /feedback → total diário agregado de avaliações 👍/👎, sem texto associado
//   POST /match    → "Essa vaga combina?": requisitos da vaga × perfil, com evidências e nota
//   POST /visit    → contagem agregada por continente, somente após consentimento
//   POST /click    → total diário de cliques por link (LinkedIn, GitHub…), somente após consentimento
//   POST /image    → demo do gerador de imagens (FLUX.1 schnell), com moderação e teto diário
//   GET  /prices   → preços das ações da demo do LSTM (Yahoo Finance)
//   Cron (horário) → limpeza de dados expirados; (segunda 12:00 UTC) resumo agregado semanal
//
// Cada rota fica em src/rotas/; as peças comuns em src/comum.js; o cron em src/agendado.js.
import { corsHeaders, json } from "./comum.js";
import { handleChat } from "./rotas/chat.js";
import { handleFeedback } from "./rotas/avaliacao.js";
import { handleMatch } from "./rotas/vaga.js";
import { handlePrices } from "./rotas/precos.js";
import { handleVisit } from "./rotas/visitas.js";
import { handleClick } from "./rotas/metricas.js";
import { handleImage } from "./rotas/imagem.js";
import { purgeOldData, sendWeeklySummary } from "./agendado.js";

// Rotas POST: caminho → função (payload, ip, env, origin, ctx, request).
const POST_ROUTES = {
  "/": handleChat,
  "/feedback": handleFeedback,
  "/match": handleMatch,
  "/click": handleClick,
  "/image": handleImage,
  "/visit": (_payload, _ip, env, origin, _ctx, request) => handleVisit(request, env, origin),
};

export default {
  async scheduled(event, env, ctx) {
    const tasks = [purgeOldData(env)];
    if (event.cron === "0 12 * * 1") tasks.push(sendWeeklySummary(env));
    ctx.waitUntil(Promise.all(tasks));
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

    const { pathname } = new URL(request.url);
    if (pathname === "/visit") return POST_ROUTES[pathname](null, null, env, origin, ctx, request);
    const handler = Object.hasOwn(POST_ROUTES, pathname) ? POST_ROUTES[pathname] : null;
    if (!handler) return json({ error: "not_found" }, 404, origin);

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "invalid_json" }, 400, origin);
    }
    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    return handler(payload, ip, env, origin, ctx, request);
  },
};
