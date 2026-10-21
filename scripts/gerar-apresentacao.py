# Gera os áudios da apresentação falada do "Sobre mim" (botão ▶ na foto) com a voz do Emanuel,
# clonada pelo Chatterbox Multilingual (modelo aberto, licença MIT) na demo gratuita do Hugging Face.
# Os arquivos ficam em audio/apresentacao/ e são servidos pelo GitHub Pages: o visitante nunca chama
# a IA, então o custo por acesso é zero.
# O texto falado é o resumo do perfil em "about.speech" (i18n/<idioma>.js). Um arquivo por frase,
# para a legenda acompanhar a fala sem precisar de marcação de tempo. Frases que não mudaram
# desde a última geração são reaproveitadas (a cota gratuita de GPU da demo é pequena).
# Voz de referência: scripts/voz-referencia.wav, 16 s do pitch "Aplicativos Híbridos para Gestão
# de Cupons e Promoções" (youtube.com/watch?v=W6EMlj5NCdY).
# Uso: pip install gradio_client && python3 scripts/gerar-apresentacao.py   (requer ffmpeg;
# HF_TOKEN opcional, para usar a cota da sua conta do Hugging Face)
import json
import os
import re
import subprocess
from pathlib import Path

from gradio_client import Client, handle_file

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "audio" / "apresentacao"
VOICE = ROOT / "scripts" / "voz-referencia.wav"
LANGS = ["en", "pt", "es", "fr", "it", "de", "zh", "ru"]
SEED = 42  # mesma semente, mesma entonação ao gerar de novo


def speech(lang):
    source = (ROOT / "i18n" / f"{lang}.js").read_text(encoding="utf-8")
    return json.loads(re.search(r'^  "about\.speech": (".*"),$', source, re.M).group(1))


# Frases do resumo; cada uma vira uma faixa e uma legenda (a demo aceita até 300 caracteres).
def sentences(text, lang):
    parts = re.findall(r"[^。]+。?", text) if lang == "zh" else re.split(r"(?<=[.!?])\s+", text)
    return [part.strip() for part in parts if part.strip()]


manifest_path = OUT / "faixas.json"
previous = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
client = Client("ResembleAI/Chatterbox-Multilingual-TTS", token=os.environ.get("HF_TOKEN"))
manifest = {}

for lang in LANGS:
    folder = OUT / lang
    folder.mkdir(parents=True, exist_ok=True)
    old = previous.get(lang, [])
    manifest[lang] = []
    for i, text in enumerate(sentences(speech(lang), lang)):
        file = folder / f"{i}.mp3"
        track = {"text": text, "file": f"{lang}/{i}.mp3", "voice": "emanuel"}
        # Reaproveita a faixa se o texto e a voz são os mesmos da última geração.
        if not (i < len(old) and old[i] == track and file.exists()):
            wav = client.predict(text, lang, handle_file(str(VOICE)), 0.5, 0.8, SEED, 0.5, api_name="/generate_tts_audio")
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", wav, "-ac", "1", "-ar", "24000", "-b:a", "48k", str(file)], check=True)
        manifest[lang].append(track)
        # Salva a cada frase: se a cota acabar no meio, a próxima rodada continua de onde parou.
        manifest_path.write_text(json.dumps(previous | manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # Apaga faixas que sobraram de uma versão mais longa do texto.
    for extra in folder.glob("*.mp3"):
        if int(extra.stem) >= len(manifest[lang]):
            extra.unlink()
    print(f"{lang}: {len(manifest[lang])} frases")

manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("Áudios em audio/apresentacao/.")
