import test from "node:test";
import assert from "node:assert/strict";
import { handleTranscribe, MAX_AUDIO_BASE64 } from "../src/rotas/transcricao.js";

const ORIGIN = "https://exemplo.github.io";

// Turnstile aprovado, limite liberado e um Whisper simulado.
function setup(run) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true }));
  const calls = [];
  const env = {
    TURNSTILE_SECRET: "segredo",
    TRANSCRIBE_LIMITER: { limit: async () => ({ success: true }) },
    AI: { run: async (model, input) => (calls.push({ model, input }), run(input)) },
  };
  return { env, calls, restore: () => (globalThis.fetch = realFetch) };
}
const ask = (env, body) => handleTranscribe({ turnstileToken: "token", lang: "pt", audio: "GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibQ==", ...body }, "1.2.3.4", env, ORIGIN);

test("transcribes the audio with the site language as a hint", async () => {
  const { env, calls, restore } = setup(() => ({ text: "  Ele tem experiência\n com Kafka? " }));
  try {
    const response = await ask(env, {});
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { text: "Ele tem experiência com Kafka?" });
    assert.equal(calls[0].model, "@cf/openai/whisper-large-v3-turbo");
    assert.equal(calls[0].input.language, "pt");
    assert.equal(calls[0].input.vad_filter, true);
  } finally {
    restore();
  }
});

test("rejects missing, oversized or non-base64 audio without calling the AI", async () => {
  const { env, calls, restore } = setup(() => ({ text: "x" }));
  try {
    for (const audio of ["", "não é base64!", "A".repeat(MAX_AUDIO_BASE64 + 4)]) {
      const response = await ask(env, { audio });
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "invalid_audio" });
    }
    assert.equal(calls.length, 0);
  } finally {
    restore();
  }
});

test("silence answers 422 no_speech and the daily quota answers 503 quota", async () => {
  const silent = setup(() => ({ text: "" }));
  try {
    assert.deepEqual(await (await ask(silent.env, {})).json(), { error: "no_speech" });
  } finally {
    silent.restore();
  }
  const quota = setup(() => {
    throw new Error("AiError: 3036: daily free allocation of 10,000 neurons used");
  });
  try {
    const response = await ask(quota.env, {});
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "quota" });
  } finally {
    quota.restore();
  }
});
