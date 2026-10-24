// Conexão do site com o Cloudflare Worker (chat com IA e formulário de contato)
// e com o Turnstile (anti-robô invisível). Tudo no plano gratuito do Cloudflare.
export const PortfolioApi = (() => {
  // Endereço do Worker e chave pública do Turnstile do domínio: data/perfil.json (servicos).
  const { worker: BASE, turnstile: TURNSTILE_SITE_KEY } = globalThis.PERFIL.servicos;

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

  const recordVisit = async () => {
    const response = await fetch(`${BASE}/visit`, {
      method: "POST",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Contagem regional indisponível (${response.status})`);
  };

  // Total diário de cliques num link (só após consentimento). keepalive: o envio continua
  // mesmo se o clique sair da página; text/plain evita a pré-checagem de CORS.
  const recordClick = async (target) => {
    const response = await fetch(`${BASE}/click`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ target }),
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
      keepalive: true,
    });
    if (!response.ok) throw new Error(`Contagem de cliques indisponível (${response.status})`);
  };

  // Rodapé técnico: mede o tempo de ida e volta até o Worker e devolve { ms, colo, model }.
  // Só roda quando o visitante pede (não guarda nada; a primeira chamada abre a conexão).
  const status = async () => {
    let best = Infinity;
    let data = null;
    for (let i = 0; i < 3; i += 1) {
      const start = performance.now();
      const response = await fetch(`${BASE}/status`, { credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store" });
      if (!response.ok) throw new Error(`Status indisponível (${response.status})`);
      data = await response.json();
      if (i > 0) best = Math.min(best, performance.now() - start);
    }
    return { ms: Math.round(best), colo: data.colo, model: data.model };
  };

  return { enabled: Boolean(BASE), loadTurnstile, post, recordVisit, recordClick, status };
})();
