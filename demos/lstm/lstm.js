// Inferência do LSTM em JavaScript puro (mesmas contas do Keras), sem biblioteca.
// Camada LSTM do Keras: z = x·W + h·U + b, dividido nos portões i, f, c, o:
//   i = σ(zi)  f = σ(zf)  c = f·c + i·tanh(zc)  o = σ(zo)  h = o·tanh(c)
// Dropout não atua na previsão. Camadas Dense são lineares.
(function (root) {
  const sigmoid = (v) => 1 / (1 + Math.exp(-v));

  function lstmLayer(layer, sequence, returnSequences) {
    const { units, kernel, recurrent, bias } = layer;
    let h = new Float64Array(units);
    let c = new Float64Array(units);
    const outputs = [];
    for (const x of sequence) {
      const z = Float64Array.from(bias);
      for (let k = 0; k < x.length; k += 1) {
        const row = kernel[k];
        for (let j = 0; j < z.length; j += 1) z[j] += x[k] * row[j];
      }
      for (let k = 0; k < units; k += 1) {
        const row = recurrent[k];
        for (let j = 0; j < z.length; j += 1) z[j] += h[k] * row[j];
      }
      const nextH = new Float64Array(units);
      const nextC = new Float64Array(units);
      for (let u = 0; u < units; u += 1) {
        const i = sigmoid(z[u]);
        const f = sigmoid(z[units + u]);
        const g = Math.tanh(z[2 * units + u]);
        const o = sigmoid(z[3 * units + u]);
        nextC[u] = f * c[u] + i * g;
        nextH[u] = o * Math.tanh(nextC[u]);
      }
      h = nextH;
      c = nextC;
      if (returnSequences) outputs.push(h);
    }
    return returnSequences ? outputs : h;
  }

  function denseLayer(layer, input) {
    const { kernel, bias } = layer;
    return bias.map((b, j) => input.reduce((sum, v, k) => sum + v * kernel[k][j], b));
  }

  // window: preços de fechamento (o tamanho do modelo); retorna a variação prevista do dia seguinte.
  function predictChange(model, window) {
    const last = window[window.length - 1];
    let value = window.map((p) => [p / last - 1]);
    const lstmCount = model.layers.filter((l) => l.type === "lstm").length;
    let seen = 0;
    for (const layer of model.layers) {
      if (layer.type === "lstm") {
        seen += 1;
        value = lstmLayer(layer, value, seen < lstmCount);
      } else {
        value = denseLayer(layer, Array.from(value));
      }
    }
    return value[0];
  }

  // Previsão recursiva de N dias: cada dia previsto entra na janela do dia seguinte.
  function forecast(model, prices, days) {
    const series = prices.slice(-model.window);
    const predicted = [];
    for (let d = 0; d < days; d += 1) {
      const window = series.slice(-model.window);
      const next = window[window.length - 1] * (1 + predictChange(model, window));
      predicted.push(next);
      series.push(next);
    }
    return predicted;
  }

  root.LSTM = { predictChange, forecast };
})(typeof module !== "undefined" ? module.exports : window);
