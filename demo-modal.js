// Demos, páginas internas (vaga/, como-construi/) e o currículo em PDF abertos num modal, sem sair do portfólio: "Ver demo" (demos/<nome>/) carrega a página da demo
// num iframe com ?embed=1 (ela esconde o próprio cabeçalho — demos/demos.js), no idioma e tema atuais.
// Ctrl/⌘/Shift+clique ou clique do meio continuam abrindo a página inteira; "nova aba" também.
// Ao fechar, o iframe volta para about:blank (desliga a câmera da demo facial, por exemplo).

import { currentLang, t } from "./script.js";

const dialog = document.querySelector("[data-demo-modal]");

if (dialog?.showModal) {
  const frame = dialog.querySelector("[data-demo-modal-frame]");
  const title = dialog.querySelector("[data-demo-modal-title]");
  const newTab = dialog.querySelector("[data-demo-modal-new]");
  let opener = null;

  // Desliga a demo (câmera, timers) e devolve o foco; roda uma vez por abertura.
  const cleanup = () => {
    if (frame.getAttribute("src") === "about:blank") return;
    frame.src = "about:blank";
    opener?.focus({ preventScroll: true });
  };
  const close = () => {
    cleanup();
    if (dialog.open) dialog.close();
  };

  // Currículo em PDF: lê a versão HTML (curriculo.html, da qual o PDF é gerado — funciona também no
  // celular, onde o navegador não mostra PDF dentro da página) e o botão da barra baixa o PDF.
  const openPdf = (link) => {
    opener = link;
    const pdf = new URL(link.getAttribute("href"), location.href);
    const lang = pdf.pathname.match(/-([a-z]{2})\.pdf$/)?.[1] ?? currentLang;
    const page = new URL("curriculo.html", location.href);
    page.searchParams.set("lang", lang);
    page.searchParams.set("embed", "1");
    newTab.href = pdf.href;
    newTab.setAttribute("download", "");
    newTab.removeAttribute("target");
    newTab.textContent = t("demo.download");
    title.textContent = `~${pdf.pathname} · ${t("demo.cvTitle")}`;
    frame.title = t("demo.cvTitle");
    dialog.classList.remove("is-loaded");
    frame.src = page.href;
    dialog.showModal();
    dialog.querySelector("[data-demo-modal-close]").focus();
  };

  const open = (link) => {
    opener = link;
    newTab.removeAttribute("download");
    newTab.target = "_blank";
    newTab.innerHTML = t("demo.newTab");
    const url = new URL(link.getAttribute("href"), location.href);
    url.searchParams.set("lang", currentLang);
    url.searchParams.set("theme", document.documentElement.dataset.theme || "amazonia");
    newTab.href = url.href;
    url.searchParams.set("embed", "1");
    const name = (link.closest(".project-card")?.querySelector("h3") ?? link).textContent.replace(/[↗→↘▶]/g, "").replace(/\s+/g, " ").trim();
    title.textContent = `~${url.pathname.replace(/\/$/, "")} · ${name}`;
    frame.title = name;
    dialog.classList.remove("is-loaded");
    frame.src = url.href;
    dialog.showModal();
    dialog.querySelector("[data-demo-modal-close]").focus();
  };

  frame.addEventListener("load", () => frame.src !== "about:blank" && dialog.classList.add("is-loaded"));
  dialog.addEventListener("cancel", cleanup); // Esc
  dialog.addEventListener("close", cleanup);
  dialog.querySelector("[data-demo-modal-close]").addEventListener("click", close);
  newTab.addEventListener("click", () => newTab.hasAttribute("download") || close());
  // Clique no fundo escurecido fecha.
  dialog.addEventListener("click", (event) => event.target === dialog && close());
  document.addEventListener("languagechange", () => dialog.querySelector("[data-demo-modal-close]").setAttribute("aria-label", t("demo.close")));

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[data-demo][href^='demos/'], a[href='vaga/'], a[href='como-construi/']");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(link);
  });

  // Currículo (cv/*.pdf), em qualquer botão da página e na busca rápida.
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href$='.pdf']");
    if (!link || link.closest("[data-demo-modal]") || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (new URL(link.href).origin !== location.origin) return;
    event.preventDefault();
    openPdf(link);
  });
}
