import { Demo } from "../demos.js";
import { PortfolioApi } from "../../api.js";

// Demo "Gerador de imagens": o texto vai ao Worker (POST /image), que modera e gera com FLUX.1 [schnell].
// Nada é salvo: a imagem chega em base64 e só existe nesta aba.
const EXAMPLES = [
  "A lighthouse on the Amazon river at sunset, watercolor",
  "Isometric illustration of a tiny server room inside a terrarium",
  "A capybara astronaut floating near Saturn, 3D render",
  "Minimalist poster of Manaus Opera House, flat design, orange and green",
];

const T = {
  en: {
    "meta.title": "AI Image Generator — FLUX.1 — Emanuel Borges",
    "meta.description": "Type a description and generate an image with FLUX.1 [schnell] on Cloudflare Workers AI, with layered moderation and no storage.",
    lang: "Language",
    kicker: "// AI DEMO · TEXT TO IMAGE",
    title: "Image generator <span>with FLUX.1.</span>",
    lead: "Describe an image and a diffusion model generates it in a few seconds on Cloudflare's free tier, with moderation before every generation. Nothing you type or generate is stored.",
    back: "← Back to portfolio",
    code: "View code ↗",
    promptLabel: "Describe the image",
    placeholder: "e.g. a toucan made of circuit boards, studio lighting",
    examplesLabel: "Or try an example (English gives the best results):",
    generate: "Generate image",
    generating: "Generating…",
    empty: "Your image will appear here.",
    working: "Checking the request and generating. This usually takes 3–8 seconds…",
    done: "Generated in {seconds} s.",
    download: "Download ↓",
    "error.short": "Write at least 3 characters.",
    "error.unsafe_prompt": "This request was blocked by moderation. Try describing something else.",
    "error.rate_limited": "Too many requests. Wait a minute and try again.",
    "error.daily_limit": "Today's free image quota is used up. It resets at 00:00 UTC.",
    "error.turnstile_failed": "The anti-bot check failed. Reload the page and try again.",
    "error.generic": "Image generation is unavailable right now. Try again later.",
    howTitle: "How it works",
    s1Title: "Limits",
    s1Text: "2 images per minute per visitor and a daily ceiling that protects the free quota shared with the chat.",
    s2Title: "Anti-bot",
    s2Text: "An invisible Turnstile token proves the request comes from a person on this site.",
    s3Title: "Moderation",
    s3Text: "A local term filter, then Llama Guard 3 classifies the request before any image is made.",
    s4Title: "Diffusion",
    s4Text: "FLUX.1 [schnell] turns noise into a 1024×1024 image in 4 steps on Workers AI.",
    s5Title: "No storage",
    s5Text: "The image comes back as base64 and lives only in this tab. The server keeps only the daily count.",
    limits: "<strong>About this demo:</strong> generated images can be inaccurate or strange, and moderation is not perfect. Don't use it for real people, logos or anything you wouldn't show in a job interview.",
  },
  pt: {
    "meta.title": "Gerador de Imagens com IA — FLUX.1 — Emanuel Borges",
    "meta.description": "Escreva uma descrição e gere uma imagem com o FLUX.1 [schnell] no Cloudflare Workers AI, com moderação em camadas e sem armazenamento.",
    lang: "Idioma",
    kicker: "// DEMO DE IA · TEXTO PARA IMAGEM",
    title: "Gerador de imagens <span>com FLUX.1.</span>",
    lead: "Descreva uma imagem e um modelo de difusão a gera em poucos segundos no plano gratuito da Cloudflare, com moderação antes de cada geração. Nada do que você escreve ou gera é salvo.",
    back: "← Voltar ao portfólio",
    code: "Ver código ↗",
    promptLabel: "Descreva a imagem",
    placeholder: "ex.: um tucano feito de placas de circuito, luz de estúdio",
    examplesLabel: "Ou teste um exemplo (em inglês o resultado é melhor):",
    generate: "Gerar imagem",
    generating: "Gerando…",
    empty: "Sua imagem aparece aqui.",
    working: "Conferindo o pedido e gerando. Costuma levar de 3 a 8 segundos…",
    done: "Gerada em {seconds} s.",
    download: "Baixar ↓",
    "error.short": "Escreva pelo menos 3 caracteres.",
    "error.unsafe_prompt": "Este pedido foi bloqueado pela moderação. Tente descrever outra coisa.",
    "error.rate_limited": "Muitos pedidos. Espere um minuto e tente de novo.",
    "error.daily_limit": "A cota gratuita de imagens de hoje acabou. Ela renova às 00:00 UTC.",
    "error.turnstile_failed": "A verificação anti-robô falhou. Recarregue a página e tente de novo.",
    "error.generic": "A geração de imagens está indisponível agora. Tente mais tarde.",
    howTitle: "Como funciona",
    s1Title: "Limites",
    s1Text: "2 imagens por minuto por visitante e um teto diário que protege a cota gratuita dividida com o chat.",
    s2Title: "Anti-robô",
    s2Text: "Um token invisível do Turnstile comprova que o pedido vem de uma pessoa neste site.",
    s3Title: "Moderação",
    s3Text: "Um filtro local de termos e, depois, o Llama Guard 3 classifica o pedido antes de qualquer imagem.",
    s4Title: "Difusão",
    s4Text: "O FLUX.1 [schnell] transforma ruído numa imagem 1024×1024 em 4 passos no Workers AI.",
    s5Title: "Sem armazenamento",
    s5Text: "A imagem volta em base64 e só existe nesta aba. O servidor guarda apenas a contagem do dia.",
    limits: "<strong>Sobre esta demo:</strong> as imagens geradas podem sair imprecisas ou estranhas, e a moderação não é perfeita. Não use para pessoas reais, marcas ou nada que você não mostraria numa entrevista de emprego.",
  },
  es: {
    "meta.title": "Generador de Imágenes con IA — FLUX.1 — Emanuel Borges",
    "meta.description": "Escribe una descripción y genera una imagen con FLUX.1 [schnell] en Cloudflare Workers AI, con moderación por capas y sin almacenamiento.",
    lang: "Idioma",
    kicker: "// DEMO DE IA · TEXTO A IMAGEN",
    title: "Generador de imágenes <span>con FLUX.1.</span>",
    lead: "Describe una imagen y un modelo de difusión la genera en pocos segundos en el plan gratuito de Cloudflare, con moderación antes de cada generación. Nada de lo que escribes o generas se guarda.",
    back: "← Volver al portafolio",
    code: "Ver código ↗",
    promptLabel: "Describe la imagen",
    placeholder: "p. ej.: un tucán hecho de placas de circuito, luz de estudio",
    examplesLabel: "O prueba un ejemplo (en inglés el resultado es mejor):",
    generate: "Generar imagen",
    generating: "Generando…",
    empty: "Tu imagen aparecerá aquí.",
    working: "Revisando la petición y generando. Suele tardar de 3 a 8 segundos…",
    done: "Generada en {seconds} s.",
    download: "Descargar ↓",
    "error.short": "Escribe al menos 3 caracteres.",
    "error.unsafe_prompt": "La moderación bloqueó esta petición. Intenta describir otra cosa.",
    "error.rate_limited": "Demasiadas peticiones. Espera un minuto e inténtalo de nuevo.",
    "error.daily_limit": "La cuota gratuita de imágenes de hoy se agotó. Se renueva a las 00:00 UTC.",
    "error.turnstile_failed": "La verificación antibots falló. Recarga la página e inténtalo de nuevo.",
    "error.generic": "La generación de imágenes no está disponible ahora. Inténtalo más tarde.",
    howTitle: "Cómo funciona",
    s1Title: "Límites",
    s1Text: "2 imágenes por minuto por visitante y un tope diario que protege la cuota gratuita compartida con el chat.",
    s2Title: "Antibots",
    s2Text: "Un token invisible de Turnstile demuestra que la petición viene de una persona en este sitio.",
    s3Title: "Moderación",
    s3Text: "Un filtro local de términos y luego Llama Guard 3 clasifica la petición antes de generar nada.",
    s4Title: "Difusión",
    s4Text: "FLUX.1 [schnell] convierte ruido en una imagen de 1024×1024 en 4 pasos en Workers AI.",
    s5Title: "Sin almacenamiento",
    s5Text: "La imagen vuelve en base64 y solo existe en esta pestaña. El servidor guarda solo el recuento del día.",
    limits: "<strong>Sobre esta demo:</strong> las imágenes pueden salir imprecisas o extrañas y la moderación no es perfecta. No la uses con personas reales, marcas ni nada que no mostrarías en una entrevista de trabajo.",
  },
  fr: {
    "meta.title": "Générateur d’images IA — FLUX.1 — Emanuel Borges",
    "meta.description": "Écrivez une description et générez une image avec FLUX.1 [schnell] sur Cloudflare Workers AI, avec une modération en couches et sans stockage.",
    lang: "Langue",
    kicker: "// DÉMO IA · TEXTE VERS IMAGE",
    title: "Générateur d’images <span>avec FLUX.1.</span>",
    lead: "Décrivez une image et un modèle de diffusion la génère en quelques secondes sur l’offre gratuite de Cloudflare, avec une modération avant chaque génération. Rien de ce que vous écrivez ou générez n’est conservé.",
    back: "← Retour au portfolio",
    code: "Voir le code ↗",
    promptLabel: "Décrivez l’image",
    placeholder: "ex. : un toucan fait de circuits imprimés, éclairage studio",
    examplesLabel: "Ou essayez un exemple (l’anglais donne les meilleurs résultats) :",
    generate: "Générer l’image",
    generating: "Génération…",
    empty: "Votre image apparaîtra ici.",
    working: "Vérification de la demande et génération. Cela prend en général 3 à 8 secondes…",
    done: "Générée en {seconds} s.",
    download: "Télécharger ↓",
    "error.short": "Écrivez au moins 3 caractères.",
    "error.unsafe_prompt": "Cette demande a été bloquée par la modération. Essayez de décrire autre chose.",
    "error.rate_limited": "Trop de demandes. Attendez une minute et réessayez.",
    "error.daily_limit": "Le quota gratuit d’images du jour est épuisé. Il se renouvelle à 00:00 UTC.",
    "error.turnstile_failed": "La vérification anti-robot a échoué. Rechargez la page et réessayez.",
    "error.generic": "La génération d’images est indisponible pour le moment. Réessayez plus tard.",
    howTitle: "Comment ça marche",
    s1Title: "Limites",
    s1Text: "2 images par minute par visiteur et un plafond quotidien qui protège le quota gratuit partagé avec le chat.",
    s2Title: "Anti-robot",
    s2Text: "Un jeton Turnstile invisible prouve que la demande vient d’une personne sur ce site.",
    s3Title: "Modération",
    s3Text: "Un filtre local de termes, puis Llama Guard 3 classe la demande avant toute génération.",
    s4Title: "Diffusion",
    s4Text: "FLUX.1 [schnell] transforme du bruit en image 1024×1024 en 4 étapes sur Workers AI.",
    s5Title: "Aucun stockage",
    s5Text: "L’image revient en base64 et n’existe que dans cet onglet. Le serveur ne garde que le total du jour.",
    limits: "<strong>À propos de cette démo :</strong> les images peuvent être imprécises ou étranges, et la modération n’est pas parfaite. Ne l’utilisez pas pour de vraies personnes, des marques ou quoi que ce soit que vous ne montreriez pas en entretien.",
  },
  it: {
    "meta.title": "Generatore di immagini IA — FLUX.1 — Emanuel Borges",
    "meta.description": "Scrivi una descrizione e genera un’immagine con FLUX.1 [schnell] su Cloudflare Workers AI, con moderazione a più livelli e senza archiviazione.",
    lang: "Lingua",
    kicker: "// DEMO IA · DA TESTO A IMMAGINE",
    title: "Generatore di immagini <span>con FLUX.1.</span>",
    lead: "Descrivi un’immagine e un modello di diffusione la genera in pochi secondi sul piano gratuito di Cloudflare, con moderazione prima di ogni generazione. Nulla di ciò che scrivi o generi viene salvato.",
    back: "← Torna al portfolio",
    code: "Vedi il codice ↗",
    promptLabel: "Descrivi l’immagine",
    placeholder: "es.: un tucano fatto di circuiti stampati, luce da studio",
    examplesLabel: "Oppure prova un esempio (in inglese il risultato è migliore):",
    generate: "Genera immagine",
    generating: "Generazione…",
    empty: "La tua immagine apparirà qui.",
    working: "Verifica della richiesta e generazione. Di solito servono 3–8 secondi…",
    done: "Generata in {seconds} s.",
    download: "Scarica ↓",
    "error.short": "Scrivi almeno 3 caratteri.",
    "error.unsafe_prompt": "La moderazione ha bloccato questa richiesta. Prova a descrivere altro.",
    "error.rate_limited": "Troppe richieste. Aspetta un minuto e riprova.",
    "error.daily_limit": "La quota gratuita di immagini di oggi è esaurita. Si rinnova alle 00:00 UTC.",
    "error.turnstile_failed": "Il controllo anti-bot non è riuscito. Ricarica la pagina e riprova.",
    "error.generic": "La generazione di immagini non è disponibile ora. Riprova più tardi.",
    howTitle: "Come funziona",
    s1Title: "Limiti",
    s1Text: "2 immagini al minuto per visitatore e un tetto giornaliero che protegge la quota gratuita condivisa con la chat.",
    s2Title: "Anti-bot",
    s2Text: "Un token Turnstile invisibile dimostra che la richiesta arriva da una persona su questo sito.",
    s3Title: "Moderazione",
    s3Text: "Un filtro locale di termini, poi Llama Guard 3 classifica la richiesta prima di generare.",
    s4Title: "Diffusione",
    s4Text: "FLUX.1 [schnell] trasforma il rumore in un’immagine 1024×1024 in 4 passi su Workers AI.",
    s5Title: "Nessuna archiviazione",
    s5Text: "L’immagine torna in base64 ed esiste solo in questa scheda. Il server conserva solo il conteggio del giorno.",
    limits: "<strong>Su questa demo:</strong> le immagini possono risultare imprecise o strane e la moderazione non è perfetta. Non usarla per persone reali, marchi o nulla che non mostreresti a un colloquio di lavoro.",
  },
  de: {
    "meta.title": "KI-Bildgenerator — FLUX.1 — Emanuel Borges",
    "meta.description": "Gib eine Beschreibung ein und erzeuge ein Bild mit FLUX.1 [schnell] auf Cloudflare Workers AI, mit mehrstufiger Moderation und ohne Speicherung.",
    lang: "Sprache",
    kicker: "// KI-DEMO · TEXT ZU BILD",
    title: "Bildgenerator <span>mit FLUX.1.</span>",
    lead: "Beschreibe ein Bild, und ein Diffusionsmodell erzeugt es in wenigen Sekunden im Gratis-Tarif von Cloudflare, mit Moderation vor jeder Erzeugung. Nichts, was du eingibst oder erzeugst, wird gespeichert.",
    back: "← Zurück zum Portfolio",
    code: "Code ansehen ↗",
    promptLabel: "Beschreibe das Bild",
    placeholder: "z. B. ein Tukan aus Leiterplatten, Studiobeleuchtung",
    examplesLabel: "Oder probiere ein Beispiel (Englisch liefert die besten Ergebnisse):",
    generate: "Bild erzeugen",
    generating: "Wird erzeugt…",
    empty: "Hier erscheint dein Bild.",
    working: "Anfrage wird geprüft und das Bild erzeugt. Das dauert meist 3–8 Sekunden…",
    done: "Erzeugt in {seconds} s.",
    download: "Herunterladen ↓",
    "error.short": "Schreibe mindestens 3 Zeichen.",
    "error.unsafe_prompt": "Diese Anfrage wurde von der Moderation blockiert. Beschreibe etwas anderes.",
    "error.rate_limited": "Zu viele Anfragen. Warte eine Minute und versuche es erneut.",
    "error.daily_limit": "Das kostenlose Bildkontingent für heute ist aufgebraucht. Es wird um 00:00 UTC erneuert.",
    "error.turnstile_failed": "Die Anti-Bot-Prüfung ist fehlgeschlagen. Lade die Seite neu und versuche es erneut.",
    "error.generic": "Die Bilderzeugung ist gerade nicht verfügbar. Versuche es später erneut.",
    howTitle: "So funktioniert es",
    s1Title: "Limits",
    s1Text: "2 Bilder pro Minute und Besucher sowie eine Tagesgrenze, die das mit dem Chat geteilte Gratis-Kontingent schützt.",
    s2Title: "Anti-Bot",
    s2Text: "Ein unsichtbares Turnstile-Token belegt, dass die Anfrage von einem Menschen auf dieser Website kommt.",
    s3Title: "Moderation",
    s3Text: "Ein lokaler Begriffsfilter, danach stuft Llama Guard 3 die Anfrage ein, bevor ein Bild entsteht.",
    s4Title: "Diffusion",
    s4Text: "FLUX.1 [schnell] macht aus Rauschen in 4 Schritten ein 1024×1024-Bild auf Workers AI.",
    s5Title: "Keine Speicherung",
    s5Text: "Das Bild kommt als Base64 zurück und existiert nur in diesem Tab. Der Server speichert nur die Tagesanzahl.",
    limits: "<strong>Zu dieser Demo:</strong> Erzeugte Bilder können ungenau oder seltsam sein, und die Moderation ist nicht perfekt. Nutze sie nicht für echte Personen, Marken oder etwas, das du nicht im Vorstellungsgespräch zeigen würdest.",
  },
  zh: {
    "meta.title": "AI 图像生成器 — FLUX.1 — Emanuel Borges",
    "meta.description": "输入描述，用 Cloudflare Workers AI 上的 FLUX.1 [schnell] 生成图像，多层审核，不做任何存储。",
    lang: "语言",
    kicker: "// AI 演示 · 文本生成图像",
    title: "图像生成器 <span>基于 FLUX.1。</span>",
    lead: "描述一张图像，扩散模型会在 Cloudflare 免费方案上几秒内生成，每次生成前都会先审核。你输入和生成的内容都不会被保存。",
    back: "← 返回作品集",
    code: "查看代码 ↗",
    promptLabel: "描述图像",
    placeholder: "例如：由电路板组成的巨嘴鸟，影棚灯光",
    examplesLabel: "或试试示例（英文效果最好）：",
    generate: "生成图像",
    generating: "生成中…",
    empty: "图像将显示在这里。",
    working: "正在检查请求并生成，通常需要 3–8 秒…",
    done: "用时 {seconds} 秒。",
    download: "下载 ↓",
    "error.short": "请至少输入 3 个字符。",
    "error.unsafe_prompt": "该请求被审核拦截，请换个描述。",
    "error.rate_limited": "请求过多，请等一分钟再试。",
    "error.daily_limit": "今天的免费图像额度已用完，将于 UTC 00:00 重置。",
    "error.turnstile_failed": "防机器人验证失败，请刷新页面后重试。",
    "error.generic": "图像生成暂时不可用，请稍后再试。",
    howTitle: "工作原理",
    s1Title: "限流",
    s1Text: "每位访客每分钟 2 张图像，另有每日上限，保护与聊天共享的免费额度。",
    s2Title: "防机器人",
    s2Text: "隐形的 Turnstile 令牌证明请求来自本站的真实用户。",
    s3Title: "审核",
    s3Text: "先经过本地关键词过滤，再由 Llama Guard 3 在生成前对请求分类。",
    s4Title: "扩散生成",
    s4Text: "FLUX.1 [schnell] 在 Workers AI 上用 4 步把噪声变成 1024×1024 的图像。",
    s5Title: "不存储",
    s5Text: "图像以 base64 返回，只存在于当前标签页。服务器只记录当天的数量。",
    limits: "<strong>关于此演示：</strong>生成的图像可能不准确或奇怪，审核也并不完美。请勿用于真实人物、品牌或任何你不会在面试中展示的内容。",
  },
  ru: {
    "meta.title": "ИИ-генератор изображений — FLUX.1 — Emanuel Borges",
    "meta.description": "Опишите картинку и сгенерируйте её с FLUX.1 [schnell] в Cloudflare Workers AI — с многоуровневой модерацией и без хранения.",
    lang: "Язык",
    kicker: "// ИИ-ДЕМО · ТЕКСТ В ИЗОБРАЖЕНИЕ",
    title: "Генератор изображений <span>на FLUX.1.</span>",
    lead: "Опишите изображение, и диффузионная модель создаст его за несколько секунд на бесплатном тарифе Cloudflare, с модерацией перед каждой генерацией. Ничего из того, что вы вводите или создаёте, не сохраняется.",
    back: "← Назад к портфолио",
    code: "Смотреть код ↗",
    promptLabel: "Опишите изображение",
    placeholder: "например: тукан из печатных плат, студийный свет",
    examplesLabel: "Или попробуйте пример (на английском результат лучше):",
    generate: "Сгенерировать",
    generating: "Генерация…",
    empty: "Здесь появится ваше изображение.",
    working: "Проверяем запрос и генерируем. Обычно это занимает 3–8 секунд…",
    done: "Готово за {seconds} с.",
    download: "Скачать ↓",
    "error.short": "Введите хотя бы 3 символа.",
    "error.unsafe_prompt": "Запрос заблокирован модерацией. Попробуйте описать что-то другое.",
    "error.rate_limited": "Слишком много запросов. Подождите минуту и попробуйте снова.",
    "error.daily_limit": "Бесплатная квота изображений на сегодня исчерпана. Она обновится в 00:00 UTC.",
    "error.turnstile_failed": "Антибот-проверка не пройдена. Обновите страницу и попробуйте снова.",
    "error.generic": "Генерация изображений сейчас недоступна. Попробуйте позже.",
    howTitle: "Как это работает",
    s1Title: "Лимиты",
    s1Text: "2 изображения в минуту на посетителя и дневной потолок, который бережёт бесплатную квоту, общую с чатом.",
    s2Title: "Антибот",
    s2Text: "Невидимый токен Turnstile подтверждает, что запрос сделал человек на этом сайте.",
    s3Title: "Модерация",
    s3Text: "Локальный фильтр слов, затем Llama Guard 3 классифицирует запрос до генерации.",
    s4Title: "Диффузия",
    s4Text: "FLUX.1 [schnell] за 4 шага превращает шум в изображение 1024×1024 на Workers AI.",
    s5Title: "Без хранения",
    s5Text: "Изображение возвращается в base64 и существует только в этой вкладке. Сервер хранит лишь счётчик за день.",
    limits: "<strong>Об этой демо:</strong> изображения могут получаться неточными или странными, а модерация не идеальна. Не используйте её для реальных людей, брендов и всего, что вы не показали бы на собеседовании.",
  },
};

const form = document.querySelector("[data-form]");
const promptInput = document.querySelector("[data-prompt]");
const counter = document.querySelector("[data-counter]");
const button = document.querySelector("[data-generate]");
const status = document.querySelector("[data-status]");
const canvas = document.querySelector("[data-canvas]");
const meta = document.querySelector("[data-meta]");
let busy = false;

const setStatus = (text, error = false) => {
  status.textContent = text;
  status.classList.toggle("error", error);
};

const updateCounter = () => (counter.textContent = `${promptInput.value.length} / 300`);

const renderExamples = () => {
  const box = document.querySelector("[data-examples]");
  box.replaceChildren(
    ...EXAMPLES.map((text) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.textContent = text.length > 38 ? `${text.slice(0, 36)}…` : text;
      chip.title = text;
      chip.addEventListener("click", () => {
        promptInput.value = text;
        updateCounter();
        promptInput.focus();
      });
      return chip;
    }),
  );
};

const showImage = (base64, prompt, seconds, seed) => {
  const src = `data:image/jpeg;base64,${base64}`;
  const img = document.createElement("img");
  img.src = src;
  img.alt = prompt;
  canvas.replaceChildren(img);
  const download = document.createElement("a");
  download.href = src;
  download.download = `flux-${seed}.jpg`;
  download.textContent = Demo.t("download");
  const info = document.createElement("span");
  info.textContent = `FLUX.1 [schnell] · 4 steps · seed ${seed}`;
  meta.replaceChildren(info, download);
  meta.hidden = false;
  setStatus(Demo.t("done", { seconds: Demo.fmtNum(seconds, 1) }));
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
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

  if (ok && data?.image) return showImage(data.image, prompt, (performance.now() - started) / 1000, data.seed);
  const key = `error.${data?.error}`;
  setStatus(Demo.t(key in T.en ? key : "error.generic"), true);
});

promptInput.addEventListener("input", updateCounter);
renderExamples();
Demo.setup(T, () => {
  if (!busy) button.textContent = Demo.t("generate");
  const download = meta.querySelector("a");
  if (download) download.textContent = Demo.t("download");
});
