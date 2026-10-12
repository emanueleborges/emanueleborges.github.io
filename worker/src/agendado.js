// Tarefas agendadas: limpeza horária de dados expirados e resumo agregado semanal.
import { EMBEDDING_MODEL, MODEL, aiText, emailEnabled, escapeHtml, sendEmail } from "./comum.js";

// Saúde dos serviços usados pelo site (IA, embeddings, Vectorize e D1).
async function healthCheck(env) {
  const checks = {};
  try {
    const embedding = await env.AI.run(EMBEDDING_MODEL, { text: ["health check"] });
    checks.embeddings = Boolean(embedding?.data?.[0]?.length);
    const { matches } = await env.VECTORIZE.query(embedding.data[0], { topK: 1 });
    checks.vectorize = matches?.length > 0;
  } catch (error) {
    checks.embeddings ??= false;
    checks.vectorize = false;
  }
  try {
    const result = await env.AI.run(MODEL, { messages: [{ role: "user", content: "Reply with the single word OK. /no_think" }], max_tokens: 20 });
    checks.ia = Boolean(String(aiText(result)).trim());
  } catch {
    checks.ia = false;
  }
  try {
    await env.DB.prepare("SELECT 1").first();
    checks.banco = true;
  } catch {
    checks.banco = false;
  }
  return checks;
}

// Apaga mensagens do formulário e avaliações do chat que ultrapassaram 30 dias.
export async function purgeOldData(env) {
  try {
    const results = await env.DB.batch([
      env.DB.prepare("DELETE FROM messages WHERE created_at < datetime('now', '-30 days')"),
      env.DB.prepare("DELETE FROM feedback WHERE created_at < datetime('now', '-30 days')"),
    ]);
    const removed = results.map((r) => r.meta?.changes ?? 0);
    if (removed.some(Boolean)) console.log(`Retenção: ${removed[0]} mensagens e ${removed[1]} avaliações apagadas`);
  } catch (error) {
    console.error("Retenção de dados falhou:", error?.message ?? error);
  }
}

// Semana no GoatCounter: visitas, cliques mais frequentes, alcance do Contato e endereços 404.
async function goatCounterWeek(env) {
  if (!env.GOATCOUNTER_TOKEN) return null;
  try {
    const end = new Date(Date.now() + 86400000);
    const start = new Date(end.getTime() - 8 * 86400000);
    const range = `start=${start.toISOString().slice(0, 10)}&end=${end.toISOString().slice(0, 10)}`;
    const get = async (path) => {
      const response = await fetch(`https://emanueleborges.goatcounter.com/api/v0/${path}`, { headers: { Authorization: `Bearer ${env.GOATCOUNTER_TOKEN}`, "Content-Type": "application/json" } });
      if (!response.ok) throw new Error(`GoatCounter ${response.status}`);
      return response.json();
    };
    const [total, hits] = await Promise.all([get(`stats/total?${range}`), get(`stats/hits?${range}&limit=100`)]);
    const events = (hits.hits ?? []).filter((h) => h.event);
    const sum = (prefix) => events.filter((h) => h.path.startsWith(prefix)).reduce((n, h) => n + h.count, 0);
    const clicks = events.filter((h) => h.path.startsWith("clique/")).sort((a, b) => b.count - a.count);
    const top = sum("secao/inicio");
    return {
      total: typeof total.total === "number" ? total.total : null,
      topClicks: clicks.slice(0, 5).map((h) => [h.path.slice(7).replace("/", " › "), h.count]),
      clicks: clicks.reduce((n, h) => n + h.count, 0),
      reachContact: top ? Math.round((sum("secao/contato") / top) * 100) : null,
      notFound: events.filter((h) => h.path.startsWith("404/")).slice(0, 5).map((h) => [h.path.slice(3), h.count]),
    };
  } catch (error) {
    console.error("Resumo semanal: GoatCounter", error?.message ?? error);
    return null;
  }
}

export async function sendWeeklySummary(env) {
  if (!emailEnabled(env)) return;
  const week = "created_at > datetime('now', '-7 days')";
  const [messages, ratings, health, visits] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS total FROM messages WHERE ${week}`).first(),
    env.DB.prepare(`SELECT SUM(rating = 1) AS up, SUM(rating = -1) AS down FROM feedback WHERE ${week}`).first(),
    healthCheck(env),
    goatCounterWeek(env),
  ]);
  const ok = (value) => (value ? "✅ funcionando" : "❌ com problema");
  const messageCount = messages?.total ?? 0;
  const html = `
    <h2>Resumo semanal do portfólio</h2>
    <p><strong>Visitas (7 dias):</strong> ${visits?.total ?? "— (configure GOATCOUNTER_TOKEN para ver aqui; veja em emanueleborges.goatcounter.com)"}</p>
    ${visits ? `<p><strong>Cliques (7 dias):</strong> ${visits.clicks}${visits.reachContact !== null ? ` · <strong>chegaram ao Contato:</strong> ${visits.reachContact}% das visitas ao topo` : ""}</p>
    ${visits.topClicks.length ? `<p>Mais clicados:</p>${list(visits.topClicks.map(([name, n]) => `<li>${escapeHtml(name)} — ${n}</li>`))}` : ""}
    ${visits.notFound.length ? `<p>⚠️ Páginas não encontradas (links quebrados?):</p>${list(visits.notFound.map(([path, n]) => `<li>${escapeHtml(path)} — ${n}</li>`))}` : ""}` : ""}
    <h3>Mensagens do formulário (contagem): ${messageCount}</h3>
    <h3>Avaliações do chat: 👍 ${ratings?.up ?? 0} · 👎 ${ratings?.down ?? 0}</h3>
    <h3>Saúde do sistema</h3>
    <ul>
      <li>IA (Qwen3): ${ok(health.ia)}</li>
      <li>Embeddings (BGE-M3): ${ok(health.embeddings)}</li>
      <li>Vectorize (RAG): ${ok(health.vectorize)}</li>
      <li>Banco D1: ${ok(health.banco)}</li>
    </ul>
    <p style="color:#666">Para consultar mensagens e avaliações completas, use o painel local privado.</p>`;
  await sendEmail(env, {
    subject: `Resumo semanal do portfólio — ${messageCount} mensagem(ns), 👍 ${ratings?.up ?? 0} 👎 ${ratings?.down ?? 0}${Object.values(health).every(Boolean) ? "" : " ⚠️"}`,
    html,
  });
}
