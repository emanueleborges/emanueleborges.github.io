// Assistente do portfólio — interface: painel, mensagens, sugestões e a barra "Pergunte à minha IA".
// A lógica fica em chat/: texto.js (normalização), regras.js (respostas prontas),
// busca.js (busca local na página) e ia.js (Worker).
import { currentLang, prefersReducedMotion, t } from "./script.js";
import { normalize } from "./chat/texto.js";
import { LOCAL_ONLY, intents, faqs, findFaq } from "./chat/regras.js";
import { text, search } from "./chat/busca.js";
import * as ai from "./chat/ia.js";

function initChat() {
  /* ---------- Interface ---------- */

  const root = document.createElement("div");
  root.className = "chat";
  root.innerHTML = `
    <button class="chat-toggle" type="button" aria-expanded="false" aria-controls="chat-panel">
      <span class="chat-toggle-label" data-chat="toggleLabel"></span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4.4 21l4-2c1.1.3 2.3.5 3.6.5 5.5 0 10-3.8 10-8.5S17.5 3 12 3Zm-4 9.7a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"/></svg>
    </button>
    <section class="chat-panel" id="chat-panel" role="dialog" aria-labelledby="chat-title" hidden>
      <header class="chat-header">
        <site-logo class="chat-avatar" size="38"></site-logo>
        <div>
          <h2 id="chat-title" data-chat="title"></h2>
          <p data-chat="subtitle"></p>
        </div>
        <button class="chat-close" type="button" data-chat-aria="close">×</button>
      </header>
      <div class="chat-messages" aria-live="polite"></div>
      <div class="chat-suggestions" role="group"></div>
      <form class="chat-form">
        <input type="text" autocomplete="off" maxlength="200" />
        <button type="submit" data-chat-aria="send">↑</button>
      </form>
      <p class="chat-note" data-chat="${ai.enabled ? "disclaimerAi" : "disclaimer"}"></p>
    </section>
    <div class="chat-hint" hidden>
      <button class="chat-hint-text" type="button" data-chat="hint"></button>
      <button class="chat-hint-close" type="button" data-chat-aria="hintClose">×</button>
    </div>`;
  document.body.append(root);

  const toggle = root.querySelector(".chat-toggle");
  const panel = root.querySelector(".chat-panel");
  const messages = root.querySelector(".chat-messages");
  const suggestions = root.querySelector(".chat-suggestions");
  const form = root.querySelector(".chat-form");
  const input = form.querySelector("input");
  const hint = root.querySelector(".chat-hint");
  const tc = (key, vars) => t(`chat.${key}`, vars);

  const el = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content != null) node.textContent = content;
    return node;
  };

  const addMessage = (from, ...children) => {
    const bubble = el("div", `chat-msg chat-msg-${from}`);
    bubble.append(...children);
    messages.append(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  };

  // Trecho com os termos encontrados destacados (sem usar innerHTML).
  const snippet = (body, terms) => {
    const normalized = normalize(body);
    const hits = terms.map((term) => normalized.indexOf(term)).filter((i) => i >= 0);
    const first = hits.length ? Math.min(...hits) : 0;
    const start = Math.max(0, first - 60);
    const cut = (start > 0 ? "…" : "") + body.slice(start, start + 220) + (start + 220 < body.length ? "…" : "");
    const p = el("p", "chat-snippet");
    const lower = normalize(cut);
    let i = 0;
    while (i < cut.length) {
      const hit = terms
        .map((term) => ({ term, at: lower.indexOf(term, i) }))
        .filter(({ at }) => at >= 0)
        .sort((a, b) => a.at - b.at)[0];
      if (!hit) {
        p.append(cut.slice(i));
        break;
      }
      p.append(cut.slice(i, hit.at), el("mark", null, cut.slice(hit.at, hit.at + hit.term.length)));
      i = hit.at + hit.term.length;
    }
    return p;
  };

  // Forma como o termo aparece na página (ex.: "kafka" → "Kafka").
  // Prefere a forma com letras minúsculas/maiúsculas normais a rótulos em CAIXA ALTA.
  const displayTerm = (term, results) => {
    const found = [];
    for (const result of results) {
      const lower = normalize(result.body);
      for (let at = lower.indexOf(term); at >= 0; at = lower.indexOf(term, at + 1)) {
        const match = result.body.slice(at).match(/^[\p{L}\p{N}+#./-]+/u);
        if (match) found.push(match[0]);
      }
    }
    return found.find((word) => word !== word.toUpperCase()) ?? found[0] ?? term;
  };

  // Frase-resumo: "Sobre “Kafka”, encontrei:" + resultados agrupados por seção.
  const summary = (results, main) => {
    const groups = new Map();
    for (const result of results) {
      if (!groups.has(result.section)) groups.set(result.section, []);
      if (result.item) groups.get(result.section).push(result.item);
    }
    const nodes = [];
    nodes.push(
      el("p", null, main.length ? tc("summary", { q: main.map((term) => `“${displayTerm(term, results)}”`).join(" + ") }) : tc("found")),
    );
    const list = el("p", "chat-summary");
    [...groups].forEach(([section, items], index) => {
      if (index) list.append(" · ");
      list.append(el("strong", null, section));
      if (items.length) list.append(`: ${items.join(", ")}`);
    });
    nodes.push(list);
    return nodes;
  };

  // Sugestões de continuação: outras tecnologias que aparecem nos resultados.
  const relatedSuggestions = (results, terms) => {
    const names = [...document.querySelectorAll(".skill-chip strong")].map(text);
    const counts = new Map();
    for (const name of names) {
      const key = normalize(name);
      if (terms.some((term) => key.includes(term) || term.includes(key))) continue;
      const hitsCount = results.filter((result) => result.haystack.includes(key)).length;
      if (hitsCount) counts.set(name, hitsCount);
    }
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
  };

  const goTo = (target) => {
    // Se o item estiver escondido por um filtro, volta para "todos".
    const group = target.closest("[data-filter-items]");
    if (target.hidden && group) {
      document.querySelector(`[data-filter-group="${group.dataset.filterItems}"] [data-filter="todos"]`).click();
    }
    if (matchMedia("(max-width: 760px)").matches) setOpen(false);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.remove("chat-highlight");
    void target.offsetWidth;
    target.classList.add("chat-highlight");
    setTimeout(() => target.classList.remove("chat-highlight"), 2400);
  };

  const linkButton = (label, href) => {
    const a = el("a", "chat-link", label);
    a.href = href;
    if (!href.startsWith("cv/")) {
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.setAttribute("download", "");
    }
    return a;
  };

  const contactLinks = () => {
    const box = el("div", "chat-links");
    box.append(
      linkButton("E-mail", "mailto:emanuel.eborges@gmail.com"),
      linkButton("WhatsApp", "https://wa.me/5592999771376"),
      linkButton("LinkedIn", "https://www.linkedin.com/in/borgesemmanuell"),
      linkButton("GitHub", "https://github.com/emanueleborges"),
    );
    return box;
  };

  const chipButton = (label, onClick = () => ask(label)) => {
    const chip = el("button", "chat-chip", label);
    chip.type = "button";
    chip.addEventListener("click", onClick);
    return chip;
  };

  // Resposta pronta + contatos, "Ver na página" e botões de continuação.
  const faqAnswer = (faq) => {
    const nodes = [el("p", null, tc(`faq.${faq.key}`))];
    if (faq.contacts) nodes.push(contactLinks());
    const target = faq.target && document.querySelector(faq.target);
    if (target) {
      const button = el("button", "chat-goto", `${tc("goTo")} →`);
      button.type = "button";
      button.addEventListener("click", () => goTo(target));
      nodes.push(button);
    }
    if (faq.related?.length) {
      const box = el("div", "chat-related");
      box.append(
        ...faq.related.map((key) => {
          const label = tc(`q.${key}`);
          return chipButton(label, () => respond(label, () => faqAnswer(faqs.find((item) => item.key === key))));
        }),
      );
      nodes.push(box);
    }
    return nodes;
  };

  // Monta a resposta (lista de elementos) para uma pergunta.
  const answer = (query) => {
    const q = normalize(query);
    if (intents.cv.test(q)) {
      const box = el("div", "chat-links");
      box.append(linkButton(text(document.querySelector('[data-i18n="cv.download"]')).replace(/[↓]/g, "").trim(), `cv/curriculo-emanuel-borges-${currentLang}.pdf`));
      return [el("p", null, tc("cv")), box];
    }
    const faq = findFaq(q);
    if (faq) return faqAnswer(faq);
    if (intents.contact.test(q)) return [el("p", null, tc("contact")), contactLinks()];

    const { results, main } = search(query);
    if (!results.length) return [el("p", null, tc("none")), contactLinks()];

    const cards = results.map((result) => {
      const card = el("div", "chat-result");
      const button = el("button", "chat-goto", `${tc("goTo")} →`);
      button.type = "button";
      button.addEventListener("click", () => goTo(result.target));
      card.append(el("strong", null, result.label), snippet(result.body, result.terms), button);
      return card;
    });

    const nodes = [...summary(results, main), ...cards];
    const related = relatedSuggestions(results, results[0].terms);
    if (related.length) {
      const box = el("div", "chat-related");
      box.append(el("p", null, tc("related")), ...related.map((name) => chipButton(name)));
      nodes.push(box);
    }
    return nodes;
  };

  const renderTexts = () => {
    root.querySelectorAll("[data-chat]").forEach((node) => (node.textContent = tc(node.dataset.chat)));
    root.querySelectorAll("[data-chat-aria]").forEach((node) => node.setAttribute("aria-label", tc(node.dataset.chatAria)));
    input.placeholder = tc("placeholder");
    toggle.setAttribute("aria-label", tc("open"));
    suggestions.setAttribute("aria-label", tc("suggestions"));
    suggestions.replaceChildren(...["s1", "s2", "s3", "s4"].map((key) => chipButton(tc(key))));
  };

  // Avaliação 👍/👎 de uma resposta da IA (salva no D1 só quando o visitante clica).
  const ratingRow = (question, answerText) => {
    const row = el("div", "chat-rate");
    const label = el("span", "chat-rate-ask", tc("rateAsk"));
    const note = el("small", "chat-rate-note", tc("rateNote"));
    const buttons = [
      [1, "👍", "rateUp"],
      [-1, "👎", "rateDown"],
    ].map(([rating, icon, key]) => {
      const button = el("button", "chat-rate-button", icon);
      button.type = "button";
      button.setAttribute("aria-label", tc(key));
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", async () => {
        buttons.forEach((other) => (other.disabled = true));
        button.setAttribute("aria-pressed", "true");
        const ok = await ai.rate({ question, answer: answerText, rating, lang: currentLang });
        label.textContent = tc(ok ? "rateThanks" : "rateError");
        note.remove();
        if (!ok) buttons.forEach((other) => (other.disabled = false));
      });
      return button;
    });
    row.append(label, ...buttons, note);
    return row;
  };

  // Resposta da IA + atalho "Ver na página" para o trecho mais relevante do site.
  const aiReply = async (question) => {
    const reply = await ai.ask(question, currentLang);
    if (!reply) return answer(question);
    const nodes = [el("span", "chat-ai-label", tc("aiLabel"))];
    reply.split(/\n{2,}/).forEach((paragraph) => nodes.push(el("p", null, paragraph)));
    const { results } = search(question);
    const best = results.find((result) => result.item) ?? results[0];
    if (best) {
      const button = el("button", "chat-goto", `${tc("goTo")}: ${best.label} →`);
      button.type = "button";
      button.addEventListener("click", () => goTo(best.target));
      nodes.push(button);
    }
    nodes.push(ratingRow(question, reply));
    return nodes;
  };

  // Usa a IA quando configurada, exceto em contato, currículo e temas locais.
  const usesAi = (query) => {
    if (!ai.enabled) return false;
    const q = normalize(query);
    if (intents.cv.test(q) || intents.contact.test(q)) return false;
    const faq = findFaq(q);
    return !(faq && LOCAL_ONLY.has(faq.key));
  };

  const ask = (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (usesAi(trimmed)) respond(trimmed, () => aiReply(trimmed));
    else respond(trimmed, () => answer(trimmed));
  };

  // Mostra "digitando…" enquanto a resposta (local ou da IA) é preparada.
  async function respond(userText, makeReply) {
    addMessage("user", el("p", null, userText));
    const typing = addMessage("bot", el("span", "chat-typing", ""));
    typing.querySelector(".chat-typing").append(el("i"), el("i"), el("i"));
    typing.setAttribute("aria-hidden", "true");
    const minimumDelay = prefersReducedMotion ? 0 : 550;
    const [reply] = await Promise.all([makeReply(), new Promise((resolve) => setTimeout(resolve, minimumDelay))]);
    typing.removeAttribute("aria-hidden");
    typing.replaceChildren(...reply);
    messages.scrollTop = messages.scrollHeight;
  }

  /* ---------- Balão de convite (uma vez por visitante) ---------- */

  const hintStorageKey = "chatHintSeen";
  const hintSeen = () => {
    try {
      return localStorage.getItem(hintStorageKey) === "1";
    } catch {
      return false;
    }
  };
  const markHintSeen = () => {
    try {
      localStorage.setItem(hintStorageKey, "1");
    } catch {
      /* navegação privada: segue sem salvar */
    }
  };
  let hintTimer = null;

  const hideHint = () => {
    clearTimeout(hintTimer);
    hint.hidden = true;
  };

  const showHint = () => {
    if (!panel.hidden || hintSeen()) return;
    markHintSeen();
    hint.hidden = false;
    root.classList.add("is-nudging");
    setTimeout(() => root.classList.remove("is-nudging"), 1800);
    hintTimer = setTimeout(hideHint, 8000);
  };

  hint.querySelector(".chat-hint-text").addEventListener("click", () => setOpen(true));
  hint.querySelector(".chat-hint-close").addEventListener("click", hideHint);
  if (!prefersReducedMotion && !hintSeen()) setTimeout(showHint, 3000);

  function setOpen(open) {
    if (open) {
      hideHint();
      markHintSeen();
    }
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    root.classList.toggle("is-open", open);
    if (open) {
      ai.prepare();
      if (!messages.children.length) addMessage("bot", el("p", null, tc("greeting")));
      input.focus();
    }
  }

  toggle.addEventListener("click", () => setOpen(panel.hidden));
  root.querySelector(".chat-close").addEventListener("click", () => {
    setOpen(false);
    toggle.focus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
    input.value = "";
  });

  document.addEventListener("languagechange", () => {
    renderTexts();
    messages.replaceChildren();
    if (!panel.hidden) addMessage("bot", el("p", null, tc("greeting")));
  });
  renderTexts();

  /* ---------- Barra "Pergunte à minha IA" no topo ---------- */

  const heroAsk = document.querySelector("[data-hero-ask]");
  if (heroAsk) {
    heroAsk.hidden = false;
    const typed = heroAsk.querySelector(".hero-ask-typed");
    let examples = [];
    let current = "";
    let timer = null;

    const setCurrent = (text) => {
      current = text;
      typed.textContent = text;
      heroAsk.setAttribute("aria-label", `${t("hero.askLabel")}: ${text}`);
    };

    // Digita a pergunta, espera, apaga e passa para a próxima.
    const cycle = (index = 0) => {
      clearTimeout(timer);
      examples = t("hero.askExamples").split("|");
      const text = examples[index % examples.length];
      if (prefersReducedMotion) return setCurrent(text);
      let length = 0;
      const typeNext = () => {
        setCurrent(text.slice(0, ++length));
        if (length < text.length) timer = setTimeout(typeNext, 45);
        else timer = setTimeout(() => erase(text.length), 2600);
      };
      const erase = (n) => {
        setCurrent(text.slice(0, n));
        if (n > 0) timer = setTimeout(() => erase(n - 1), 18);
        else timer = setTimeout(() => cycle(index + 1), 300);
      };
      typeNext();
    };

    heroAsk.addEventListener("click", () => {
      const index = Math.max(0, examples.findIndex((example) => example.startsWith(current) && current));
      const question = examples[index] ?? examples[0];
      setOpen(true);
      ask(question);
    });
    document.addEventListener("languagechange", () => cycle(0));
    cycle(0);
  }

  // Link direto para o assistente: https://emanueleborges.github.io/#chat
  if (location.hash === "#chat") setOpen(true);
  // Botões que abrem o assistente na própria página (ex.: "Ver demo" no card do assistente).
  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-open-chat]")) return;
    event.preventDefault();
    setOpen(true);
  });

  // Usado pelos testes automáticos (tests/): devolve a resposta em texto.
  window.portfolioChat = {
    open: () => setOpen(true),
    answerText: (query) =>
      answer(query)
        .map((node) => node.textContent)
        .join(" | "),
    search: (query) => search(query).results.map((result) => result.label),
  };
}

initChat();
