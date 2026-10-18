// Demos abertas num modal, sem sair do portfólio: "Ver demo" (demos/<nome>/) carrega a página da demo
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

  const open = (link) => {
    opener = link;
    const url = new URL(link.getAttribute("href"), location.href);
    url.searchParams.set("lang", currentLang);
    url.searchParams.set("theme", document.documentElement.dataset.theme || "amazonia");
    newTab.href = url.href;
    url.searchParams.set("embed", "1");
    const name = link.closest(".project-card")?.querySelector("h3")?.textContent.trim() ?? "Demo";
    title.textContent = `~/demos/${url.pathname.split("/").filter(Boolean).pop()} · ${name}`;
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
  newTab.addEventListener("click", close);
  // Clique no fundo escurecido fecha.
  dialog.addEventListener("click", (event) => event.target === dialog && close());
  document.addEventListener("languagechange", () => dialog.querySelector("[data-demo-modal-close]").setAttribute("aria-label", t("demo.close")));

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[data-demo][href^='demos/']");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(link);
  });
}
