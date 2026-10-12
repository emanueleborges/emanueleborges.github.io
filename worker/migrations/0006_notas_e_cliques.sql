-- Nota do portfólio (0–100, escolhida na barra) e cliques nos links do site.
-- Só totais diários: sem IP, página, idioma ou identificadores. Apagados antes de 30 dias.
CREATE TABLE IF NOT EXISTS score_daily (
  score_date TEXT NOT NULL DEFAULT (date('now')),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  total INTEGER NOT NULL DEFAULT 1 CHECK (total > 0),
  PRIMARY KEY (score_date, score)
);

CREATE TABLE IF NOT EXISTS click_daily (
  click_date TEXT NOT NULL DEFAULT (date('now')),
  target TEXT NOT NULL CHECK (length(target) <= 60),
  total INTEGER NOT NULL DEFAULT 1 CHECK (total > 0),
  PRIMARY KEY (click_date, target)
);
