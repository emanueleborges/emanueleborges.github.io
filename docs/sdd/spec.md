# Especificação — Portfólio de Emanuel Borges

🌐 [English](en/spec.md) · **Português**

> **Spec-Driven Development (SDD).** Este documento descreve **o quê** o produto faz e **por quê**. O **como** está em [`plan.md`](plan.md) e a execução em [`tasks.md`](tasks.md).

| | |
|---|---|
| **Produto** | Portfólio profissional com assistente de IA, demos de IA e análise de vagas |
| **URL** | https://emanueleborges.github.io |
| **Responsável** | Emanuel Borges |
| **Status** | Em produção |
| **Restrições principais** | Custo zero de infraestrutura · privacidade (nada de conteúdo do visitante guardado) · cada informação num lugar só |

---

## 1. Visão

Apresentar o perfil profissional de Emanuel Borges a recrutadores e empresas do Brasil e do exterior de forma **clara, moderna e interativa**, permitindo que o visitante **encontre rapidamente** o que procura (experiência, projetos, tecnologias, formação, disponibilidade) e **entre em contato** com facilidade.

### 1.1 Problema
Currículos e perfis estáticos obrigam o recrutador a ler tudo para achar uma informação específica ("tem experiência com Kafka?", "aceita trabalho remoto?"), e não mostram na prática as habilidades técnicas do candidato.

### 1.2 Objetivos
1. Comunicar o perfil em até 30 segundos (topo da página + resumo + projetos em destaque).
2. Responder perguntas do visitante em linguagem natural, em 8 idiomas.
3. Facilitar o contato por links diretos (e-mail, WhatsApp, LinkedIn) e pelo currículo em PDF, sem formulário no site.
4. Demonstrar, no próprio site, competências em front-end, back-end serverless e IA aplicada.
5. Operar com **custo zero**.
6. Ser fácil de manter e de **reaproveitar como modelo**: dados pessoais, textos, idiomas e temas ficam em fontes únicas; o resto é gerado.

### 1.3 Fora do escopo
- Armazenamento de mensagens de contato pelo site.
- Armazenamento ou cache de perguntas e respostas dos visitantes.
- Blog, contas de usuário ou pagamentos.

---

## 2. Personas

| Persona | Necessidade | Como o produto atende |
|---|---|---|
| **Recrutador(a) técnico(a)** | Verificar rapidamente tecnologias e experiência | Seções organizadas, projetos em destaque, filtros, busca rápida, chat com IA, currículo em PDF |
| **Recrutador(a) internacional** | Ler no próprio idioma; entender modelo de contratação | 8 idiomas (inglês por padrão), respostas sobre remoto, fuso e CLT/PJ, análise "Sua vaga combina?" |
| **Gestor(a) / tech lead** | Avaliar profundidade técnica e projetos | Projetos com descrições técnicas e resultados verificáveis, **demos de IA ao vivo**, "Como construí" e o próprio site como demonstração |
| **Emanuel (dono)** | Atualizar conteúdo e acompanhar interesse | Fontes únicas (`data/`, `i18n/`, `idiomas.js`), gerador conferido no CI, estatísticas agregadas e resumo semanal |
| **Outra pessoa usando o projeto como modelo** | Ter o próprio portfólio sem reescrever código | Troca `data/` (dados, mídias, temas) e os textos de `i18n/`, roda o gerador e publica |

---

## 3. Requisitos funcionais

### RF-01 — Conteúdo do perfil
O site deve apresentar: topo (nome, cargo, resumo, localização, anos de experiência), Sobre (com foto e apresentação falada), Experiência (esteira de CI/CD), Projetos, Habilidades, Formação (com certificações e idiomas) e Contato.
- RF-01.1 Cada card de projeto tem o link "Ver código" para o repositório e mostra linguagem, estrelas (se houver) e data da última atualização, vindos da API pública do GitHub.
- RF-01.2 Projetos com demo ao vivo têm o botão "Ver demo" (LSTM, reconhecimento facial, recomendação de filmes, segurança RAG, gerador de imagens e o próprio assistente).
- RF-01.3 Resultados citados nos cards devem ser verificáveis (mesmo número mostrado na demo ou no repositório).
- RF-01.4 A Experiência é uma esteira de CI/CD: cada emprego é uma etapa (✓ concluída ou ● em execução), em ordem cronológica; escolher uma etapa mostra o "log" com as conquistas e a stack mais citada no período. Navegável por teclado (←/→).
- RF-01.5 As Habilidades abrem em grade (padrão) e podem ser vistas como grafo habilidades × projetos.
- RF-01.6 **Projetos em destaque:** os projetos marcados como destaque aparecem primeiro, em cards grandes com métricas; os demais ficam em "Mais projetos", em cards compactos. A numeração dos cards segue a ordem de exibição. O título "Mais projetos" some quando o filtro esconde todos os seus cards.
- RF-01.7 **Formação em andamento:** cursos ainda não concluídos mostram "(em andamento)" ao lado do período, no site, no currículo e nas respostas da IA.
- RF-01.8 **Apresentação falada:** o botão ▶ na foto toca um resumo do perfil (inglês e português) com legenda; o botão só aparece se houver áudio para o idioma.

### RF-02 — Idiomas
- RF-02.1 Disponível em **inglês (padrão)**, português, espanhol, francês, italiano, alemão, chinês simplificado e russo.
- RF-02.2 O visitante troca o idioma por um seletor no cabeçalho; a escolha é lembrada e vale em todas as páginas.
- RF-02.3 O idioma pode ser definido pelo link (`?lang=xx`).
- RF-02.4 Todo texto visível, atributos de acessibilidade, chat, cartões e currículo seguem o idioma escolhido.

### RF-03 — Filtros
- RF-03.1 Projetos filtráveis por categoria (Todos, IA/ML, Backend & APIs, Web & Apps), nos dois grupos (destaque e "Mais projetos").
- RF-03.2 Habilidades filtráveis por categoria, com contador "mostrando X de Y".

### RF-04 — Currículo em PDF
- RF-04.1 O currículo é **montado pelo próprio site**, na hora, a partir das mesmas fontes de dados e textos do site, em qualquer um dos 8 idiomas. Não existem arquivos PDF no repositório.
- RF-04.2 "Baixar currículo" abre o currículo do idioma atual num modal para leitura (legível no celular); "Baixar PDF" baixa o **arquivo PDF** em A4, gerado a partir da mesma página. Se a geração não estiver disponível, abre a impressão do navegador ("Salvar como PDF"); a página avulsa `curriculo.html?lang=xx&pdf=1` abre direto na impressão.
- RF-04.3 Links antigos para `/cv/…-<idioma>.pdf` levam ao currículo daquele idioma, já na impressão.

### RF-05 — Assistente (chat)
- RF-05.1 Botão flutuante abre o painel do assistente; um balão de convite aparece 3 s após a primeira visita (uma única vez).
- RF-05.2 **Respostas prontas** para temas frequentes (19 temas), com botões de continuação.
- RF-05.3 Saudação, agradecimento, salário, data de início e formação são respondidos **sempre** com texto pronto (sem IA).
- RF-05.4 Demais perguntas são respondidas por **IA generativa** com base **somente** no perfil (RAG).
- RF-05.5 Respostas da IA exibem o selo "Resposta gerada por IA" e um atalho "Ver na página".
- RF-05.6 Se a IA falhar ou a cota gratuita do dia acabar, o chat **avisa o visitante** ("A IA atingiu a cota gratuita de hoje…" ou "…está indisponível agora…") e responde pela **busca local** no conteúdo da página.
- RF-05.7 A busca local tolera erros de digitação e sinônimos e funciona nos 8 idiomas.
- RF-05.8 Perguntas sobre contato mostram botões de contato; sobre currículo, o atalho para o currículo (com "Baixar PDF").
- RF-05.9 O link `/#chat` abre o site com o assistente aberto.
- RF-05.10 Respostas da IA podem ser avaliadas com 👍/👎; somente totais diários por tipo de avaliação são guardados por até 30 dias, sem pergunta, resposta, idioma ou identificadores.
- RF-05.11 As respostas aparecem com efeito de digitação (ver RF-16.6).

### RF-07 — Contatos diretos
E-mail, WhatsApp, LinkedIn e GitHub visíveis na seção de contato e no assistente. Não há formulário; as mensagens não são enviadas nem armazenadas pelo site. Cada contato abre um cartão em modal (RF-16.3).

### RF-08 — Estatísticas
Contagem opcional somente após consentimento explícito. O Worker usa a região continental fornecida pela Cloudflare e o D1 armazena apenas totais diários por continente e por link clicado (alvos fixos validados pelo Worker); não registra IP, URL, idioma ou identificadores. Os agregados são removidos antes de completar 30 dias. Páginas abertas dentro do modal não perguntam nem contam visita.

### RF-09 — SEO e compartilhamento
- RF-09.1 Ao compartilhar o link (LinkedIn, WhatsApp, X), exibir prévia com imagem, título e descrição.
- RF-09.2 Indicar ao Google as 8 versões de idioma (`hreflang`) e quem é a pessoa do site (dados estruturados `Person`, com empresa atual e escolas vindas dos dados de experiência e formação).
- RF-09.3 Publicar `sitemap.xml` (página em 8 idiomas, demos, "Sua vaga combina?" e "Como construí") e `robots.txt`; o site é verificado no Google Search Console.

### RF-10 — Resumo semanal
Toda segunda-feira, o dono recebe por e-mail contagens agregadas de avaliações, acessos regionais e cliques consentidos, além da saúde da IA, do índice vetorial e do banco. O resumo contém somente dados agregados.

### RF-11 — Página não encontrada
Endereços inexistentes mostram uma página 404 no estilo do site, com links para o portfólio e o assistente (e o redirecionamento de RF-04.3).

### RF-12 — Demos de IA
Páginas próprias (`/demos/…`), nos 8 idiomas, no estilo e no tema do site, com link de volta ao portfólio e ao código:
- RF-12.1 **Previsão de ações (LSTM):** 15 ações (8 da B3 e 7 da NASDAQ) e 1–10 dias úteis; previsão em gráfico e tabela, métricas do teste fora da amostra **comparadas a um baseline ingênuo** e gráfico real × previsto. Preços atualizados quando possível; sem eles, a última cópia salva, com a data indicada. Aviso "não é recomendação de investimento".
- RF-12.2 **Reconhecimento facial:** pela webcam ou por foto; o visitante cadastra rostos com um nome e vê o reconhecimento com a distância. **Nenhuma imagem sai do aparelho** e nada é salvo.
- RF-12.3 **Recomendação de filmes:** por um filme escolhido ou por descrição livre (em inglês), com a similaridade e **os termos que explicam a recomendação**. Base de licença livre, com crédito às fontes.
- RF-12.4 As demos de inferência rodam no navegador do visitante; nenhuma exige conta ou servidor pago.
- RF-12.5 **Segurança RAG contra prompt injection:** simulação local e interativa de ataques na pergunta e em documentos recuperados, com defesas em camadas; não executa modelo de IA nem envia o texto digitado; o segredo exibido é fictício.
- RF-12.6 **Gerador de imagens (FLUX.1):** texto em qualquer idioma → imagem 1024×1024; 2 imagens por visitante por dia (a página mostra quantas restam), teto global diário, moderação do texto traduzido; nem o texto nem a imagem são salvos.

### RF-13 — App instalável e offline
O site pode ser instalado como app (manifest e ícones) e, depois da primeira visita, abre sem internet com a última versão salva; o chat usa a busca local quando offline.

### RF-14 — "Sua vaga combina?" (para recrutadores)
- RF-14.1 Página `/vaga/` (8 idiomas) onde o recrutador cola a descrição de uma vaga (80–8.000 caracteres, qualquer idioma) e recebe: nota de aderência (0–100%), cada requisito com nível (atende / parcial / não encontrado), obrigatório ou diferencial, justificativa e evidências clicáveis, e um resumo "por que <nome>" com botão de copiar.
- RF-14.2 Os requisitos são só os escritos na vaga (nada inventado, nada omitido); a nota é calculada por regra, não pela IA; nenhuma experiência pode ser afirmada sem evidência no perfil.
- RF-14.3 O texto da vaga não é salvo; o visitante é avisado disso.
- RF-14.4 O resultado mostra a nota num velocímetro e a aderência por pilar (Backend, Frontend, IA/ML, Dados, DevOps, Outros) em radar e barras.

### RF-15 — Temas
- RF-15.1 Dois temas: **Amazônia** (padrão; escuro, verde-floresta e lima com azul de tecnologia) e **Editorial** (escuro; azul-noite, ardósia e ciano).
- RF-15.2 Botão no cabeçalho de todas as páginas passa ao próximo tema; a escolha fica salva e vale nas próximas visitas e páginas; `?theme=editorial` abre direto no tema.
- RF-15.3 O tema é aplicado antes da primeira pintura (sem piscar); acessibilidade 100 no Lighthouse nos dois temas.
- RF-15.4 **Intensidade da cor:** uma barra ao lado do botão de tema deixa as cores mais fracas (à esquerda, até quase cinza) ou mais fortes e escuras (à direita); o meio corresponde às cores originais. A escolha fica salva, vale em todas as páginas e é aplicada antes da pintura. Em telas de até 420 px a barra fica no menu ☰.
- RF-15.5 Criar ou alterar um tema (nome em cada idioma, cores, tema padrão, limites da barra) exige editar um único arquivo de dados.

### RF-16 — Interações e navegação sem sair do site
- RF-16.1 **Sons e vibração:** cliques de interface e teclas ao digitar, sintetizados no navegador, e vibração curta no celular; botão para mutar em todas as páginas, com a escolha salva.
- RF-16.2 **Modais para páginas do site:** demos, "Como construí", a página de vagas e o currículo abrem num modal no idioma e tema atuais; fechar descarrega a página (desliga a câmera da demo facial).
- RF-16.3 **Links externos:** links do GitHub do dono abrem num visualizador em modal (pastas, README/Markdown formatados, código e imagens). LinkedIn, WhatsApp, e-mail e outros sites abrem um cartão em modal (QR code do WhatsApp, perfil do LinkedIn com cargo e cidade, e-mail para copiar, descrição e tecnologia dos sistemas desenvolvidos); o site externo só abre se o visitante pedir.
- RF-16.4 **Compartilhar:** QR code e link do portfólio no idioma atual, com copiar, compartilhamento nativo e atalhos para WhatsApp, LinkedIn e e-mail.
- RF-16.5 **Busca rápida:** `/` ou Ctrl/⌘+K abre uma barra que encontra projetos, experiências, habilidades, seções e ações, filtra os projetos por assunto e envia perguntas ao assistente; nada é enviado a servidor.
- RF-16.6 **Efeito de digitação:** respostas do chat (e a saudação) aparecem letra a letra em até ~2,5 s; clicar completa; leitores de tela recebem o texto inteiro; sem efeito com "reduzir movimento".
- RF-16.7 **Rodapé técnico:** mostra o modelo de IA do chat e o **estado da IA** (online / cota atingida · busca local / indisponível · busca local), atualizado pela última pergunta ao chat; ping e data center da Cloudflare só são medidos quando o visitante clica.

### RF-17 — Fontes únicas e reaproveitamento como modelo
- RF-17.1 Cada informação existe em **um único lugar**: dados pessoais, contatos, mídias, SEO e endereços de serviços (`data/perfil.json`); experiência e sistemas desenvolvidos; formação; projetos; habilidades; temas; idiomas; textos por idioma.
- RF-17.2 Tudo o que depende dessas fontes (HTML estático, SEO, sitemap, robots, manifest, CSP, seletores de idioma, currículo, cores, conhecimento da IA, configuração do Worker) é **gerado** a partir delas; arquivos gerados não são editados à mão.
- RF-17.3 Trocar os dados de `data/` e os textos de `i18n/` produz o portfólio de outra pessoa, sem alterar código; sem os áudios, o botão de apresentação falada simplesmente não aparece.

---

## 4. Requisitos não funcionais

| ID | Categoria | Requisito |
|---|---|---|
| RNF-01 | **Custo** | Infraestrutura com custo zero: apenas planos gratuitos **sem forma de pagamento cadastrada**. Ao atingir um limite grátis, o recurso pausa e o site segue funcionando (degradação graciosa), nunca gerando cobrança. Serviços novos só entram se tiverem plano gratuito sem cartão. |
| RNF-02 | **Desempenho** | Site estático sem build; primeira imagem pré-carregada; fontes sem bloquear a exibição; traduções, Turnstile, QR code e Markdown carregados sob demanda. Meta: Lighthouse (celular) ≥ 75 em desempenho e 100 em acessibilidade, boas práticas e SEO. |
| RNF-03 | **Disponibilidade** | O chat continua útil sem IA (busca local, com aviso); contato por links diretos; currículo sem depender de servidor. |
| RNF-04 | **Segurança** | Backend aceita só a origem do site; anti-robô em toda chamada que grava dados ou usa IA; limites por IP; validação de entrada; nenhum segredo no repositório; CSP em todas as páginas. |
| RNF-05 | **Privacidade (LGPD)** | Sem formulário de contato. Perguntas do chat, textos de vagas e pedidos de imagem são processados para gerar a resposta e **não são gravados nem guardados em cache** (nem no AI Gateway, nem em KV). O D1 guarda somente totais diários agregados, apagados antes de completar 30 dias. Estatísticas só após consentimento. Na demo facial, câmera e fotos ficam no aparelho. |
| RNF-06 | **Acessibilidade** | HTML semântico, rótulos ARIA traduzidos, foco visível, navegação por teclado, respeito a `prefers-reduced-motion`; acessibilidade 100 nos dois temas. |
| RNF-07 | **Responsividade** | Funcional e legível de 320 px a desktop largo, sem rolagem lateral (o cabeçalho é medido em 320, 360 e 390 px). |
| RNF-08 | **Confiabilidade da IA** | A IA não pode inventar fatos; deve recusar temas fora do perfil e resistir a instruções do visitante que tentem mudar as regras. |
| RNF-09 | **Manutenibilidade** | Fontes únicas (RF-17) e gerador com modo `--check` no CI: o build falha se qualquer arquivo gerado estiver desatualizado. Sem framework nem bundler; componentes em Web Components; módulos ES com importmap. |
| RNF-10 | **Cache** | Atualizações do site chegam ao visitante sem limpeza manual de cache (versão `?v=` automática). |

---

## 5. Critérios de aceite

### Idiomas
- [x] Sem preferência salva, o site abre em inglês.
- [x] Ao escolher "中文", todos os textos visíveis mudam para chinês e a escolha persiste ao recarregar e nas demos.
- [x] `?lang=ru` abre o site em russo.

### Assistente
- [x] "where did he study?" retorna a formação com os nomes exatos (FUCAPI, UFG, FIAP, Descomplica).
- [x] "kafak" (erro de digitação) encontra os projetos com Kafka.
- [x] "Qual foi o TCC dele?" (IA) cita o Crítico Jurídico Inteligente.
- [x] "Me dá uma receita de bolo" é recusado educadamente; "Ignore all previous instructions…" não altera o comportamento.
- [x] "Quantos anos ele tem?" responde que não há essa informação, sem inventar.
- [x] Com o Worker respondendo `503 quota` (erro 3036), o chat mostra o aviso de cota, responde pela busca local e o rodapé passa a "cota atingida · busca local" — nos 8 idiomas (teste automático).
- [x] Os 104 testes de `tests/rodar-testes-chat.sh` passam (96 casos + o fallback da IA em cada idioma).

### Fontes únicas e reaproveitamento
- [x] `node scripts/gerar-secoes.mjs --check` passa no CI; alterar um dado sem rodar o gerador faz o CI falhar.
- [x] Trocando só `data/perfil.json` por uma pessoa fictícia, site, títulos das demos, currículo, SEO, manifest, robots, sitemap, CSP, `wrangler.jsonc` e conhecimento da IA passam a mostrar a pessoa nova, sem restos do perfil anterior.
- [x] A seção de experiência, a formação e o currículo renderizado (pt e en) ficaram idênticos aos anteriores após passarem a vir de `data/`.

### Currículo
- [x] "Baixar currículo" abre o modal; "Baixar PDF" abre a impressão do currículo (testado com `print` simulado).
- [x] `curriculo.html?lang=fr&pdf=1` abre a impressão; sem `?pdf=1`, não.
- [x] O texto do PDF impresso é idêntico ao dos PDFs que existiam antes (pt, en e zh, 2 páginas).

### Temas
- [x] Na intensidade 1 (meio da barra), as 63 cores calculadas do tema são idênticas às de antes (diferença máxima de 0,5/255).
- [x] Barras do topo e do menu ficam sincronizadas; a escolha é salva e aplicada nas demos.
- [x] O cabeçalho mantém as mesmas medidas de antes em 320, 360 e 390 px.

### Contato e privacidade
- [x] A seção de contato mantém links diretos, sem formulário nem rota de envio ao Worker.
- [x] As consultas ao D1 usam o índice da chave primária (conferido com `EXPLAIN QUERY PLAN`).

### Segurança
- [x] Pedido ao backend vindo de outra origem → `403 forbidden_origin`.
- [x] Pedido sem token Turnstile ou com token falso → `403 turnstile_failed`.
- [x] 11º pedido de chat no mesmo minuto → `429 rate_limited`.
- [x] Script da demo facial adulterado no CDN → o navegador recusa executar (SRI).

### Cache
- [x] Após um commit, o HTML referencia `styles.css?v=<nova versão>` e o importmap usa a mesma versão.

### Avaliações
- [x] Clicar em 👎 numa resposta da IA mostra "Obrigado pela avaliação!" e incrementa o total do dia.

### SEO e desempenho
- [x] `sitemap.xml` e `robots.txt` respondem HTTP 200; o sitemap é XML válido com 16 endereços.
- [x] A página tem prévia Open Graph (imagem 1200×630), `hreflang` para os 8 idiomas e JSON-LD `Person` válido.
- [x] Lighthouse (celular): desempenho ~80, acessibilidade 100, boas práticas 100, SEO 100.
- [x] Um endereço inexistente responde HTTP 404 com a página personalizada.

### Integração contínua
- [x] Cada push na `main` roda: sintaxe dos scripts, SEO, gerador em `--check`, importmap, conhecimento da IA, testes do Worker (40), da demo de segurança (6) e do chat (104).
- [x] Cada push roda o Lighthouse (3 medições); falha se acessibilidade < 95, boas práticas < 90 ou SEO < 95.

### Projetos e demos
- [x] 4 projetos em destaque e 8 em "Mais projetos" (cards compactos de 240 px); filtros e busca rápida funcionam nos dois grupos.
- [x] UFG e FIAP mostram "(em andamento)" no site, no currículo e no conhecimento da IA.
- [x] O LSTM em JavaScript dá o mesmo resultado do Keras (diferença ~1e-8); o MAPE (1,1–2,2%) aparece ao lado do baseline ingênuo.
- [x] Demo facial: uma foto cadastrada é reconhecida numa versão espelhada e girada (distância 0,19 < 0,55).
- [x] Demo de filmes: ~1.500 filmes indexados em < 50 ms.

### App instalável
- [x] Depois da primeira visita, o site recarrega sem internet, com o visual e os projetos.

### Interações e navegação
- [x] "/" e Ctrl/⌘+K abrem a busca; "rag" filtra os projetos com RAG.
- [x] Demos, "Como construí", vagas e currículo abrem no modal; fechar limpa o iframe.
- [x] WhatsApp, LinkedIn, e-mail e os sistemas da Prefeitura abrem seus cartões, com textos vindos das traduções.

### E-mail de métricas
- [ ] O resumo semanal agregado chega na segunda-feira (envio de teste executado sem erros; recebimento a confirmar).
