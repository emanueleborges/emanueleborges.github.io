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
- ✅ **T07** Imagens de fundo em tela cheia com duotone — RNF-07
- ✅ **T08** Partículas (Canvas), manchas de luz, animações ao rolar, respeito a "reduzir movimento" — RNF-06
- ✅ **T09** Filtros de Projetos e Habilidades com contador — RF-03
- ✅ **T10** Logos das instituições (versões para fundo claro e escuro) — RF-01
- ✅ **T11** Ícones das 46 habilidades (Simple Icons + genéricos) — RF-01

### Idiomas
- ✅ **T12** i18n em 8 idiomas, seletor no cabeçalho, `?lang=`, inglês por padrão — RF-02
- ✅ **T52** Alemão como 8º idioma: site, chat, currículo, IA e testes — RF-02

### Currículo
- ✅ **T13** `curriculo.html` como modelo A4 do currículo nos 8 idiomas — RF-04 *(os PDFs gerados no Mac foram substituídos pela T86)*
- ✅ **T14** Botão "Baixar currículo" por idioma — RF-04.2

### Assistente
- ✅ **T15** Busca local (TF-IDF, sinônimos, chinês) — RF-05.6, RF-05.7
- ✅ **T16** Correção de digitação (Damerau-Levenshtein) — RF-05.7
- ✅ **T17** 19 temas de respostas prontas com botões de continuação — RF-05.2
- ✅ **T18** Balão de convite (3 s, uma vez) — RF-05.1
- ✅ **T19** Worker com Workers AI (Qwen3 30B), CORS e limite por IP — RF-05.4, RNF-01, RNF-04
- ✅ **T20** AI Gateway; cache de prompts/respostas removido em revisão de privacidade — RNF-05
- ✅ **T21** Turnstile invisível — RNF-04
- ✅ **T22** RAG com Vectorize + BGE-M3 — RF-05.4
- ✅ **T23** Formação com resposta pronta conferida — RNF-08
- ✅ **T24** Testes automáticos do chat — Critérios de aceite
- ✅ **T49** Barra "Pergunte à minha IA" no topo e botão do chat com texto no desktop — RF-05

### Contato, métricas e privacidade
- ✅ **T25** WhatsApp, e-mail, LinkedIn, GitHub — RF-07
- ✅ **T26** Formulário de contato aposentado; links diretos mantidos e mensagens antigas removidas — RF-07, RNF-05
- ✅ **T36** Avaliações 👍/👎 agregadas por dia no D1 — RNF-05
- ✅ **T42** Resumo semanal por e-mail (Cron) com saúde da IA, Vectorize e D1 — RF-10
- ✅ **T61** Painel local (`npm run painel`) só com totais agregados — RF-08, RNF-05
- ✅ **T66** Mapa de cliques removido em revisão de privacidade
- ✅ **T67** Contagem regional por continente/dia, após consentimento — RF-08
- ✅ **T70** Estatísticas sem provedor externo, expurgo antes de 30 dias — RF-08, LGPD

### SEO, desempenho e qualidade
- ✅ **T29** Data de atualização no rodapé e versão `?v=` automática (hook) — RNF-10
- ✅ **T34** Open Graph/Twitter, `hreflang`, JSON-LD `Person`, `sitemap.xml` e `robots.txt` — RF-09
- ✅ **T40** GitHub Actions a cada push — Critérios de aceite
- ✅ **T41** Lighthouse: imagens sob demanda, fontes sem bloqueio, contraste — RNF-02, RNF-06
- ✅ **T43** Página 404 personalizada e link `#chat` — RF-11
- ✅ **T45** Google Search Console — RF-09.3
- ✅ **T50** Responsividade validada de 390 px a 1920 px — RNF-07
- ✅ **T51** Regras de custo zero documentadas e verificadas — RNF-01
- ✅ **T53** App instalável e offline (PWA) — RF-13
- ✅ **T54** Lighthouse no CI com notas mínimas — RNF-02, RNF-06
- ✅ **T60** Limite por IP em `GET /prices` e SRI no face-api.js — RNF-04
- ✅ **T68** Auditoria de 11/10/2026: desempenho da demo facial, CSP em todas as páginas, CLS, acessibilidade — RNF-02, RNF-04, RNF-05, RNF-06

### Projetos e demos
- ✅ **T31** "Ver código" em todos os cards — RF-01.1
- ✅ **T32** Linguagem, estrelas e atualização via API do GitHub — RF-01.1
- ✅ **T55** Demo LSTM no navegador, com baseline ingênuo e `GET /prices` — RF-12.1
- ✅ **T56** Demo de reconhecimento facial no navegador — RF-12.2
- ✅ **T57** Demo de recomendação de filmes (TF-IDF) — RF-12.3
- ✅ **T58** O assistente do portfólio como projeto, com botão que abre o chat — RF-01.2
- ✅ **T62** LSTM com 15 ações (B3 e NASDAQ) — RF-12.1
- ✅ **T63** "Sua vaga combina?" (`/vaga/` + `POST /match`) — RF-14
- ✅ **T77** Vagas: velocímetro e aderência por pilar — RF-14.4

### Temas, interações e componentização
- ✅ **T64** Temas Amazônia (padrão) e Editorial — RF-15
- ✅ **T65** Logo "E." por tema, com animação — RF-15
- ✅ **T69** Componentização: Web Components, dados + gerador de HTML, chat em módulos, Worker com um arquivo por rota, traduções sob demanda, importmap — RNF-02, RNF-09
- ✅ **T74** Sons de interface e vibração, com botão para mutar — RF-16.1
- ✅ **T75** Busca rápida, efeito de digitação e rodapé técnico — RF-16.5, RF-16.6, RF-16.7
- ✅ **T76** Experiência como esteira de CI/CD e grafo habilidades × projetos — RF-01.4, RF-01.5
- ✅ **T78** Demos, vaga, "Como construí" e currículo em modal; visualizador do GitHub; cartões de links externos — RF-16.2, RF-16.3
- ✅ **T79** "Compartilhar portfólio" — RF-16.4
- ✅ **T81** Visualizador do GitHub sem o limite de 60/h — RF-16.3

### Conteúdo
- ✅ **T72** Inglês descrito como básico (A2), evoluindo para intermediário (B1) — RF-01, RF-14
- ✅ **T73** SDD nas práticas (caixa de ferramentas, currículo, IA) — RF-01
- ✅ **T80** Java no ICCT e na Prefeitura; ASP.NET Web Forms e Bootstrap na Prefeitura — RF-01

### Fontes únicas e reaproveitamento (outubro de 2026)
- ✅ **T82** Efeito de digitação também na saudação do chat — RF-16.6
- ✅ **T83** Dados pessoais em `data/perfil.json` (gera `perfil.js`); traduções com o nome vindo do perfil; `data-perfil*` nas páginas; SEO, manifest, robots, sitemap, CSP e `wrangler.jsonc` gerados; troca completa testada com uma pessoa fictícia — RF-17
- ✅ **T84** Português estático do `index.html` copiado do `i18n/pt.js` pelo gerador; `scripts/dados.mjs` como leitor único no Node — RF-17, RNF-09
- ✅ **T85** Experiência e formação em `data/`; currículo e IA lendo os mesmos dados; idiomas em `idiomas.js` (seletores gerados); textos dos cartões e dos sistemas desenvolvidos vindos das traduções e de `data/experiencia.json` — RF-17
- ✅ **T86** PDF do currículo gerado pelo próprio site (impressão do navegador, `?pdf=1`); pasta `cv/`, `gerar-curriculos.sh` e PDFs removidos; links antigos redirecionados pela 404 — RF-04
- ✅ **T87** Temas em `data/temas.json` (gera `temas.css` e o bloco do `boot.js`); cores copiadas em três CSS removidas — RF-15.5
- ✅ **T88** Barra de intensidade da cor (`<theme-intensity>`), mais forte e mais escura no fim, no menu ☰ em telas estreitas — RF-15.4
- ✅ **T89** Endereço do Worker e chave do Turnstile em `servicos` (`data/perfil.json`); idioma inicial decidido só no `boot.js` — RF-17
- ✅ **T90** Foto, imagem de compartilhamento, áudios e voz de referência em `data/imagens` e `data/audio`; gerador da apresentação falada lendo do perfil — RF-01.8, RF-17
- ✅ **T91** Auditoria do D1 (`EXPLAIN QUERY PLAN`): todas as consultas usam o índice da chave primária — RNF-02
- ✅ **T92** Fallback da IA visível: `503 quota`/`unavailable`, aviso no chat, estado da IA no rodapé e no `/status`, testes no Worker e no navegador (8 idiomas) — RF-05.6, RF-16.7
- ✅ **T93** Projetos em destaque (4) e "Mais projetos" compactos; numeração gerada pela ordem de exibição — RF-01.6
- ✅ **T94** Formação "(em andamento)" no site, no currículo e na IA — RF-01.7
- ✅ **T95** Dependências do Worker: binário do workerd restaurado (`npm ci`); wrangler 4.152 com `undici` corrigido via `overrides` (0 vulnerabilidades) — RNF-04
- ✅ **T96** `CLAUDE.md` e SDD atualizados para a aplicação inteira — RNF-09
- ✅ **T97** Worker publicado (wrangler 4.152): conhecimento com a formação "em andamento", `ai` no `/status`, 33 trechos reindexados no Vectorize — RF-05.6, RF-01.7
- ✅ **T100** Base de conhecimento da IA revista: informações desatualizadas corrigidas (formulário de contato, PDFs), projeto p11 incluído, trechos de cargo atual, setor público e "o que fazer no site", métricas verificáveis e links de código/demo por projeto, sistemas da Prefeitura; nada escrito à mão no gerador (37 trechos) — RF-05.4, RF-17

---

## Pendentes

| ID | Tarefa | Depende de | Requisito |
|---|---|---|---|
| ⏳ **T98** | Atualizar a prévia do link no LinkedIn (Post Inspector), pois a imagem de compartilhamento mudou de endereço | Emanuel | RF-09.1 |
| ⏳ **T99** | Decidir se os logos das instituições vão para `data/imagens/logos/` (ícones de tecnologias ficam em `imagens/`) | Emanuel | RF-17 |
| ⏳ **T33** | Números de impacto nas experiências (ex.: tempo de deploy, % de bugs) | Dados do Emanuel | RF-01 |
| ⏳ **T35** | Revisão das traduções por falantes nativos (prioridade: chinês e russo) | Revisor | RF-02 |

## Ideias

- 💡 Brilhos e sombras (variáveis `*-rgb`) acompanhando a barra de intensidade.
- 💡 Deslocar o tom do verde em direção ao azul no fim da barra de intensidade.
- 💡 Demo do RAG Agent / Crítico Jurídico (perguntas sobre um PDF) com Workers AI, dentro da cota grátis.
- 💡 Gerar o portfólio a partir de um currículo enviado (extrair os dados para `data/` com IA e revisar antes de publicar).
- 💡 Recomendações de colegas (LinkedIn).
- 💡 Domínio próprio (pago) — endereço mais profissional e e-mails com remetente próprio.
