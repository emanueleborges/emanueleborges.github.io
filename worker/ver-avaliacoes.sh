#!/bin/sh
# Mostra o resumo das avaliações (👍/👎) do chat e as últimas respostas mal avaliadas.
# Uso: ./ver-avaliacoes.sh            → últimas 10 avaliações negativas
#      ./ver-avaliacoes.sh 30         → últimas 30
cd "$(dirname "$0")"
LIMIT=${1:-10}
case "$LIMIT" in ""|*[!0-9]*) echo "Use um número, ex.: ./ver-avaliacoes.sh 30"; exit 1;; esac
echo "== Resumo =="
npx wrangler d1 execute portfolio-contact --remote \
  --command "SELECT SUM(rating = 1) AS positivas, SUM(rating = -1) AS negativas, COUNT(*) AS total FROM feedback"
echo "== Últimas respostas avaliadas com 👎 =="
npx wrangler d1 execute portfolio-contact --remote \
  --command "SELECT created_at AS data_utc, lang AS idioma, question AS pergunta, answer AS resposta FROM feedback WHERE rating = -1 ORDER BY id DESC LIMIT $LIMIT"
