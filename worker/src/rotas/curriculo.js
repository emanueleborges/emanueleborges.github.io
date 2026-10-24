// GET /cv?lang=xx — o currículo em PDF, gerado pelo Browser Run (navegador da Cloudflare, plano gratuito:
// 10 minutos por dia) a partir da página publicada curriculo.html, a mesma do site. Cada PDF é gerado uma
// vez por idioma e versão do conteúdo e guardado no D1. Se o navegador não estiver disponível (limite do
// dia, falha), redireciona para a versão de impressão do site (?pdf=1), que gera o PDF no navegador do visitante.
import puppeteer from "@cloudflare/puppeteer";
import { NOME, VERSION } from "../conhecimento.js";
import { LANGUAGES } from "../comum.js";

// "Emanuel Borges" → "emanuel-borges"
const slug = NOME.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function renderPdf(url, env) {
  const browser = await puppeteer.launch(env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    return await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
  } finally {
    await browser.close();
  }
}

export async function handleCv(request, env, origin, render = renderPdf) {
  const asked = new URL(request.url).searchParams.get("lang");
  const lang = Object.hasOwn(LANGUAGES, asked) ? asked : "en";
  const printVersion = Response.redirect(`${origin}/curriculo.html?lang=${lang}&pdf=1`, 302);

  const { success } = await env.CV_LIMITER.limit({ key: request.headers.get("CF-Connecting-IP") ?? "unknown" });
  if (!success) return printVersion;

  let pdf = null;
  try {
    const row = await env.DB.prepare("SELECT pdf FROM cv_pdf WHERE lang = ? AND versao = ?").bind(lang, VERSION).first();
    if (row?.pdf) pdf = new Uint8Array(row.pdf);
  } catch (error) {
    console.error("Cache do currículo indisponível:", error?.message ?? error);
  }
  if (!pdf) {
    try {
      pdf = new Uint8Array(await render(`${origin}/curriculo.html?lang=${lang}`, env));
    } catch (error) {
      console.error("Browser Run indisponível, usando a versão de impressão:", error?.message ?? error);
      return printVersion;
    }
    try {
      await env.DB.prepare("INSERT OR REPLACE INTO cv_pdf (lang, versao, pdf) VALUES (?, ?, ?)").bind(lang, VERSION, pdf).run();
    } catch (error) {
      console.error("PDF do currículo não guardado:", error?.message ?? error);
    }
  }
  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="curriculo-${slug}-${lang}.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
