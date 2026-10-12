import { PortfolioApi } from "./api.js";

(() => {
  const STORAGE_KEY = "portfolio-region-consent-v2";
  const COPY = {
    en: {
      title: "Optional usage statistics",
      text: "If you accept, your browser contacts our Cloudflare Worker, which uses the connection IP to estimate a continent. The portfolio stores only a daily total by continent for up to 30 days; it does not store your IP, page, language, clicks, or device ID. Changing this choice stops future counts; a visit already merged into an anonymous total cannot be singled out. Your choice is saved only in this browser.",
      accept: "Accept",
      reject: "Reject",
      settings: "Privacy settings",
    },
    pt: {
      title: "Estatísticas opcionais de uso",
      text: "Se aceitar, seu navegador acessará nosso Worker na Cloudflare, que usa o IP da conexão para estimar o continente. O portfólio guarda somente um total diário por continente por até 30 dias; não guarda seu IP, página, idioma, cliques ou identificador do aparelho. Mudar a escolha interrompe contagens futuras; uma visita já somada a um total anônimo não pode ser separada. A escolha fica salva somente neste navegador.",
      accept: "Aceitar",
      reject: "Recusar",
      settings: "Preferências de privacidade",
    },
    es: {
      title: "Estadísticas de uso opcionales",
      text: "Si aceptas, tu navegador contactará nuestro Worker en Cloudflare, que usa la IP de conexión para estimar el continente. El portafolio guarda solo un total diario por continente durante un máximo de 30 días; no guarda tu IP, página, idioma, clics ni identificador del dispositivo. Cambiar la opción detiene futuros recuentos; una visita ya sumada a un total anónimo no se puede separar. La opción se guarda solo en este navegador.",
      accept: "Aceptar",
      reject: "Rechazar",
      settings: "Preferencias de privacidad",
    },
    fr: {
      title: "Statistiques d’utilisation facultatives",
      text: "Si vous acceptez, votre navigateur contacte notre Worker Cloudflare, qui utilise l’adresse IP de connexion pour estimer le continent. Le portfolio conserve uniquement un total quotidien par continent pendant 30 jours maximum ; il ne conserve pas votre IP, page, langue, clics ou identifiant d’appareil. Modifier ce choix arrête les futurs comptages ; une visite déjà intégrée à un total anonyme ne peut pas être isolée. Votre choix est enregistré uniquement dans ce navigateur.",
      accept: "Accepter",
      reject: "Refuser",
      settings: "Préférences de confidentialité",
    },
    it: {
      title: "Statistiche di utilizzo facoltative",
      text: "Se accetti, il browser contatterà il nostro Worker su Cloudflare, che usa l’IP di connessione per stimare il continente. Il portfolio conserva solo un totale giornaliero per continente per un massimo di 30 giorni; non conserva IP, pagina, lingua, clic o identificativi del dispositivo. Cambiare scelta interrompe i conteggi futuri; una visita già aggiunta a un totale anonimo non può essere separata. La scelta viene salvata solo in questo browser.",
      accept: "Accetta",
      reject: "Rifiuta",
      settings: "Preferenze privacy",
    },
    de: {
      title: "Optionale Nutzungsstatistiken",
      text: "Wenn du zustimmst, kontaktiert dein Browser unseren Cloudflare-Worker, der anhand der Verbindungs-IP den Kontinent schätzt. Das Portfolio speichert höchstens 30 Tage lang nur eine tägliche Summe je Kontinent, nicht deine IP, Seite, Sprache, Klicks oder Gerätekennung. Eine Änderung stoppt künftige Zählungen; ein bereits zur anonymen Summe addierter Besuch kann nicht einzeln herausgelöst werden. Deine Auswahl wird nur in diesem Browser gespeichert.",
      accept: "Zustimmen",
      reject: "Ablehnen",
      settings: "Datenschutzeinstellungen",
    },
    zh: {
      title: "可选使用统计",
      text: "如果你同意，浏览器会访问我们的 Cloudflare Worker，由它使用连接 IP 估算所在洲。作品集最多保存 30 天的每日大洲汇总，不保存你的 IP、页面、语言、点击或设备标识。更改选择会停止未来统计；已加入匿名总数的访问无法单独删除。你的选择仅保存在此浏览器中。",
      accept: "允许",
      reject: "拒绝",
      settings: "隐私设置",
    },
    ru: {
      title: "Необязательная статистика использования",
      text: "Если вы согласны, браузер обратится к нашему Worker в Cloudflare, который использует IP подключения для определения континента. Портфолио хранит только суточный итог по континентам не более 30 дней; IP, страницу, язык, клики и идентификатор устройства не сохраняет. Изменение выбора остановит будущий подсчёт; посещение, уже добавленное к анонимной сумме, нельзя удалить отдельно. Выбор сохраняется только в этом браузере.",
      accept: "Разрешить",
      reject: "Отклонить",
      settings: "Настройки конфиденциальности",
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
      .panel, .settings {
        position: fixed; z-index: 2147483000; color: #201c28;
        border: 1px solid #c9c4d0; background: #fff; box-shadow: 0 8px 32px #0003;
      }
      .panel {
        inset: auto auto max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
        width: min(420px, calc(100vw - 32px)); padding: 18px; border-radius: 14px;
      }
      .panel[hidden], .settings[hidden] { display: none; }
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
      .settings {
        inset: auto auto max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
        min-height: 38px; padding: 7px 11px; border-radius: 999px; font-size: 12px;
      }
      @media (max-width: 480px) {
        .panel { inset-inline: 8px; bottom: max(8px, env(safe-area-inset-bottom)); width: auto; }
        .settings { inset-inline-start: 8px; bottom: max(8px, env(safe-area-inset-bottom)); }
      }
      @media print { .panel, .settings { display: none !important; } }
    </style>
    <section class="panel" role="region" aria-labelledby="consent-title">
      <h2 id="consent-title"></h2>
      <p id="consent-description"></p>
      <div class="actions">
        <button class="primary" type="button" data-choice="accepted"></button>
        <button type="button" data-choice="rejected"></button>
      </div>
    </section>
    <button class="settings" type="button" aria-expanded="false" hidden></button>`;

  const panel = root.shadowRoot.querySelector(".panel");
  const settings = root.shadowRoot.querySelector(".settings");
  const updateText = () => {
    const copy = COPY[language()];
    root.shadowRoot.querySelector("#consent-title").textContent = copy.title;
    root.shadowRoot.querySelector("#consent-description").textContent = copy.text;
    root.shadowRoot.querySelector('[data-choice="accepted"]').textContent = copy.accept;
    root.shadowRoot.querySelector('[data-choice="rejected"]').textContent = copy.reject;
    settings.textContent = copy.settings;
  };

  const current = readConsent();
  panel.hidden = current === "accepted" || current === "rejected";
  settings.hidden = !panel.hidden;
  if (current === "accepted") enableStatistics();
  updateText();
  document.addEventListener("languagechange", updateText);

  root.shadowRoot.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.choice;
      writeConsent(choice);
      panel.hidden = true;
      settings.hidden = false;
      settings.setAttribute("aria-expanded", "false");
      if (choice === "accepted") enableStatistics();
      settings.focus();
    });
  });

  settings.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    settings.setAttribute("aria-expanded", String(open));
    if (open) root.shadowRoot.querySelector('[data-choice="accepted"]').focus();
  });

  const mount = () => document.body.append(root);
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount, { once: true });
})();
