import { Demo } from "../demos.js";
import { PortfolioApi } from "../../api.js";

// Demo "Gerador de imagens": o texto vai ao Worker (POST /image), que modera e gera com FLUX.1 [schnell].
// O pedido pode ser escrito em qualquer idioma: o Worker traduz para o inglês antes de moderar e gerar.
// Nada é salvo: a imagem chega em base64 e só existe nesta aba.
// Exemplos no idioma escolhido (ex1…ex4): o Worker traduz para o inglês antes de gerar.
const EXAMPLE_KEYS = ["ex1", "ex2", "ex3", "ex4"];

const T = {
  en: {
    "meta.title": "AI Image Generator — FLUX.1",
    "meta.description": "Type a description and generate an image with FLUX.1 [schnell] on Cloudflare Workers AI, with layered moderation and no storage.",
    lang: "Language",
    kicker: "// AI DEMO · TEXT TO IMAGE",
    title: "Image generator <span>with FLUX.1.</span>",
    lead: "Describe an image and a diffusion model generates it in a few seconds on Cloudflare's free tier, with moderation before every generation. Nothing you type or generate is stored.",
    back: "← Back to portfolio",
    code: "View code ↗",
    promptLabel: "Describe the image",
    placeholder: "e.g. a toucan made of circuit boards, studio lighting",
    examplesLabel: "Or try an example:",
    generate: "Generate image",
    generating: "Generating…",
    empty: "Your image will appear here.",
    working: "Checking the request and generating. This usually takes 3–8 seconds…",
    done: "Generated in {seconds} s.",
    download: "Download ↓",
    sent: "Sent to the model (English):",
    ex1: "A lighthouse on the Amazon river at sunset, watercolor",
    ex2: "Isometric illustration of a tiny server room inside a terrarium",
    ex3: "A capybara astronaut floating near Saturn, 3D render",
    ex4: "Minimalist poster of the Manaus Opera House, orange and green",
    "error.short": "Write at least 3 characters.",
    "error.unsafe_prompt": "This request was blocked by moderation. Try describing something else.",
    "error.rate_limited": "Too many requests. Wait a minute and try again.",
    "error.daily_limit": "Today's free image quota is used up. It resets at 00:00 UTC.",
    "error.turnstile_failed": "The anti-bot check failed. Reload the page and try again.",
    "error.generic": "Image generation is unavailable right now. Try again later.",
    "error.visitor_limit": "You've reached the limit of 2 images per day. Come back after 00:00 UTC.",
    quota: "Limit: 2 images per visitor per day.",
    left1: "You can generate 1 more image today.",
    left0: "That was your last image for today. The limit resets at 00:00 UTC.",
    howTitle: "How it works",
    s1Title: "Limits",
    s1Text: "2 images per day per visitor, plus a global daily ceiling that protects the free quota shared with the chat.",
    s2Title: "Anti-bot",
    s2Text: "An invisible Turnstile token proves the request comes from a person on this site.",
    s3Title: "Translate + moderate",
    s3Text: "Your text is translated into English (Qwen3); then a term filter and Llama Guard 3 check the translation before any image is made.",
    s4Title: "Diffusion",
    s4Text: "FLUX.1 [schnell] turns noise into a 1024×1024 image in 4 steps on Workers AI.",
    s5Title: "No storage",
    s5Text: "The image comes back as base64 and lives only in this tab. The server keeps only the daily count.",
    limits: "<strong>About this demo:</strong> generated images can be inaccurate or strange, and moderation is not perfect. Don't use it for real people, logos or anything you wouldn't show in a job interview.",
  },
  pt: {
    "meta.title": "Gerador de Imagens com IA — FLUX.1",
    "meta.description": "Escreva uma descrição e gere uma imagem com o FLUX.1 [schnell] no Cloudflare Workers AI, com moderação em camadas e sem armazenamento.",
    lang: "Idioma",
    kicker: "// DEMO DE IA · TEXTO PARA IMAGEM",
    title: "Gerador de imagens <span>com FLUX.1.</span>",
    lead: "Descreva uma imagem e um modelo de difusão a gera em poucos segundos no plano gratuito da Cloudflare, com moderação antes de cada geração. Nada do que você escreve ou gera é salvo.",
    back: "← Voltar ao portfólio",
    code: "Ver código ↗",
    promptLabel: "Descreva a imagem",
    placeholder: "ex.: um tucano feito de placas de circuito, luz de estúdio",
    examplesLabel: "Ou teste um exemplo:",
    generate: "Gerar imagem",
    generating: "Gerando…",
    empty: "Sua imagem aparece aqui.",
    working: "Conferindo o pedido e gerando. Costuma levar de 3 a 8 segundos…",
    done: "Gerada em {seconds} s.",
    download: "Baixar ↓",
    sent: "Enviado ao modelo (em inglês):",
    ex1: "Um farol no rio Amazonas ao pôr do sol, aquarela",
    ex2: "Ilustração isométrica de uma sala de servidores dentro de um terrário",
    ex3: "Uma capivara astronauta flutuando perto de Saturno, render 3D",
    ex4: "Pôster minimalista do Teatro Amazonas, laranja e verde",
    "error.short": "Escreva pelo menos 3 caracteres.",
    "error.unsafe_prompt": "Este pedido foi bloqueado pela moderação. Tente descrever outra coisa.",
    "error.rate_limited": "Muitos pedidos. Espere um minuto e tente de novo.",
    "error.daily_limit": "A cota gratuita de imagens de hoje acabou. Ela renova às 00:00 UTC.",
    "error.turnstile_failed": "A verificação anti-robô falhou. Recarregue a página e tente de novo.",
    "error.generic": "A geração de imagens está indisponível agora. Tente mais tarde.",
    "error.visitor_limit": "Você atingiu o limite de 2 imagens por dia. Volte depois das 00:00 UTC.",
    quota: "Limite: 2 imagens por visitante por dia.",
    left1: "Você ainda pode gerar 1 imagem hoje.",
    left0: "Essa foi sua última imagem de hoje. O limite renova às 00:00 UTC.",
    howTitle: "Como funciona",
    s1Title: "Limites",
    s1Text: "2 imagens por dia por visitante, mais um teto diário global que protege a cota gratuita dividida com o chat.",
    s2Title: "Anti-robô",
    s2Text: "Um token invisível do Turnstile comprova que o pedido vem de uma pessoa neste site.",
    s3Title: "Tradução e moderação",
    s3Text: "Seu texto é traduzido para o inglês (Qwen3); depois um filtro de termos e o Llama Guard 3 conferem a tradução antes de gerar.",
    s4Title: "Difusão",
    s4Text: "O FLUX.1 [schnell] transforma ruído numa imagem 1024×1024 em 4 passos no Workers AI.",
    s5Title: "Sem armazenamento",
    s5Text: "A imagem volta em base64 e só existe nesta aba. O servidor guarda apenas a contagem do dia.",
    limits: "<strong>Sobre esta demo:</strong> as imagens geradas podem sair imprecisas ou estranhas, e a moderação não é perfeita. Não use para pessoas reais, marcas ou nada que você não mostraria numa entrevista de emprego.",
  },
  es: {
    "meta.title": "Generador de Imágenes con IA — FLUX.1",
    "meta.description": "Escribe una descripción y genera una imagen con FLUX.1 [schnell] en Cloudflare Workers AI, con moderación por capas y sin almacenamiento.",
    lang: "Idioma",
    kicker: "// DEMO DE IA · TEXTO A IMAGEN",
    title: "Generador de imágenes <span>con FLUX.1.</span>",
    lead: "Describe una imagen y un modelo de difusión la genera en pocos segundos en el plan gratuito de Cloudflare, con moderación antes de cada generación. Nada de lo que escribes o generas se guarda.",
    back: "← Volver al portafolio",
    code: "Ver código ↗",
    promptLabel: "Describe la imagen",
    placeholder: "p. ej.: un tucán hecho de placas de circuito, luz de estudio",
    examplesLabel: "O prueba un ejemplo:",
    generate: "Generar imagen",
    generating: "Generando…",
    empty: "Tu imagen aparecerá aquí.",
    working: "Revisando la petición y generando. Suele tardar de 3 a 8 segundos…",
    done: "Generada en {seconds} s.",
    download: "Descargar ↓",
    sent: "Enviado al modelo (en inglés):",
    ex1: "Un faro en el río Amazonas al atardecer, acuarela",
    ex2: "Ilustración isométrica de una pequeña sala de servidores dentro de un terrario",
    ex3: "Un capibara astronauta flotando cerca de Saturno, render 3D",
    ex4: "Póster minimalista del Teatro Amazonas, naranja y verde",
    "error.short": "Escribe al menos 3 caracteres.",
    "error.unsafe_prompt": "La moderación bloqueó esta petición. Intenta describir otra cosa.",
    "error.rate_limited": "Demasiadas peticiones. Espera un minuto e inténtalo de nuevo.",
    "error.daily_limit": "La cuota gratuita de imágenes de hoy se agotó. Se renueva a las 00:00 UTC.",
    "error.turnstile_failed": "La verificación antibots falló. Recarga la página e inténtalo de nuevo.",
    "error.generic": "La generación de imágenes no está disponible ahora. Inténtalo más tarde.",
    "error.visitor_limit": "Alcanzaste el límite de 2 imágenes al día. Vuelve después de las 00:00 UTC.",
    quota: "Límite: 2 imágenes por visitante al día.",
    left1: "Todavía puedes generar 1 imagen hoy.",
    left0: "Esa fue tu última imagen de hoy. El límite se renueva a las 00:00 UTC.",
    howTitle: "Cómo funciona",
    s1Title: "Límites",
    s1Text: "2 imágenes al día por visitante, más un tope diario global que protege la cuota gratuita compartida con el chat.",
    s2Title: "Antibots",
    s2Text: "Un token invisible de Turnstile demuestra que la petición viene de una persona en este sitio.",
    s3Title: "Traducción y moderación",
    s3Text: "Tu texto se traduce al inglés (Qwen3); luego un filtro de términos y Llama Guard 3 revisan la traducción antes de generar.",
    s4Title: "Difusión",
    s4Text: "FLUX.1 [schnell] convierte ruido en una imagen de 1024×1024 en 4 pasos en Workers AI.",
    s5Title: "Sin almacenamiento",
    s5Text: "La imagen vuelve en base64 y solo existe en esta pestaña. El servidor guarda solo el recuento del día.",
    limits: "<strong>Sobre esta demo:</strong> las imágenes pueden salir imprecisas o extrañas y la moderación no es perfecta. No la uses con personas reales, marcas ni nada que no mostrarías en una entrevista de trabajo.",
  },
};

const form = document.querySelector("[data-form]");
const promptInput = document.querySelector("[data-prompt]");
const counter = document.querySelector("[data-counter]");
const button = document.querySelector("[data-generate]");
const status = document.querySelector("[data-status]");
const canvas = document.querySelector("[data-canvas]");
const meta = document.querySelector("[data-meta]");
const quotaNote = document.querySelector("[data-quota]");
let busy = false;
// Lembra, só neste navegador, que a cota do dia (UTC) acabou — o Worker é quem garante o limite.
const QUOTA_KEY = "image-quota-done";
const utcDay = () => new Date().toISOString().slice(0, 10);
const quotaDone = () => {
  try {
    return localStorage.getItem(QUOTA_KEY) === utcDay();
  } catch {
    return false;
  }
};
const markQuotaDone = () => {
  try {
    localStorage.setItem(QUOTA_KEY, utcDay());
  } catch {
    /* navegação privada */
  }
  button.disabled = true;
};
// Texto da cota: o limite, quantas restam ou o aviso de que acabou.
let quotaKey = "quota";
const showQuota = (key) => {
  quotaKey = key;
  quotaNote.textContent = Demo.t(key);
  quotaNote.classList.toggle("over", key === "left0" || key === "error.visitor_limit");
};

const setStatus = (text, error = false) => {
  status.textContent = text;
  status.classList.toggle("error", error);
};

const updateCounter = () => (counter.textContent = `${promptInput.value.length} / 300`);

const renderExamples = () => {
  const box = document.querySelector("[data-examples]");
  box.replaceChildren(
    ...EXAMPLE_KEYS.map((key) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.textContent = Demo.t(key);
      chip.addEventListener("click", () => {
        promptInput.value = Demo.t(key);
        updateCounter();
        promptInput.focus();
      });
      return chip;
    }),
  );
};

const sentNote = document.querySelector("[data-sent]");
let sentText = "";
const showSent = () => {
  sentNote.hidden = !sentText;
  if (!sentText) return;
  const label = document.createElement("strong");
  label.textContent = `${Demo.t("sent")} `;
  sentNote.replaceChildren(label, sentText);
};

const showImage = (base64, prompt, seconds, english) => {
  const src = `data:image/jpeg;base64,${base64}`;
  const img = document.createElement("img");
  img.src = src;
  img.alt = prompt;
  canvas.replaceChildren(img);
  const download = document.createElement("a");
  download.href = src;
  download.download = `flux-${Date.now()}.jpg`;
  download.textContent = Demo.t("download");
  const info = document.createElement("span");
  info.textContent = "FLUX.1 [schnell] · 4 steps · 1024×1024";
  meta.replaceChildren(info, download);
  meta.hidden = false;
  sentText = english ?? "";
  showSent();
  setStatus(Demo.t("done", { seconds: Demo.fmtNum(seconds, 1) }));
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy || quotaDone()) return;
  const prompt = promptInput.value.replace(/\s+/g, " ").trim();
  if (prompt.length < 3) return setStatus(Demo.t("error.short"), true);

  busy = true;
  button.disabled = true;
  button.textContent = Demo.t("generating");
  canvas.classList.add("loading");
  setStatus(Demo.t("working"));
  const started = performance.now();
  const { ok, data } = await PortfolioApi.post("/image", { prompt }, 60000);
  canvas.classList.remove("loading");
  busy = false;
  button.disabled = false;
  button.textContent = Demo.t("generate");

  if (typeof data?.remaining === "number") {
    showQuota(data.remaining > 0 ? "left1" : "left0");
    if (data.remaining <= 0) markQuotaDone();
  }
  if (ok && data?.image) return showImage(data.image, prompt, (performance.now() - started) / 1000, data.prompt);
  if (data?.error === "visitor_limit") {
    markQuotaDone();
    showQuota("error.visitor_limit");
    return setStatus("");
  }
  const key = `error.${data?.error}`;
  setStatus(Demo.t(key in T.en ? key : "error.generic"), true);
});

promptInput.addEventListener("input", updateCounter);
// Texto vindo do chat do portfólio (?prompt=…): já deixa o pedido preenchido.
const fromChat = new URLSearchParams(location.search).get("prompt");
if (fromChat) {
  promptInput.value = fromChat.replace(/\s+/g, " ").trim().slice(0, 300);
  updateCounter();
}
if (quotaDone()) {
  quotaKey = "error.visitor_limit";
  button.disabled = true;
}
Demo.setup(T, () => {
  if (!busy) button.textContent = Demo.t("generate");
  showQuota(quotaKey);
  renderExamples();
  showSent();
  const download = meta.querySelector("a");
  if (download) download.textContent = Demo.t("download");
});
showQuota(quotaKey);
renderExamples();
