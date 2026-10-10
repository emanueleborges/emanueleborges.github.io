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
    label.textContent = t("form.send");

    if (ok) {
      form.reset();
      fields.forEach((field) => field.removeAttribute("aria-invalid"));
      setStatus("form.success", "success");
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
