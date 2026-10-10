#!/bin/sh
# Mostra as mensagens do formulário de contato (mais recentes primeiro).
# Uso: ./ver-mensagens.sh            → últimas 20
#      ./ver-mensagens.sh 50         → últimas 50
cd "$(dirname "$0")"
LIMIT=${1:-20}
case "$LIMIT" in ""|*[!0-9]*) echo "Use um número, ex.: ./ver-mensagens.sh 50"; exit 1;; esac
npx wrangler d1 execute portfolio-contact --remote \
  --command "SELECT id, created_at AS data_utc, name AS nome, email, lang AS idioma, message AS mensagem FROM messages ORDER BY id DESC LIMIT $LIMIT"
