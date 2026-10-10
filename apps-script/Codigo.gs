/**
 * Confirmação automática para quem envia mensagem pelo formulário do portfólio.
 * Roda no Google Apps Script da conta do Emanuel (gratuito) e envia do Gmail dele.
 *
 * Chamado pelo Cloudflare Worker (worker/src/index.js → sendConfirmation).
 * Implantação: Implantar → Nova implantação → App da Web
 *   · Executar como: Eu
 *   · Quem pode acessar: Qualquer pessoa
 * A URL do app vai para o secret APPS_SCRIPT_URL do Worker.
 */

// Mesmo valor do secret APPS_SCRIPT_SECRET do Worker. Nunca publique este valor.
const SECRET = "COLE_AQUI_O_SEGREDO";

const SITE = "https://emanueleborges.github.io";

const TEXTS = {
  pt: {
    subject: "Recebi sua mensagem — Emanuel Borges",
    hello: (n) => (n ? `Olá, ${n}!` : "Olá!"),
    body: "Obrigado pelo contato pelo meu portfólio. Recebi sua mensagem e vou responder em breve por este e-mail.",
    bye: "Abraço,",
  },
  en: {
    subject: "I received your message — Emanuel Borges",
    hello: (n) => (n ? `Hi ${n},` : "Hi,"),
    body: "Thanks for reaching out through my portfolio. I received your message and will reply to this email soon.",
    bye: "Best regards,",
  },
  es: {
    subject: "Recibí tu mensaje — Emanuel Borges",
    hello: (n) => (n ? `¡Hola, ${n}!` : "¡Hola!"),
    body: "Gracias por contactarme a través de mi portafolio. Recibí tu mensaje y te responderé pronto por este correo.",
    bye: "Saludos,",
  },
  fr: {
    subject: "J’ai bien reçu votre message — Emanuel Borges",
    hello: (n) => (n ? `Bonjour ${n},` : "Bonjour,"),
    body: "Merci de m’avoir contacté via mon portfolio. J’ai bien reçu votre message et je vous répondrai bientôt à cette adresse.",
    bye: "Cordialement,",
  },
  it: {
    subject: "Ho ricevuto il tuo messaggio — Emanuel Borges",
    hello: (n) => (n ? `Ciao ${n},` : "Ciao,"),
    body: "Grazie per avermi contattato tramite il mio portfolio. Ho ricevuto il tuo messaggio e ti risponderò presto a questo indirizzo.",
    bye: "Un saluto,",
  },
  de: {
    subject: "Ich habe deine Nachricht erhalten — Emanuel Borges",
    hello: (n) => (n ? `Hallo ${n},` : "Hallo,"),
    body: "Danke, dass du mich über mein Portfolio kontaktiert hast. Ich habe deine Nachricht erhalten und antworte bald an diese E-Mail-Adresse.",
    bye: "Viele Grüße,",
  },
  zh: {
    subject: "已收到你的留言 — Emanuel Borges",
    hello: (n) => (n ? `${n}，你好！` : "你好！"),
    body: "感谢你通过我的作品集联系我。我已收到你的留言，会尽快通过此邮箱回复你。",
    bye: "此致，",
  },
  ru: {
    subject: "Я получил ваше сообщение — Emanuel Borges",
    hello: (n) => (n ? `Здравствуйте, ${n}!` : "Здравствуйте!"),
    body: "Спасибо, что написали через моё портфолио. Я получил ваше сообщение и скоро отвечу на этот адрес.",
    bye: "С уважением,",
  },
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SECRET) return reply({ ok: false, error: "forbidden" });

    const to = String(data.to || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to) || to.length > 200) return reply({ ok: false, error: "invalid_email" });

    // Só letras no nome (o Worker já limpa; aqui é uma segunda proteção).
    const firstName = String(data.firstName || "").replace(/[^\p{L}'-]/gu, "").slice(0, 30);
    const t = TEXTS[data.lang] || TEXTS.en;

    const text = `${t.hello(firstName)}\n\n${t.body}\n\n${t.bye}\nEmanuel Borges\n${SITE}`;
    const html =
      `<p>${t.hello(firstName)}</p><p>${t.body}</p>` +
      `<p>${t.bye}<br><strong>Emanuel Borges</strong><br><a href="${SITE}">${SITE}</a></p>`;

    MailApp.sendEmail({ to, subject: t.subject, body: text, htmlBody: html, name: "Emanuel Borges" });
    return reply({ ok: true });
  } catch (error) {
    return reply({ ok: false, error: "unexpected" });
  }
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
