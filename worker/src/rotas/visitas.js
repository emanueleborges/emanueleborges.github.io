import { json, rateLimited } from "../comum.js";

const CONTINENTS = new Set(["AF", "AN", "AS", "EU", "NA", "OC", "SA"]);

export async function handleVisit(request, env, origin) {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const limited = await rateLimited(env.VISIT_LIMITER, ip, origin);
  if (limited) return limited;

  const continent = request.cf?.continent;
  if (typeof continent !== "string" || !CONTINENTS.has(continent)) {
    return json({ error: "region_unavailable" }, 422, origin);
  }

  try {
    await env.DB.prepare(
      "INSERT INTO regional_visits (continent, total) VALUES (?, 1) ON CONFLICT (access_date, continent) DO UPDATE SET total = total + 1",
    ).bind(continent).run();
    return json({ ok: true }, 200, origin);
  } catch (error) {
    console.error("Falha ao registrar contagem regional:", error?.message ?? error);
    return json({ error: "unavailable" }, 503, origin);
  }
}
