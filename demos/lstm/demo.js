// Demo do LSTM no navegador: carrega os pesos exportados do Keras e prevê com lstm.js.
// Preços recentes: Worker do Cloudflare (Yahoo Finance); se falhar, a cópia em dados.json.
import { Demo } from "../demos.js";
import { LSTM } from "./lstm.js";

const PRICES_API = `${globalThis.PERFIL.servicos.worker}/prices`; // data/perfil.json
const HISTORY_DAYS = 30;

const T = {
  en: {
    "caso.p": "Predict the next closing price of stocks and, above all, find out whether the prediction beats a simple guess.",
    "caso.s": "A 3-layer LSTM with a 60-day window and adjusted prices, trained in Python/Keras; the weights run in plain JavaScript, with no server or library.",
    "caso.r": "A mean error of 1.1–2.2% (MAPE) out of sample, about the same as repeating the last price. The demo shows that comparison instead of hiding it.",
    "caso.m": "Predict returns instead of prices, show confidence intervals and compare with simpler models such as ARIMA before drawing conclusions.",
    groupB3: "Brazil (B3)",
    groupUS: "United States (NASDAQ)",
    "meta.title": "LSTM Stock Forecasting",
    "meta.description": "LSTM neural network that forecasts the next stock close, running in your browser in plain JavaScript and evaluated against a naive baseline.",
    lang: "Language",
    kicker: "// AI DEMO · RUNS IN YOUR BROWSER",
    title: "Stock forecasting <span>with LSTM.</span>",
    lead: "LSTM neural network (3 layers, 60-session window) that forecasts the next close from recent price changes. The weights were trained in Python/Keras and run here in plain JavaScript — no server, no library. Project from the FIAP Tech Challenge (Machine Learning Engineering).",
    back: "← Back to portfolio",
    code: "View code ↗",
    stock: "Stock",
    days: "Business days to forecast",
    run: "Forecast",
    loading: "Loading the model…",
    error: "Could not load the model. Please reload the page.",
    status: "<strong>Last close:</strong> {price} on {date} · <strong>Source:</strong> {source}",
    live: "Yahoo Finance (up to date)",
    saved: "saved copy up to {date}",
    chart: "Last 30 sessions and forecast",
    real: "Actual",
    predicted: "LSTM forecast",
    predictedNext: "LSTM (next day)",
    date: "Date",
    price: "Forecast price",
    change: "Change vs. last close",
    testTitle: "How the model did on the test set",
    testNote: "Out-of-sample test: <strong>{days} sessions</strong> ({start} to {end}). The LSTM is off by <strong>{lstm}</strong> on average for the next day — practically the same as repeating the last price ({naive}). Stock prices behave almost like a random walk, and showing this comparison is part of an honest evaluation.",
    model: "Model",
    naive: "Naive baseline (tomorrow = today)",
    backtest: "Test: actual × predicted (one day ahead)",
    how: "<strong>How it works:</strong> each 60-session window is divided by its last price, so the network learns relative changes instead of price levels; prices are adjusted for dividends and splits; the last 20% of 5 years of data is kept for the test. The forecast for several days is recursive: each predicted day enters the next window.",
    disclaimer: "⚠️ Technical demo — not investment advice.",
  },
  pt: {
    "caso.p": "Prever o próximo fechamento de ações e, principalmente, descobrir se a previsão vale mais que um palpite simples.",
    "caso.s": "LSTM de 3 camadas com janela de 60 pregões e preços ajustados, treinada em Python/Keras; os pesos rodam em JavaScript puro, sem servidor nem biblioteca.",
    "caso.r": "Erro médio de 1,1–2,2% (MAPE) fora da amostra, praticamente igual ao de repetir o último preço. A demo mostra essa comparação em vez de escondê-la.",
    "caso.m": "Prever retornos em vez de preços, mostrar intervalos de confiança e comparar com modelos mais simples, como ARIMA, antes de tirar conclusões.",
    groupB3: "Brasil (B3)",
    groupUS: "EUA (NASDAQ)",
    "meta.title": "Previsão de Ações com LSTM",
    "meta.description": "Rede neural LSTM que prevê o próximo fechamento de ações, rodando no seu navegador em JavaScript puro e avaliada contra um baseline ingênuo.",
    lang: "Idioma",
    kicker: "// DEMO DE IA · RODA NO SEU NAVEGADOR",
    title: "Previsão de ações <span>com LSTM.</span>",
    lead: "Rede neural LSTM (3 camadas, janela de 60 pregões) que prevê o próximo fechamento a partir das variações recentes. Os pesos foram treinados em Python/Keras e rodam aqui em JavaScript puro — sem servidor e sem biblioteca. Projeto do FIAP Tech Challenge (Machine Learning Engineering).",
    back: "← Voltar ao portfólio",
    code: "Ver código ↗",
    stock: "Ação",
    days: "Dias úteis a prever",
    run: "Prever",
    loading: "Carregando o modelo…",
    error: "Não foi possível carregar o modelo. Recarregue a página.",
    status: "<strong>Último fechamento:</strong> {price} em {date} · <strong>Fonte:</strong> {source}",
    live: "Yahoo Finance (atualizado)",
    saved: "cópia salva até {date}",
    chart: "Últimos 30 pregões e previsão",
    real: "Real",
    predicted: "Previsão LSTM",
    predictedNext: "LSTM (dia seguinte)",
    date: "Data",
    price: "Preço previsto",
    change: "Variação vs. último fechamento",
    testTitle: "Como o modelo se saiu no teste",
    testNote: "Teste fora da amostra: <strong>{days} pregões</strong> ({start} a {end}). O LSTM erra em média <strong>{lstm}</strong> no dia seguinte — praticamente o mesmo que repetir o último preço ({naive}). Preços de ações se comportam quase como um passeio aleatório, e mostrar essa comparação faz parte de uma avaliação honesta.",
    model: "Modelo",
    naive: "Baseline ingênuo (amanhã = hoje)",
    backtest: "Teste: real × previsto (um dia à frente)",
    how: "<strong>Como funciona:</strong> cada janela de 60 pregões é dividida pelo seu último preço, para a rede aprender variações relativas e não níveis de preço; os preços são ajustados por dividendos e desdobramentos; os últimos 20% de 5 anos de dados ficam para o teste. A previsão de vários dias é recursiva: cada dia previsto entra na janela seguinte.",
    disclaimer: "⚠️ Demonstração técnica — não é recomendação de investimento.",
  },
  es: {
    "caso.p": "Predecir el próximo cierre de acciones y, sobre todo, descubrir si la predicción vale más que una suposición simple.",
    "caso.s": "LSTM de 3 capas con ventana de 60 sesiones y precios ajustados, entrenada en Python/Keras; los pesos se ejecutan en JavaScript puro, sin servidor ni biblioteca.",
    "caso.r": "Error medio de 1,1–2,2% (MAPE) fuera de la muestra, prácticamente igual a repetir el último precio. La demo muestra esa comparación en lugar de ocultarla.",
    "caso.m": "Predecir retornos en lugar de precios, mostrar intervalos de confianza y comparar con modelos más simples, como ARIMA, antes de sacar conclusiones.",
    groupB3: "Brasil (B3)",
    groupUS: "Estados Unidos (NASDAQ)",
    "meta.title": "Predicción de Acciones con LSTM",
    "meta.description": "Red neuronal LSTM que predice el próximo cierre de acciones, ejecutándose en tu navegador en JavaScript puro y evaluada frente a un baseline ingenuo.",
    lang: "Idioma",
    kicker: "// DEMO DE IA · SE EJECUTA EN TU NAVEGADOR",
    title: "Predicción de acciones <span>con LSTM.</span>",
    lead: "Red neuronal LSTM (3 capas, ventana de 60 sesiones) que predice el próximo cierre a partir de las variaciones recientes. Los pesos se entrenaron en Python/Keras y se ejecutan aquí en JavaScript puro — sin servidor ni biblioteca. Proyecto del FIAP Tech Challenge (Machine Learning Engineering).",
    back: "← Volver al portafolio",
    code: "Ver código ↗",
    stock: "Acción",
    days: "Días hábiles a predecir",
    run: "Predecir",
    loading: "Cargando el modelo…",
    error: "No se pudo cargar el modelo. Recarga la página.",
    status: "<strong>Último cierre:</strong> {price} el {date} · <strong>Fuente:</strong> {source}",
    live: "Yahoo Finance (actualizado)",
    saved: "copia guardada hasta {date}",
    chart: "Últimas 30 sesiones y predicción",
    real: "Real",
    predicted: "Predicción LSTM",
    predictedNext: "LSTM (día siguiente)",
    date: "Fecha",
    price: "Precio previsto",
    change: "Variación vs. último cierre",
    testTitle: "Cómo le fue al modelo en la prueba",
    testNote: "Prueba fuera de muestra: <strong>{days} sesiones</strong> ({start} a {end}). El LSTM se equivoca en promedio <strong>{lstm}</strong> al día siguiente — prácticamente lo mismo que repetir el último precio ({naive}). Los precios de las acciones se comportan casi como un paseo aleatorio, y mostrar esta comparación es parte de una evaluación honesta.",
    model: "Modelo",
    naive: "Baseline ingenuo (mañana = hoy)",
    backtest: "Prueba: real × previsto (un día adelante)",
    how: "<strong>Cómo funciona:</strong> cada ventana de 60 sesiones se divide por su último precio, para que la red aprenda variaciones relativas y no niveles de precio; los precios se ajustan por dividendos y desdoblamientos; el último 20% de 5 años de datos se reserva para la prueba. La predicción de varios días es recursiva: cada día previsto entra en la ventana siguiente.",
    disclaimer: "⚠️ Demostración técnica — no es una recomendación de inversión.",
  },
};

let data = null;
const models = {};
const prices = {};

const { t, fmtDate, fmtNum, fmtPct } = Demo;
const money = (value, currency) =>
  new Intl.NumberFormat(Demo.locale(), { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const $ = (selector) => document.querySelector(selector);

/* ---------- Gráfico de linhas em SVG ---------- */

// O viewBox acompanha a largura real do gráfico, para o texto manter 11 px também no celular.
function drawChart(svg, series, label, tickFormat) {
  const W = Math.round(svg.getBoundingClientRect().width) || 900;
  const H = W < 600 ? 220 : 300;
  const pad = { l: 52, r: 12, t: 12, b: 30 };
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const all = series.flatMap((s) => s.points.map((p) => p.y));
  const dates = [...new Set(series.flatMap((s) => s.points.map((p) => p.x)))].sort();
  let min = Math.min(...all), max = Math.max(...all);
  const margin = (max - min) * 0.08 || 1;
  min -= margin;
  max += margin;
  const x = (d) => pad.l + (dates.indexOf(d) / Math.max(dates.length - 1, 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);

  let out = "";
  for (let i = 0; i <= 4; i += 1) {
    const v = min + ((max - min) * i) / 4;
    out += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--grid)"/>`;
    out += `<text x="${pad.l - 8}" y="${y(v) + 4}" text-anchor="end">${fmtNum(v)}</text>`;
  }
  const ticks = W < 600 ? 3 : 5;
  const tick = (d) => new Intl.DateTimeFormat(Demo.locale(), tickFormat).format(new Date(`${d}T12:00:00`));
  for (let i = 0; i < ticks; i += 1) {
    const d = dates[Math.round((i * (dates.length - 1)) / (ticks - 1))];
    const anchor = i === 0 ? "start" : i === ticks - 1 ? "end" : "middle";
    out += `<text x="${x(d)}" y="${H - 8}" text-anchor="${anchor}">${tick(d)}</text>`;
  }
  for (const s of series) {
    const path = s.points.map((p, i) => `${i ? "L" : "M"}${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`).join("");
    out += `<path d="${path}" fill="none" style="stroke:${s.color}" stroke-width="2" stroke-linejoin="round"${s.dashed ? ' stroke-dasharray="6 5"' : ""}/>`;
  }
  svg.innerHTML = out;
  svg.setAttribute("aria-label", label);
}

/* ---------- Dados ---------- */

async function loadModel(symbol) {
  if (!models[symbol]) models[symbol] = fetch(data[symbol].model).then((r) => r.json());
  return models[symbol];
}

async function loadPrices(symbol) {
  if (!prices[symbol]) {
    prices[symbol] = (async () => {
      try {
        const response = await fetch(`${PRICES_API}?symbol=${encodeURIComponent(symbol)}`);
        if (response.ok) {
          const live = await response.json();
          if (live.close?.length >= 60) return { ...live, live: true };
        }
      } catch {
        /* sem Worker ou Yahoo indisponível: usa a cópia salva */
      }
      return { ...data[symbol].prices, live: false };
    })();
  }
  return prices[symbol];
}

function businessDays(fromIso, count) {
  const days = [];
  const d = new Date(`${fromIso}T12:00:00Z`);
  while (days.length < count) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/* ---------- Telas ---------- */

async function runForecast() {
  const symbol = $("[data-symbol]").value;
  const days = Number($("[data-days]").value);
  const status = $("[data-status]");
  status.textContent = t("loading");
  try {
    const [model, series] = await Promise.all([loadModel(symbol), loadPrices(symbol)]);
    const predicted = LSTM.forecast(model, series.close, days);
    const lastDate = series.dates.at(-1);
    const lastClose = series.close.at(-1);
    const future = businessDays(lastDate, days);

    status.innerHTML = t("status", {
      price: money(lastClose, data[symbol].currency),
      date: fmtDate(lastDate),
      source: series.live ? t("live") : t("saved", { date: fmtDate(lastDate) }),
    });

    const history = series.dates.slice(-HISTORY_DAYS).map((d, i) => ({ x: d, y: series.close.slice(-HISTORY_DAYS)[i] }));
    drawChart($('[data-chart="forecast"]'), [
      { color: "var(--series-1)", points: history },
      { color: "var(--series-2)", dashed: true, points: [{ x: lastDate, y: lastClose }, ...future.map((d, i) => ({ x: d, y: predicted[i] }))] },
    ], t("chart"), { day: "2-digit", month: "short" });

    $("[data-forecast-table]").innerHTML =
      `<thead><tr><th>${t("date")}</th><th>${t("price")}</th><th>${t("change")}</th></tr></thead><tbody>` +
      future.map((d, i) => `<tr><td>${fmtDate(d)}</td><td class="num">${money(predicted[i], data[symbol].currency)}</td><td class="num">${fmtPct((predicted[i] / lastClose - 1) * 100, true)}</td></tr>`).join("") +
      "</tbody>";
  } catch {
    status.textContent = t("error");
  }
}

function renderTest() {
  const info = data[$("[data-symbol]").value];
  $("[data-test-note]").innerHTML = t("testNote", {
    days: info.test.days,
    start: fmtDate(info.test.start),
    end: fmtDate(info.test.end),
    lstm: fmtPct(info.lstm.mape),
    naive: fmtPct(info.naive.mape),
  });
  const row = (name, m) => `<tr><td>${name}</td><td class="num">${money(m.mae, info.currency)}</td><td class="num">${money(m.rmse, info.currency)}</td><td class="num">${fmtPct(m.mape)}</td></tr>`;
  $("[data-metrics-table]").innerHTML =
    `<thead><tr><th>${t("model")}</th><th>MAE</th><th>RMSE</th><th>MAPE</th></tr></thead><tbody>` +
    row("LSTM", info.lstm) + row(t("naive"), info.naive) + "</tbody>";
  const bt = info.backtest;
  drawChart($('[data-chart="backtest"]'), [
    { color: "var(--series-1)", points: bt.dates.map((d, i) => ({ x: d, y: bt.actual[i] })) },
    { color: "var(--series-2)", points: bt.dates.map((d, i) => ({ x: d, y: bt.predicted[i] })) },
  ], t("backtest"), { month: "short", year: "2-digit" });
}

// Menu agrupado por bolsa; refeito ao trocar o idioma (mantém a ação escolhida).
function buildSelect() {
  const select = $("[data-symbol]");
  const current = select.value;
  const group = (market, label) =>
    `<optgroup label="${t(label)}">` +
    Object.entries(data).filter(([, info]) => info.market === market).map(([symbol, info]) => `<option value="${symbol}">${info.name} (${symbol.replace(".SA", "")})</option>`).join("") +
    "</optgroup>";
  select.innerHTML = group("B3", "groupB3") + group("NASDAQ", "groupUS");
  if (current) select.value = current;
}

function render() {
  buildSelect();
  renderTest();
  runForecast();
}

async function init() {
  Demo.setup(T, render);
  $("[data-status]").textContent = t("loading");
  try {
    data = await (await fetch("dados.json")).json();
  } catch {
    $("[data-status]").textContent = t("error");
    return;
  }

  const select = $("[data-symbol]");
  buildSelect();

  select.addEventListener("change", () => {
    renderTest();
    runForecast();
  });
  const range = $("[data-days]");
  range.addEventListener("input", () => ($("[data-days-out]").textContent = range.value));
  range.addEventListener("change", runForecast);
  $("[data-run]").addEventListener("click", runForecast);

  render();
  let width = innerWidth;
  addEventListener("resize", () => {
    if (innerWidth === width) return;
    width = innerWidth;
    render();
  });
}

init();
