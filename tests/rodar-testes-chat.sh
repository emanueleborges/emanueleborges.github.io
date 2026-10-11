#!/bin/sh
# Roda os testes do assistente de busca (chat.js) no Chrome headless, servindo o site num servidor local.
# Uso: ./tests/rodar-testes-chat.sh
set -e
cd "$(dirname "$0")/.."
# Chrome: variável CHROME, ou o do macOS, ou o do Linux (GitHub Actions).
if [ -z "$CHROME" ]; then
  if [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  else
    CHROME=$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser)
  fi
fi
[ -n "$CHROME" ] || { echo "Chrome não encontrado (defina a variável CHROME)"; exit 1; }
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cp -R index.html styles.css script.js i18n.js i18n api.js chat.js chat contact.js components imagens tests/runner.js "$TMP"/
# Sem o contador de visitas nos testes; injeta o executor dos testes.
# (perl funciona igual no macOS e no Linux, ao contrário de `sed -i`)
perl -0pi -e 's#.*goatcounter.*\n##g; s#</head>#<script src="runner.js" defer></script></head>#' "$TMP/index.html"
python3 -I - "$TMP" "$CHROME" tests/chat-casos.json <<'PY'
import functools, html, http.server, json, os, re, subprocess, sys, threading, urllib.parse
tmp, chrome, cases_file = sys.argv[1:4]
cases = json.load(open(cases_file))
# Servidor local: o site usa módulos ES, que o navegador não carrega por file://.
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=tmp))
threading.Thread(target=server.serve_forever, daemon=True).start()
origin = f"http://127.0.0.1:{server.server_address[1]}"
failed = total = 0
for lang, items in cases.items():
    url = f"{origin}/index.html?lang={lang}#" + urllib.parse.quote(json.dumps(items))
    flags = ["--headless=new", "--disable-gpu", f"--user-data-dir={tmp}/profile", "--virtual-time-budget=3000"]
    if os.environ.get("CI"):
        flags.append("--no-sandbox")  # necessário nos servidores do GitHub Actions
    dom = subprocess.run([chrome, *flags, "--dump-dom", url], capture_output=True, text=True).stdout
    m = re.search(r'<pre id="test-results">(.*?)</pre>', dom, re.S)
    if not m:
        print(f"[{lang}] ERRO: a página não retornou resultados"); failed += len(items); total += len(items); continue
    for r in json.loads(html.unescape(m.group(1))):
        total += 1
        status = "ok  " if r["ok"] else "FALHOU"
        if not r["ok"]: failed += 1
        print(f"[{lang}] {status} {r['query']!r} → espera {r['expected']!r}" + ("" if r["ok"] else f"\n         obteve: {r['got']}"))
print(f"\n{total - failed}/{total} testes passaram")
sys.exit(1 if failed else 0)
PY
