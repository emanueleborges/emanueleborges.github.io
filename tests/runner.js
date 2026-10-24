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
  window.fetch = realFetch;

  const pre = document.createElement("pre");
  pre.id = "test-results";
  pre.textContent = JSON.stringify(results);
  document.body.append(pre);
});
