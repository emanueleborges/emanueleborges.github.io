// GET /prices — fechamentos ajustados do último ano para a demo do LSTM (demos/lstm), via Yahoo Finance.
// Só as ações da demo; até 30 pedidos por minuto por IP; resposta guardada por 1 hora no navegador e na borda do Cloudflare.
import { json, rateLimited } from "../comum.js";

const PRICE_SYMBOLS = new Set([
  "PETR4.SA", "VALE3.SA", "ITUB4.SA", "BBDC4.SA", "BBAS3.SA", "ABEV3.SA", "WEGE3.SA", "B3SA3.SA",
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA",
]);
export async function handlePrices(request, ip, env, origin) {
  const limited = await rateLimited(env.PRICES_LIMITER, ip, origin);
  if (limited) return limited;

  const symbol = new URL(request.url).searchParams.get("symbol");
  if (!PRICE_SYMBOLS.has(symbol)) return json({ error: "invalid_symbol" }, 400, origin);
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, cf: { cacheTtl: 3600, cacheEverything: true } },
    );
    if (!response.ok) return json({ error: "upstream" }, 502, origin);
    const result = (await response.json()).chart.result[0];
    const offset = result.meta.gmtoffset * 1000;
    const adjusted = result.indicators.adjclose[0].adjclose;
    const dates = [];
    const close = [];
    result.timestamp.forEach((ts, i) => {
      if (adjusted[i] == null) return;
      dates.push(new Date(ts * 1000 + offset).toISOString().slice(0, 10));
      close.push(Math.round(adjusted[i] * 10000) / 10000);
    });
    const body = json({ symbol, dates, close }, 200, origin);
    body.headers.set("Cache-Control", "public, max-age=3600");
    return body;
  } catch (error) {
    console.error(`Preços (${symbol}): ${error}`);
    return json({ error: "upstream" }, 502, origin);
  }
}
