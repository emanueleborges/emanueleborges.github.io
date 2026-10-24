// Rodapé técnico: o modelo de IA do chat, o estado da IA (online / cota atingida → busca local) e, quando o
// visitante clica em "medir conexão", o ping até o Worker e o data center da Cloudflare que o atendeu
// (ex.: GRU = São Paulo). Sem clique, nada é enviado: o estado vem da última pergunta ao chat ou do clique.

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

  // Estado da IA: "online", "quota" (cota gratuita do dia esgotada) ou "unavailable"; null = ainda não se sabe.
  let aiState = null;
  const AI_STATE_KEYS = { online: "sys.aiOnline", quota: "sys.aiQuota", unavailable: "sys.aiDown" };
  const showAiState = () => {
    field("state").textContent = aiState ? t(AI_STATE_KEYS[aiState]) : "—";
    field("state").dataset.state = aiState ?? "";
  };
  document.addEventListener("aistate", (event) => {
    aiState = event.detail.state;
    showAiState();
  });
  document.addEventListener("languagechange", showAiState);

  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = t("sys.running");
    dot.dataset.state = "busy";
    try {
      const { ms, colo, model, ai } = await PortfolioApi.status();
      if (ai) {
        aiState = ai;
        showAiState();
      }
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
