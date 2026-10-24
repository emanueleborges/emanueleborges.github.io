// POST /transcribe — pergunta falada no chat: áudio gravado no navegador (WebM/Opus ou MP4/AAC, até ~20 s)
// → texto, com o Whisper do Workers AI (mesma cota gratuita do chat). O áudio só é usado para gerar o
// texto: não é gravado nem guardado em cache. O texto volta para o campo do chat, onde o visitante revisa.
import { LANGUAGES, aiErrorKind, isHuman, json, rateLimited } from "../comum.js";

export const TRANSCRIBE_MODEL = "@cf/openai/whisper-large-v3-turbo";
// ~20 s de áudio comprimido cabem com folga; acima disso o pedido é recusado sem chamar a IA.
export const MAX_AUDIO_BASE64 = 1_500_000;

export async function handleTranscribe(payload, ip, env, origin) {
  const limited = await rateLimited(env.TRANSCRIBE_LIMITER, ip, origin);
  if (limited) return limited;

  const audio = typeof payload?.audio === "string" ? payload.audio : "";
  if (!audio || audio.length > MAX_AUDIO_BASE64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(audio)) return json({ error: "invalid_audio" }, 400, origin);
  const lang = Object.hasOwn(LANGUAGES, payload?.lang) ? payload.lang : "en";
  if (!(await isHuman(payload?.turnstileToken, ip, env))) return json({ error: "turnstile_failed" }, 403, origin);

  try {
    // O idioma do site como dica melhora nomes próprios e frases curtas; vad_filter ignora o silêncio.
    const result = await env.AI.run(TRANSCRIBE_MODEL, { audio, language: lang, vad_filter: true }, { gateway: { id: "default" } });
    const text = String(result?.text ?? "").replace(/\s+/g, " ").trim();
    if (!text) return json({ error: "no_speech" }, 422, origin);
    return json({ text: text.slice(0, 500) }, 200, origin);
  } catch (error) {
    console.error("Erro na transcrição:", error?.message ?? error);
    return json({ error: aiErrorKind(error) }, 503, origin);
  }
}
