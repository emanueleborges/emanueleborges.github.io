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

  // Currículo: curriculo.html (dados de data/) para leitura; o botão da barra baixa o PDF gerado pelo Worker
  // (PERFIL.cvPdf: Browser Run, com a versão de impressão do site como reserva).
  const openCv = (link) => {
    opener = link;
    const page = new URL(link.getAttribute("href"), location.href);
    page.searchParams.set("lang", page.searchParams.get("lang") ?? currentLang);
    page.searchParams.delete("pdf");
    newTab.href = new URL(globalThis.PERFIL.cvPdf(page.searchParams.get("lang")), location.href).href;
    page.searchParams.set("embed", "1");
    newTab.dataset.cv = "";
    newTab.target = "_blank"; // o PDF vem como download; a reserva (impressão) abre noutra aba
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
    delete newTab.dataset.cv;
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
  // "Nova aba" fecha o modal; "Baixar PDF" (currículo) só baixa e mantém o currículo aberto.
  newTab.addEventListener("click", () => "cv" in newTab.dataset || close());
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
