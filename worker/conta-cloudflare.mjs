// Conta e credenciais da Cloudflare para os scripts locais (indexar-vectorize.mjs, painel.mjs):
// o login do Wrangler (`npx wrangler login`) e, se definida, a variável CLOUDFLARE_API_TOKEN
// (token próprio, para permissões que o login do Wrangler não tem — ex.: ler o Analytics Engine).
import fs from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";

export function contaCloudflare() {
  const whoami = execFileSync("npx", ["wrangler", "whoami", "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const accountId = JSON.parse(whoami).accounts?.[0]?.id;
  // Onde o Wrangler guarda o login: macOS e Linux.
  const configs = [`${os.homedir()}/Library/Preferences/.wrangler/config/default.toml`, `${os.homedir()}/.config/.wrangler/config/default.toml`];
  const config = configs.find((path) => fs.existsSync(path));
  const oauth = config ? fs.readFileSync(config, "utf8").match(/^oauth_token = "([^"]+)"/m)?.[1] : undefined;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN || undefined;
  if (!accountId || !(oauth || apiToken)) throw new Error("Faça login com `npx wrangler login` (ou defina CLOUDFLARE_API_TOKEN).");
  return { accountId, oauth, apiToken };
}
