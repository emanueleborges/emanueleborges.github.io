// Tarefas agendadas: limpeza horária de dados expirados e resumo agregado semanal.
import { EMBEDDING_MODEL, MODEL, aiText, emailEnabled, sendEmail } from "./comum.js";

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

// Apaga mensagens, avaliações e agregados regionais expirados.
export async function purgeOldData(env) {
  try {
    const results = await env.DB.batch([
      env.DB.prepare("DELETE FROM messages WHERE created_at < datetime('now', '-30 days')"),
      env.DB.prepare("DELETE FROM feedback WHERE created_at < datetime('now', '-30 days')"),
      env.DB.prepare("DELETE FROM regional_visits WHERE access_date <= date('now', '-29 days')"),
    ]);
    const removed = results.map((r) => r.meta?.changes ?? 0);
    if (removed.some(Boolean)) console.log(`Retenção: ${removed[0]} mensagens, ${removed[1]} avaliações e ${removed[2]} contagens regionais apagadas`);
  } catch (error) {
    console.error("Retenção de dados falhou:", error?.message ?? error);
  }
}

export async function sendWeeklySummary(env) {
  if (!emailEnabled(env)) return;
  const week = "created_at > datetime('now', '-7 days')";
  const [messages, ratings, health, visits] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS total FROM messages WHERE ${week}`).first(),
    env.DB.prepare(`SELECT SUM(rating = 1) AS up, SUM(rating = -1) AS down FROM feedback WHERE ${week}`).first(),
    healthCheck(env),
    env.DB.prepare("SELECT COALESCE(SUM(total), 0) AS total FROM regional_visits WHERE access_date > date('now', '-7 days')").first(),
  ]);
  const ok = (value) => (value ? "✅ funcionando" : "❌ com problema");
  const messageCount = messages?.total ?? 0;
  const html = `
    <h2>Resumo semanal do portfólio</h2>
    <p><strong>Acessos regionais consentidos (7 dias):</strong> ${visits?.total ?? 0}</p>
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
