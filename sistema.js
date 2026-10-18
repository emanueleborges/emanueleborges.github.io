// Rodapé técnico: o modelo de IA do chat e, quando o visitante clica em "medir conexão", o ping até o
// Worker e o data center da Cloudflare que o atendeu (ex.: GRU = São Paulo). Sem clique, nada é enviado.

import { PortfolioApi } from "./api.js";
import { t } from "./script.js";

const bar = document.querySelector("[data-system]");

if (bar && PortfolioApi.enabled) {
  const button = bar.querySelector("[data-system-run]");
  const dot = bar.querySelector("[data-system-dot]");
  const field = (name) => bar.querySelector(`[data-system-${name}]`);

  // "qwen3-30b-a3b-fp8" → "Qwen3 30B"
  const modelName = (id) => {
    const [family, size] = id.split("-");
    return `${family.charAt(0).toUpperCase()}${family.slice(1)} ${size?.toUpperCase() ?? ""}`.trim();
  };

  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = t("sys.running");
    dot.dataset.state = "busy";
    try {
      const { ms, colo, model } = await PortfolioApi.status();
      field("ping").textContent = `${ms} ms`;
      field("colo").textContent = colo ?? "—";
      if (model) field("model").textContent = modelName(model);
      dot.dataset.state = "ok";
    } catch {
      field("ping").textContent = t("sys.offline");
      dot.dataset.state = "down";
    } finally {
      button.disabled = false;
      button.textContent = t("sys.run");
    }
  });
}
