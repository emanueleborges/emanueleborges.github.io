// Nota do portfólio: barra de 0% a 100% que começa em 50%. Ao enviar, o Worker soma 1 ao total
// diário daquela nota (sem IP ou identificadores). Uma nota por navegador.
import { PortfolioApi as api } from "./api.js";
import { t } from "./script.js";

const STORAGE_KEY = "portfolio-score-sent";

const form = document.querySelector("[data-score-form]");
const input = form?.querySelector("[data-score-input]");
const output = form?.querySelector("[data-score-value]");
const submit = form?.querySelector("[data-score-submit]");
const status = form?.querySelector("[data-score-status]");

const readSent = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeSent = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Sem armazenamento (navegação privada): a nota vale só para esta página.
  }
};

// Estado da mensagem, para redesenhar no idioma novo: null, "sending", "error" ou "thanks".
let state = null;

const renderStatus = () => {
  status.textContent = state ? t(`score.${state}`, { value: input.value }) : "";
  status.classList.toggle("is-error", state === "error");
};

const showValue = () => {
  const value = `${input.value}%`;
  output.textContent = value;
  input.setAttribute("aria-valuetext", value);
  form.style.setProperty("--score", `${input.value}%`);
};

const lock = () => {
  input.disabled = true;
  submit.disabled = true;
  submit.hidden = true;
};

if (form && api.enabled) {
  const sent = readSent();
  if (sent !== null && /^\d{1,3}$/.test(sent)) {
    input.value = sent;
    state = "thanks";
    lock();
  }
  showValue();
  renderStatus();

  input.addEventListener("input", showValue);
  // Carrega o Turnstile antes do envio, quando o visitante começa a mexer na barra.
  input.addEventListener("pointerdown", () => api.loadTurnstile().catch(() => {}), { once: true });
  document.addEventListener("languagechange", renderStatus);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    state = "sending";
    renderStatus();
    const score = Number(input.value);
    const { ok } = await api.post("/score", { score });
    if (ok) {
      writeSent(String(score));
      state = "thanks";
      lock();
    } else {
      state = "error";
      submit.disabled = false;
    }
    renderStatus();
  });
} else if (form) {
  form.hidden = true;
}
