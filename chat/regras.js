// Assistente (2/5) — regras: sinônimos, assuntos, intenções e respostas prontas.
// Os textos das respostas ficam no i18n/ (chat.faq.<chave>); aqui só o que dispara cada uma.

import { fold, normalize } from "./texto.js";

// Primeiro nome da pessoa do portfólio (perfil.js), como aparece nas perguntas já normalizadas.
const nome = normalize(globalThis.PERFIL.nome).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Estes temas sempre usam a resposta pronta local (rápida, sem custo e controlada).
// "education" usa resposta conferida: o modelo gratuito às vezes traduz errado nomes de cursos e universidades.
const LOCAL_ONLY = new Set(["greeting", "thanks", "education"]);

/* ---------- Sinônimos: expressões que viram termos existentes no site ---------- */

const programmingContext = /program|programac|programmier|编程|программ/;
const synonyms = [
  [programmingContext, ["java", "kotlin", "python", "typescript", "javascript", "php"]],
  [/banco de dados|database|datenbank|base de datos|base de donnees|banca dati|数据库|баз[аы] данных|\bsql\b|\bdb\b/, ["postgresql", "oracle", "mysql", "mongodb", "sql server"]],
  [/celular|mobile|mobil|handy|movil|cellulare|手机|移动|мобил|\bapps?\b|android|\bios\b/, ["react native", "kotlin", "mobile"]],
  [/nuvem|cloud|nube|nuage|nuvola|云|облак/, ["aws", "serverless", "lambda"]],
  [/front|interface|\bui\b|\bux\b|前端|фронт/, ["react", "angular", "vue", "frontend"]],
  [/chat ?bot|\bllm|gpt|genai|generativ|生成式|聊天机器人|чат-?бот/, ["rag", "langchain", "llm", "ollama"]],
  [/micro-?s+ervi|微服务|микросервис/, ["kafka", "rabbitmq", "docker", "kubernetes", "hexagonal"]],
  [/mensageria|messaging|mensajeria|messagerie|messaggistica|fila|queue|消息|очеред/, ["kafka", "rabbitmq"]],
  [/devops|deploy|pipeline|container|contene?dor|容器|部署|контейнер/, ["docker", "kubernetes", "ci/cd", "gitlab"]],
  [/qualidade|quality|calidad|qualite|qualita|teste?s?\b|testing|测试|质量|тест|качеств/, ["sonarqube", "tdd", "code review"]],
  [/machine learning|aprendizado de maquina|aprendizaje automatico|apprentissage automatique|apprendimento automatico|机器学习|машинн/, ["machine learning", "scikit", "tensorflow", "xgboost"]],
  [/financ|banco digital|pagamento|payment|pago|paiement|pagament|支付|金融|платеж|финанс/, ["financial", "p2p"]],
  [/governo|government|gobierno|gouvernement|governo|政府|государ|prefeitura|setor publico|public sector/, ["manaus", "semef"]],
];

/* ---------- Assuntos que apontam para uma seção ---------- */

const topics = [
  ["nav.education", /ausbildung|hochschule|abschluss|estud|study|studied|estudi|etudi|studi|universi|faculd|facult|colleg|gradua|diplom|degree|学|教育|毕业|учил|образов|универс|вуз/],
  ["nav.experience", /arbeit|firma|unternehmen|beruf|karriere|trabalh|work|trabaj|travail|lavor|job|emprego|empleo|empresa|company|career|carreira|carrera|工作|经历|公司|работ|опыт|компан/],
  ["nav.skills", /fahigkeit|kenntnis|werkzeug|tecnolog|technolog|stack|skill|habilid|competen|ferrament|tool|herramient|outil|strument|技能|技术|навык|технолог/],
  ["nav.projects", /projekt|projet|project|proyect|progett|portf|作品|项目|проект/],
];

/* ---------- Intenções especiais ---------- */

const intents = {
  contact: /kontakt|erreich|anrufen|contat|contact|contacto|contatto|e-?mail|whats|telefon|phone|linkedin|github|falar|hablar|parler|parlare|联系|邮箱|电话|связ|почт|телефон|контакт/,
  cv: /lebenslauf|curricul|\bcv\b|resum|pdf|download|baixar|descargar|telecharg|scaric|简历|резюме/,
  // Pedido para gerar uma imagem ("gera uma imagem de…", "draw a cat"): o chat indica a demo do gerador.
  image: /(?<![a-zа-я])(gera|gere|gerar|cria|crie|criar|desenha|desenhe|desenhar|faz|faca|fazer|generate|create|make|draw|paint|render|genera|generar|generare|crea|crear|creare|dibuja|dibujar|haz|hacer|genere|generer|cree|creer|dessine|dessiner|fais|faire|disegna|disegnare|fai|fare|erstell[a-z]*|generier[a-z]*|zeichne[a-z]*|male|mach[a-z]*|erzeug[a-z]*|нарисуи|сгенерируи|создаи|сделаи)(?![a-zа-я]).{0,25}?(?<![a-zа-я])(imagem|imagens|image|images|imagen|imagenes|immagine|immagini|foto|fotos|photo|picture|pic|desenho|drawing|ilustracao|illustration|ilustracion|dibujo|dessin|disegno|bild|bilder|zeichnung|изображени[а-я]*|картин[а-я]*|рисун[а-я]*)(?![a-zа-я])|(?<![a-zа-я])(draw|desenhe|desenha|dibuja|dessine|disegna|zeichne|нарисуи)\s+(a|an|me|um|uma|un|une|una|uno|ein|eine|einen|мне)(?![a-zа-я])|(?<![a-zа-я])нарисуи(?![a-zа-я])|画(一|个|张|幅)|生成.{0,8}(图|画|照片)|(做|创建|制作).{0,6}(图片|图像|照片)/,
  // "Classificação de imagens", "reconhecimento de imagem"… são perguntas sobre o perfil, não pedidos de imagem.
  imageUnless: /classif|recogn|reconhec|reconoc|riconosc|erkenn|processing|processamento|procesamiento|deteccao|detection|segment|распозн|识别|分类/,
};

/* ---------- Respostas prontas (perguntas frequentes) ---------- */

// A ordem importa: a primeira regra que casar responde.
// `unless`: evita confundir, por ex., "linguagens de programação" com idiomas falados.
// `related`: botões de continuação mostrados depois da resposta.
const faqs = [
  {
    key: "greeting",
    pattern: /^\s*(oi+|ola|opa|hello|hi|hey|hola|bonjour|salut|ciao|buongiorno|buenas|bom dia|boa tarde|boa noite|good (morning|afternoon|evening)|buenos dias|hallo|guten (tag|morgen|abend)|moin|servus|你好|您好|привет|здравствуйте|добрый день)[\s!.,?！。]*$/,
    related: ["about", "work", "ai", "stack"],
  },
  {
    key: "thanks",
    pattern: /^\s*((muito )?obrigad[oa]|valeu|thanks|thank you|thx|danke( schon| sehr)?|vielen dank|gracias|merci|grazie|谢谢|多谢|спасибо)[\s!.,?！。]*$/,
    contacts: true,
  },
  {
    key: "differential",
    pattern: /warum .*(einstellen|ihn)|starken|vorteil|alleinstellung|diferencia|por que contrat|porque contrat|why (should (we|i) )?hire|why him|strength|ponto forte|pontos fortes|fortaleza|point fort|pourquoi (le |l.)?(embaucher|recruter)|punti di forza|perche (assumer|sceglier)|优势|为什么.*(选择|雇|招)|сильн\w* сторон|почему (он|его|нанять)|преимуществ/,
    related: ["ai", "soft", "work"],
  },
  {
    key: "work",
    pattern: /zeitzone|festanstellung|freiberuf|ausland|vertrag|remot|home ?office|presencial|hibrid|hybrid|on-?site|fuso|timezone|time zone|zona horaria|fuseau|fuso orario|\butc\b|\bgmt\b|onde mora|where .*(live|based|located)|donde vive|ou habite|dove vive|internaciona|internationa|exterior|abroad|estero|etranger|relocat|\bvisa\b|\bclt\b|\bpj\b|contrat|freelanc|autonom|disponib|availab|远程|时区|国际|合同|удален|пояс|междунар|контракт|релокац/,
    contacts: true,
    related: ["years", "stack"],
  },
  {
    key: "education",
    pattern: /ausbildung|studium|studiert|hochschule|abschluss|graduac|faculdade|universidade|formacao|formacao academica|estudou|bacharel|pos-graduac|pos graduac|degree|graduat|universit|college|studied|study|education|postgrad|carrera|licenciatura|universidad|estudio|formacion|diplome|licence|etudes|formation|laurea|universita|studi|formazione|学历|大学|毕业院校|学位|教育背景|образовани|университет|учил|степен/,
    unless: /tcc|capstone|thesis|abschlussarbeit|projekt|projeto|project|proyecto|projet|progett|项目|проект/,
    target: ".education-list",
    related: ["ai", "years", "stack"],
  },
  {
    key: "years",
    pattern: /wie viele jahre|jahre (berufs)?erfahrung|berufsjahre|quantos anos|anos de experiencia|how many years|years of experience|how long|cuantos anos|combien d.?annees|annees d.?experience|quanti anni|anni di esperienza|多少年|几年|工作年限|сколько лет|лет опыта|опыт в годах/,
    target: "#experiencia",
    related: ["current", "stack", "ai"],
  },
  {
    key: "current",
    pattern: /wo arbeitet er|arbeitet er (jetzt|derzeit|aktuell)|aktuelle[rns]? (arbeitgeber|stelle|firma|position)|trabalha (hoje|atualmente|agora)|(onde|aonde) (ele )?trabalha (hoje|atualmente|agora)|emprego atual|empresa atual|cargo atual|current(ly)? (job|company|role|position|employer)|where does he (currently )?work|works? (now|currently)|trabajo actual|empresa actual|donde trabaja (ahora|actualmente)|poste actuel|ou travaille-t-il|lavoro attuale|dove lavora (ora|adesso|attualmente)|目前.*(工作|公司)|现在.*工作|где (он )?(сейчас )?работает|текущ\w* (работ|компан|должност)/,
    target: ".job",
    related: ["years", "stack"],
  },
  {
    key: "languages",
    pattern: /sprache|spricht|englisch|spanisch|portugiesisch|idioma|lingua|language|langue|lengua|ingles|english|espanhol|spanish|espanol|frances|anglais|inglese|\bfala\b|speak|habla|parle|parla|语言|英语|язык|английск/,
    unless: /programmier|program|codigo|code|codice|编程|программ|tecnolog|technolog/,
    target: ".education-extra",
  },
  {
    key: "soft",
    pattern: /fuhrung|teamarbeit|kommunikation|soft ?skills?|lideranca|leadership|liderazgo|trabalho em equipe|teamwork|trabajo en equipo|comunicac|communication|comportament|habilidades blandas|savoir-etre|competenze trasversali|软技能|领导力|沟通|гибк\w* навык|лидерств|коммуникац/,
    related: ["differential", "years"],
  },
  {
    key: "ai",
    pattern: /(experien|erfahrung|esperienz|trabalha|arbeitet|works?|sabe|kennt|know|conhec|conoce|connait|conosce)\w*\s.{0,20}\b(ia|ai|ki|kunstliche intelligenz|inteligencia artificial|artificial intelligence|machine learning|nlp|llm)\b|опыт.{0,8}(ии|ai|машинн)|ai.{0,6}经验|人工智能.{0,4}经验/,
    target: ".project-card",
    related: ["differential", "stack", "work"],
  },
  {
    key: "mobile",
    pattern: /mobil|handy|mobile|celular|aplicativ|\bapps?\b|android|\bios\b|movil|cellulare|мобил|移动|手机/,
    target: "#habilidades",
    related: ["stack", "ai"],
  },
  {
    key: "devops",
    pattern: /infrastruktur|devops|infraestrutura|infrastructure|infraestructura|infrastruttura|\bcloud\b|nuvem|\bnube\b|nuage|nuvola|облак|云|девопс/,
    target: ".job",
    related: ["stack", "current"],
  },
  {
    key: "databases",
    pattern: /datenbank|banco de dados|database|bases? de datos|base de donnees|banca dati|数据库|баз[аы] данных/,
    target: "#habilidades",
    related: ["stack", "years"],
  },
  {
    key: "public",
    pattern: /offentlich|behorde|stadtverwaltung|regierung|setor publico|governo|prefeitura|public sector|government|sector publico|gobierno|secteur public|gouvernement|settore pubblico|政府|госсектор|государств/,
    target: "#experiencia",
    related: ["years", "current"],
  },
  {
    key: "stack",
    pattern: /wichtigste[n]? technologie|welche technologien|principais (tecnologias|habilidades|competencias|skills|ferramentas)|\bstack\b|tecnologias (que )?(ele )?(usa|domina)|main (technolog|skills|stack)|core (skills|stack)|what technolog|which technolog|tecnologias principales|technologies principales|tecnologie principali|主要技术|技术栈|основн\w* (технолог|навык)|стек/,
    target: "#habilidades",
    related: ["ai", "years", "differential"],
  },
  {
    key: "about",
    pattern: new RegExp(String.raw`wer ist (er|${nome})|erzahl.* uber (ihn|${nome})|uber ihn|quem e (voce|ele|o ${nome}|${nome})|(fale|conte|fala) (mais )?sobre (ele|voce|o ${nome}|${nome})|resumo (dele|profissional)|who is (he|${nome})|tell me about (him|${nome}|yourself)|about (him|${nome})|quien es|hablame (de|sobre) (el|${nome})|qui est|parlez-moi (de lui|d.${nome})|chi e|parlami (di lui|di ${nome})|他是谁|是谁|介绍一下|кто (он|такой)|расскажи о (нем|себе|${nome})`),
    target: "#sobre",
    related: ["work", "differential", "ai"],
  },
];

// As regras passam pela mesma normalização das perguntas (ex.: "й" → "и", sem acentos).
faqs.forEach((faq) => {
  faq.pattern = fold(faq.pattern);
  if (faq.unless) faq.unless = fold(faq.unless);
});
topics.forEach((topic) => (topic[1] = fold(topic[1])));
synonyms.forEach((synonym) => (synonym[0] = fold(synonym[0])));
Object.keys(intents).forEach((key) => (intents[key] = fold(intents[key])));

// Primeira resposta pronta que casa com a pergunta (já normalizada).
const findFaq = (q) => faqs.find(({ pattern, unless }) => pattern.test(q) && !(unless && unless.test(q)));

export { LOCAL_ONLY, programmingContext, synonyms, topics, intents, faqs, findFaq };
