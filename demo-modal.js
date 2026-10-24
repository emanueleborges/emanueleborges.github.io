// Demos, páginas internas (vaga/, como-construi/) e o currículo abertos num modal, sem sair do portfólio: "Ver demo" (demos/<nome>/) carrega a página da demo
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

  // Currículo: curriculo.html, montado com os dados de data/. O PDF é gerado na hora pela própria página
  // (impressão do navegador → "Salvar como PDF"), no botão da barra; sem arquivos PDF no site.
  const openCv = (link) => {
    opener = link;
    const page = new URL(link.getAttribute("href"), location.href);
    page.searchParams.set("lang", page.searchParams.get("lang") ?? currentLang);
    page.searchParams.delete("pdf");
    const standalone = new URL(page);
    standalone.searchParams.set("pdf", "1");
    page.searchParams.set("embed", "1");
    newTab.href = standalone.href; // Ctrl/⌘+clique: abre a página avulsa já na impressão
    newTab.dataset.print = "";
    newTab.removeAttribute("target");
    newTab.textContent = t("demo.download");
    title.textContent = `~${page.pathname} · ${t("demo.cvTitle")}`;
    frame.title = t("demo.cvTitle");
    dialog.classList.remove("is-loaded");
    frame.src = page.href;
    dialog.showModal();
    dialog.querySelector("[data-demo-modal-close]").focus();
  };

  const open = (link) => {
    opener = link;
    delete newTab.dataset.print;
    newTab.target = "_blank";
    newTab.innerHTML = t("demo.newTab");
    const url = new URL(link.getAttribute("href"), location.href);
    url.searchParams.set("lang", currentLang);
    url.searchParams.set("theme", document.documentElement.dataset.theme || window.TEMAS.padrao);
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
  newTab.addEventListener("click", (event) => {
    if (!("print" in newTab.dataset)) return close();
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    frame.contentWindow.print(); // imprime só o currículo do iframe (mesma origem)
  });
  // Clique no fundo escurecido fecha.
  dialog.addEventListener("click", (event) => event.target === dialog && close());
  document.addEventListener("languagechange", () => dialog.querySelector("[data-demo-modal-close]").setAttribute("aria-label", t("demo.close")));

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[data-demo][href^='demos/'], a[href='vaga/'], a[href='como-construi/']");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(link);
  });

  // Currículo, em qualquer botão da página, no chat e na busca rápida.
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href^='curriculo.html']");
    if (!link || link.closest("[data-demo-modal]") || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (new URL(link.href).origin !== location.origin) return;
    event.preventDefault();
    openCv(link);
  });
}
