"""Treina os modelos LSTM da demo demos/lstm (rodar localmente; o site só usa os pesos exportados).

Mesma arquitetura do projeto FIAP Tech Challenge Fase 4 (3 camadas LSTM de 50 unidades,
janela de 60 dias, preço de fechamento), com três correções:
- cada janela é normalizada pelo seu último preço (o modelo prevê a variação do dia seguinte).
  O MinMaxScaler original era ajustado na série inteira (vazamento) e não extrapola preços
  fora da faixa do treino;
- preços ajustados por dividendos e desdobramentos (sem quedas artificiais na série);
- as métricas do teste são comparadas com um baseline ingênuo (amanhã = hoje).

Uso (a partir da raiz do repositório): python scripts/lstm/train.py
Grava scripts/lstm/models/ (modelos .keras e metrics.json) e scripts/lstm/data/ (fechamentos);
os dois ficam fora do git. Depois, rode exportar_web.py para atualizar demos/lstm/.
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
import yfinance as yf
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
from tensorflow.keras.models import Sequential

TICKERS = {"PETR4.SA": "Petrobras PN", "VALE3.SA": "Vale ON", "AAPL": "Apple"}
WINDOW = 60
PERIOD = "5y"
MODELS = Path(__file__).parent / "models"
DATA = Path(__file__).parent / "data"

tf.keras.utils.set_random_seed(42)


def build_model() -> Sequential:
    model = Sequential([
        Input(shape=(WINDOW, 1)),
        LSTM(50, return_sequences=True),
        Dropout(0.2),
        LSTM(50, return_sequences=True),
        Dropout(0.2),
        LSTM(50),
        Dropout(0.2),
        Dense(25),
        Dense(1),
    ])
    model.compile(optimizer="adam", loss="mean_squared_error", metrics=["mae"])
    return model


def sequences(prices: np.ndarray, start: int, end: int):
    """Janelas de WINDOW dias relativas ao último preço, prevendo a variação do dia seguinte
    (alvos no intervalo [start, end)). Retorna também o último preço de cada janela."""
    last = prices[start - 1:end - 1]
    X = np.array([prices[i - WINDOW:i] for i in range(start, end)]) / last[:, None] - 1
    y = prices[start:end] / last - 1
    return X.reshape(-1, WINDOW, 1), y, last


def metrics(actual: np.ndarray, predicted: np.ndarray) -> dict:
    error = actual - predicted
    return {
        "mae": float(np.mean(np.abs(error))),
        "rmse": float(np.sqrt(np.mean(error ** 2))),
        "mape": float(np.mean(np.abs(error / actual)) * 100),
    }


def train(symbol: str) -> dict:
    df = yf.Ticker(symbol).history(period=PERIOD, auto_adjust=True)
    close = df["Close"].dropna()
    prices = close.to_numpy(dtype="float64")

    split = int(len(prices) * 0.8)
    X_train, y_train, _ = sequences(prices, WINDOW, split)
    X_test, _, last = sequences(prices, split, len(prices))

    model = build_model()
    # Validação = últimos 10% do treino (o teste fica intocado até a avaliação final).
    history = model.fit(
        X_train, y_train,
        epochs=100, batch_size=32, validation_split=0.1, shuffle=False, verbose=0,
        callbacks=[EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True)],
    )

    predicted = last * (1 + model.predict(X_test, verbose=0).ravel())
    actual = prices[split:]
    naive = prices[split - 1:-1]  # previsão ingênua: o fechamento do dia anterior

    MODELS.mkdir(exist_ok=True)
    DATA.mkdir(exist_ok=True)
    name = symbol.replace(".", "_")
    model.save(MODELS / f"{name}.keras")
    # Cópia dos preços para o Space funcionar mesmo se o Yahoo Finance recusar o acesso.
    close.rename("close").to_frame().rename_axis("date").to_csv(DATA / f"{name}.csv", float_format="%.4f")

    dates = close.index[split:]
    return {
        "name": TICKERS[symbol],
        "train": {"start": str(close.index[0].date()), "end": str(close.index[split - 1].date())},
        "test": {"start": str(dates[0].date()), "end": str(dates[-1].date()), "days": len(actual)},
        "epochs": len(history.history["loss"]),
        "lstm": metrics(actual, predicted),
        "naive": metrics(actual, naive),
        "backtest": {
            "dates": [str(d.date()) for d in dates],
            "actual": [round(float(v), 4) for v in actual],
            "predicted": [round(float(v), 4) for v in predicted],
        },
    }


if __name__ == "__main__":
    results = {}
    for symbol in TICKERS:
        results[symbol] = train(symbol)
        lstm, naive = results[symbol]["lstm"], results[symbol]["naive"]
        print(f"{symbol}: LSTM MAPE {lstm['mape']:.2f}% · ingênuo {naive['mape']:.2f}% "
              f"(MAE {lstm['mae']:.2f} vs {naive['mae']:.2f}) · {results[symbol]['epochs']} épocas")
    (MODELS / "metrics.json").write_text(json.dumps(results, indent=1), encoding="utf-8")
