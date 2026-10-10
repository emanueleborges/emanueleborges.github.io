// Indexa os trechos do perfil (src/conhecimento.js) no Vectorize para o RAG do chat.
// Gera os vetores com o modelo multilíngue BGE-M3 do Workers AI (cota gratuita)
// e grava com `wrangler vectorize upsert`. Trechos removidos são apagados do índice.
// Rodado automaticamente por `npm run deploy`. Requer `npx wrangler login`.
import fs from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { CHUNKS } from "./src/conhecimento.js";

const INDEX = "portfolio-profile";
const EMBEDDING_MODEL = "@cf/baai/bge-m3";
const MANIFEST = new URL("./vetores-ids.json", import.meta.url);

// Conta e login do Wrangler (o mesmo usado para publicar o Worker).
const whoami = execFileSync("npx", ["wrangler", "whoami", "--json"], { encoding: "utf8" });
const accountId = JSON.parse(whoami).accounts?.[0]?.id;
const configPath = `${os.homedir()}/Library/Preferences/.wrangler/config/default.toml`;
const token = fs.existsSync(configPath) ? fs.readFileSync(configPath, "utf8").match(/^oauth_token = "([^"]+)"/m)?.[1] : process.env.CLOUDFLARE_API_TOKEN;
if (!accountId || !token) throw new Error("Faça login com `npx wrangler login` antes de indexar.");

// Gera os vetores em lotes.
const vectors = [];
for (let i = 0; i < CHUNKS.length; i += 16) {
  const batch = CHUNKS.slice(i, i + 16);
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${EMBEDDING_MODEL}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: batch.map((chunk) => `${chunk.title}. ${chunk.text}`) }),
  });
  const body = await response.json();
  if (!body.success) throw new Error(`Erro ao gerar vetores: ${JSON.stringify(body.errors)}`);
  batch.forEach((chunk, j) => vectors.push({ id: chunk.id, values: body.result.data[j], metadata: { title: chunk.title, text: chunk.text } }));
}

const file = `${os.tmpdir()}/portfolio-vetores-${Date.now()}.ndjson`;
fs.writeFileSync(file, vectors.map((vector) => JSON.stringify(vector)).join("\n"));
execFileSync("npx", ["wrangler", "vectorize", "upsert", INDEX, "--file", file], { stdio: "inherit" });
fs.rmSync(file);

// Apaga do índice os trechos que deixaram de existir.
const previous = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : [];
const current = CHUNKS.map((chunk) => chunk.id);
const removed = previous.filter((id) => !current.includes(id));
if (removed.length) execFileSync("npx", ["wrangler", "vectorize", "delete-vectors", INDEX, "--ids", ...removed], { stdio: "inherit" });
fs.writeFileSync(MANIFEST, `${JSON.stringify(current, null, 2)}\n`);

console.log(`Vectorize: ${vectors.length} trechos indexados${removed.length ? `, ${removed.length} removidos` : ""}.`);
