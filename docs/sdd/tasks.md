# Tarefas — Portfólio de Emanuel Borges

🌐 [English](en/tasks.md) · **Português**

> **Spec-Driven Development (SDD).** Lista de execução derivada da [especificação](spec.md) e do [plano técnico](plan.md). Cada tarefa referencia os requisitos que atende.

Legenda: ✅ concluída · ⏳ pendente · 💡 ideia

---

## Concluídas

### Fundação
- ✅ **T01** Estrutura do site (topo, Sobre, Experiência, Projetos, Habilidades, Formação, Contato) — RF-01
- ✅ **T02** Publicação no GitHub Pages com deploy a cada `git push` — RNF-01
- ✅ **T03** Cabeçalho fixo com barra de progresso de leitura — RNF-06
- ✅ **T04** Favicon e ícone para iPhone/iPad com o "E." do logo

### Conteúdo e visual
- ✅ **T05** Conteúdo a partir do currículo e do LinkedIn — RF-01
- ✅ **T06** Foto oval com zoom ao passar o mouse — RF-01
- ✅ **T07** Paleta IA/tecnologia (roxo + ciano), imagens de fundo em tela cheia com duotone — RNF-07
- ✅ **T08** Partículas (Canvas), manchas de luz, animações ao rolar, respeito a "reduzir movimento" — RNF-06
- ✅ **T09** Filtros de Projetos e Habilidades com contador — RF-03
- ✅ **T10** Logos das instituições (versões para fundo claro e escuro) — RF-01
- ✅ **T11** Ícones das 45 habilidades (Simple Icons + genéricos) — RF-01

### Idiomas
- ✅ **T12** i18n em 8 idiomas, seletor no cabeçalho, `?lang=`, inglês por padrão — RF-02

### Currículo
- ✅ **T13** `curriculo.html` + `gerar-curriculos.sh` → 8 PDFs — RF-04
- ✅ **T14** Botão de download por idioma — RF-04.2

### Assistente
- ✅ **T15** Busca local (TF-IDF, sinônimos, chinês) — RF-05.6, RF-05.7
- ✅ **T16** Correção de digitação (Damerau-Levenshtein) — RF-05.7
- ✅ **T17** 19 temas de respostas prontas com botões de continuação — RF-05.2
- ✅ **T18** Balão de convite (3 s, uma vez) — RF-05.1
- ✅ **T19** Worker com Workers AI (Qwen3 30B), CORS e limite por IP — RF-05.4, RNF-01, RNF-04
- ✅ **T20** AI Gateway com cache de 24 h e chave versionada — RNF-02
- ✅ **T21** Turnstile invisível — RNF-04
- ✅ **T22** RAG com Vectorize + BGE-M3 (32 trechos) — RF-05.4, RNF-09
- ✅ **T23** Formação com resposta pronta conferida — RNF-08
- ✅ **T24** 92 testes automáticos do chat — Critérios de aceite

### Contato e métricas
- ✅ **T25** WhatsApp, e-mail, LinkedIn, GitHub — RF-07
- ✅ **T26** Formulário com D1, Turnstile, campo-armadilha, limite por IP, contador e confirmação — RF-06
- ✅ **T27** `ver-mensagens.sh` — RF-06.4
- ✅ **T28** GoatCounter com eventos — RF-08
- ✅ **T29** Data de atualização no rodapé e versão `?v=` automática (hook) — RNF-10

### Documentação
- ✅ **T30** README e documentos SDD (spec, plan, tasks) em português e inglês
- ✅ **T38** Aviso de nova mensagem por e-mail (Resend, gratuito) — RF-06.5
- ✅ **T36** Avaliação 👍/👎 das respostas da IA salva no D1 + `ver-avaliacoes.sh` — RNF-08
- ✅ **T34** Prévia de link (Open Graph/Twitter), `hreflang`, JSON-LD `Person`, `sitemap.xml` e `robots.txt` — RNF-02
- ✅ **T39** README em inglês (principal) + português — documentação
- ✅ **T40** GitHub Actions: sintaxe, SEO, conhecimento da IA e 92 testes a cada push — Critérios de aceite
- ✅ **T41** Lighthouse: imagens sob demanda e responsivas, fontes sem bloqueio, contraste (desempenho 69 → ~80; acessibilidade, boas práticas e SEO 100) — RNF-02, RNF-06
- ✅ **T42** Resumo semanal por e-mail (Cron) com saúde da IA, Vectorize e D1 — RF-08
- ✅ **T43** Página 404 personalizada e link `#chat` que abre o assistente
- ✅ **T45** Google Search Console: verificação por tag HTML e envio do `sitemap.xml` — RF-09.3
- ✅ **T48** Novo logo "E." (gradiente + nó de IA) em favicon, cabeçalho, rodapé, chat, 404 e ícone do iPhone
- ✅ **T49** Destaque do assistente: barra "Pergunte à minha IA" no topo (pergunta de exemplo digitada) e botão do chat com texto no desktop — RF-05
- ✅ **T50** Responsividade validada em smartphone (390 px), tablet (768 px), laptop (1366 px) e desktop (1920 px): menu ☰ até 1.100 px, sem rolagem lateral — RNF-07
- ✅ **T51** Regras de custo zero documentadas (README e RNF-01); verificado: Workers Free, sem cartão em nenhum serviço — RNF-01
- ✅ **T44** Confirmação automática ao visitante no idioma da mensagem (Google Apps Script) — RF-06.6
- ✅ **T52** Alemão como 8º idioma: site, chat (respostas prontas e busca), currículo PDF, IA, confirmação por e-mail e 13 testes — RF-02
- ✅ **T31** Link "Ver código" nos 9 cards de projetos, apontando para o repositório de cada um (8 idiomas) — RF-01
- ✅ **T32** Cards com linguagem, estrelas e data da última atualização via API pública do GitHub (sem chave, guardado na sessão) — RF-01
- ✅ **T53** App instalável e offline (PWA): manifest, ícones 192/512/maskable e *service worker* — RNF-02
- ✅ **T54** Lighthouse no GitHub Actions com notas mínimas (acessibilidade 95, boas práticas 90, SEO 95) — RNF-02, RNF-06
- ✅ **T55** Demo de IA `/demos/lstm/`: LSTM retreinado sem vazamento, inferência em JavaScript puro no navegador, comparação com baseline ingênuo, 8 idiomas e rota `GET /prices` no Worker — RF-01
- ✅ **T56** Demo de IA `/demos/face/`: reconhecimento facial com face-api.js no navegador (webcam ou foto, nada sai do aparelho), 8 idiomas — RF-01
- ✅ **T57** Demo de IA `/demos/filmes/`: recomendação TF-IDF + cosseno em JS puro sobre ~1.500 filmes de licença livre, com termos que explicam cada resultado — RF-01
- ✅ **T58** Card 10: o assistente do portfólio como projeto (RAG com Workers AI e Vectorize), com botão que abre o chat — RF-01
- ✅ **T59** Documentação atualizada (README, especificação RF-12/RF-13, plano §2.6–2.8, `GET /prices`, ADR-24 a 26) e scripts de treino do LSTM trazidos para `scripts/lstm/` — RNF-09
- ✅ **T60** Segurança: limite por IP na rota `GET /prices` (30/min) e SRI no face-api.js da demo facial (testado com arquivo adulterado) — RNF-04
- ✅ **T61** Painel privado de estatísticas (`npm run painel` em `worker/`): avaliações por semana e idioma, respostas mal avaliadas, mensagens e visitas (com token do GoatCounter); arquivo local, fora do git — RF-08
- ✅ **T62** Demo do LSTM com 15 ações (8 da B3, 7 da NASDAQ), menu por bolsa e preços na moeda de cada bolsa; card atualizado para o MAPE de 1,1–2,2% — RF-12

---

## Pendentes

| ID | Tarefa | Depende de | Requisito |
|---|---|---|---|
| ⏳ **T33** | Números de impacto nas experiências (ex.: tempo de deploy, % de bugs) | Dados do Emanuel | RF-01 |
| ⏳ **T35** | Revisão das traduções por falantes nativos (prioridade: chinês e russo) | Revisor | RF-02 |
| ⏳ **T37** | Testar em produção o limite de 3 mensagens por minuto do formulário | — | RNF-04 |
| ⏳ **T46** | Liberar o App da Web do Apps Script para "Qualquer pessoa" e testar a confirmação | Emanuel | RF-06.6 |
| ⏳ **T47** | Token do GoatCounter (`GOATCOUNTER_TOKEN`) para incluir visitas no resumo semanal | Emanuel | RF-08 |

## Ideias

- 💡 Demo do RAG Agent / Crítico Jurídico (perguntas sobre um PDF) com Workers AI, dentro da cota grátis.
- 💡 Mover `scripts/lstm/` também para o repositório `fiaptech4`, junto do projeto original.
- 💡 Recomendações de colegas (LinkedIn).
- 💡 Domínio próprio (pago) — endereço mais profissional e e-mails com remetente próprio.
