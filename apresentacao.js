/* ---------- Apresentação falada (botão ▶ na foto do "Sobre mim") ---------- */

// Áudios gerados uma vez por scripts/gerar-apresentacao.py (voz da pessoa do portfólio, clonada por IA) e servidos
// como arquivos estáticos: tocar não chama nenhuma IA. Fala um resumo do perfil, uma faixa por frase, com legenda.
const BASE = new URL(globalThis.PERFIL.audio.apresentacao, document.baseURI); // data/perfil.json
const button = document.querySelector("[data-voice]");
const figure = button?.closest(".about-photo");
const label = button?.querySelector("[data-voice-label]");
const caption = document.querySelector("[data-voice-caption]");
const audio = new Audio();

let tracks = {};
let session = null;

const lang = () => document.documentElement.lang.split("-")[0];
const t = (key) => window.I18N?.[lang()]?.[key] ?? window.I18N?.pt?.[key] ?? key;

const render = () => {
  const speaking = Boolean(session);
  button.hidden = !tracks[lang()];
  button.setAttribute("aria-pressed", String(speaking));
  label.textContent = t(speaking ? "about.listenStop" : "about.listen");
  figure.classList.toggle("is-speaking", speaking);
  caption.hidden = !speaking;
  caption.dataset.note = t("about.voiceNote");
};

const stop = () => {
  session = null;
  audio.pause();
  caption.textContent = "";
  render();
};

// Toca uma faixa e termina quando ela acaba ou quando o visitante para.
const playOne = (src) =>
  new Promise((resolve) => {
    audio.src = src;
    audio.onended = audio.onerror = audio.onpause = () => resolve();
    audio.play().catch(resolve);
  });

// Um único elemento <audio> para todas as faixas: o Safari do iPhone só libera o que o clique tocou.
const play = async () => {
  const current = (session = {});
  const segments = tracks[lang()];
  const urls = segments.map((segment) => new URL(segment.file, BASE).href);
  urls.slice(1).forEach((url) => fetch(url).catch(() => {}));
  render();
  for (const [i, segment] of segments.entries()) {
    if (session !== current) return;
    caption.textContent = segment.text;
    await playOne(urls[i]);
  }
  if (session === current) stop();
};

if (button) {
  button.addEventListener("click", () => (session ? stop() : play()));
  document.addEventListener("languagechange", () => (session ? stop() : render()));
  // Sempre confere com o servidor: a legenda precisa ser da mesma versão do áudio.
  fetch(new URL("faixas.json", BASE), { cache: "no-cache" })
    .then((response) => (response.ok ? response.json() : {}))
    .then((data) => {
      tracks = data;
      render();
    })
    .catch(() => {});
}
