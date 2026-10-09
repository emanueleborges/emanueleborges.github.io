#!/bin/sh
# Gera os PDFs do currículo (um por idioma) a partir de curriculo.html.
# Uso: ./gerar-curriculos.sh   (requer Google Chrome instalado)
set -e
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p cv
for lang in en pt es fr it zh ru; do
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --virtual-time-budget=8000 \
    --print-to-pdf="cv/curriculo-emanuel-borges-$lang.pdf" \
    "file://$PWD/curriculo.html?lang=$lang" 2>/dev/null
  echo "cv/curriculo-emanuel-borges-$lang.pdf"
done
