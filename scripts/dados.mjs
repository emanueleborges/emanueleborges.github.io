// Lê, no Node, os dados que o navegador recebe como scripts clássicos: idiomas.js (globalThis.IDIOMAS),
// o perfil (data/perfil.json → perfil.js, globalThis.PERFIL) e as traduções i18n/<idioma>.js (window.I18N,
// que usam o PERFIL). O perfil vem sempre do JSON; o perfil.js é só a cópia que o navegador carrega.
// Fonte única para os geradores (scripts/gerar-secoes.mjs, worker/gerar-conhecimento.mjs, gerar-curriculos.sh).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const read = (file) => readFileSync(join(ROOT, file), "utf8");

// perfil.js: script clássico com os dados de data/perfil.json e os campos derivados deles.
// O navegador (páginas e service worker) precisa de um script, não de JSON: ele roda antes das
// traduções e funciona também em file:// (currículo em PDF). Gravado por scripts/gerar-secoes.mjs.
export function perfilScript() {
  const { _doc, ...dados } = JSON.parse(read("data/perfil.json"));
  return `// Gerado por scripts/gerar-secoes.mjs a partir de data/perfil.json — não edite aqui.
// Script clássico (globalThis.PERFIL): roda no navegador, no service worker e nos scripts Node.
(() => {
  const perfil = ${JSON.stringify(dados, null, 2).replace(/\n/g, "\n  ")};

  // Derivados dos dados acima.
  perfil.nomeCompleto = \`\${perfil.nome} \${perfil.sobrenome}\`;
  perfil.links = {
    email: \`mailto:\${perfil.email}\`,
    whatsapp: \`https://wa.me/\${perfil.telefone.replace(/\\D/g, "")}\`,
    github: \`https://github.com/\${perfil.github}\`,
    linkedin: \`https://www.linkedin.com/in/\${perfil.linkedin}\`,
  };
  perfil.cv = (lang) => \`\${perfil.curriculo}-\${lang}.pdf\`;

  globalThis.PERFIL = perfil;
})();
`;
}

// Contexto isolado que imita a página: window === globalThis.
const sandbox = {};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(read("idiomas.js"), sandbox, { filename: "idiomas.js" });
vm.runInContext(perfilScript(), sandbox, { filename: "perfil.js" });
export const IDIOMAS = sandbox.IDIOMAS;
export const LANGS = Object.keys(IDIOMAS);
for (const lang of LANGS) vm.runInContext(read(`i18n/${lang}.js`), sandbox, { filename: `i18n/${lang}.js` });

export const perfil = sandbox.PERFIL;
export const i18n = sandbox.I18N;

// "{nome} — {links.github}" → valores do perfil (caminhos com ponto). Campo inexistente é erro, não texto vazio.
export const preencher = (template) =>
  template.replace(/\{([\w.]+)\}/g, (_, path) => {
    const value = path.split(".").reduce((obj, key) => obj?.[key], perfil);
    if (typeof value !== "string") throw new Error(`Campo "${path}" não existe no data/perfil.json`);
    return value;
  });
