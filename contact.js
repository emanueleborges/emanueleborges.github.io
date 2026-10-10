// Formulário de contato: envia ao Worker (salvo no banco D1 do Cloudflare),
// com Turnstile invisível contra robôs. Usa `t`, `currentLang` e `track` de script.js.
(() => {
  const form = document.querySelector(".contact-form");
  if (!form || !window.PortfolioApi?.enabled) return;
  form.hidden = false;

  const status = form.querySelector(".form-status");
  const button = form.querySelector("button[type=submit]");
  const label = form.querySelector(".form-send");
  const fields = ["name", "email", "message"].map((name) => form.elements[name]);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const body = form.querySelector(".form-body");
  const success = form.querySelector(".form-success");
  const counter = form.querySelector(".form-counter");
  const count = form.querySelector(".form-count");

  // Contador de caracteres da mensagem (amarelo perto do limite).
  const updateCounter = () => {
    const length = form.elements.message.value.length;
    count.textContent = String(length);
    counter.classList.toggle("is-near", length > 1800);
  };
  form.elements.message.addEventListener("input", updateCounter);

  // Corrige o destaque de erro assim que o campo é editado.
  fields.forEach((field) => field.addEventListener("input", () => field.removeAttribute("aria-invalid")));

  form.querySelector(".form-again").addEventListener("click", () => {
    success.hidden = true;
    body.hidden = false;
    fields[0].focus();
  });

  let lastStatus = null;
  const setStatus = (key, kind) => {
    lastStatus = key ? { key, kind } : null;
    status.textContent = key ? t(key) : "";
    status.className = `form-status${kind ? ` is-${kind}` : ""}`;
  };

  // Começa a carregar o Turnstile quando o visitante interage com o formulário.
  form.addEventListener("focusin", () => window.PortfolioApi.loadTurnstile().catch(() => {}), { once: true });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const [name, email, message] = fields.map((field) => field.value.trim());
    const invalid = {
      name: name.length < 2,
      email: !emailPattern.test(email),
      message: message.length < 5 || message.length > 2000,
    };
    fields.forEach((field) => field.setAttribute("aria-invalid", String(invalid[field.name])));
    if (Object.values(invalid).some(Boolean)) {
      setStatus("form.invalid", "error");
      fields.find((field) => invalid[field.name]).focus();
      return;
    }

    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    label.textContent = t("form.sending");
    setStatus("", "");
    const { ok, status: code } = await window.PortfolioApi.post("/contact", {
      name,
      email,
      message,
      lang: currentLang,
      website: form.elements.website.value,
    });
    button.disabled = false;
    button.removeAttribute("aria-busy");
    label.textContent = t("form.send");

    if (ok) {
      form.reset();
      updateCounter();
      fields.forEach((field) => field.removeAttribute("aria-invalid"));
      setStatus("", "");
      body.hidden = true;
      success.hidden = false;
      success.querySelector(".form-again").focus();
      track("contato-formulario", "Enviou mensagem pelo formulário");
    } else if (code === 429) {
      setStatus("form.rate", "error");
    } else if (code === 400) {
      setStatus("form.invalid", "error");
    } else {
      setStatus("form.error", "error");
    }
  });

  // Mensagens de status acompanham a troca de idioma.
  document.addEventListener("languagechange", () => {
    if (lastStatus) setStatus(lastStatus.key, lastStatus.kind);
  });
})();
