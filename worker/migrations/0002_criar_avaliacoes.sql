-- Avaliações (👍/👎) das respostas da IA no chat do portfólio.
-- Só são gravadas quando o visitante clica em um dos botões.
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  rating INTEGER NOT NULL CHECK (rating IN (-1, 1)),
  lang TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback (created_at);
