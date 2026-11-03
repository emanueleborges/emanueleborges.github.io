// Executa os casos de teste do chat dentro da página (injetado por rodar-testes-chat.sh).
window.addEventListener("load", async () => {
  const cases = JSON.parse(decodeURIComponent(location.hash.slice(1)));
  const results = cases.map(([query, expected]) => {
    const wantsAnswer = expected.startsWith("answer:");
    const needle = wantsAnswer ? expected.slice(7) : expected;
    const got = wantsAnswer ? window.portfolioChat.answerText(query) : window.portfolioChat.search(query).join(" | ");
    return { query, expected, ok: got.includes(needle), got: got.slice(0, 160) };
  });

  // IA sem cota (erro 3036 no Worker): o chat avisa, responde pela busca local e o rodapé mostra o estado.
  // Turnstile e Worker simulados — o teste não acessa a rede.
  window.turnstile = {
    render: (holder, options) => ((window.turnstile.options = options), 1),
    execute: () => window.turnstile.options.callback("token-de-teste"),
    reset: () => {},
  };
  const realFetch = window.fetch;
  window.fetch = async (url, init) =>
    String(url).startsWith(window.PERFIL.servicos.worker)
      ? new Response(JSON.stringify({ error: "quota" }), { status: 503, headers: { "Content-Type": "application/json" } })
      : realFetch(url, init);
  const lang = document.documentElement.lang.slice(0, 2);
  const notice = window.I18N[lang]?.["chat.aiQuota"] ?? window.I18N.pt["chat.aiQuota"];
  const footerText = window.I18N[lang]?.["sys.aiQuota"] ?? window.I18N.pt["sys.aiQuota"];
  const got = await window.portfolioChat.aiAnswerText("Kafka");
  const footer = document.querySelector("[data-system-state]")?.textContent ?? "";
  results.push({
    query: "[IA sem cota] Kafka",
    expected: "aviso + resposta local + rodapé",
    ok: got.startsWith(notice) && got.split(" | ").length > 1 && footer === footerText,
    got: `${got.slice(0, 120)} · rodapé: ${footer}`,
  });

  // Resposta em partes: o texto aparece na bolha enquanto chega; botões só no fim, sem redigitar.
  const waitFor = async (check) => {
    for (let i = 0; i < 100 && !check(); i += 1) await new Promise((resolve) => setTimeout(resolve, 50));
    return Boolean(check());
  };
  let stream;
  const body = new ReadableStream({ start: (controller) => (stream = controller) });
  window.fetch = async (url, init) =>
    String(url).startsWith(window.PERFIL.servicos.worker)
      ? new Response(body, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } })
      : realFetch(url, init);
  const encoder = new TextEncoder();
  const bubble = () => document.querySelector(".chat-ai-label")?.parentElement;
  document.dispatchEvent(new CustomEvent("portfolio:ask", { detail: { question: "Qual a experiência com Kafka?" } }));
  await waitFor(() => document.querySelector(".chat-typing"));
  stream.enqueue(encoder.encode("Kafka "));
  const partial = await waitFor(() => bubble()?.textContent.includes("Kafka"));
  const busyWhileStreaming = bubble()?.getAttribute("aria-busy") === "true" && !bubble()?.querySelector(".chat-rate-ask");
  stream.enqueue(encoder.encode("é usado."));
  stream.close();
  const finished = await waitFor(() => bubble()?.querySelector(".chat-rate-ask"));
  const reply = bubble();
  results.push({
    query: "[IA em partes] Kafka",
    expected: "texto parcial + resposta inteira + avaliação, sem redigitar",
    ok: partial && busyWhileStreaming && finished && reply.querySelector("p")?.textContent === "Kafka é usado." && !reply.hasAttribute("aria-busy") && !reply.classList.contains("is-typing"),
    got: `parcial ${partial}, ocupado ${busyWhileStreaming}, fim ${finished}: ${reply?.textContent.slice(0, 80)}`,
  });
  window.fetch = realFetch;

  const pre = document.createElement("pre");
  pre.id = "test-results";
  pre.textContent = JSON.stringify(results);
  document.body.append(pre);
});
