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
  fr: {
    "meta.title": "Générateur d’images IA — FLUX.1",
    "meta.description": "Écrivez une description et générez une image avec FLUX.1 [schnell] sur Cloudflare Workers AI, avec une modération en couches et sans stockage.",
    lang: "Langue",
    kicker: "// DÉMO IA · TEXTE VERS IMAGE",
    title: "Générateur d’images <span>avec FLUX.1.</span>",
    lead: "Décrivez une image et un modèle de diffusion la génère en quelques secondes sur l’offre gratuite de Cloudflare, avec une modération avant chaque génération. Rien de ce que vous écrivez ou générez n’est conservé.",
    back: "← Retour au portfolio",
    code: "Voir le code ↗",
    promptLabel: "Décrivez l’image",
    placeholder: "ex. : un toucan fait de circuits imprimés, éclairage studio",
    examplesLabel: "Ou essayez un exemple :",
    generate: "Générer l’image",
    generating: "Génération…",
    empty: "Votre image apparaîtra ici.",
    working: "Vérification de la demande et génération. Cela prend en général 3 à 8 secondes…",
    done: "Générée en {seconds} s.",
    download: "Télécharger ↓",
    sent: "Envoyé au modèle (en anglais) :",
    ex1: "Un phare sur l’Amazone au coucher du soleil, aquarelle",
    ex2: "Illustration isométrique d’une petite salle de serveurs dans un terrarium",
    ex3: "Un capybara astronaute flottant près de Saturne, rendu 3D",
    ex4: "Affiche minimaliste du Théâtre Amazonas, orange et vert",
    "error.short": "Écrivez au moins 3 caractères.",
    "error.unsafe_prompt": "Cette demande a été bloquée par la modération. Essayez de décrire autre chose.",
    "error.rate_limited": "Trop de demandes. Attendez une minute et réessayez.",
    "error.daily_limit": "Le quota gratuit d’images du jour est épuisé. Il se renouvelle à 00:00 UTC.",
    "error.turnstile_failed": "La vérification anti-robot a échoué. Rechargez la page et réessayez.",
    "error.generic": "La génération d’images est indisponible pour le moment. Réessayez plus tard.",
    "error.visitor_limit": "Vous avez atteint la limite de 2 images par jour. Revenez après 00:00 UTC.",
    quota: "Limite : 2 images par visiteur et par jour.",
    left1: "Vous pouvez encore générer 1 image aujourd’hui.",
    left0: "C’était votre dernière image du jour. La limite se renouvelle à 00:00 UTC.",
    howTitle: "Comment ça marche",
    s1Title: "Limites",
    s1Text: "2 images par jour et par visiteur, plus un plafond quotidien global qui protège le quota gratuit partagé avec le chat.",
    s2Title: "Anti-robot",
    s2Text: "Un jeton Turnstile invisible prouve que la demande vient d’une personne sur ce site.",
    s3Title: "Traduction et modération",
    s3Text: "Votre texte est traduit en anglais (Qwen3) ; puis un filtre de termes et Llama Guard 3 vérifient la traduction avant la génération.",
    s4Title: "Diffusion",
    s4Text: "FLUX.1 [schnell] transforme du bruit en image 1024×1024 en 4 étapes sur Workers AI.",
    s5Title: "Aucun stockage",
    s5Text: "L’image revient en base64 et n’existe que dans cet onglet. Le serveur ne garde que le total du jour.",
    limits: "<strong>À propos de cette démo :</strong> les images peuvent être imprécises ou étranges, et la modération n’est pas parfaite. Ne l’utilisez pas pour de vraies personnes, des marques ou quoi que ce soit que vous ne montreriez pas en entretien.",
  },
  it: {
    "meta.title": "Generatore di immagini IA — FLUX.1",
    "meta.description": "Scrivi una descrizione e genera un’immagine con FLUX.1 [schnell] su Cloudflare Workers AI, con moderazione a più livelli e senza archiviazione.",
    lang: "Lingua",
    kicker: "// DEMO IA · DA TESTO A IMMAGINE",
    title: "Generatore di immagini <span>con FLUX.1.</span>",
    lead: "Descrivi un’immagine e un modello di diffusione la genera in pochi secondi sul piano gratuito di Cloudflare, con moderazione prima di ogni generazione. Nulla di ciò che scrivi o generi viene salvato.",
    back: "← Torna al portfolio",
    code: "Vedi il codice ↗",
    promptLabel: "Descrivi l’immagine",
    placeholder: "es.: un tucano fatto di circuiti stampati, luce da studio",
    examplesLabel: "Oppure prova un esempio:",
    generate: "Genera immagine",
    generating: "Generazione…",
    empty: "La tua immagine apparirà qui.",
    working: "Verifica della richiesta e generazione. Di solito servono 3–8 secondi…",
    done: "Generata in {seconds} s.",
    download: "Scarica ↓",
    sent: "Inviato al modello (in inglese):",
    ex1: "Un faro sul Rio delle Amazzoni al tramonto, acquerello",
    ex2: "Illustrazione isometrica di una piccola sala server dentro un terrario",
    ex3: "Un capibara astronauta che fluttua vicino a Saturno, render 3D",
    ex4: "Poster minimalista del Teatro Amazonas, arancione e verde",
    "error.short": "Scrivi almeno 3 caratteri.",
    "error.unsafe_prompt": "La moderazione ha bloccato questa richiesta. Prova a descrivere altro.",
    "error.rate_limited": "Troppe richieste. Aspetta un minuto e riprova.",
    "error.daily_limit": "La quota gratuita di immagini di oggi è esaurita. Si rinnova alle 00:00 UTC.",
    "error.turnstile_failed": "Il controllo anti-bot non è riuscito. Ricarica la pagina e riprova.",
    "error.generic": "La generazione di immagini non è disponibile ora. Riprova più tardi.",
    "error.visitor_limit": "Hai raggiunto il limite di 2 immagini al giorno. Torna dopo le 00:00 UTC.",
    quota: "Limite: 2 immagini per visitatore al giorno.",
    left1: "Puoi generare ancora 1 immagine oggi.",
    left0: "Questa era la tua ultima immagine di oggi. Il limite si rinnova alle 00:00 UTC.",
    howTitle: "Come funziona",
    s1Title: "Limiti",
    s1Text: "2 immagini al giorno per visitatore, più un tetto giornaliero globale che protegge la quota gratuita condivisa con la chat.",
    s2Title: "Anti-bot",
    s2Text: "Un token Turnstile invisibile dimostra che la richiesta arriva da una persona su questo sito.",
    s3Title: "Traduzione e moderazione",
    s3Text: "Il tuo testo viene tradotto in inglese (Qwen3); poi un filtro di termini e Llama Guard 3 controllano la traduzione prima di generare.",
    s4Title: "Diffusione",
    s4Text: "FLUX.1 [schnell] trasforma il rumore in un’immagine 1024×1024 in 4 passi su Workers AI.",
    s5Title: "Nessuna archiviazione",
    s5Text: "L’immagine torna in base64 ed esiste solo in questa scheda. Il server conserva solo il conteggio del giorno.",
    limits: "<strong>Su questa demo:</strong> le immagini possono risultare imprecise o strane e la moderazione non è perfetta. Non usarla per persone reali, marchi o nulla che non mostreresti a un colloquio di lavoro.",
  },
  de: {
    "meta.title": "KI-Bildgenerator — FLUX.1",
    "meta.description": "Gib eine Beschreibung ein und erzeuge ein Bild mit FLUX.1 [schnell] auf Cloudflare Workers AI, mit mehrstufiger Moderation und ohne Speicherung.",
    lang: "Sprache",
    kicker: "// KI-DEMO · TEXT ZU BILD",
    title: "Bildgenerator <span>mit FLUX.1.</span>",
    lead: "Beschreibe ein Bild, und ein Diffusionsmodell erzeugt es in wenigen Sekunden im Gratis-Tarif von Cloudflare, mit Moderation vor jeder Erzeugung. Nichts, was du eingibst oder erzeugst, wird gespeichert.",
    back: "← Zurück zum Portfolio",
    code: "Code ansehen ↗",
    promptLabel: "Beschreibe das Bild",
    placeholder: "z. B. ein Tukan aus Leiterplatten, Studiobeleuchtung",
    examplesLabel: "Oder probiere ein Beispiel:",
    generate: "Bild erzeugen",
    generating: "Wird erzeugt…",
    empty: "Hier erscheint dein Bild.",
    working: "Anfrage wird geprüft und das Bild erzeugt. Das dauert meist 3–8 Sekunden…",
    done: "Erzeugt in {seconds} s.",
    download: "Herunterladen ↓",
    sent: "An das Modell gesendet (Englisch):",
    ex1: "Ein Leuchtturm am Amazonas bei Sonnenuntergang, Aquarell",
    ex2: "Isometrische Illustration eines winzigen Serverraums in einem Terrarium",
    ex3: "Ein Capybara-Astronaut schwebt nahe dem Saturn, 3D-Render",
    ex4: "Minimalistisches Poster des Teatro Amazonas, Orange und Grün",
    "error.short": "Schreibe mindestens 3 Zeichen.",
    "error.unsafe_prompt": "Diese Anfrage wurde von der Moderation blockiert. Beschreibe etwas anderes.",
    "error.rate_limited": "Zu viele Anfragen. Warte eine Minute und versuche es erneut.",
    "error.daily_limit": "Das kostenlose Bildkontingent für heute ist aufgebraucht. Es wird um 00:00 UTC erneuert.",
    "error.turnstile_failed": "Die Anti-Bot-Prüfung ist fehlgeschlagen. Lade die Seite neu und versuche es erneut.",
    "error.generic": "Die Bilderzeugung ist gerade nicht verfügbar. Versuche es später erneut.",
    "error.visitor_limit": "Du hast das Limit von 2 Bildern pro Tag erreicht. Komm nach 00:00 UTC wieder.",
    quota: "Limit: 2 Bilder pro Besucher und Tag.",
    left1: "Du kannst heute noch 1 Bild erzeugen.",
    left0: "Das war dein letztes Bild für heute. Das Limit wird um 00:00 UTC erneuert.",
    howTitle: "So funktioniert es",
    s1Title: "Limits",
    s1Text: "2 Bilder pro Tag und Besucher, dazu eine globale Tagesgrenze, die das mit dem Chat geteilte Gratis-Kontingent schützt.",
    s2Title: "Anti-Bot",
    s2Text: "Ein unsichtbares Turnstile-Token belegt, dass die Anfrage von einem Menschen auf dieser Website kommt.",
    s3Title: "Übersetzung und Moderation",
    s3Text: "Dein Text wird ins Englische übersetzt (Qwen3); dann prüfen ein Begriffsfilter und Llama Guard 3 die Übersetzung vor der Erzeugung.",
    s4Title: "Diffusion",
    s4Text: "FLUX.1 [schnell] macht aus Rauschen in 4 Schritten ein 1024×1024-Bild auf Workers AI.",
    s5Title: "Keine Speicherung",
    s5Text: "Das Bild kommt als Base64 zurück und existiert nur in diesem Tab. Der Server speichert nur die Tagesanzahl.",
    limits: "<strong>Zu dieser Demo:</strong> Erzeugte Bilder können ungenau oder seltsam sein, und die Moderation ist nicht perfekt. Nutze sie nicht für echte Personen, Marken oder etwas, das du nicht im Vorstellungsgespräch zeigen würdest.",
  },
  zh: {
    "meta.title": "AI 图像生成器 — FLUX.1",
    "meta.description": "输入描述，用 Cloudflare Workers AI 上的 FLUX.1 [schnell] 生成图像，多层审核，不做任何存储。",
    lang: "语言",
    kicker: "// AI 演示 · 文本生成图像",
    title: "图像生成器 <span>基于 FLUX.1。</span>",
    lead: "描述一张图像，扩散模型会在 Cloudflare 免费方案上几秒内生成，每次生成前都会先审核。你输入和生成的内容都不会被保存。",
    back: "← 返回作品集",
    code: "查看代码 ↗",
    promptLabel: "描述图像",
    placeholder: "例如：由电路板组成的巨嘴鸟，影棚灯光",
    examplesLabel: "或试试示例：",
    generate: "生成图像",
    generating: "生成中…",
    empty: "图像将显示在这里。",
    working: "正在检查请求并生成，通常需要 3–8 秒…",
    done: "用时 {seconds} 秒。",
    download: "下载 ↓",
    sent: "发送给模型（英文）：",
    ex1: "日落时分亚马孙河上的灯塔，水彩",
    ex2: "玻璃生态瓶里的迷你服务器机房，等距插画",
    ex3: "漂浮在土星附近的水豚宇航员，3D 渲染",
    ex4: "马瑙斯亚马孙剧院的极简海报，橙色和绿色",
    "error.short": "请至少输入 3 个字符。",
    "error.unsafe_prompt": "该请求被审核拦截，请换个描述。",
    "error.rate_limited": "请求过多，请等一分钟再试。",
    "error.daily_limit": "今天的免费图像额度已用完，将于 UTC 00:00 重置。",
    "error.turnstile_failed": "防机器人验证失败，请刷新页面后重试。",
    "error.generic": "图像生成暂时不可用，请稍后再试。",
    "error.visitor_limit": "你已达到每天 2 张图像的上限，请在 UTC 00:00 之后再来。",
    quota: "限制：每位访客每天 2 张图像。",
    left1: "今天你还可以生成 1 张图像。",
    left0: "这是你今天的最后一张图像，限额将于 UTC 00:00 重置。",
    howTitle: "工作原理",
    s1Title: "限流",
    s1Text: "每位访客每天 2 张图像，另有全站每日上限，保护与聊天共享的免费额度。",
    s2Title: "防机器人",
    s2Text: "隐形的 Turnstile 令牌证明请求来自本站的真实用户。",
    s3Title: "翻译与审核",
    s3Text: "你的文字会先翻译成英文（Qwen3），再由关键词过滤和 Llama Guard 3 在生成前检查译文。",
    s4Title: "扩散生成",
    s4Text: "FLUX.1 [schnell] 在 Workers AI 上用 4 步把噪声变成 1024×1024 的图像。",
    s5Title: "不存储",
    s5Text: "图像以 base64 返回，只存在于当前标签页。服务器只记录当天的数量。",
    limits: "<strong>关于此演示：</strong>生成的图像可能不准确或奇怪，审核也并不完美。请勿用于真实人物、品牌或任何你不会在面试中展示的内容。",
  },
  ru: {
    "meta.title": "ИИ-генератор изображений — FLUX.1",
    "meta.description": "Опишите картинку и сгенерируйте её с FLUX.1 [schnell] в Cloudflare Workers AI — с многоуровневой модерацией и без хранения.",
    lang: "Язык",
    kicker: "// ИИ-ДЕМО · ТЕКСТ В ИЗОБРАЖЕНИЕ",
    title: "Генератор изображений <span>на FLUX.1.</span>",
    lead: "Опишите изображение, и диффузионная модель создаст его за несколько секунд на бесплатном тарифе Cloudflare, с модерацией перед каждой генерацией. Ничего из того, что вы вводите или создаёте, не сохраняется.",
    back: "← Назад к портфолио",
    code: "Смотреть код ↗",
    promptLabel: "Опишите изображение",
    placeholder: "например: тукан из печатных плат, студийный свет",
    examplesLabel: "Или попробуйте пример:",
    generate: "Сгенерировать",
    generating: "Генерация…",
    empty: "Здесь появится ваше изображение.",
    working: "Проверяем запрос и генерируем. Обычно это занимает 3–8 секунд…",
    done: "Готово за {seconds} с.",
    download: "Скачать ↓",
    sent: "Отправлено модели (на английском):",
    ex1: "Маяк на Амазонке на закате, акварель",
    ex2: "Изометрическая иллюстрация крошечной серверной в террариуме",
    ex3: "Капибара-астронавт парит рядом с Сатурном, 3D-рендер",
    ex4: "Минималистичный постер театра Амазонас, оранжевый и зелёный",
    "error.short": "Введите хотя бы 3 символа.",
    "error.unsafe_prompt": "Запрос заблокирован модерацией. Попробуйте описать что-то другое.",
    "error.rate_limited": "Слишком много запросов. Подождите минуту и попробуйте снова.",
    "error.daily_limit": "Бесплатная квота изображений на сегодня исчерпана. Она обновится в 00:00 UTC.",
    "error.turnstile_failed": "Антибот-проверка не пройдена. Обновите страницу и попробуйте снова.",
    "error.generic": "Генерация изображений сейчас недоступна. Попробуйте позже.",
    "error.visitor_limit": "Вы достигли лимита в 2 изображения в день. Возвращайтесь после 00:00 UTC.",
    quota: "Лимит: 2 изображения на посетителя в день.",
    left1: "Сегодня можно сгенерировать ещё 1 изображение.",
    left0: "Это было последнее изображение на сегодня. Лимит обновится в 00:00 UTC.",
    howTitle: "Как это работает",
    s1Title: "Лимиты",
    s1Text: "2 изображения в день на посетителя плюс общий дневной потолок, который бережёт бесплатную квоту, общую с чатом.",
    s2Title: "Антибот",
    s2Text: "Невидимый токен Turnstile подтверждает, что запрос сделал человек на этом сайте.",
    s3Title: "Перевод и модерация",
    s3Text: "Ваш текст переводится на английский (Qwen3), затем фильтр слов и Llama Guard 3 проверяют перевод перед генерацией.",
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
