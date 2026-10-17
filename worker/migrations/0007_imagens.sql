-- Demo do gerador de imagens: só o total de imagens geradas por dia (teto diário da cota gratuita).
-- Sem texto pedido, imagem, IP ou identificadores. Apagado antes de 30 dias.
CREATE TABLE IF NOT EXISTS image_daily (
  image_date TEXT NOT NULL DEFAULT (date('now')) PRIMARY KEY,
  total INTEGER NOT NULL DEFAULT 1 CHECK (total > 0)
);
