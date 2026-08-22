#!/usr/bin/env python3
"""Build data/club-rankings.json from public ranking lists.

Firecrawl CLI/key is not available in this environment, so we fetch the
official HTML (DJ Mag Top 100 Clubs 2026, INA World's 100 Best Clubs 2025,
Time Out nightlife cities 2025) and parse it. No invented ranks or venues.
"""
from __future__ import annotations

import json
import re
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
CACHE = Path(r"C:\Users\moses.isik\Desktop\Claude Cowork files\_temp\velvet-rankings")
CACHE.mkdir(parents=True, exist_ok=True)

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
)
DJMAG_LIST = "https://djmag.com/top100clubs"
INA_LIST = "https://www.nightlifeinternational.org/en/congress-awards/100-world-s-best-clubs"


def fold(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower()


def norm_name(s: str) -> str:
    s = fold(s)
    s = s.replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    drop = {
        "nightclub", "dayclub", "day", "club", "beach", "the", "disco",
        "official", "experience", "hyperclub", "open", "air", "and",
        "main", "room", "lounge",
    }
    toks = [t for t in s.split() if t and t not in drop]
    return " ".join(toks)


def get(url: str, cache_name: str, timeout: int = 25) -> str:
    path = CACHE / cache_name
    if path.exists() and path.stat().st_size > 400:
        return path.read_text(encoding="utf-8", errors="replace")
    req = Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urlopen(req, timeout=timeout) as r:
        raw = r.read()
    text = raw.decode("utf-8", errors="replace")
    path.write_text(text, encoding="utf-8")
    return text


def rank_score(rank: int | None, top: float = 5.0, n: int = 100) -> float:
    if not rank or rank < 1:
        return 0.0
    return round(top * (n + 1 - rank) / n, 3)


# Existing dest names (public + extra) — aliases map ranking cities onto them.
CITY_ALIAS = {
    "new york city": "New York",
    "nyc": "New York",
    "brooklyn": "New York",
    "hollywood": "Los Angeles",
    "washington d.c.": "Washington DC",
    "washington dc": "Washington DC",
    "washington d c": "Washington DC",
    "washington": "Washington DC",
    "mykonos island": "Mykonos",
    "sao paulo": "São Paulo",
    "taipei": "Taipei",
    "shenzhen": "Shenzhen",
    "montanita": "Montañita",
    "hyderabad": "Hyderabad",
    "kathmandu": "Kathmandu",
    "koh samui": "Koh Samui",
    "washington, dc": "Washington DC",
    "camboriu": "Camboriú",
    "balneario camboriu": "Camboriú",
    "mallorca": "Mallorca",
    "palma": "Mallorca",
    "ios island": "Ios",
    "zrce beach": "Zrće",
    "zrce": "Zrće",
    "novalja": "Zrće",
    "cap d agde": "Cap d'Agde",
    "roma": "Rome",
    "cancun": "Cancún",
    "bogota": "Bogotá",
    "medellin": "Medellín",
    "pointe calumet": "Pointe-Calumet",
    "montreal": "Pointe-Calumet",
    "sassari": "Porto Cervo",
    "costa smeralda": "Porto Cervo",
    "attard": "Malta",
    "rabat": "Malta",
    "la grande motte": "La Grande-Motte",
    "barbera del valles": "Barberà del Vallès",
    "barbera del valles": "Barberà del Vallès",
    "denia": "Dénia",
    "cypruss": "Ayia Napa",
    "cyprus": "Ayia Napa",
    "athens": "Athens Riviera",
    "gothenburg": "Gothenburg",
    "goteborg": "Gothenburg",
    "itajai": "Itajaí",
    "lloret de mar": "Lloret de Mar",
    "hong kong": "Hong Kong",
    "mexico city": "Mexico City",
    "cdmx": "Mexico City",
    "las vegas": "Las Vegas",
    "saint tropez": "Saint-Tropez",
    "st tropez": "Saint-Tropez",
    "new york": "New York",
    "los angeles": "Los Angeles",
    "ibiza": "Ibiza",
    "mykonos": "Mykonos",
    "dubai": "Dubai",
    "marbella": "Marbella",
    "phuket": "Phuket",
    "bangkok": "Bangkok",
    "bali": "Bali",
    "miami": "Miami",
    "barcelona": "Barcelona",
    "london": "London",
    "paris": "Paris",
    "singapore": "Singapore",
    "berlin": "Berlin",
    "amsterdam": "Amsterdam",
    "madrid": "Madrid",
    "tokyo": "Tokyo",
    "sydney": "Sydney",
    "rome": "Rome",
    "lisbon": "Lisbon",
    "stockholm": "Stockholm",
    "cabo san lucas": "Cabo San Lucas",
}

NEW_CITIES = {
    "Camboriú": {"code": "CMB", "country": "Brazil", "region": "South America", "lat": -27.00, "lng": -48.63, "party": 5},
    "Washington DC": {"code": "WAS", "country": "USA", "region": "North America", "lat": 38.91, "lng": -77.04, "party": 5},
    "Valinhos": {"code": "VLN", "country": "Brazil", "region": "South America", "lat": -22.97, "lng": -46.99, "party": 5},
    "Cologne": {"code": "CGN", "country": "Germany", "region": "Europe", "lat": 50.94, "lng": 6.96, "party": 5},
    "Manchester": {"code": "MAN", "country": "UK", "region": "Europe", "lat": 53.48, "lng": -2.24, "party": 5},
    "Mallorca": {"code": "PMI", "country": "Spain", "region": "Europe", "lat": 39.57, "lng": 2.65, "party": 5},
    "Gothenburg": {"code": "GOT", "country": "Sweden", "region": "Europe", "lat": 57.71, "lng": 11.97, "party": 4},
    "Bristol": {"code": "BRS", "country": "UK", "region": "Europe", "lat": 51.45, "lng": -2.59, "party": 4},
    "Santiago": {"code": "SCL", "country": "Chile", "region": "South America", "lat": -33.45, "lng": -70.67, "party": 4},
    "Malta": {"code": "MLA", "country": "Malta", "region": "Europe", "lat": 35.90, "lng": 14.47, "party": 4},
    "Dubrovnik": {"code": "DBV", "country": "Croatia", "region": "Europe", "lat": 42.65, "lng": 18.09, "party": 4},
    "Prague": {"code": "PRG", "country": "Czech Republic", "region": "Europe", "lat": 50.08, "lng": 14.44, "party": 4},
    "Austin": {"code": "AUS", "country": "USA", "region": "North America", "lat": 30.27, "lng": -97.74, "party": 4},
    "Florence": {"code": "FLR", "country": "Italy", "region": "Europe", "lat": 43.77, "lng": 11.25, "party": 4},
    "Ios": {"code": "IOS", "country": "Greece", "region": "Europe", "lat": 36.72, "lng": 25.28, "party": 4},
    "Buenos Aires": {"code": "BUE", "country": "Argentina", "region": "South America", "lat": -34.60, "lng": -58.38, "party": 5},
    "Warsaw": {"code": "WAW", "country": "Poland", "region": "Europe", "lat": 52.23, "lng": 21.01, "party": 4},
    "Cancún": {"code": "CUN", "country": "Mexico", "region": "North America", "lat": 21.16, "lng": -86.85, "party": 5},
    "Boston": {"code": "BOS", "country": "USA", "region": "North America", "lat": 42.36, "lng": -71.06, "party": 4},
    "San Diego": {"code": "SAN", "country": "USA", "region": "North America", "lat": 32.72, "lng": -117.16, "party": 4},
    "Costa Mesa": {"code": "CMA", "country": "USA", "region": "North America", "lat": 33.64, "lng": -117.92, "party": 4},
    "Zrće": {"code": "ZRC", "country": "Croatia", "region": "Europe", "lat": 44.56, "lng": 14.91, "party": 5},
    "Hong Kong": {"code": "HKG", "country": "Hong Kong", "region": "Asia", "lat": 22.32, "lng": 114.17, "party": 4},
    "Bucharest": {"code": "BUH", "country": "Romania", "region": "Europe", "lat": 44.43, "lng": 26.10, "party": 4},
    "Lucca": {"code": "LUC", "country": "Italy", "region": "Europe", "lat": 43.84, "lng": 10.50, "party": 3},
    "Lleida": {"code": "LLE", "country": "Spain", "region": "Europe", "lat": 41.62, "lng": 0.62, "party": 3},
    "Pointe-Calumet": {"code": "PTC", "country": "Canada", "region": "North America", "lat": 45.50, "lng": -73.97, "party": 4},
    "Lausanne": {"code": "LAU", "country": "Switzerland", "region": "Europe", "lat": 46.52, "lng": 6.63, "party": 3},
    "Mataró": {"code": "MAT", "country": "Spain", "region": "Europe", "lat": 41.54, "lng": 2.44, "party": 3},
    "Glasgow": {"code": "GLA", "country": "UK", "region": "Europe", "lat": 55.86, "lng": -4.25, "party": 4},
    "Quito": {"code": "UIO", "country": "Ecuador", "region": "South America", "lat": -0.18, "lng": -78.47, "party": 3},
    "Dénia": {"code": "DEN", "country": "Spain", "region": "Europe", "lat": 38.84, "lng": 0.11, "party": 3},
    "Ayia Napa": {"code": "AYN", "country": "Cyprus", "region": "Europe", "lat": 34.99, "lng": 34.00, "party": 4},
    "Shanghai": {"code": "SHA", "country": "China", "region": "Asia", "lat": 31.23, "lng": 121.47, "party": 5},
    "Melbourne": {"code": "MEL", "country": "Australia", "region": "Oceania", "lat": -37.81, "lng": 144.96, "party": 4},
    "Brighton": {"code": "BTN", "country": "UK", "region": "Europe", "lat": 50.82, "lng": -0.14, "party": 4},
    "Mexico City": {"code": "MEX", "country": "Mexico", "region": "North America", "lat": 19.43, "lng": -99.13, "party": 5},
    "Mumbai": {"code": "BOM", "country": "India", "region": "Asia", "lat": 19.08, "lng": 72.88, "party": 4},
    "Cape Town": {"code": "CPT", "country": "South Africa", "region": "Africa", "lat": -33.92, "lng": 18.42, "party": 4},
    "Lagos": {"code": "LOS", "country": "Nigeria", "region": "Africa", "lat": 6.52, "lng": 3.38, "party": 5},
    "Cairo": {"code": "CAI", "country": "Egypt", "region": "Africa", "lat": 30.04, "lng": 31.24, "party": 3},
    "Riyadh": {"code": "RUH", "country": "Saudi Arabia", "region": "Middle East", "lat": 24.71, "lng": 46.68, "party": 3},
    "Medellín": {"code": "MDE", "country": "Colombia", "region": "South America", "lat": 6.25, "lng": -75.56, "party": 5},
    "Marrakech": {"code": "RAK", "country": "Morocco", "region": "Africa", "lat": 31.63, "lng": -8.00, "party": 4},
    "Hanoi": {"code": "HAN", "country": "Vietnam", "region": "Asia", "lat": 21.03, "lng": 105.85, "party": 4},
    "Dallas": {"code": "DAL", "country": "USA", "region": "North America", "lat": 32.78, "lng": -96.80, "party": 4},
    "Itajaí": {"code": "ITJ", "country": "Brazil", "region": "South America", "lat": -26.91, "lng": -48.66, "party": 4},
    "Cali": {"code": "CLO", "country": "Colombia", "region": "South America", "lat": 3.45, "lng": -76.53, "party": 4},
    "Bogotá": {"code": "BOG", "country": "Colombia", "region": "South America", "lat": 4.71, "lng": -74.07, "party": 5},
    "Lloret de Mar": {"code": "LLO", "country": "Spain", "region": "Europe", "lat": 41.70, "lng": 2.85, "party": 4},
    "Alicante": {"code": "ALC", "country": "Spain", "region": "Europe", "lat": 38.35, "lng": -0.48, "party": 4},
    "Torrevieja": {"code": "TRV", "country": "Spain", "region": "Europe", "lat": 37.98, "lng": -0.68, "party": 3},
    "Cap d'Agde": {"code": "AGD", "country": "France", "region": "Europe", "lat": 43.28, "lng": 3.50, "party": 4},
    "Atlantic City": {"code": "ACY", "country": "USA", "region": "North America", "lat": 39.36, "lng": -74.42, "party": 4},
    "Riccione": {"code": "RIC", "country": "Italy", "region": "Europe", "lat": 44.00, "lng": 12.65, "party": 4},
    "Wuppertal": {"code": "WUP", "country": "Germany", "region": "Europe", "lat": 51.26, "lng": 7.15, "party": 4},
    "La Grande-Motte": {"code": "LGM", "country": "France", "region": "Europe", "lat": 43.56, "lng": 4.08, "party": 3},
    "Barberà del Vallès": {"code": "BDV", "country": "Spain", "region": "Europe", "lat": 41.52, "lng": 2.13, "party": 3},
    "Salou": {"code": "SLU", "country": "Spain", "region": "Europe", "lat": 41.08, "lng": 1.14, "party": 4},
    "Benidorm": {"code": "BEN", "country": "Spain", "region": "Europe", "lat": 38.54, "lng": -0.13, "party": 4},
    "Taipei": {"code": "TPE", "country": "Taiwan", "region": "Asia", "lat": 25.03, "lng": 121.57, "party": 4},
    "Shenzhen": {"code": "SZX", "country": "China", "region": "Asia", "lat": 22.54, "lng": 114.06, "party": 4},
    "Montañita": {"code": "MTA", "country": "Ecuador", "region": "South America", "lat": -1.83, "lng": -80.75, "party": 4},
    "Hyderabad": {"code": "HYD", "country": "India", "region": "Asia", "lat": 17.39, "lng": 78.49, "party": 4},
    "São Paulo": {"code": "SAO", "country": "Brazil", "region": "South America", "lat": -23.55, "lng": -46.63, "party": 5},
    "Kathmandu": {"code": "KTM", "country": "Nepal", "region": "Asia", "lat": 27.72, "lng": 85.32, "party": 3},
    "Koh Samui": {"code": "USM", "country": "Thailand", "region": "Asia", "lat": 9.51, "lng": 100.04, "party": 4},
}

TIMEOUT_CITIES = [
    {"rank": 1, "name": "Las Vegas", "country": "USA", "venues": ["OMNIA"]},
    {"rank": 2, "name": "Madrid", "country": "Spain", "venues": ["Fabrik", "Ochoymedio", "LuLa", "Fitz"]},
    {"rank": 3, "name": "Paris", "country": "France", "venues": ["Essaim", "Mia Mao", "La Station", "Nexus"]},
    {"rank": 4, "name": "Shanghai", "country": "China", "venues": ["INS"]},
    {"rank": 5, "name": "Berlin", "country": "Germany", "venues": ["RSO.Berlin", "Sisyphos", "SchwuZ"]},
    {"rank": 6, "name": "Melbourne", "country": "Australia", "venues": ["Revolver Upstairs"]},
    {"rank": 7, "name": "Brighton", "country": "UK", "venues": ["Pryzm Brighton"]},
    {"rank": 8, "name": "Mexico City", "country": "Mexico", "venues": []},
    {"rank": 9, "name": "Dubai", "country": "UAE", "venues": ["Sky 2.0", "Soho Garden"]},
    {"rank": 10, "name": "Mumbai", "country": "India", "venues": ["Kitty Su"]},
    {"rank": 11, "name": "Cape Town", "country": "South Africa", "venues": []},
    {"rank": 12, "name": "Warsaw", "country": "Poland", "venues": []},
    {"rank": 13, "name": "Bangkok", "country": "Thailand", "venues": []},
    {"rank": 14, "name": "Lagos", "country": "Nigeria", "venues": []},
    {"rank": 15, "name": "Cairo", "country": "Egypt", "venues": []},
    {"rank": 16, "name": "Riyadh", "country": "Saudi Arabia", "venues": []},
    {"rank": 17, "name": "Amsterdam", "country": "Netherlands", "venues": ["Garage Noord", "Club Raum"]},
    {"rank": 18, "name": "Medellín", "country": "Colombia", "venues": ["Perro Negro"]},
    {"rank": 19, "name": "Marrakech", "country": "Morocco", "venues": ["Babouchka", "Theatro", "555 Famous Club"]},
    {"rank": 20, "name": "Athens Riviera", "country": "Greece", "venues": ["Island", "Bolivar"]},
]


def canonical_city(raw: str) -> str:
    if not raw:
        return ""
    k = fold(raw).replace(".", " ")
    k = re.sub(r"[^a-z0-9]+", " ", k).strip()
    return CITY_ALIAS.get(k, raw.strip())


def parse_djmag_list(html: str) -> list[dict]:
    items = {}
    # rank + slug from href
    for m in re.finditer(r'href="(/top100clubs/2026/(\d+)/([^"]+))"', html):
        href, rank_s, slug = m.group(1), m.group(2), m.group(3)
        rank = int(rank_s)
        if rank in items:
            continue
        items[rank] = {
            "rank": rank,
            "slug": slug,
            "url": "https://djmag.com" + href,
            "name": slug.replace("-", " ").title(),
        }
    # names from headings when present
    for m in re.finditer(
        r'href="(/top100clubs/2026/(\d+)/[^"]+)"[^>]*>\s*(?:<[^>]+>\s*)*([^<]{2,80})',
        html,
    ):
        rank = int(m.group(2))
        name = unescape(re.sub(r"\s+", " ", m.group(3))).strip()
        if rank in items and name and name.lower() not in {"new entry", "non-mover"} and len(name) > 1:
            if not re.fullmatch(r"\d+", name):
                items[rank]["name"] = name.strip("[] ")
    return [items[k] for k in sorted(items)]


BLOCK_HOST = (
    "doubleclick.net", "googlesyndication", "googleadservices", "googletag",
    "facebook.com", "instagram.com", "twitter.com", "x.com", "youtube.com",
    "tiktok.com", "soundcloud.com", "djmag.com", "djmag.asia", "djmag.fr",
    "djmag.de", "djmagshop", "djtickets", "djmagchina", "djmagitalia",
    "inmobi.com", "googleapis.com", "gstatic.com", "cookie", "adservice",
)


def abs_url(u: str) -> str:
    u = (u or "").strip()
    if not u:
        return ""
    if u.startswith("//"):
        u = "https:" + u
    if u.startswith("www."):
        u = "https://" + u
    if not u.startswith("http"):
        if re.match(r"^[a-z0-9.-]+\.[a-z]{2,}", u, re.I):
            u = "https://" + u
        else:
            return ""
    return u.split("?")[0].rstrip("/")


def host_ok(url: str) -> bool:
    from urllib.parse import urlparse
    u = (url or "").lower()
    if not u:
        return False
    host = (urlparse(u).hostname or "").lower()
    if host.startswith("djmag") or ".djmag." in host:
        return False
    return not any(b in u for b in BLOCK_HOST)


def field_after(html: str, label: str) -> str:
    pats = [
        rf"<strong>{label}:\s*</strong>\s*([^<]+)",
        rf"<strong>{label}:</strong>\s*([^<]+)",
        rf"{label}:\s*</strong>\s*([^<]+)",
        rf"{label}:\s*([^<]{{3,80}})",
    ]
    for pat in pats:
        m = re.search(pat, html, re.I)
        if m:
            val = unescape(m.group(1)).strip(" \u00a0-|")
            val = re.sub(r"\s+", " ", val).strip()
            if not val:
                continue
            if re.search(r"hostname|window|gtag|function|script|custom", val, re.I):
                continue
            return val
    return ""


def parse_djmag_detail(html: str, club: dict) -> dict:
    loc = field_after(html, "Location")
    cap = field_after(html, "Capacity")
    site = ""
    m = re.search(
        r"Capacity:[\s\S]{0,500}?<a href=\"([^\"]+)\"",
        html,
        re.I,
    )
    if m:
        cand = abs_url(m.group(1))
        if host_ok(cand):
            site = cand
    if not site:
        for href in re.findall(r'<a href="([^"]+)"', html):
            cand = abs_url(href)
            if host_ok(cand) and cand.startswith("http"):
                site = cand
                break
    city, country = "", ""
    if loc:
        parts = [p.strip() for p in loc.split(",") if p.strip()]
        if len(parts) >= 2:
            city, country = parts[0], parts[-1]
        elif parts:
            city = parts[0]
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.I | re.S)
    name = club["name"]
    if h1:
        nm = re.sub(r"<[^>]+>", "", unescape(h1.group(1)))
        nm = re.sub(r"\s+", " ", nm).strip()
        nm = re.sub(r"\|.*$", "", nm).strip()
        if nm and "top 100" not in nm.lower():
            name = nm
    return {
        **club,
        "name": name,
        "location_raw": loc,
        "city": canonical_city(city or loc),
        "country": country,
        "capacity": cap,
        "website": site,
    }


def parse_ina(html: str) -> list[dict]:
    # Cut at OTHER EDITIONS so we only take 2025
    cut = re.split(r"OTHER EDITIONS", html, maxsplit=1, flags=re.I)[0]
    clubs = []
    # Pattern: heading ### [N](url) then name, city, country in nearby text — markdown from webfetch
    # HTML version: club cards with rank images and text
    # Try structured blocks: rank number as heading then name/city/country
    text = re.sub(r"<script[\s\S]*?</script>", " ", cut)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text)
    plain = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    plain = re.sub(r"</(p|div|h\d|li)>", "\n", plain, flags=re.I)
    plain = re.sub(r"<[^>]+>", " ", plain)
    plain = unescape(plain)
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in plain.splitlines()]
    lines = [ln for ln in lines if ln]
    i = 0
    while i < len(lines):
        if re.fullmatch(r"\d{1,3}", lines[i]):
            rank = int(lines[i])
            if 1 <= rank <= 100:
                name = lines[i + 1] if i + 1 < len(lines) else ""
                city = lines[i + 2] if i + 2 < len(lines) else ""
                country = lines[i + 3] if i + 3 < len(lines) else ""
                if name and not re.fullmatch(r"\d+", name) and len(name) > 1:
                    clubs.append({
                        "rank": rank,
                        "name": name.strip("[] "),
                        "city": canonical_city(city),
                        "country": country,
                    })
                    i += 4
                    continue
        i += 1
    # Dedup by rank, first wins
    by = {}
    for c in clubs:
        by.setdefault(c["rank"], c)
    # Website from original HTML next to rank image links
    for m in re.finditer(r'href="(https?://[^"]+)"[^>]*>\s*(?:<img[^>]+>)?\s*</a>\s*<h3>\s*<a[^>]*>\s*(\d+)\s*<', cut, re.I):
        url, rank_s = m.group(1), m.group(2)
        rank = int(rank_s)
        if rank in by and "website" not in by[rank]:
            if "nightlifeinternational" not in url:
                by[rank]["website"] = url
    # Simpler: sequential (rank)(url) from ### [n](url)
    for m in re.finditer(r'href="(https?://(?!www\.nightlifeinternational)[^"]+)"', cut):
        pass
    return [by[k] for k in sorted(by)]


def parse_ina_cards(html: str) -> list[dict]:
    """Parse INA 2025 feature boxes: img alt=rank, official href, name/city/country."""
    clubs = []
    blocks = re.split(r'sppb-addon-feature', html, flags=re.I)
    for b in blocks[1:]:
        hm = re.search(
            r'<a[^>]*href="(https?://[^"]+)"[^>]*>\s*<img[^>]*alt="(\d{1,3})"',
            b,
            re.I,
        )
        if not hm:
            hm = re.search(
                r'<img[^>]*alt="(\d{1,3})"[^>]*>[\s\S]{0,400}?<h3[^>]*>\s*<a[^>]*href="(https?://[^"]+)"[^>]*>\s*(\d{1,3})',
                b,
                re.I,
            )
            if hm:
                website, rank_s = hm.group(2), hm.group(1)
            else:
                continue
        else:
            website, rank_s = hm.group(1), hm.group(2)
        rank = int(rank_s)
        if not (1 <= rank <= 100):
            continue
        text_m = re.search(r'sppb-addon-text["\s>]*>([\s\S]+?)</div>\s*</div>\s*</div>', b, re.I)
        blob = text_m.group(1) if text_m else b[:1500]
        blob = re.sub(r"<br\s*/?>", "\n", blob, flags=re.I)
        blob = re.sub(r"</div>", "\n", blob, flags=re.I)
        blob = re.sub(r"<[^>]+>", " ", blob)
        blob = unescape(blob)
        lines = [re.sub(r"\s+", " ", ln).strip() for ln in blob.splitlines()]
        lines = [ln for ln in lines if ln]
        name, city, country = "", "", ""
        if lines:
            # "HÏ IBIZA Ibiza" or two lines
            first = lines[0]
            # If first line has a trailing city word after a known break
            parts = re.split(r"\s{2,}|<br>", first)
            if len(parts) >= 2:
                name, city = parts[0], parts[1]
            else:
                name = first
                if len(lines) > 1:
                    city = lines[1]
            if len(lines) > 2:
                country = lines[2]
            elif len(lines) > 1 and not country:
                country = lines[-1] if lines[-1] != city else ""
            # "HÏ IBIZA\nIbiza" already; some are "NAME CITY" on one line
            if name and not city:
                bits = name.split()
                if len(bits) >= 2 and fold(bits[-1]) in CITY_ALIAS:
                    city = bits[-1]
                    name = " ".join(bits[:-1])
        website = abs_url(website) if host_ok(website) else ""
        if not name:
            continue
        clubs.append({
            "rank": rank,
            "name": name.strip("[] "),
            "city": canonical_city(city),
            "country": (country or "").strip(),
            "website": website,
            "url": INA_LIST,
        })
    by = {}
    for c in clubs:
        by.setdefault(c["rank"], c)
    return [by[k] for k in sorted(by)]


def names_match(a: str, b: str) -> bool:
    na, nb = norm_name(a), norm_name(b)
    if not na or not nb:
        return False
    if na == nb or na.replace(" ", "") == nb.replace(" ", ""):
        return True
    if (na in nb or nb in na) and len(min(na, nb, key=len)) >= 4:
        return True
    ta, tb = set(na.split()), set(nb.split())
    if ta and tb and (ta <= tb or tb <= ta):
        return True
    if len(ta & tb) >= 2:
        return True
    compact, other = na.replace(" ", ""), nb.replace(" ", "")
    if min(len(compact), len(other)) >= 3 and (compact in tb or other in ta):
        return True
    return False


def city_match(a: str, b: str) -> bool:
    if not a or not b:
        return True
    return canonical_city(a) == canonical_city(b) or fold(a) in fold(b) or fold(b) in fold(a)


def website_ok(url: str) -> bool:
    if not url:
        return False
    u = url.lower()
    if not u.startswith("http"):
        return False
    if "nightlifeinternational" in u or "timeout.com" in u:
        return False
    return host_ok(u)


def next_unlisted_id(code: str, used: set[str]) -> str:
    n = 101
    while f"{code}-{n:03d}" in used:
        n += 1
    vid = f"{code}-{n:03d}"
    used.add(vid)
    return vid


def extra_dest_row(name: str) -> dict:
    meta = NEW_CITIES[name]
    return {
        "code": meta["code"],
        "name": name,
        "country": meta["country"],
        "region": meta["region"],
        "tier": "Tier 2",
        "luxury": 4,
        "party": meta.get("party", 4),
        "shareability": 3,
        "peak_season": "Year-round",
        "use_cases": "Clubs, nightlife",
        "note": "Sökbar stad från globala rankinglistor — klubbar ej i den publika katalogen",
        "lat": meta["lat"],
        "lng": meta["lng"],
        "listed": False,
    }


def combine_score(sources: list[dict]) -> float:
    scores = []
    for s in sources:
        if s["source"] == "djmag-top100" and s.get("rank"):
            scores.append(rank_score(s["rank"], 5.0))
        elif s["source"] == "ina-100-best" and s.get("rank"):
            scores.append(rank_score(s["rank"], 4.6))
    return max(scores) if scores else 0.0


def main() -> None:
    venues = json.loads((DATA / "venues.json").read_text(encoding="utf-8"))
    unlisted = json.loads((DATA / "unlisted-venues.json").read_text(encoding="utf-8"))
    dests = json.loads((DATA / "destinations.json").read_text(encoding="utf-8"))
    extra = json.loads((DATA / "extra-destinations.json").read_text(encoding="utf-8"))
    all_venues = venues + unlisted
    dest_by_name = {d["name"]: d for d in dests + extra}
    dest_by_code = {d["code"]: d for d in dests + extra}

    print("fetch DJ Mag list…")
    dj_html = Path(r"C:\Users\moses.isik\AppData\Local\Temp\djmag-top100.html")
    if dj_html.exists():
        raw = dj_html.read_text(encoding="utf-8", errors="replace")
        (CACHE / "djmag-top100.html").write_text(raw, encoding="utf-8")
    else:
        raw = get(DJMAG_LIST, "djmag-top100.html")
    dj_list = parse_djmag_list(raw)
    print("DJ Mag list", len(dj_list))

    print("fetch DJ Mag club pages…")
    details = []

    def one(c):
        try:
            html = get(c["url"], f"djmag-{c['rank']:03d}-{c['slug']}.html")
            return parse_djmag_detail(html, c)
        except Exception as e:
            c["error"] = str(e)
            return c

    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = [ex.submit(one, c) for c in dj_list]
        for fut in as_completed(futs):
            details.append(fut.result())
    details.sort(key=lambda x: x["rank"])
    print("DJ Mag details", sum(1 for d in details if d.get("city")), "/", len(details))

    print("fetch INA 2025…")
    ina_html = get(INA_LIST, "ina-100-2025.html")
    ina = parse_ina_cards(ina_html)
    if len(ina) < 80:
        ina2 = parse_ina(ina_html)
        if len(ina2) > len(ina):
            ina = ina2
    print("INA clubs", len(ina))

    # Merge clubs by fuzzy name+city
    merged: list[dict] = []

    def find_merged(name, city):
        for m in merged:
            if names_match(m["name"], name) and city_match(m.get("city"), city):
                return m
        return None

    for d in details:
        city = canonical_city(d.get("city") or "")
        rec = {
            "name": d["name"],
            "city": city,
            "country": d.get("country") or "",
            "website": d.get("website") or "",
            "capacity": d.get("capacity") or "",
            "sources": [{
                "source": "djmag-top100",
                "year": 2026,
                "rank": d["rank"],
                "url": d["url"],
                "score": rank_score(d["rank"], 5.0),
            }],
        }
        merged.append(rec)

    for c in ina:
        hit = find_merged(c["name"], c.get("city"))
        src = {
            "source": "ina-100-best",
            "year": 2025,
            "rank": c["rank"],
            "url": INA_LIST,
            "score": rank_score(c["rank"], 4.6),
        }
        if hit:
            hit["sources"].append(src)
            if website_ok(c.get("website") or "") and (not hit.get("website") or not website_ok(hit.get("website") or "")):
                hit["website"] = c["website"]
            if not hit.get("city") and c.get("city"):
                hit["city"] = canonical_city(c["city"])
            if not hit.get("country") and c.get("country"):
                hit["country"] = c["country"]
        else:
            merged.append({
                "name": c["name"],
                "city": canonical_city(c.get("city") or ""),
                "country": c.get("country") or "",
                "website": c.get("website") or "",
                "capacity": "",
                "sources": [src],
            })

    # Match catalog venues
    used_ids = {v["venue_id"] for v in all_venues}
    new_unlisted = []
    needed_cities = set()

    def dest_for_city(city: str):
        city = canonical_city(city)
        if city in dest_by_name:
            return dest_by_name[city]
        if city in NEW_CITIES:
            needed_cities.add(city)
            row = extra_dest_row(city)
            dest_by_name[city] = row
            dest_by_code[row["code"]] = row
            return row
        return None

    for rec in merged:
        dest = dest_for_city(rec.get("city") or "")
        rec["destination"] = dest["name"] if dest else (rec.get("city") or "")
        rec["destination_code"] = dest["code"] if dest else ""
        rec["score"] = combine_score(rec["sources"])
        rec["unverified_score"] = round(rec["score"] * 0.72, 3)
        best = None
        # Prefer same-city match
        cands = []
        for v in all_venues:
            if not names_match(v["name"], rec["name"]):
                continue
            same_city = city_match(v.get("destination"), rec.get("destination") or rec.get("city"))
            cands.append((0 if same_city else 1, v))
        cands.sort(key=lambda x: x[0])
        if cands and cands[0][0] == 0:
            best = cands[0][1]
        elif cands and len(norm_name(rec["name"])) >= 8:
            # unique-ish name, allow cross-city only if dest empty
            if not rec.get("city"):
                best = cands[0][1]
        if best:
            rec["venue_id"] = best["venue_id"]
            rec["matched"] = True
            rec["listed"] = best.get("listed") is not False
            rec["research_status"] = best.get("research_status")
            continue
        rec["matched"] = False
        rec["listed"] = False
        rec["research_status"] = "Unverified"
        if not dest:
            rec["venue_id"] = None
            rec["skip_reason"] = "no-destination"
            continue
        if not website_ok(rec.get("website") or ""):
            rec["venue_id"] = None
            rec["skip_reason"] = "no-official-site"
            continue
        vid = next_unlisted_id(dest["code"], used_ids)
        rec["venue_id"] = vid
        dj = next((s for s in rec["sources"] if s["source"] == "djmag-top100"), None)
        ina_s = next((s for s in rec["sources"] if s["source"] == "ina-100-best"), None)
        bits = []
        if dj:
            bits.append(f"DJ Mag Top 100 Clubs 2026 #{dj['rank']}")
        if ina_s:
            bits.append(f"INA World's 100 Best Clubs 2025 #{ina_s['rank']}")
        bits.append("Ej web-verifierad i VELVET — källans ranking, inte VELVET-stjärnor.")
        new_unlisted.append({
            "venue_id": vid,
            "destination": dest["name"],
            "destination_code": dest["code"],
            "name": rec["name"],
            "category": "Nightclub",
            "website_url": (rec["website"] or "").replace("http://", "https://", 1),
            "vip_table_potential": True,
            "shareable_format": True,
            "luxury_score": 4,
            "party_score": 4,
            "shareability_score": 4,
            "booking_potential": 4,
            "research_status": "Unverified",
            "listed": False,
            "notes": " ".join(bits),
            "source_url": rec["website"],
            "priority_score": max(40, int(round(rec["unverified_score"] * 20))),
        })

    # Extra destinations
    extra_out = list(extra)
    extra_codes = {d["code"] for d in extra_out}
    for city in sorted(needed_cities):
        row = extra_dest_row(city)
        if row["code"] not in extra_codes and row["name"] not in dest_by_name:
            extra_out.append(row)
            extra_codes.add(row["code"])
        elif row["code"] not in extra_codes and city in needed_cities:
            # name already public dest — skip extra
            pass
        elif row["name"] not in {d["name"] for d in dests} and row["code"] not in extra_codes:
            extra_out.append(row)
            extra_codes.add(row["code"])
        elif row["name"] not in {d["name"] for d in dests + extra_out}:
            extra_out.append(row)
            extra_codes.add(row["code"])

    # Fix extra: only add if not already in dests or extra
    existing_names = {d["name"] for d in dests + extra}
    extra_out = list(extra)
    extra_codes = {d["code"] for d in extra_out}
    for city in sorted(needed_cities):
        if city in existing_names:
            continue
        row = extra_dest_row(city)
        if row["code"] in extra_codes or row["code"] in {d["code"] for d in dests}:
            continue
        extra_out.append(row)
        extra_codes.add(row["code"])
        existing_names.add(city)

    unlisted_out = unlisted + new_unlisted

    cities_out = []
    for c in TIMEOUT_CITIES:
        dest = dest_for_city(c["name"])
        if c["name"] in NEW_CITIES and c["name"] not in existing_names:
            row = extra_dest_row(c["name"])
            if row["code"] not in extra_codes and row["code"] not in {d["code"] for d in dests}:
                extra_out.append(row)
                extra_codes.add(row["code"])
                existing_names.add(c["name"])
                dest = row
        cities_out.append({
            "rank": c["rank"],
            "name": dest["name"] if dest else c["name"],
            "destination_code": dest["code"] if dest else "",
            "country": c["country"],
            "source": "timeout-nightlife-cities",
            "year": 2025,
            "url": "https://www.timeout.com/travel/worlds-best-cities-for-nightlife",
            "score": rank_score(c["rank"], 4.0, 20),
            "mentioned_venues": c["venues"],
        })

    by_venue = {r["venue_id"]: r for r in merged if r.get("venue_id")}
    db = {
        "fetchedAt": time.strftime("%Y-%m-%d"),
        "engine": "html-fetch",
        "note": "Firecrawl-nyckel saknas. Listor hämtade från officiell HTML. Overifierade använder källans ranking med 0.72-rabatt. Inga påhittade Google-stjärnor.",
        "sources": [
            {"id": "djmag-top100", "name": "DJ Mag Top 100 Clubs", "year": 2026, "url": DJMAG_LIST, "count": len(details)},
            {"id": "ina-100-best", "name": "International Nightlife Association — World's 100 Best Clubs", "year": 2025, "url": INA_LIST, "count": len(ina)},
            {"id": "timeout-nightlife-cities", "name": "Time Out — World's 20 best cities for nightlife", "year": 2025, "url": "https://www.timeout.com/travel/worlds-best-cities-for-nightlife", "count": 20},
        ],
        "scoring": {
            "djmag": "5.0 * (101-rank)/100",
            "ina": "4.6 * (101-rank)/100",
            "combined": "max + 0.12*second",
            "unverifiedDiscount": 0.72,
            "verifiedFirst": True,
        },
        "cities": cities_out,
        "clubs": merged,
        "byVenueId": {
            vid: {
                "name": r["name"],
                "score": r["score"],
                "unverifiedScore": r["unverified_score"],
                "sources": r["sources"],
                "city": r.get("destination") or r.get("city"),
            }
            for vid, r in by_venue.items()
        },
    }

    (DATA / "club-rankings.json").write_text(json.dumps(db, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (DATA / "unlisted-venues.json").write_text(json.dumps(unlisted_out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (DATA / "extra-destinations.json").write_text(json.dumps(extra_out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    matched = sum(1 for r in merged if r.get("matched"))
    added = len(new_unlisted)
    print("clubs", len(merged), "matched", matched, "new unlisted", added, "extra dest", len(extra_out))
    print("DJ Mag missing city", [d["rank"] for d in details if not d.get("city")][:20])
    print("INA ranks", [c["rank"] for c in ina[:15]], "... total", len(ina))


if __name__ == "__main__":
    main()
