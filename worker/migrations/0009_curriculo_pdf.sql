-- PDFs do currículo gerados pelo Browser Run (GET /cv), um por idioma e versão do conteúdo.
-- É conteúdo público do próprio site (não há dado de visitante); versões antigas são apagadas pelo cron.
CREATE TABLE IF NOT EXISTS cv_pdf (
  lang TEXT NOT NULL,
  versao TEXT NOT NULL,
  pdf BLOB NOT NULL,
  criado TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (lang, versao)
);
