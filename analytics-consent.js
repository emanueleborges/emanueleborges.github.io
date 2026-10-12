import { PortfolioApi } from "./api.js";

(() => {
  const STORAGE_KEY = "portfolio-region-consent-v2";
  const COPY = {
    en: {
      title: "Optional usage statistics",
      text: "If you accept, your browser contacts our Cloudflare Worker, which uses the connection IP to estimate a continent. The portfolio stores only a daily total by continent for up to 30 days; it does not store your IP, page, language, clicks, or device ID. Your choice is saved only in this browser. To change it later, clear this site's saved data in your browser settings.",
      accept: "Accept",
      reject: "Reject",
    },
    pt: {
      title: "Estatísticas opcionais de uso",
      text: "Se aceitar, seu navegador acessará nosso Worker na Cloudflare, que usa o IP da conexão para estimar o continente. O portfólio guarda somente um total diário por continente por até 30 dias; não guarda seu IP, página, idioma, cliques ou identificador do aparelho. A escolha fica salva somente neste navegador. Para alterá-la depois, limpe os dados salvos deste site nas configurações do navegador.",
      accept: "Aceitar",
      reject: "Recusar",
    },
    es: {
      title: "Estadísticas de uso opcionales",
      text: "Si aceptas, tu navegador contactará nuestro Worker en Cloudflare, que usa la IP de conexión para estimar el continente. El portafolio guarda solo un total diario por continente durante un máximo de 30 días; no guarda tu IP, página, idioma, clics ni identificador del dispositivo. La opción se guarda solo en este navegador. Para cambiarla más adelante, borra los datos guardados de este sitio en la configuración del navegador.",
      accept: "Aceptar",
      reject: "Rechazar",
    },
    fr: {
      title: "Statistiques d’utilisation facultatives",
      text: "Si vous acceptez, votre navigateur contacte notre Worker Cloudflare, qui utilise l’adresse IP de connexion pour estimer le continent. Le portfolio conserve uniquement un total quotidien par continent pendant 30 jours maximum ; il ne conserve pas votre IP, page, langue, clics ou identifiant d’appareil. Votre choix est enregistré uniquement dans ce navigateur. Pour le modifier plus tard, effacez les données enregistrées pour ce site dans les paramètres du navigateur.",
      accept: "Accepter",
      reject: "Refuser",
    },
    it: {
      title: "Statistiche di utilizzo facoltative",
      text: "Se accetti, il browser contatterà il nostro Worker su Cloudflare, che usa l’IP di connessione per stimare il continente. Il portfolio conserva solo un totale giornaliero per continente per un massimo di 30 giorni; non conserva IP, pagina, lingua, clic o identificativi del dispositivo. La scelta viene salvata solo in questo browser. Per cambiarla in seguito, cancella i dati salvati di questo sito dalle impostazioni del browser.",
      accept: "Accetta",
      reject: "Rifiuta",
    },
    de: {
      title: "Optionale Nutzungsstatistiken",
      text: "Wenn du zustimmst, kontaktiert dein Browser unseren Cloudflare-Worker, der anhand der Verbindungs-IP den Kontinent schätzt. Das Portfolio speichert höchstens 30 Tage lang nur eine tägliche Summe je Kontinent, nicht deine IP, Seite, Sprache, Klicks oder Gerätekennung. Deine Auswahl wird nur in diesem Browser gespeichert. Um sie später zu ändern, lösche die für diese Website gespeicherten Daten in den Browsereinstellungen.",
      accept: "Zustimmen",
      reject: "Ablehnen",
    },
    zh: {
      title: "可选使用统计",
      text: "如果你同意，浏览器会访问我们的 Cloudflare Worker，由它使用连接 IP 估算所在洲。作品集最多保存 30 天的每日大洲汇总，不保存你的 IP、页面、语言、点击或设备标识。你的选择仅保存在此浏览器中。以后如需更改，请在浏览器设置中清除此网站保存的数据。",
      accept: "允许",
      reject: "拒绝",
    },
    ru: {
      title: "Необязательная статистика использования",
      text: "Если вы согласны, браузер обратится к нашему Worker в Cloudflare, который использует IP подключения для определения континента. Портфолио хранит только суточный итог по континентам не более 30 дней; IP, страницу, язык, клики и идентификатор устройства не сохраняет. Выбор сохраняется только в этом браузере. Чтобы изменить его позже, удалите сохранённые данные этого сайта в настройках браузера.",
      accept: "Разрешить",
      reject: "Отклонить",
    },
  };

  const language = () => {
    const queryLang = new URLSearchParams(location.search).get("lang");
    const lang = queryLang || document.documentElement.lang || "en";
    if (lang.startsWith("pt")) return "pt";
    if (lang.startsWith("zh")) return "zh";
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

  const enableStatistics = () => {
    PortfolioApi.recordVisit().catch((error) => {
      console.warn("Não foi possível registrar a contagem regional:", error);
    });
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

  const current = readConsent();
  panel.hidden = current === "accepted" || current === "rejected";
  if (current === "accepted") enableStatistics();
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
