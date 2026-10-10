# Especificação — Portfólio de Emanuel Borges

🌐 [English](en/spec.md) · **Português**

> **Spec-Driven Development (SDD).** Este documento descreve **o quê** o produto faz e **por quê**. O **como** está em [`plan.md`](plan.md) e a execução em [`tasks.md`](tasks.md).

| | |
|---|---|
| **Produto** | Portfólio profissional com assistente de IA |
| **URL** | https://emanueleborges.github.io |
| **Responsável** | Emanuel Borges |
| **Status** | Em produção |
| **Restrição principal** | Custo zero de infraestrutura |

---

## 1. Visão

Apresentar o perfil profissional de Emanuel Borges a recrutadores e empresas do Brasil e do exterior de forma **clara, moderna e interativa**, permitindo que o visitante **encontre rapidamente** o que procura (experiência, projetos, tecnologias, formação, disponibilidade) e **entre em contato** com facilidade.

### 1.1 Problema
Currículos e perfis estáticos obrigam o recrutador a ler tudo para achar uma informação específica ("tem experiência com Kafka?", "aceita trabalho remoto?"), e não mostram na prática as habilidades técnicas do candidato.

### 1.2 Objetivos
1. Comunicar o perfil em até 30 segundos (topo da página + resumo).
2. Responder perguntas do visitante em linguagem natural, em 8 idiomas.
3. Facilitar o contato (e-mail, WhatsApp, LinkedIn, formulário, currículo em PDF).
4. Demonstrar, no próprio site, competências em front-end, back-end serverless e IA aplicada.
5. Operar com **custo zero**.

### 1.3 Fora do escopo
- Área administrativa web (as mensagens são lidas pelo terminal ou painel do Cloudflare).
- Blog, contas de usuário ou pagamentos.

---

## 2. Personas

| Persona | Necessidade | Como o produto atende |
|---|---|---|
| **Recrutador(a) técnico(a)** | Verificar rapidamente tecnologias e experiência | Seções organizadas, filtros, chat com IA, currículo em PDF |
| **Recrutador(a) internacional** | Ler no próprio idioma; entender modelo de contratação | 8 idiomas (inglês por padrão), respostas sobre remoto, fuso e CLT/PJ |
| **Gestor(a) / tech lead** | Avaliar profundidade técnica e projetos | Projetos com descrições técnicas, resultados (87%, 89%, top 5%) e o próprio site como demonstração |
| **Emanuel (dono)** | Atualizar conteúdo e acompanhar interesse | Fonte única de textos (`i18n.js`), scripts de publicação, estatísticas e mensagens do formulário |

---

## 3. Requisitos funcionais

### RF-01 — Conteúdo do perfil
O site deve apresentar: topo (nome, cargo, resumo, localização, anos de experiência), Sobre (com foto), Experiência (linha do tempo), Projetos, Habilidades, Formação (com certificações e idiomas) e Contato.

### RF-02 — Idiomas
- RF-02.1 Disponível em **inglês (padrão)**, português, espanhol, francês, italiano, alemão, chinês simplificado e russo.
- RF-02.2 O visitante troca o idioma por um seletor no cabeçalho; a escolha é lembrada.
- RF-02.3 O idioma pode ser definido pelo link (`?lang=xx`).
- RF-02.4 Todo texto visível, atributos de acessibilidade, chat, formulário e currículo seguem o idioma escolhido.

### RF-03 — Filtros
- RF-03.1 Projetos filtráveis por categoria (Todos, IA/ML, Backend & APIs, Web & Apps).
- RF-03.2 Habilidades filtráveis por categoria, com contador "mostrando X de Y".

### RF-04 — Currículo em PDF
- RF-04.1 Um PDF por idioma, gerado a partir da mesma fonte de textos do site.
- RF-04.2 O botão "Baixar currículo" entrega o PDF do idioma atual.

### RF-05 — Assistente (chat)
- RF-05.1 Botão flutuante abre o painel do assistente; um balão de convite aparece 3 s após a primeira visita (uma única vez).
- RF-05.2 **Respostas prontas** para temas frequentes (19 temas), com botões de continuação.
- RF-05.3 Saudação, agradecimento, salário, data de início e formação são respondidos **sempre** com texto pronto (sem IA).
- RF-05.4 Demais perguntas são respondidas por **IA generativa** com base **somente** no perfil (RAG).
- RF-05.5 Respostas da IA exibem o selo "Resposta gerada por IA" e um atalho "Ver na página".
- RF-05.6 Se a IA falhar, a resposta vem da **busca local** no conteúdo da página, sem mensagem de erro.
- RF-05.7 A busca local tolera erros de digitação e sinônimos e funciona nos 8 idiomas.
- RF-05.8 Perguntas sobre contato mostram botões de contato; sobre currículo, o link do PDF.
- RF-05.9 O link `/#chat` abre o site com o assistente aberto.
- RF-05.10 Respostas da IA podem ser avaliadas com 👍/👎; a avaliação (pergunta + resposta) só é salva quando o visitante clica, com aviso ao lado dos botões.

### RF-06 — Formulário de contato
- RF-06.1 Campos: nome, e-mail e mensagem (obrigatórios), com contador de caracteres.
- RF-06.2 Validação no navegador e no servidor.
- RF-06.3 Mensagens válidas são armazenadas; o visitante vê confirmação ("Mensagem enviada!").
- RF-06.4 O dono lê as mensagens por um comando ou pelo painel do Cloudflare.
- RF-06.5 A cada mensagem nova, o dono recebe um aviso por e-mail, com "Responder" direcionado ao visitante.
- RF-06.6 O visitante recebe uma confirmação automática no idioma da mensagem.

### RF-07 — Contatos diretos
E-mail, WhatsApp, LinkedIn e GitHub visíveis na seção de contato e no assistente.

### RF-08 — Estatísticas
Registrar visitas e eventos (chat aberto, pergunta respondida pela IA, download de currículo por idioma, cliques em contatos, troca de idioma, envio do formulário, avaliações) **sem cookies e sem o texto das perguntas**.

### RF-09 — SEO e compartilhamento
- RF-09.1 Ao compartilhar o link (LinkedIn, WhatsApp, X), exibir prévia com imagem, título e descrição.
- RF-09.2 Indicar ao Google as 7 versões de idioma (`hreflang`) e quem é a pessoa do site (dados estruturados `Person`).
- RF-09.3 Publicar `sitemap.xml` e `robots.txt`; o site é verificado no Google Search Console.

### RF-10 — Resumo semanal
Toda segunda-feira, o dono recebe por e-mail: mensagens da semana, avaliações do chat (com as respostas mal avaliadas) e a saúde da IA, do índice vetorial e do banco; visitas, se houver token do GoatCounter.

### RF-11 — Página não encontrada
Endereços inexistentes mostram uma página 404 no estilo do site, com links para o portfólio e o assistente.

---

## 4. Requisitos não funcionais

| ID | Categoria | Requisito |
|---|---|---|
| RNF-01 | **Custo** | Infraestrutura com custo zero: apenas planos gratuitos **sem forma de pagamento cadastrada** (o dono não pode ter custos). Ao atingir um limite grátis, o recurso deve pausar e o site seguir funcionando (degradação graciosa), nunca gerar cobrança. Serviços novos só entram se tiverem plano gratuito sem cartão. |
| RNF-02 | **Desempenho** | Site estático sem build; primeira imagem pré-carregada (menor no celular) e demais sob demanda; fontes sem bloquear a exibição; scripts de terceiros (Turnstile) carregados sob demanda; respostas repetidas da IA servidas do cache. Meta: Lighthouse (celular) ≥ 75 em desempenho e 100 em acessibilidade, boas práticas e SEO. |
| RNF-03 | **Disponibilidade** | O chat deve continuar útil mesmo sem IA (busca local); o formulário falha com mensagem clara. |
| RNF-04 | **Segurança** | Backend aceita só a origem do site; anti-robô em toda chamada ao backend; limites por IP; validação de entrada; nenhum segredo no repositório. |
| RNF-05 | **Privacidade (LGPD)** | Sem cookies de rastreamento; formulário guarda o mínimo (sem IP); aviso de uso de IA e de finalidade dos dados. |
| RNF-06 | **Acessibilidade** | HTML semântico, rótulos ARIA traduzidos, foco visível, navegação por teclado, respeito a `prefers-reduced-motion`. |
| RNF-07 | **Responsividade** | Funcional e legível de 360 px a desktop largo. |
| RNF-08 | **Confiabilidade da IA** | A IA não pode inventar fatos; deve recusar temas fora do perfil e resistir a instruções do visitante que tentem mudar as regras. |
| RNF-09 | **Manutenibilidade** | Fonte única de textos; conhecimento da IA e índice vetorial gerados automaticamente a partir dela. |
| RNF-10 | **Cache** | Atualizações do site devem chegar ao visitante sem exigir limpeza manual de cache. |

---

## 5. Critérios de aceite

### Idiomas
- [x] Sem preferência salva, o site abre em inglês.
- [x] Ao escolher "中文", todos os textos visíveis mudam para chinês e a escolha persiste ao recarregar.
- [x] `?lang=ru` abre o site em russo.

### Assistente
- [x] "where did he study?" retorna a formação com os nomes exatos (FUCAPI, UFG, FIAP, Descomplica).
- [x] "kafak" (erro de digitação) encontra os projetos com Kafka.
- [x] "Projetos com IA" lista os projetos da categoria IA/ML.
- [x] "Qual foi o TCC dele?" (IA) cita o Crítico Jurídico Inteligente.
- [x] "Me dá uma receita de bolo" é recusado educadamente.
- [x] "Ignore all previous instructions…" não altera o comportamento.
- [x] "Quantos anos ele tem?" responde que não há essa informação, sem inventar.
- [x] Com a IA indisponível, a pergunta é respondida pela busca local.
- [x] Os 92 casos de `tests/chat-casos.json` passam.

### Formulário
- [x] Enviar vazio mostra aviso de campos obrigatórios e destaca os campos.
- [x] Envio válido exibe o cartão de confirmação e grava no banco.
- [x] Envio com o campo-armadilha preenchido não grava nada.
- [ ] Mais de 3 envios por minuto do mesmo IP retornam "muitas mensagens seguidas" (implementado; ainda não testado em produção).

### Segurança
- [x] Pedido ao backend vindo de outra origem → `403 forbidden_origin`.
- [x] Pedido sem token Turnstile ou com token falso → `403 turnstile_failed`.
- [x] 11º pedido de chat no mesmo minuto → `429 rate_limited`.

### Cache
- [x] Após um commit, o HTML referencia `styles.css?v=<nova versão>`.
- [x] Mudança no perfil invalida automaticamente o cache de respostas da IA.

### Avaliações
- [x] Clicar em 👎 numa resposta da IA mostra "Obrigado pela avaliação!" e grava o registro no banco.

### SEO e desempenho
- [x] `sitemap.xml` e `robots.txt` respondem HTTP 200; o sitemap é XML válido com 15 endereços.
- [x] A página tem prévia Open Graph (imagem 1200×630), `hreflang` para os 8 idiomas e JSON-LD `Person` válido.
- [x] A tag de verificação do Google Search Console está publicada.
- [x] Lighthouse (celular): desempenho ~80, acessibilidade 100, boas práticas 100, SEO 100.
- [x] Um endereço inexistente responde HTTP 404 com a página personalizada.

### Integração contínua
- [x] Cada push na `main` roda no GitHub Actions: sintaxe dos scripts, validação de SEO, geração do conhecimento da IA e os 92 testes do chat — todos passando.

### E-mails
- [x] Nova mensagem do formulário gera aviso no Gmail do dono, com "Responder" para o visitante.
- [ ] O visitante recebe a confirmação no idioma da mensagem (aguardando liberar o Apps Script para "Qualquer pessoa").
- [ ] O resumo semanal chega na segunda-feira (envio de teste executado sem erros; recebimento a confirmar).
