#!/bin/sh
# Mostra somente os totais diários de avaliações (👍/👎), sem perguntas ou respostas.
# Uso: ./ver-avaliacoes.sh            → últimos 10 dias
#      ./ver-avaliacoes.sh 30         → últimos 30 dias
cd "$(dirname "$0")"
LIMIT=${1:-10}
case "$LIMIT" in ""|*[!0-9]*) echo "Use um número, ex.: ./ver-avaliacoes.sh 30"; exit 1;; esac
echo "== Resumo =="
npx wrangler d1 execute portfolio-contact --remote \
  --command "SELECT SUM(CASE WHEN rating = 1 THEN total ELSE 0 END) AS positivas, SUM(CASE WHEN rating = -1 THEN total ELSE 0 END) AS negativas, SUM(total) AS total FROM feedback_daily WHERE feedback_date > date('now', '-30 days')"
echo "== Totais diários =="
npx wrangler d1 execute portfolio-contact --remote \
  --command "SELECT feedback_date AS data_utc, SUM(CASE WHEN rating = 1 THEN total ELSE 0 END) AS positivas, SUM(CASE WHEN rating = -1 THEN total ELSE 0 END) AS negativas FROM feedback_daily GROUP BY feedback_date ORDER BY feedback_date DESC LIMIT $LIMIT"
