// Confere os módulos ES do index.html: todo arquivo importado (direta ou indiretamente) precisa
// estar no <script type="importmap"> com a mesma versão (?v=) das tags. Sem isso, o navegador
// carregaria o mesmo arquivo duas vezes (com e sem ?v=) — por exemplo, dois script.js.
// Uso: node scripts/conferir-modulos.mjs   (roda no CI)

import { readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(ROOT, "index.html"), "utf8");

const map = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
const entries = [...html.matchAll(/<script type="module" src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const preloads = [...html.matchAll(/<link rel="modulepreload" href="([^"]+)"/g)].map((m) => m[1]);

const errors = [];
const key = (path) => `./${normalize(path)}`;
const versionOf = (url) => url.split("?v=")[1];
const version = versionOf(entries[0]);

// Percorre o grafo de imports a partir das tags <script type="module">.
const seen = new Set();
const visit = (path, from) => {
  if (seen.has(path)) return;
  seen.add(path);
  let source;
  try {
    source = readFileSync(join(ROOT, path), "utf8");
  } catch {
    errors.push(`${path} (importado por ${from}) não existe`);
    return;
  }
  for (const [, spec] of source.matchAll(/^import [^"]*"([^"]+)";$/gm)) {
    const target = normalize(join(dirname(path), spec));
    if (!map[key(target)]) errors.push(`${target} (importado por ${path}) não está no importmap`);
    visit(target, path);
  }
};
for (const entry of entries) visit(entry.split("?")[0], "index.html");

for (const [name, url] of Object.entries(map)) {
  if (versionOf(url) !== version) errors.push(`importmap: ${name} com versão diferente das tags (${url})`);
  if (!seen.has(name.slice(2))) errors.push(`importmap: ${name} não é usado por nenhum módulo`);
}
for (const url of [...entries, ...preloads]) {
  if (versionOf(url) !== version) errors.push(`${url}: versão diferente das demais`);
}
for (const url of preloads) {
  if (map[key(url.split("?")[0])] !== `./${url}`) errors.push(`modulepreload ${url} não bate com o importmap`);
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join("\n"));
  process.exit(1);
}
console.log(`Módulos em dia: ${seen.size} arquivos, todos no importmap com a versão ${version}`);
