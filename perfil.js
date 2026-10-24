// Gerado por scripts/gerar-secoes.mjs a partir de data/perfil.json — não edite aqui.
// Script clássico (globalThis.PERFIL): roda no navegador, no service worker e nos scripts Node.
(() => {
  const perfil = {
    "nome": "Emanuel",
    "sobrenome": "Borges",
    "nomeCivil": "Emanuel Melo Borges",
    "email": "emanuel.eborges@gmail.com",
    "telefone": "+55 92 99977-1376",
    "github": "emanueleborges",
    "linkedin": "borgesemmanuell",
    "site": "https://emanueleborges.github.io/",
    "foto": "data/imagens/emanuel-borges.jpg",
    "audio": {
      "apresentacao": "data/audio/apresentacao/",
      "vozReferencia": "data/audio/voz-referencia.wav",
      "voz": "emanuel"
    },
    "googleVerificacao": "4hxCxYtZIODldYdYJvIOxejABtc2_GRdp5L6Ug72eEE",
    "cargo": "Senior Full Stack Developer",
    "titulo": "Senior Full Stack Developer · AI & NLP",
    "resumo": "Senior Full Stack Developer (Java/Kotlin, Node.js, React, React Native) with 10+ years of experience, specializing in applied AI (Machine Learning and NLP).",
    "compartilhamento": {
      "descricao": "10+ years building systems with Java, Kotlin, Node.js, React and React Native — now applying Machine Learning and NLP. Portfolio in 3 languages with an AI assistant, live AI demos and a job-match tool for recruiters.",
      "descricaoCurta": "Portfolio and résumé in 3 languages, an AI assistant, live AI demos and a tool that matches your job description to my profile.",
      "imagem": "data/imagens/og-image.jpg?v=20261011",
      "imagemAlt": "Senior Full Stack Developer, AI & NLP — AI made in the Amazon"
    },
    "endereco": {
      "cidade": "Manaus",
      "estado": "AM",
      "pais": "BR",
      "fuso": "UTC−4"
    },
    "conhecimentos": [
      "Java",
      "Kotlin",
      "Spring Boot",
      "Node.js",
      "NestJS",
      "React",
      "React Native",
      "TypeScript",
      "Python",
      "Machine Learning",
      "Natural Language Processing",
      "RAG",
      "LLM",
      "Docker",
      "Kubernetes",
      "AWS",
      "Kafka",
      "PostgreSQL",
      "Oracle"
    ],
    "idiomasFalados": [
      "pt-BR",
      "es",
      "en"
    ],
    "servicos": {
      "worker": "https://emanuel-portfolio-chat.emanuel-portfolio-chat.workers.dev",
      "turnstile": "0x4AAAAAAFSypCNI4YX6-cMF"
    }
  };

  // Derivados dos dados acima.
  perfil.nomeCompleto = `${perfil.nome} ${perfil.sobrenome}`;
  perfil.links = {
    email: `mailto:${perfil.email}`,
    whatsapp: `https://wa.me/${perfil.telefone.replace(/\D/g, "")}`,
    github: `https://github.com/${perfil.github}`,
    linkedin: `https://www.linkedin.com/in/${perfil.linkedin}`,
  };
  // Currículo: página montada com os dados; o PDF é gerado nela, pela impressão do navegador.
  perfil.cv = (lang) => `curriculo.html?lang=${lang}`;
  // PDF para baixar: gerado pelo Worker (GET /cv, Browser Run); sem Worker, a versão de impressão do site.
  perfil.cvPdf = (lang) =>
    perfil.servicos?.worker ? `${perfil.servicos.worker}/cv?lang=${lang}` : `curriculo.html?lang=${lang}&pdf=1`;
  // Sites desenvolvidos (data/experiencia.json): domínio → { nome, key, stack }.
  perfil.sistemas = {
    "compras.manaus.am.gov.br": {
      "nome": "ComprasManaus",
      "key": "sistema.compras",
      "stack": "ASP Classic · ASP.NET Web Forms · VB.NET · jQuery · Bootstrap · Highcharts"
    },
    "contratos.manaus.am.gov.br": {
      "nome": "ContratosManaus",
      "key": "sistema.contratos",
      "stack": "PHP · jQuery · Bootstrap · Chart.js · Select2"
    },
    "sistemaspmm.manaus.am.gov.br": {
      "nome": "ContratosManaus",
      "key": "sistema.contratos",
      "stack": "PHP · jQuery · Bootstrap · Chart.js · Select2"
    }
  };

  globalThis.PERFIL = perfil;
})();
