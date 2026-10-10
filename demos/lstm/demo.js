// Demo do LSTM no navegador: carrega os pesos exportados do Keras e prevê com lstm.js.
// Preços recentes: Worker do Cloudflare (Yahoo Finance); se falhar, a cópia em dados.json.

const PRICES_API = "https://emanuel-portfolio-chat.emanuel-portfolio-chat.workers.dev/prices";
const HISTORY_DAYS = 30;

const T = {
  en: {
    "meta.title": "LSTM Stock Forecasting — Emanuel Borges",
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
    "meta.title": "Previsão de Ações com LSTM — Emanuel Borges",
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
    "meta.title": "Predicción de Acciones con LSTM — Emanuel Borges",
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
  fr: {
    "meta.title": "Prévision d'actions avec LSTM — Emanuel Borges",
    "meta.description": "Réseau de neurones LSTM qui prévoit la prochaine clôture d'une action, exécuté dans votre navigateur en JavaScript pur et évalué face à une référence naïve.",
    lang: "Langue",
    kicker: "// DÉMO D'IA · S'EXÉCUTE DANS VOTRE NAVIGATEUR",
    title: "Prévision d'actions <span>avec LSTM.</span>",
    lead: "Réseau de neurones LSTM (3 couches, fenêtre de 60 séances) qui prévoit la prochaine clôture à partir des variations récentes. Les poids ont été entraînés en Python/Keras et s'exécutent ici en JavaScript pur — sans serveur ni bibliothèque. Projet du FIAP Tech Challenge (Machine Learning Engineering).",
    back: "← Retour au portfolio",
    code: "Voir le code ↗",
    stock: "Action",
    days: "Jours ouvrés à prévoir",
    run: "Prévoir",
    loading: "Chargement du modèle…",
    error: "Impossible de charger le modèle. Rechargez la page.",
    status: "<strong>Dernière clôture :</strong> {price} le {date} · <strong>Source :</strong> {source}",
    live: "Yahoo Finance (à jour)",
    saved: "copie enregistrée jusqu'au {date}",
    chart: "30 dernières séances et prévision",
    real: "Réel",
    predicted: "Prévision LSTM",
    predictedNext: "LSTM (jour suivant)",
    date: "Date",
    price: "Prix prévu",
    change: "Variation vs. dernière clôture",
    testTitle: "Les résultats du modèle sur le test",
    testNote: "Test hors échantillon : <strong>{days} séances</strong> ({start} au {end}). Le LSTM se trompe en moyenne de <strong>{lstm}</strong> le jour suivant — pratiquement autant que répéter le dernier prix ({naive}). Les cours des actions se comportent presque comme une marche aléatoire, et montrer cette comparaison fait partie d'une évaluation honnête.",
    model: "Modèle",
    naive: "Référence naïve (demain = aujourd'hui)",
    backtest: "Test : réel × prévu (un jour à l'avance)",
    how: "<strong>Fonctionnement :</strong> chaque fenêtre de 60 séances est divisée par son dernier prix, pour que le réseau apprenne des variations relatives et non des niveaux de prix ; les prix sont ajustés des dividendes et des divisions ; les derniers 20 % de 5 ans de données sont réservés au test. La prévision sur plusieurs jours est récursive : chaque jour prévu entre dans la fenêtre suivante.",
    disclaimer: "⚠️ Démonstration technique — pas un conseil en investissement.",
  },
  it: {
    "meta.title": "Previsione di Azioni con LSTM — Emanuel Borges",
    "meta.description": "Rete neurale LSTM che prevede la prossima chiusura di un'azione, eseguita nel tuo browser in JavaScript puro e valutata rispetto a un baseline ingenuo.",
    lang: "Lingua",
    kicker: "// DEMO DI IA · GIRA NEL TUO BROWSER",
    title: "Previsione di azioni <span>con LSTM.</span>",
    lead: "Rete neurale LSTM (3 strati, finestra di 60 sedute) che prevede la prossima chiusura a partire dalle variazioni recenti. I pesi sono stati addestrati in Python/Keras e girano qui in JavaScript puro — senza server né librerie. Progetto del FIAP Tech Challenge (Machine Learning Engineering).",
    back: "← Torna al portfolio",
    code: "Vedi il codice ↗",
    stock: "Azione",
    days: "Giorni lavorativi da prevedere",
    run: "Prevedi",
    loading: "Caricamento del modello…",
    error: "Impossibile caricare il modello. Ricarica la pagina.",
    status: "<strong>Ultima chiusura:</strong> {price} il {date} · <strong>Fonte:</strong> {source}",
    live: "Yahoo Finance (aggiornato)",
    saved: "copia salvata fino al {date}",
    chart: "Ultime 30 sedute e previsione",
    real: "Reale",
    predicted: "Previsione LSTM",
    predictedNext: "LSTM (giorno successivo)",
    date: "Data",
    price: "Prezzo previsto",
    change: "Variazione vs. ultima chiusura",
    testTitle: "Come è andato il modello nel test",
    testNote: "Test fuori campione: <strong>{days} sedute</strong> (dal {start} al {end}). L'LSTM sbaglia in media del <strong>{lstm}</strong> il giorno successivo — praticamente come ripetere l'ultimo prezzo ({naive}). I prezzi delle azioni si comportano quasi come una passeggiata aleatoria, e mostrare questo confronto fa parte di una valutazione onesta.",
    model: "Modello",
    naive: "Baseline ingenuo (domani = oggi)",
    backtest: "Test: reale × previsto (un giorno avanti)",
    how: "<strong>Come funziona:</strong> ogni finestra di 60 sedute è divisa per il suo ultimo prezzo, così la rete impara variazioni relative e non livelli di prezzo; i prezzi sono rettificati per dividendi e frazionamenti; l'ultimo 20% di 5 anni di dati è riservato al test. La previsione su più giorni è ricorsiva: ogni giorno previsto entra nella finestra successiva.",
    disclaimer: "⚠️ Dimostrazione tecnica — non è una raccomandazione di investimento.",
  },
  de: {
    "meta.title": "Aktienprognose mit LSTM — Emanuel Borges",
    "meta.description": "LSTM-Netz, das den nächsten Schlusskurs einer Aktie prognostiziert – läuft in Ihrem Browser in reinem JavaScript und wird mit einer naiven Baseline verglichen.",
    lang: "Sprache",
    kicker: "// KI-DEMO · LÄUFT IN IHREM BROWSER",
    title: "Aktienprognose <span>mit LSTM.</span>",
    lead: "LSTM-Netz (3 Schichten, Fenster von 60 Handelstagen), das den nächsten Schlusskurs aus den jüngsten Veränderungen prognostiziert. Die Gewichte wurden in Python/Keras trainiert und laufen hier in reinem JavaScript – ohne Server und ohne Bibliothek. Projekt aus der FIAP Tech Challenge (Machine Learning Engineering).",
    back: "← Zurück zum Portfolio",
    code: "Code ansehen ↗",
    stock: "Aktie",
    days: "Zu prognostizierende Handelstage",
    run: "Prognostizieren",
    loading: "Modell wird geladen…",
    error: "Das Modell konnte nicht geladen werden. Bitte laden Sie die Seite neu.",
    status: "<strong>Letzter Schlusskurs:</strong> {price} am {date} · <strong>Quelle:</strong> {source}",
    live: "Yahoo Finance (aktuell)",
    saved: "gespeicherte Kopie bis {date}",
    chart: "Letzte 30 Handelstage und Prognose",
    real: "Tatsächlich",
    predicted: "LSTM-Prognose",
    predictedNext: "LSTM (nächster Tag)",
    date: "Datum",
    price: "Prognostizierter Kurs",
    change: "Veränderung vs. letztem Schluss",
    testTitle: "So schnitt das Modell im Test ab",
    testNote: "Out-of-Sample-Test: <strong>{days} Handelstage</strong> ({start} bis {end}). Das LSTM liegt am nächsten Tag im Schnitt <strong>{lstm}</strong> daneben – praktisch so viel wie die Wiederholung des letzten Kurses ({naive}). Aktienkurse verhalten sich fast wie ein Random Walk, und dieser Vergleich gehört zu einer ehrlichen Bewertung.",
    model: "Modell",
    naive: "Naive Baseline (morgen = heute)",
    backtest: "Test: tatsächlich × prognostiziert (ein Tag voraus)",
    how: "<strong>So funktioniert es:</strong> Jedes Fenster von 60 Handelstagen wird durch seinen letzten Kurs geteilt, damit das Netz relative Veränderungen statt Kursniveaus lernt; die Kurse sind um Dividenden und Splits bereinigt; die letzten 20 % von 5 Jahren Daten bleiben für den Test. Die Prognose über mehrere Tage ist rekursiv: Jeder prognostizierte Tag geht in das nächste Fenster ein.",
    disclaimer: "⚠️ Technische Demo – keine Anlageberatung.",
  },
  zh: {
    "meta.title": "LSTM 股价预测 — Emanuel Borges",
    "meta.description": "预测股票下一个收盘价的 LSTM 神经网络，以纯 JavaScript 在浏览器中运行，并与朴素基线对比评估。",
    lang: "语言",
    kicker: "// AI 演示 · 在你的浏览器中运行",
    title: "股价预测 <span>基于 LSTM。</span>",
    lead: "LSTM 神经网络（3 层，60 个交易日窗口），根据近期价格变化预测下一个收盘价。权重在 Python/Keras 中训练，在这里以纯 JavaScript 运行——无需服务器，也不依赖任何库。FIAP Tech Challenge（机器学习工程）项目。",
    back: "← 返回作品集",
    code: "查看代码 ↗",
    stock: "股票",
    days: "预测的交易日数",
    run: "预测",
    loading: "正在加载模型…",
    error: "无法加载模型，请刷新页面。",
    status: "<strong>最新收盘价：</strong>{price}（{date}）· <strong>来源：</strong>{source}",
    live: "Yahoo Finance（最新）",
    saved: "截至 {date} 的保存副本",
    chart: "最近 30 个交易日及预测",
    real: "实际",
    predicted: "LSTM 预测",
    predictedNext: "LSTM（次日）",
    date: "日期",
    price: "预测价格",
    change: "相对最新收盘价的变化",
    testTitle: "模型在测试集上的表现",
    testNote: "样本外测试：<strong>{days} 个交易日</strong>（{start} 至 {end}）。LSTM 对次日的平均误差为 <strong>{lstm}</strong>——几乎等同于直接重复上一个价格（{naive}）。股价的走势近似随机游走，展示这一对比是诚实评估的一部分。",
    model: "模型",
    naive: "朴素基线（明天 = 今天）",
    backtest: "测试：实际 × 预测（提前一天）",
    how: "<strong>工作原理：</strong>每个 60 日窗口都除以其最后一个价格，使网络学习相对变化而非价格水平；价格已按分红和拆股调整；5 年数据中最后 20% 用于测试。多日预测是递归的：每个预测日都会进入下一个窗口。",
    disclaimer: "⚠️ 技术演示——不构成投资建议。",
  },
  ru: {
    "meta.title": "Прогноз акций с LSTM — Emanuel Borges",
    "meta.description": "Нейросеть LSTM, прогнозирующая следующую цену закрытия акции, работает в вашем браузере на чистом JavaScript и сравнивается с наивным бейзлайном.",
    lang: "Язык",
    kicker: "// ДЕМО ИИ · РАБОТАЕТ В ВАШЕМ БРАУЗЕРЕ",
    title: "Прогноз акций <span>с LSTM.</span>",
    lead: "Нейросеть LSTM (3 слоя, окно из 60 торговых дней) прогнозирует следующую цену закрытия по недавним изменениям. Веса обучены в Python/Keras и работают здесь на чистом JavaScript — без сервера и без библиотек. Проект FIAP Tech Challenge (Machine Learning Engineering).",
    back: "← Назад к портфолио",
    code: "Смотреть код ↗",
    stock: "Акция",
    days: "Торговых дней для прогноза",
    run: "Прогноз",
    loading: "Загрузка модели…",
    error: "Не удалось загрузить модель. Обновите страницу.",
    status: "<strong>Последнее закрытие:</strong> {price} ({date}) · <strong>Источник:</strong> {source}",
    live: "Yahoo Finance (актуально)",
    saved: "сохранённая копия до {date}",
    chart: "Последние 30 торговых дней и прогноз",
    real: "Факт",
    predicted: "Прогноз LSTM",
    predictedNext: "LSTM (следующий день)",
    date: "Дата",
    price: "Прогноз цены",
    change: "Изменение к последнему закрытию",
    testTitle: "Как модель показала себя на тесте",
    testNote: "Тест вне выборки: <strong>{days} торговых дней</strong> ({start} — {end}). LSTM ошибается в среднем на <strong>{lstm}</strong> на следующий день — практически как повтор последней цены ({naive}). Цены акций ведут себя почти как случайное блуждание, и показать это сравнение — часть честной оценки.",
    model: "Модель",
    naive: "Наивный бейзлайн (завтра = сегодня)",
    backtest: "Тест: факт × прогноз (на день вперёд)",
    how: "<strong>Как это работает:</strong> каждое окно из 60 дней делится на свою последнюю цену, чтобы сеть училась относительным изменениям, а не уровням цен; цены скорректированы на дивиденды и сплиты; последние 20% из 5 лет данных отведены под тест. Прогноз на несколько дней рекурсивный: каждый прогнозный день входит в следующее окно.",
    disclaimer: "⚠️ Техническая демонстрация — не инвестиционная рекомендация.",
  },
};

let data = null;
const models = {};
const prices = {};

const { t, fmtDate, fmtNum, fmtPct, track } = Demo;
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
    out += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/>`;
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
    out += `<path d="${path}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round"${s.dashed ? ' stroke-dasharray="6 5"' : ""}/>`;
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
      price: fmtNum(lastClose),
      date: fmtDate(lastDate),
      source: series.live ? t("live") : t("saved", { date: fmtDate(lastDate) }),
    });

    const history = series.dates.slice(-HISTORY_DAYS).map((d, i) => ({ x: d, y: series.close.slice(-HISTORY_DAYS)[i] }));
    drawChart($('[data-chart="forecast"]'), [
      { color: "#67e8f9", points: history },
      { color: "#b895ff", dashed: true, points: [{ x: lastDate, y: lastClose }, ...future.map((d, i) => ({ x: d, y: predicted[i] }))] },
    ], t("chart"), { day: "2-digit", month: "short" });

    $("[data-forecast-table]").innerHTML =
      `<thead><tr><th>${t("date")}</th><th>${t("price")}</th><th>${t("change")}</th></tr></thead><tbody>` +
      future.map((d, i) => `<tr><td>${fmtDate(d)}</td><td class="num">${fmtNum(predicted[i])}</td><td class="num">${fmtPct((predicted[i] / lastClose - 1) * 100, true)}</td></tr>`).join("") +
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
  const row = (name, m) => `<tr><td>${name}</td><td class="num">${fmtNum(m.mae)}</td><td class="num">${fmtNum(m.rmse)}</td><td class="num">${fmtPct(m.mape)}</td></tr>`;
  $("[data-metrics-table]").innerHTML =
    `<thead><tr><th>${t("model")}</th><th>MAE</th><th>RMSE</th><th>MAPE</th></tr></thead><tbody>` +
    row("LSTM", info.lstm) + row(t("naive"), info.naive) + "</tbody>";
  const bt = info.backtest;
  drawChart($('[data-chart="backtest"]'), [
    { color: "#67e8f9", points: bt.dates.map((d, i) => ({ x: d, y: bt.actual[i] })) },
    { color: "#b895ff", points: bt.dates.map((d, i) => ({ x: d, y: bt.predicted[i] })) },
  ], t("backtest"), { month: "short", year: "2-digit" });
}

function render() {
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
  select.innerHTML = Object.entries(data).map(([symbol, info]) => `<option value="${symbol}">${info.name} (${symbol})</option>`).join("");

  select.addEventListener("change", () => {
    renderTest();
    runForecast();
    track(`demo-lstm-${select.value}`, `Demo LSTM: ${select.value}`);
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
