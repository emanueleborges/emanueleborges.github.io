// POST /contact — formulário de contato: salva no D1, avisa o Emanuel por e-mail (Resend)
// e envia uma confirmação ao visitante (Google Apps Script).
import { emailEnabled, escapeHtml, isHuman, json, languageOf, rateLimited, sendEmail } from "../comum.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const clean = (value, max) => (typeof value === "string" ? value.trim().slice(0, max + 1) : "");

async function notifyByEmail({ name, email, message, lang }, env) {
  if (!emailEnabled(env)) return;
  try {
    await sendEmail(env, {
      replyTo: email,
      subject: `Nova mensagem no portfólio: ${name.slice(0, 60)}`,
      text: `Nome: ${name}\nE-mail: ${email}\nIdioma do site: ${lang}\n\n${message}\n\n— Responda este e-mail para falar direto com ${name}.`,
      html: `<p><strong>Nome:</strong> ${escapeHtml(name)}<br><strong>E-mail:</strong> ${escapeHtml(email)}<br><strong>Idioma do site:</strong> ${escapeHtml(lang)}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p><p style="color:#666">Responda este e-mail para falar direto com ${escapeHtml(name)}.</p>`,
    });
  } catch (error) {
    console.error("Falha ao enviar o aviso por e-mail:", error?.message ?? error);
  }
}

// Detecta o idioma do texto da mensagem; sem confiança suficiente, usa o idioma do site.
const LANGUAGE_HINTS = {
  pt: { words: "de que não nao uma para com você voce os do da em um por mais mas como obrigado obrigada olá ola vaga seu sua gostaria estou empresa oportunidade tenho sobre também tambem", marks: /ção|ções|ão\b|õe|ã|ç|\bvocê\b/g },
  es: { words: "de que el la los las y en un una por para con no es su usted hola gracias estoy empresa puesto vacante me gustaría gustaria tengo sobre también", marks: /ción|ñ|¿|¡|\busted\b/g },
  fr: { words: "le la les de des et en un une pour avec pas est vous nous je bonjour merci poste entreprise votre suis avez sur aussi", marks: /œ|è|ê|ù|ç|\bvous\b|\bnous\b|\bj'|\bc'est\b/g },
  it: { words: "il la le di che e un una per con non è sono ciao grazie buongiorno azienda posizione vorrei mi ho anche sul gli", marks: /zione|\bgli\b|\bè\b|\bciao\b|\bgrazie\b/g },
  en: { words: "the and to of a in is you for with we i are hello hi thanks thank position role company would your have about also", marks: /\bthe\b|\bwould\b|\byour\b|\bthanks?\b/g },
  de: { words: "der die das und ist ich sie wir ihr mit für von zu den dem ein eine nicht auch bitte danke hallo stelle unternehmen haben würde gerne ihre ihnen", marks: /ß|ä|ö|ü|\bich\b|\bund\b|\bnicht\b|\bihnen\b/g },
};

export function detectLanguage(text, fallback) {
  const sample = text.toLowerCase();
  const letters = sample.replace(/[^\p{L}]/gu, "");
  if (!letters.length) return fallback;
  if (/[\u4e00-\u9fff]/.test(sample) && (sample.match(/[\u4e00-\u9fff]/g).length / letters.length) > 0.3) return "zh";
  if (/[а-яё]/.test(sample) && (sample.match(/[а-яё]/g).length / letters.length) > 0.5) return "ru";

  const words = sample.match(/[\p{L}']+/gu) ?? [];
  if (words.length < 4) return fallback;
  const scores = Object.entries(LANGUAGE_HINTS).map(([lang, { words: list, marks }]) => {
    const vocabulary = new Set(list.split(" "));
    const wordHits = words.filter((word) => vocabulary.has(word)).length;
    const markHits = (sample.match(marks) ?? []).length;
    return [lang, wordHits + 2 * markHits];
  }).sort((a, b) => b[1] - a[1]);
  const [[best, top], [, second]] = scores;
  return top >= 3 && top >= second * 1.5 ? best : fallback;
}

// Confirmação automática para o visitante, enviada do Gmail do Emanuel por um
// Google Apps Script (gratuito). Para não virar canal de spam: sem o texto da
// mensagem, só o primeiro nome (sem símbolos) e no máximo 1 confirmação por e-mail a cada 24 h.
async function sendConfirmation({ name, email, message, lang }, env) {
  if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_SECRET) return;
  try {
    const { count } = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM messages WHERE email = ? AND created_at > datetime('now', '-1 day')",
    ).bind(email).first();
    if (count > 1) return;
    const firstName = (name.split(/\s+/)[0] ?? "").replace(/[^\p{L}'-]/gu, "").slice(0, 30);
    const response = await fetch(env.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Responde no idioma em que a mensagem foi escrita (ou no do site, se não der para saber).
      body: JSON.stringify({ secret: env.APPS_SCRIPT_SECRET, to: email, firstName, lang: detectLanguage(message, lang) }),
    });
    if (!response.ok) console.error(`Apps Script respondeu ${response.status}`);
  } catch (error) {
    console.error("Falha ao enviar a confirmação ao visitante:", error?.message ?? error);
  }
}

export async function handleContact(payload, ip, env, origin, ctx) {
  const limited = await rateLimited(env.CONTACT_LIMITER, ip, origin);
  if (limited) return limited;

  // Campo-armadilha: invisível para pessoas, só robôs preenchem.
  if (clean(payload?.website, 200)) return json({ ok: true }, 200, origin);

  const name = clean(payload?.name, 100);
  const email = clean(payload?.email, 200);
  const message = clean(payload?.message, 2000);
  const lang = languageOf(payload);
  const valid =
    name.length >= 2 && name.length <= 100 &&
    email.length <= 200 && EMAIL_PATTERN.test(email) &&
    message.length >= 5 && message.length <= 2000;
  if (!valid) return json({ error: "invalid_fields" }, 400, origin);

  if (!(await isHuman(payload?.turnstileToken, ip, env))) return json({ error: "turnstile_failed" }, 403, origin);

  try {
    await env.DB.prepare("INSERT INTO messages (name, email, message, lang) VALUES (?, ?, ?, ?)")
      .bind(name, email, message, lang)
      .run();
    // A mensagem já está salva; o aviso por e-mail segue em segundo plano.
    ctx.waitUntil(notifyByEmail({ name, email, message, lang }, env));
    ctx.waitUntil(sendConfirmation({ name, email, message, lang }, env));
    return json({ ok: true }, 200, origin);
  } catch (error) {
    console.error("Erro ao salvar mensagem:", error?.message ?? error);
    return json({ error: "unavailable" }, 503, origin);
  }
}
