// Executa os casos de teste do chat dentro da página (injetado por rodar-testes-chat.sh).
window.addEventListener("load", () => {
  const cases = JSON.parse(decodeURIComponent(location.hash.slice(1)));
  const results = cases.map(([query, expected]) => {
    const wantsAnswer = expected.startsWith("answer:");
    const needle = wantsAnswer ? expected.slice(7) : expected;
    const got = wantsAnswer ? window.portfolioChat.answerText(query) : window.portfolioChat.search(query).join(" | ");
    return { query, expected, ok: got.includes(needle), got: got.slice(0, 160) };
  });
  const pre = document.createElement("pre");
  pre.id = "test-results";
  pre.textContent = JSON.stringify(results);
  document.body.append(pre);
});
