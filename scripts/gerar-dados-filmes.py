"""Gera demos/filmes/filmes.json: base de filmes de uso livre para a demo de recomendação.

- Wikidata (CC0): os ~1.500 filmes com mais artigos na Wikipédia, ano, gêneros e direção.
- Wikipédia em inglês (CC BY-SA 4.0): o resumo (introdução) de cada filme, citado na página.

Uso: python3 scripts/gerar-dados-filmes.py   (só biblioteca padrão; leva ~2 minutos)
"""

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "demos" / "filmes" / "filmes.json"
HEADERS = {"User-Agent": "EmanuelBorgesPortfolio/1.0 (https://emanueleborges.github.io; demo de recomendação)"}
MIN_SITELINKS = 45
MAX_CHARS = 700


def get_json(url: str, data: dict | None = None) -> dict:
    body = urllib.parse.urlencode(data).encode() if data else None
    request = urllib.request.Request(url, data=body, headers={**HEADERS, "Accept": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                return json.load(response)
        except Exception:
            if attempt == 3:
                raise
            time.sleep(3 * (attempt + 1))


def sparql(query: str) -> list:
    return get_json("https://query.wikidata.org/sparql", {"query": query, "format": "json"})["results"]["bindings"]


def films() -> list:
    rows = sparql(f"""
SELECT ?film ?title ?links (MIN(YEAR(?date)) AS ?year) WHERE {{
  VALUES ?type {{ wd:Q11424 wd:Q202866 wd:Q29168811 wd:Q24869 }}  # filme, animação, longa de animação, longa-metragem
  ?film wdt:P31 ?type ; wikibase:sitelinks ?links .
  FILTER(?links >= {MIN_SITELINKS})
  ?article schema:about ?film ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?title .
  OPTIONAL {{ ?film wdt:P577 ?date }}
}} GROUP BY ?film ?title ?links ORDER BY DESC(?links)""")
    return [{"id": r["film"]["value"].rsplit("/", 1)[1], "wiki": r["title"]["value"],
             "year": int(r["year"]["value"]) if "year" in r else None} for r in rows]


def labels(ids: list, prop: str) -> dict:
    """Rótulos em inglês de uma propriedade (P136 gênero, P57 direção) para cada filme."""
    result = {}
    for i in range(0, len(ids), 250):
        values = " ".join(f"wd:{q}" for q in ids[i:i + 250])
        for r in sparql(f"""
SELECT ?film ?label WHERE {{
  VALUES ?film {{ {values} }}
  ?film wdt:{prop} ?item . ?item rdfs:label ?label . FILTER(LANG(?label) = "en")
}}"""):
            film = r["film"]["value"].rsplit("/", 1)[1]
            result.setdefault(film, []).append(r["label"]["value"])
    return result


def extracts(titles: list) -> dict:
    result = {}
    for i in range(0, len(titles), 20):
        data = get_json("https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode({
            "action": "query", "prop": "extracts", "exintro": 1, "explaintext": 1, "redirects": 1,
            "titles": "|".join(titles[i:i + 20]), "format": "json", "formatversion": 2,
        }))
        redirects = {r["to"]: r["from"] for r in data["query"].get("redirects", [])}
        for page in data["query"]["pages"]:
            if "extract" in page:
                result[redirects.get(page["title"], page["title"])] = page["extract"]
        time.sleep(0.2)
    return result


def short(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= MAX_CHARS:
        return text
    cut = text[:MAX_CHARS]
    end = cut.rfind(". ")
    return cut[: end + 1] if end > 200 else cut.rsplit(" ", 1)[0] + "…"


if __name__ == "__main__":
    base = films()
    ids = [f["id"] for f in base]
    genres, directors = labels(ids, "P136"), labels(ids, "P57")
    texts = extracts([f["wiki"] for f in base])
    out = []
    for f in base:
        text = texts.get(f["wiki"])
        if not text:
            continue
        out.append({
            "t": re.sub(r" \((\d{4} )?film\)$", "", f["wiki"]),
            "y": f["year"],
            "g": sorted(set(g.replace(" film", "") for g in genres.get(f["id"], []))),
            "d": sorted(set(directors.get(f["id"], [])))[:3],
            "x": short(text),
            "w": f["wiki"],
        })
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(out)} filmes → {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")
