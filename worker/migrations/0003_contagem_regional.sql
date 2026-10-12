-- Contagem agregada de acessos por continente e dia; sem identificadores individuais.
CREATE TABLE IF NOT EXISTS regional_visits (
  access_date TEXT NOT NULL DEFAULT (date('now')),
  continent TEXT NOT NULL CHECK (continent IN ('AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA')),
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  PRIMARY KEY (access_date, continent)
);
