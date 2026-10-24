import { PortfolioApi } from "./api.js";

(() => {
  const STORAGE_KEY = "portfolio-region-consent-v3";
  const COPY = {
    en: {
      title: "Optional usage statistics",
      text: "If you accept, your browser contacts our Cloudflare Worker, which uses the connection IP to estimate a continent. The portfolio stores only daily totals for up to 30 days: visits per continent and clicks per link (such as LinkedIn, GitHub and the résumé); it does not store your IP, page, language, or device ID. Your choice is saved only in this browser. To change it later, clear this site's saved data in your browser settings.",
      accept: "Accept",
      reject: "Reject",
    },
    pt: {
      title: "Estatísticas opcionais de uso",
      text: "Se aceitar, seu navegador acessará nosso Worker na Cloudflare, que usa o IP da conexão para estimar o continente. O portfólio guarda somente totais diários por até 30 dias: acessos por continente e cliques por link (como LinkedIn, GitHub e currículo); não guarda seu IP, página, idioma ou identificador do aparelho. A escolha fica salva somente neste navegador. Para alterá-la depois, limpe os dados salvos deste site nas configurações do navegador.",
      accept: "Aceitar",
      reject: "Recusar",
    },
    es: {
      title: "Estadísticas de uso opcionales",
      text: "Si aceptas, tu navegador contactará nuestro Worker en Cloudflare, que usa la IP de conexión para estimar el continente. El portafolio guarda solo totales diarios durante un máximo de 30 días: visitas por continente y clics por enlace (como LinkedIn, GitHub y el currículum); no guarda tu IP, página, idioma ni identificador del dispositivo. La opción se guarda solo en este navegador. Para cambiarla más adelante, borra los datos guardados de este sitio en la configuración del navegador.",
      accept: "Aceptar",
      reject: "Rechazar",
    },
  };

  const language = () => {
    const queryLang = new URLSearchParams(location.search).get("lang");
    const lang = queryLang || document.documentElement.lang || "en";
    if (lang.startsWith("pt")) return "pt";
    return COPY[lang.slice(0, 2)] ? lang.slice(0, 2) : "en";
  };

  const readConsent = () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  };

  const writeConsent = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // A choice still applies to this page when browser storage is unavailable.
    }
  };

  // Alvo do clique: data-track (links fixos) ou o projeto (data-demo / data-repo).
  const clickTarget = (element) => {
    if (!element) return null;
    if (element.dataset.track) return element.dataset.track;
    if (element.dataset.demo) return `demo:${element.dataset.demo}`;
    if (element.dataset.repo) return `code:${element.dataset.repo}`;
    return null;
  };

  const trackClicks = () => {
    document.addEventListener(
      "click",
      (event) => {
        const target = clickTarget(event.target.closest?.("[data-track], [data-demo], [data-repo]"));
        if (target) PortfolioApi.recordClick(target).catch(() => {});
      },
      { capture: true },
    );
  };

  const enableStatistics = () => {
    PortfolioApi.recordVisit().catch((error) => {
      console.warn("Não foi possível registrar a contagem regional:", error);
    });
    trackClicks();
  };

  const root = document.createElement("div");
  root.setAttribute("data-analytics-consent", "");
  root.attachShadow({ mode: "open" });
  root.shadowRoot.innerHTML = `
    <style>
      :host { all: initial; color-scheme: light; font: 14px/1.5 system-ui, sans-serif; }
      * { box-sizing: border-box; }
      .panel {
        position: fixed; z-index: 2147483000; color: #201c28;
        inset: auto auto max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
        width: min(420px, calc(100vw - 32px)); padding: 18px; border: 1px solid #c9c4d0;
        border-radius: 14px; background: #fff; box-shadow: 0 8px 32px #0003;
      }
      .panel[hidden] { display: none; }
      h2 { margin: 0 0 8px; font: 700 16px/1.35 system-ui, sans-serif; }
      p { margin: 0 0 14px; }
      .actions { display: flex; flex-wrap: wrap; gap: 8px; }
      button {
        min-height: 40px; padding: 8px 14px; border: 1px solid #514c5c;
        border-radius: 8px; background: #fff; color: #201c28;
        font: 600 14px/1.2 system-ui, sans-serif; cursor: pointer;
      }
      button.primary { background: #292333; color: #fff; }
      button:focus-visible { outline: 3px solid #1769aa; outline-offset: 2px; }
      @media (max-width: 480px) {
        .panel { inset-inline: 8px; bottom: max(8px, env(safe-area-inset-bottom)); width: auto; }
      }
      @media print { .panel { display: none !important; } }
    </style>
    <section class="panel" role="region" aria-labelledby="consent-title">
      <h2 id="consent-title"></h2>
      <p id="consent-description"></p>
      <div class="actions">
        <button class="primary" type="button" data-choice="accepted"></button>
        <button type="button" data-choice="rejected"></button>
      </div>
    </section>`;

  const panel = root.shadowRoot.querySelector(".panel");
  const updateText = () => {
    const copy = COPY[language()];
    root.shadowRoot.querySelector("#consent-title").textContent = copy.title;
    root.shadowRoot.querySelector("#consent-description").textContent = copy.text;
    root.shadowRoot.querySelector('[data-choice="accepted"]').textContent = copy.accept;
    root.shadowRoot.querySelector('[data-choice="rejected"]').textContent = copy.reject;
  };

  // Página aberta dentro do modal do portfólio (mesma origem): a janela principal já pergunta e conta.
  const framed = (() => {
    try {
      return window.top !== window && window.top.location.origin === location.origin;
    } catch {
      return false;
    }
  })();
  const current = readConsent();
  panel.hidden = framed || current === "accepted" || current === "rejected";
  if (current === "accepted" && !framed) enableStatistics();
  updateText();
  document.addEventListener("languagechange", updateText);

  root.shadowRoot.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.choice;
      writeConsent(choice);
      panel.hidden = true;
      if (choice === "accepted") enableStatistics();
    });
  });

  const mount = () => document.body.append(root);
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount, { once: true });
})();
