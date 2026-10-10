"""Exporta os modelos para a demo no navegador (portfólio, GitHub Pages).

Gera, na pasta de destino:
- <SIMBOLO>.json: pesos de cada camada (LSTM e Dense) em listas simples;
- dados.json: métricas, backtest, últimos fechamentos e um caso de referência do Keras
  (janela + previsão) para conferir que o cálculo em JavaScript dá o mesmo resultado.

Uso (a partir da raiz do repositório): python scripts/lstm/exportar_web.py demos/lstm
"""

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model

ROOT = Path(__file__).parent
WINDOW = 60
RECENT_DAYS = 250


def rounded(array: np.ndarray) -> list:
    return np.round(array.astype("float64"), 7).tolist()


def export(symbol: str, info: dict, out: Path) -> dict:
    name = symbol.replace(".", "_")
    model = load_model(ROOT / "models" / f"{name}.keras")
    layers = []
    for layer in model.layers:
        kind = type(layer).__name__
        if kind == "LSTM":
            kernel, recurrent, bias = layer.get_weights()
            layers.append({"type": "lstm", "units": layer.units, "kernel": rounded(kernel),
                           "recurrent": rounded(recurrent), "bias": rounded(bias)})
        elif kind == "Dense":
            kernel, bias = layer.get_weights()
            layers.append({"type": "dense", "kernel": rounded(kernel), "bias": rounded(bias)})
    (out / f"{name}.json").write_text(json.dumps({"window": WINDOW, "layers": layers}, separators=(",", ":")))

    close = pd.read_csv(ROOT / "data" / f"{name}.csv", index_col="date")["close"]
    recent = close.iloc[-RECENT_DAYS:]
    window = recent.to_numpy()[-WINDOW:]
    x = (window / window[-1] - 1).reshape(1, WINDOW, 1)
    reference = float(model.predict(x, verbose=0)[0, 0])

    return {
        "name": info["name"],
        "model": f"{name}.json",
        "train": info["train"],
        "test": info["test"],
        "epochs": info["epochs"],
        "lstm": info["lstm"],
        "naive": info["naive"],
        "backtest": info["backtest"],
        "prices": {
            "dates": [d[:10] for d in recent.index],
            "close": [round(float(v), 4) for v in recent.to_numpy()],
        },
        "reference": {"output": reference},
    }


if __name__ == "__main__":
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    metrics = json.loads((ROOT / "models" / "metrics.json").read_text(encoding="utf-8"))
    data = {symbol: export(symbol, info, out) for symbol, info in metrics.items()}
    (out / "dados.json").write_text(json.dumps(data, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    for f in sorted(out.iterdir()):
        print(f"{f.name}: {f.stat().st_size / 1024:.0f} KB")
