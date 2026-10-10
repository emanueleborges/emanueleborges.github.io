// Conexão do site com o Cloudflare Worker (chat com IA e formulário de contato)
// e com o Turnstile (anti-robô invisível). Tudo no plano gratuito do Cloudflare.
window.PortfolioApi = (() => {
  const BASE = "https://emanuel-portfolio-chat.emanuel-portfolio-chat.workers.dev";
  // Chave pública do Turnstile para emanueleborges.github.io.
  const TURNSTILE_SITE_KEY = "0x4AAAAAAFSypCNI4YX6-cMF";

  let ready = null;
  let widget = null;
  let resolveToken = null;

  // Carrega o script do Turnstile só quando for necessário (chat aberto ou formulário em uso).
  const loadTurnstile = () => {
    ready ??= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => reject(new Error("turnstile"));
      document.head.append(script);
    });
    return ready;
  };

  // Gera um token novo a cada envio (cada token vale uma única vez).
  const turnstileToken = async () => {
    try {
      const turnstile = await loadTurnstile();
      return await new Promise((resolve) => {
        resolveToken = resolve;
        setTimeout(() => resolve(null), 10000);
        if (widget === null) {
          const holder = document.createElement("div");
          holder.className = "turnstile-holder";
          document.body.append(holder);
          widget = turnstile.render(holder, {
            sitekey: TURNSTILE_SITE_KEY,
            execution: "execute",
            appearance: "interaction-only",
            callback: (token) => resolveToken?.(token),
            "error-callback": () => resolveToken?.(null),
          });
        } else {
          turnstile.reset(widget);
        }
        turnstile.execute(widget);
      });
    } catch {
      return null;
    }
  };

  // Envia JSON ao Worker com token do Turnstile; devolve { ok, status, data }.
  const post = async (path, body, timeoutMs = 25000) => {
    const token = await turnstileToken();
    if (!token) return { ok: false, status: 0, data: null };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, turnstileToken: token }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null);
      return { ok: response.ok, status: response.status, data };
    } catch {
      return { ok: false, status: 0, data: null };
    } finally {
      clearTimeout(timer);
    }
  };

  return { enabled: Boolean(BASE), loadTurnstile, post };
})();
