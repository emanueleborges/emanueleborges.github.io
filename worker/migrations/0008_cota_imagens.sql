-- Cota do gerador de imagens: até 2 imagens por visitante por dia (UTC).
-- "visitor" é um HMAC-SHA256 do IP com o dia e um segredo do Worker: muda todo dia, não revela o IP
-- e não liga visitas de dias diferentes. As linhas são apagadas no dia seguinte (cron horário).
CREATE TABLE IF NOT EXISTS image_visitor_daily (
  image_date TEXT NOT NULL,
  visitor TEXT NOT NULL CHECK (length(visitor) = 64),
  total INTEGER NOT NULL DEFAULT 1 CHECK (total >= 0),
  PRIMARY KEY (image_date, visitor)
);
