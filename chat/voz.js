// Assistente (5/5) — voz: grava a pergunta pelo microfone (MediaRecorder) e devolve o áudio em base64,
// para o Worker transcrever (chat/ia.js → POST /transcribe). Só grava quando o visitante toca no 🎤,
// e nada é enviado antes de ele parar a gravação (ou de ela chegar ao limite de MAX_SECONDS).

export const MAX_SECONDS = 20;

export const supported = () => Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

// Chrome/Firefox gravam WebM/Opus; Safari, MP4/AAC. O Whisper do Worker aceita os dois.
const mimeType = () => ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((type) => MediaRecorder.isTypeSupported?.(type));

// Começa a gravar (pede permissão na primeira vez; recusa → erro NotAllowedError).
// Devolve { stop(), done }: stop() encerra e as duas promessas resolvem com o Blob do áudio.
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const type = mimeType();
  const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const chunks = [];
  recorder.addEventListener("dataavailable", (event) => event.data.size && chunks.push(event.data));
  const done = new Promise((resolve) =>
    recorder.addEventListener("stop", () => {
      stream.getTracks().forEach((track) => track.stop()); // apaga o indicador de microfone do navegador
      resolve(new Blob(chunks, { type: recorder.mimeType }));
    }),
  );
  recorder.start();
  const timer = setTimeout(() => recorder.state === "recording" && recorder.stop(), MAX_SECONDS * 1000);
  const stop = () => {
    clearTimeout(timer);
    if (recorder.state === "recording") recorder.stop();
    return done;
  };
  return { stop, done };
}

export const toBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
