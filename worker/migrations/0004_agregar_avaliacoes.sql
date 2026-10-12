-- Remove avaliações individuais anteriores, incluindo perguntas e respostas,
-- e passa a guardar apenas totais diários de 👍/👎.
DROP TABLE IF EXISTS feedback;

CREATE TABLE IF NOT EXISTS feedback_daily (
  feedback_date TEXT NOT NULL DEFAULT (date('now')),
  rating INTEGER NOT NULL CHECK (rating IN (-1, 1)),
  total INTEGER NOT NULL DEFAULT 1 CHECK (total > 0),
  PRIMARY KEY (feedback_date, rating)
);
