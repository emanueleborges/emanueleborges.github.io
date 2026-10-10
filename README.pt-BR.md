# Emanuel Borges — Portfólio

🌐 [English](README.md) · **Português**

[![Testes](https://github.com/emanueleborges/emanueleborges.github.io/actions/workflows/testes.yml/badge.svg)](https://github.com/emanueleborges/emanueleborges.github.io/actions/workflows/testes.yml)

Portfólio profissional de **Emanuel Borges**, Desenvolvedor Full Stack Sênior (Java/Kotlin, Node.js, React, React Native) especializando-se em **IA aplicada (Machine Learning e NLP)**.

🔗 **Site:** https://emanueleborges.github.io · 💬 **Pergunte ao assistente:** https://emanueleborges.github.io/#chat

🧪 **Demos de IA ao vivo:** [previsão de ações (LSTM)](https://emanueleborges.github.io/demos/lstm/) · [reconhecimento facial](https://emanueleborges.github.io/demos/face/) · [recomendação de filmes](https://emanueleborges.github.io/demos/filmes/)

Site estático, sem framework, com um backend *serverless* no Cloudflare para o chat com IA e o formulário de contato, e **3 demos de IA que rodam no navegador do visitante**. **Toda a infraestrutura roda em planos gratuitos.**

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como rodar localmente](#como-rodar-localmente)
- [Publicação](#publicação)
- [Tarefas comuns](#tarefas-comuns)
- [Qualidade e testes](#qualidade-e-testes)
- [Segurança e privacidade](#segurança-e-privacidade)
- [Custos](#custos)
- [Especificação (SDD)](#especificação-sdd)
- [Créditos](#créditos)

---

## Funcionalidades

| Área | O que faz |
|---|---|
| **8 idiomas** | Inglês (padrão), português, espanhol, francês, italiano, alemão, chinês e russo. O visitante escolhe no cabeçalho; a escolha fica salva e pode vir no link (`?lang=pt`). |
| **Seções** | Sobre (com foto), Experiência, Projetos (10 cards, 4 com demo ao vivo; filtros, link para o código e linguagem/estrelas/última atualização vindos da API do GitHub), Habilidades (45 tecnologias com ícones e filtros), Formação (com logos das instituições) e Contato. |
| **Visual** | Tema escuro roxo + ciano, imagens de fundo em movimento (duotone), rede de partículas em Canvas, animações ao rolar e cabeçalho fixo com barra de progresso. Respeita "reduzir movimento". |
| **Assistente com IA** | Híbrido: **respostas prontas** locais para perguntas frequentes, **IA generativa com RAG** para o resto e **busca local** como reserva. Respostas da IA podem ser avaliadas com 👍/👎. Veja [Arquitetura](#arquitetura). |
| **Currículo em PDF** | Um PDF por idioma, gerado da mesma fonte de textos do site; o botão baixa o PDF do idioma atual. |
| **Formulário de contato** | Mensagens salvas no D1, proteção anti-robô invisível, **aviso por e-mail** ao dono e **confirmação automática** ao visitante no idioma da mensagem. |
| **Contatos diretos** | E-mail, WhatsApp, LinkedIn e GitHub. |
| **SEO** | Prévia de link (Open Graph/Twitter), `hreflang` para os 8 idiomas, dados estruturados de `Person` (JSON-LD), `sitemap.xml` e `robots.txt`; verificado no Google Search Console. |
| **Estatísticas** | Visitas e eventos (chat aberto, downloads do currículo, cliques em contatos, envios do formulário, avaliações) com GoatCounter, sem cookies. |
| **Resumo semanal** | Toda segunda, um e-mail com as mensagens da semana, as avaliações do chat e um teste de saúde da IA, do índice vetorial e do banco. |
| **Página 404** | Página personalizada no estilo do site, com links para o portfólio e o assistente. |
| **Demo de IA: previsão de ações com LSTM** | Página `/demos/lstm/` (8 idiomas) onde o LSTM do projeto FIAP roda **no navegador, em JavaScript puro** (pesos exportados do Keras, mesma saída até ~1e-8). Preços recentes pelo Worker (Yahoo Finance), com cópia salva se ele falhar; métricas do teste comparadas com um baseline ingênuo. |
| **Demo de IA: reconhecimento facial** | Página `/demos/face/` com face-api.js (TensorFlow.js): detecção, embeddings de 128 números e reconhecimento pela webcam ou por foto. **Nada sai do aparelho** do visitante. |
| **Demo de IA: recomendação de filmes** | Página `/demos/filmes/`: TF-IDF + cosseno em JavaScript puro sobre ~1.500 filmes (Wikidata CC0 + resumos da Wikipédia CC BY-SA), por filme ou por descrição livre, mostrando os termos que explicam cada recomendação. |
| **App instalável (PWA)** | Pode ser instalado no celular ou computador (ícone próprio) e abre sem internet: a página e os arquivos ficam salvos pelo *service worker*. |

---

## Arquitetura

```mermaid
flowchart LR
  V[Visitante] -->|HTTPS| GP[GitHub Pages<br/>site estático]
  GP -->|chat / contato / avaliação<br/>+ token Turnstile| W[Cloudflare Worker]
  W -->|valida token| TS[Turnstile]
  W -->|embeddings + geração| GW[AI Gateway<br/>cache 24 h]
  GW --> AI[Workers AI<br/>BGE-M3 e Qwen3 30B]
  W -->|busca semântica| VZ[Vectorize<br/>32 trechos do perfil]
  W -->|INSERT| D1[(D1<br/>mensagens + avaliações)]
  W -->|aviso + resumo semanal| RS[Resend → Gmail do dono]
  W -->|confirmação| GAS[Google Apps Script → visitante]
  GP -->|eventos sem cookies| GC[GoatCounter]
  GP -->|linguagem, estrelas, atualização| GH[API pública do GitHub]
  GP -->|demo LSTM: GET /prices| W
  W -->|fechamentos ajustados| YF[Yahoo Finance]
  GP -->|demo facial: face-api.js + modelos| CDN[jsDelivr]
```

As **demos de IA** fazem a inferência no navegador: o LSTM roda em JavaScript puro com pesos exportados do Keras, o reconhecimento facial usa face-api.js (TensorFlow.js) e a recomendação de filmes calcula TF-IDF + cosseno em JS. O *service worker* (`sw.js`) guarda o site para abrir offline.

### Como o assistente responde

1. **Contato e currículo** → botões de contato ou link do PDF (local).
2. **Respostas prontas** (19 temas, 8 idiomas) → saudação, agradecimento, salário, data de início e **formação** são **sempre locais**, sem custo e com texto conferido. Os demais temas prontos (tipo de vaga, remoto, IA, tecnologias…) são respondidos pela IA quando ela está disponível.
3. **IA com RAG** → o Worker:
   1. confere o token do **Turnstile**;
   2. gera o vetor da pergunta com **BGE-M3** (multilíngue);
   3. busca no **Vectorize** os 6 trechos do perfil mais parecidos em significado;
   4. envia ao **Qwen3 30B** um resumo fixo do perfil + esses trechos, com regras para responder só sobre o perfil e nunca inventar dados;
   5. guarda a resposta no **AI Gateway** por 24 h (chave = versão do conhecimento + idioma + pergunta normalizada).
4. **Busca local** (reserva) → se a IA falhar ou a cota do dia acabar, o chat procura no próprio conteúdo da página: ranking estilo TF-IDF, correção de digitação (Damerau-Levenshtein), sinônimos e tratamento de chinês.

O conhecimento da IA é **gerado das próprias traduções do site** (`i18n.js`): ao mudar o site e publicar o Worker, a IA e o índice vetorial acompanham.

---

## Tecnologias

**Front-end:** HTML5 semântico · CSS3 (sem framework) · JavaScript puro (ES2020+) · Canvas 2D · IntersectionObserver · Fetch API · `Intl` · `localStorage`

**Backend serverless (Cloudflare, plano gratuito):** Workers · Cron Triggers · Workers AI (`@cf/qwen/qwen3-30b-a3b-fp8`, `@cf/baai/bge-m3`) · Vectorize · AI Gateway · D1 (SQLite) · Turnstile · Rate Limiting · Wrangler

**IA nas demos:** Keras/TensorFlow (treino do LSTM) · LSTM em JavaScript puro (inferência) · face-api.js 1.7.15 / TensorFlow.js (WebGL) · TF-IDF + similaridade de cosseno em JS · SVG para gráficos

**PWA:** Web App Manifest · Service Worker (rede primeiro para a página, cache para os arquivos)

**E-mail:** Resend (avisos ao dono e resumo semanal) · Google Apps Script (confirmações ao visitante pelo Gmail)

**Ferramentas:** Git + GitHub · GitHub Pages · GitHub Actions · GitHub CLI · Chrome headless (PDFs e testes) · Lighthouse e Lighthouse CI · Node.js · Python · Shell · GoatCounter

**Recursos externos:** Google Fonts (Manrope, DM Mono) · Simple Icons (CC0) · Unsplash · API pública do GitHub · Yahoo Finance · Wikidata e Wikipédia · jsDelivr

---

## Estrutura do projeto

```
.
├── index.html              # Página única do portfólio (SEO, Open Graph, JSON-LD)
├── 404.html                # "Página não encontrada" personalizada
├── manifest.webmanifest · sw.js · icon-*.png  # App instalável e offline (PWA)
├── demos/                  # Demos de IA no navegador (demos.css/demos.js compartilhados)
│   ├── lstm/               # Previsão de ações: lstm.js (inferência), pesos e dados
│   ├── face/               # Reconhecimento facial com face-api.js
│   └── filmes/             # Recomendação de filmes: tfidf.js e filmes.json
├── scripts/gerar-dados-filmes.py  # Gera demos/filmes/filmes.json (Wikidata + Wikipédia)
├── scripts/lstm/           # Treino (train.py) e exportação (exportar_web.py) do LSTM da demo
├── styles.css              # Todo o visual (tema, layout, animações, chat, formulário)
├── i18n.js                 # Textos dos 8 idiomas (site, chat, formulário e currículo)
├── script.js               # Idiomas, menu, filtros, animações, partículas, estatísticas
├── api.js                  # Conexão compartilhada com o Worker e o Turnstile
├── chat.js                 # Assistente: respostas prontas, busca local, IA e avaliações
├── contact.js              # Formulário de contato
├── curriculo.html          # Modelo do currículo (A4) usado para gerar os PDFs
├── gerar-curriculos.sh     # Gera os 8 PDFs em cv/ com Chrome headless
├── sitemap.xml · robots.txt · og-image.jpg
├── cv/                     # Currículos em PDF (um por idioma)
├── logos/                  # Logos das instituições e ícones das habilidades
├── tests/                  # Testes automáticos do chat (92 casos, 8 idiomas)
├── .github/workflows/      # GitHub Actions: testes e Lighthouse a cada push
├── lighthouserc.json       # Notas mínimas do Lighthouse no CI
├── scripts/pre-commit      # Hook do git: data de atualização e versão dos arquivos
├── apps-script/Codigo.gs   # Confirmação ao visitante (Google Apps Script) — modelo sem a senha
├── docs/sdd/               # Especificação (SDD) em português; docs/sdd/en/ em inglês
└── worker/                 # Cloudflare Worker
    ├── src/index.js            # POST / (chat), /contact, /feedback, GET /prices (demo LSTM) + Cron semanal
    ├── src/conhecimento.js     # Gerado: resumo, trechos, perfil completo e versão
    ├── gerar-conhecimento.mjs  # Gera o conhecimento da IA a partir do i18n.js
    ├── indexar-vectorize.mjs   # Gera embeddings e atualiza o índice Vectorize
    ├── migrations/             # Esquema do D1 (messages, feedback)
    ├── ver-mensagens.sh        # Lista as mensagens do formulário
    ├── ver-avaliacoes.sh       # Resumo das avaliações 👍/👎 do chat
    ├── painel.mjs              # Painel privado de estatísticas (npm run painel)
    └── wrangler.jsonc          # Configuração (IA, Vectorize, D1, limites, origem, cron)
```

---

## Como rodar localmente

O site não tem etapa de build: basta servir a pasta.

```bash
git clone https://github.com/emanueleborges/emanueleborges.github.io.git
cd emanueleborges.github.io
python3 -m http.server 8000      # ou qualquer servidor estático
# abra http://localhost:8000
```

> Em ambiente local, o chat funciona com **respostas prontas e busca local**. A IA, o formulário e as avaliações só aceitam pedidos vindos de `https://emanueleborges.github.io` (CORS + Turnstile), por segurança.

Instale o hook do git (atualiza a data do rodapé e a versão `?v=` do CSS/JS a cada commit):

```bash
cp scripts/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

### Worker (opcional)

```bash
cd worker
npm install
npx wrangler login
npm run dev          # gera o conhecimento e roda o Worker localmente
```

---

## Publicação

**Site:** cada `git push` na `main` publica no GitHub Pages em 1–2 minutos (e roda os testes no GitHub Actions).

**Worker:**

```bash
cd worker
npm run deploy
```

Esse comando (1) gera o conhecimento a partir do `i18n.js`, (2) publica o Worker e (3) atualiza o índice do Vectorize.

**Recursos do Cloudflare** (criados uma vez):

| Recurso | Nome |
|---|---|
| Worker | `emanuel-portfolio-chat` (cron semanal: segundas 12:00 UTC) |
| Banco D1 | `portfolio-contact` (tabelas `messages` e `feedback`) |
| Índice Vectorize | `portfolio-profile` (1024 dimensões, cosseno) |
| AI Gateway | `default` |
| Widget Turnstile | invisível, domínio `emanueleborges.github.io` |
| Secrets do Worker | `TURNSTILE_SECRET`, `RESEND_API_KEY`, `APPS_SCRIPT_URL`, `APPS_SCRIPT_SECRET`, opcional `GOATCOUNTER_TOKEN` |

**Confirmação ao visitante (Google Apps Script):** cole `apps-script/Codigo.gs` num projeto novo do Apps Script com o mesmo valor do `APPS_SCRIPT_SECRET`, implante como **App da Web** (*Executar como: Eu*, *Quem pode acessar: Qualquer pessoa*) e guarde a URL `/exec` no secret `APPS_SCRIPT_URL`.

---

## Tarefas comuns

| Quero… | Faça |
|---|---|
| Mudar um texto do site | Edite `index.html` (português) e `i18n.js` (demais idiomas); depois rode `npm run deploy` em `worker/` para a IA aprender. |
| Atualizar os currículos em PDF | `./gerar-curriculos.sh` |
| Ler as mensagens do formulário | `cd worker && ./ver-mensagens.sh` (ou `./ver-mensagens.sh 50`) — ou no painel: D1 → `portfolio-contact` → Console |
| Ver as avaliações 👍/👎 do chat | `cd worker && ./ver-avaliacoes.sh` |
| **Ver o painel de estatísticas** (gráficos de avaliações e mensagens, respostas mal avaliadas, visitas) | `cd worker && npm run painel` — veja [Painel de estatísticas](#painel-de-estatísticas) |
| Ver uso da IA e do cache | Painel do Cloudflare → **AI → AI Gateway → default** |
| Ver visitas e eventos | https://emanueleborges.goatcounter.com |
| Ver buscas e indexação no Google | [Google Search Console](https://search.google.com/search-console) → propriedade `https://emanueleborges.github.io/` |
| Rodar os testes do chat | `./tests/rodar-testes-chat.sh` |
| Rodar o Lighthouse como no CI | `npx @lhci/cli@0.15.1 autorun` (usa `lighthouserc.json`) |
| Atualizar a base de filmes | `python3 scripts/gerar-dados-filmes.py` (~2 min) |
| Retreinar o LSTM da demo | `pip install -r scripts/lstm/requirements.txt` → `python scripts/lstm/train.py` → `python scripts/lstm/exportar_web.py demos/lstm` |
| Adicionar uma ação à demo do LSTM | Inclua o código em `TICKERS` (`scripts/lstm/train.py`) e em `PRICE_SYMBOLS` (`worker/src/index.js`); retreine, exporte e rode `npm run deploy` em `worker/` |

### Painel de estatísticas

Painel privado com gráficos de avaliações do chat, mensagens do formulário e visitas. É um arquivo local (`worker/painel.html`), fora do git, porque contém nomes e e-mails de visitantes.

```bash
cd worker
npm run painel        # ou: npm run panel
```

**Para incluir as visitas (GoatCounter):**

1. Crie uma chave em https://emanueleborges.goatcounter.com/user/api (permissão de leitura de estatísticas).
2. Escolha uma forma de usar a chave:

   **Opção A — salvar uma vez (recomendado):** grave a chave em `worker/.dev.vars`, arquivo que o git ignora:
   ```bash
   cd worker
   echo 'GOATCOUNTER_TOKEN=SUA_CHAVE' >> .dev.vars
   npm run painel
   ```

   **Opção B — informar a cada uso**, na mesma linha do comando:
   ```bash
   cd worker
   GOATCOUNTER_TOKEN=SUA_CHAVE npm run painel
   ```

   ou em duas linhas, com `export` (vale até fechar o terminal):
   ```bash
   export GOATCOUNTER_TOKEN=SUA_CHAVE
   npm run painel
   ```

> ⚠️ Troque `SUA_CHAVE` pela chave real **só no terminal ou no `.dev.vars`** — nunca neste README nem em arquivos do git. Sem `export`, a chave escrita numa linha separada **não** chega ao `npm run painel`.

**Bônus:** a mesma chave inclui as visitas no resumo semanal por e-mail: `cd worker && npx wrangler secret put GOATCOUNTER_TOKEN` (cole a chave quando pedir).

---

## Qualidade e testes

| Verificação | Resultado |
|---|---|
| **GitHub Actions** a cada push | Sintaxe dos JavaScript, validação do `sitemap.xml` e do JSON-LD, geração do conhecimento da IA e os **92 testes do chat** |
| **Lighthouse (celular)** | Desempenho ~80 · Acessibilidade 100 · Boas práticas 100 · SEO 100 |
| **Lighthouse no CI** a cada push | 3 medições; falha se acessibilidade < 95, boas práticas < 90 ou SEO < 95 (desempenho < 70 só avisa). O link do relatório aparece no log do GitHub Actions. |
| **Worker** | Origem errada, campos inválidos, token ausente/falso, rota inexistente, limites por minuto, campo-armadilha e `GET /prices` (ação fora da lista e outra origem recusadas) |
| **Demos de IA** | LSTM em JS conferido contra o Keras (diferença ~1e-8); demo facial reconhece uma foto espelhada e girada (distância 0,19); demo de filmes indexa ~1.500 filmes em < 50 ms; as três testadas no Chrome (desktop e celular, vários idiomas) e no site publicado |
| **Offline** | Com o *service worker* ativo, a página recarrega sem internet, com o visual e os projetos |
| **Ponta a ponta** | Perguntas, avaliações e envio do formulário no site publicado, numa janela real do Chrome (o Turnstile recusa navegadores automatizados invisíveis, como esperado) |

---

## Segurança e privacidade

- **CORS:** o Worker só aceita pedidos de `https://emanueleborges.github.io`.
- **Turnstile:** toda pergunta à IA, envio do formulário e avaliação exigem um token anti-robô válido.
- **Rota de preços (`GET /prices`):** só leitura, aceita apenas a origem do site e as 3 ações da demo, com limite por IP e cache de 1 h.
- **Integridade de scripts externos (SRI):** o face-api.js da demo facial tem `integrity` (SHA-384); se o arquivo do CDN for alterado, o navegador não o executa.
- **HTTPS obrigatório** com HSTS (GitHub Pages).
- **Contas:** a proteção mais importante é a verificação em duas etapas (2FA) no GitHub, Cloudflare, Google e Resend.
- **Limites por IP:** 10 perguntas/min (chat), 3 mensagens/min (formulário), 20 avaliações/min, 30 consultas de preços/min. O limitador do Cloudflare é permissivo (contadores com pequeno atraso): segura abusos em volume, não um pedido exato.
- **Validação:** pergunta ≤ 500 caracteres; nome 2–100, e-mail válido ≤ 200, mensagem 5–2.000.
- **Campo-armadilha** no formulário: envios de robôs são descartados sem salvar.
- **IA restrita ao perfil:** instruções para responder só sobre o perfil profissional, nunca inventar dados e ignorar tentativas de mudar as regras.
- **Confirmação ao visitante não vira canal de spam:** não repete o texto da mensagem, usa só o primeiro nome (letras) e envia no máximo 1 por e-mail a cada 24 h.
- **Sem segredos no código:** todas as chaves são *secrets* do Worker; a site key do Turnstile é pública por natureza.
- **LGPD:** o formulário guarda só nome, e-mail, mensagem, idioma e data (sem IP); estatísticas sem cookies; o chat avisa quando a pergunta vai para a IA; pergunta e resposta só são salvas se o visitante avaliar, com aviso ao lado dos botões.
- **Demo facial:** câmera e fotos são processadas só no aparelho do visitante; nada é enviado nem salvo, e os rostos cadastrados somem ao fechar a página.

---

## Custos

**Zero.** Tudo roda em planos gratuitos:

| Serviço | Uso |
|---|---|
| [GitHub Pages](https://pages.github.com) · [GitHub Actions](https://github.com/features/actions) | Hospedagem e testes (repositório público) |
| [Cloudflare Workers](https://workers.cloudflare.com) | Backend e cron semanal (~100 mil requisições/dia grátis) |
| [Workers AI](https://developers.cloudflare.com/workers-ai/) | IA e embeddings (10.000 "neurônios"/dia grátis; centenas de perguntas/dia) |
| [Vectorize](https://developers.cloudflare.com/vectorize/), [D1](https://developers.cloudflare.com/d1/), [AI Gateway](https://developers.cloudflare.com/ai-gateway/), [Turnstile](https://www.cloudflare.com/application-services/products/turnstile/) | Planos gratuitos |
| [Resend](https://resend.com) | Avisos e resumo semanal (3.000 e-mails/mês grátis) |
| [Google Apps Script](https://developers.google.com/apps-script) | Confirmações ao visitante pelo Gmail (~100/dia) |
| [GoatCounter](https://www.goatcounter.com) | Gratuito para uso pessoal |
| Demos de IA | Rodam no navegador do visitante; modelos do face-api.js pelo [jsDelivr](https://www.jsdelivr.com) (CDN grátis); preços pelo Worker; base de filmes estática |
| [API do GitHub](https://docs.github.com/pt/rest) · [Yahoo Finance](https://finance.yahoo.com) · [Wikidata](https://www.wikidata.org)/[Wikipédia](https://www.wikipedia.org) | Públicas e gratuitas (sem chave) |

Se a cota diária da IA acabar, o chat continua com a busca local até a renovação (00:00 UTC).

### Regras para manter o custo zero

> ⚠️ O projeto **não pode gerar custo**. Verificado em 10/10/2026: Cloudflare no plano **Workers Free** e **nenhum cartão cadastrado** em nenhum serviço.

1. **Nunca cadastrar cartão** ou outra forma de pagamento (Cloudflare, Resend, Google, GitHub, GoatCounter).
2. **Ignorar** botões de "Upgrade", "Workers Paid", "Add payment method" ou similares.
3. Sem forma de pagamento, **nenhum serviço consegue cobrar**: ao atingir um limite grátis, o recurso **pausa** (ex.: Workers AI responde com erro 3036 e o chat usa a busca local) e volta no dia seguinte.
4. Antes de adicionar qualquer serviço novo, confirmar que ele tem **plano gratuito sem cartão** e o que acontece ao passar do limite.
5. Conferir de vez em quando: Cloudflare → **Billing** (plano *Workers Free*, sem forma de pagamento) e Resend → **Settings → Billing** (plano *Free*).

---

## Especificação (SDD)

O projeto segue **Spec-Driven Development**: a especificação descreve o *quê* e o *porquê* antes do *como*.

| Documento | Português | English |
|---|---|---|
| Especificação — visão, requisitos e critérios de aceite | [spec.md](docs/sdd/spec.md) | [spec.md](docs/sdd/en/spec.md) |
| Plano técnico — arquitetura, contratos de API, dados e decisões (ADRs) | [plan.md](docs/sdd/plan.md) | [plan.md](docs/sdd/en/plan.md) |
| Tarefas — concluídas e pendentes | [tasks.md](docs/sdd/tasks.md) | [tasks.md](docs/sdd/en/tasks.md) |

---

## Créditos

- Ícones das tecnologias: [Simple Icons](https://simpleicons.org) (CC0) — ver `logos/skills/LICENSE-simple-icons.md`. Oracle, SQL Server e AWS usam ícones genéricos por diretriz de marca.
- Logos de UFG, FIAP, Descomplica e FUCAPI: obtidos dos sites oficiais, usados apenas para identificar a formação.
- Imagens de fundo: [Unsplash](https://unsplash.com).
- Fontes: Manrope e DM Mono (Google Fonts).
- Demo facial: [face-api.js](https://github.com/vladmandic/face-api) (MIT), de Vladimir Mandic.
- Demo de filmes: dados do [Wikidata](https://www.wikidata.org) (CC0) e resumos da [Wikipédia](https://en.wikipedia.org) em inglês (CC BY-SA 4.0), encurtados.
- Demo do LSTM: preços do [Yahoo Finance](https://finance.yahoo.com), usados só para demonstração.

---

**Autor:** Emanuel Borges · [LinkedIn](https://www.linkedin.com/in/borgesemmanuell) · [GitHub](https://github.com/emanueleborges) · emanuel.eborges@gmail.com
