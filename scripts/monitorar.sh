#!/usr/bin/env bash
# Confere se o site publicado e o Worker estão no ar (usado por .github/workflows/monitor.yml).
# Endereços e nome vêm de data/perfil.json. Sai com erro se algo estiver fora do ar; cota da IA
# esgotada é só aviso, porque o chat continua respondendo pela busca local.
#
# Uso:  bash scripts/monitorar.sh
set -uo pipefail
cd "$(dirname "$0")/.."

SITE=$(node -p "require('./data/perfil.json').site")
WORKER=$(node -p "require('./data/perfil.json').servicos.worker")
NOME=$(node -p "const p = require('./data/perfil.json'); p.nome + ' ' + p.sobrenome")
ORIGEM=${SITE%/}
RESUMO=${GITHUB_STEP_SUMMARY:-/dev/null}
falhas=0

# Repete pedidos que falham, para uma oscilação de rede não virar alarme.
buscar() { curl -sS --max-time 20 --retry 2 --retry-delay 5 --retry-all-errors "$@"; }

echo "| Verificação | Resultado |" >> "$RESUMO"
echo "|---|---|" >> "$RESUMO"
registrar() { echo "$1: $2"; echo "| $1 | $2 |" >> "$RESUMO"; }

# 1. Páginas iniciais (uma por idioma): respondem e trazem o nome do perfil.
for pagina in "" $(node -e "require('./idiomas.js'); Object.keys(globalThis.IDIOMAS).slice(1).forEach((c) => console.log(c + '/'))"); do
  html=$(buscar -f "${SITE}${pagina}")
  if [[ "$html" == *"$NOME"* ]]; then
    registrar "Site /${pagina}" "ok"
  else
    registrar "Site /${pagina}" "❌ fora do ar ou sem o conteúdo esperado"
    falhas=$((falhas + 1))
  fi
done

# 2. Worker: GET /status (só aceita a origem do site).
inicio=$(date +%s%N)
status=$(buscar -f -H "Origin: ${ORIGEM}" "${WORKER}/status")
ms=$(( ($(date +%s%N) - inicio) / 1000000 ))
colo=$(node -p "try { JSON.parse(process.argv[1]).colo ?? '' } catch { '' }" "$status")
ia=$(node -p "try { JSON.parse(process.argv[1]).ai ?? '' } catch { '' }" "$status")
if [ -n "$colo" ]; then
  registrar "Worker /status" "ok (${colo}, ${ms} ms)"
else
  registrar "Worker /status" "❌ fora do ar ou resposta inesperada"
  falhas=$((falhas + 1))
fi

# 3. IA: "quota" quando a cota gratuita do dia acabou (renova 00:00 UTC). É o estado visto pela
# instância do Worker que respondeu, então pode não refletir outros data centers.
if [ "$ia" = "quota" ]; then
  registrar "IA" "⚠️ cota do dia esgotada (o chat usa a busca local)"
  echo "::warning title=Cota da IA::A cota gratuita diária do Workers AI acabou; o chat responde pela busca local até 00:00 UTC."
elif [ -n "$ia" ]; then
  registrar "IA" "$ia"
fi

exit $(( falhas > 0 ))
