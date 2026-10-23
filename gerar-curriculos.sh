#!/bin/sh
# Gera os PDFs do currículo (um por idioma) a partir de curriculo.html — que monta o currículo com os
# dados de data/ (perfil.json, experiencia.json, formacao.json, projetos.json, habilidades.json) e i18n/.
# Os PDFs não ficam no repositório: o workflow de publicação (.github/workflows/publicar.yml) roda este
# script a cada push e publica os arquivos junto com o site.
# Uso: ./gerar-curriculos.sh [pasta do site]   (padrão: _site; requer Google Chrome ou Chromium)
set -e
cd "$(dirname "$0")"
OUT="${1:-_site}"
# Chrome: variável CHROME, ou o do macOS, ou o do Linux (GitHub Actions).
if [ -z "$CHROME" ]; then
  if [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  else
    CHROME=$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser)
  fi
fi
[ -n "$CHROME" ] || { echo "Chrome não encontrado (defina a variável CHROME)"; exit 1; }
SANDBOX=""
[ -n "$CI" ] && SANDBOX="--no-sandbox" # necessário nos servidores do GitHub Actions
# Caminho dos arquivos (data/perfil.json): <curriculo>-<idioma>.pdf, um por idioma do site (idiomas.js).
PREFIX=$(node --input-type=module -e 'import { perfil } from "./scripts/dados.mjs"; console.log(perfil.curriculo)')
LANGS=$(node --input-type=module -e 'import { LANGS } from "./scripts/dados.mjs"; console.log(LANGS.join(" "))')
mkdir -p "$OUT/$(dirname "$PREFIX")"
for lang in $LANGS; do
  "$CHROME" --headless=new --disable-gpu $SANDBOX --no-pdf-header-footer \
    --virtual-time-budget=8000 \
    --print-to-pdf="$OUT/$PREFIX-$lang.pdf" \
    "file://$PWD/curriculo.html?lang=$lang" 2>/dev/null
  [ -s "$OUT/$PREFIX-$lang.pdf" ] || { echo "Falhou: $OUT/$PREFIX-$lang.pdf"; exit 1; }
  echo "$OUT/$PREFIX-$lang.pdf"
done
