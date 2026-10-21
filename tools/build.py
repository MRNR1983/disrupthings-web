import json
import re
from html import escape
from urllib.parse import quote
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / "content" / "proyectos.json").read_text(encoding="utf-8"))
SITE = "https://disrupthings.com/"
CSS_V = "2026102001"
FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400&display=swap"
START, END = "<!-- proyectos:inicio -->", "<!-- proyectos:fin -->"


def booking(slug, topic=None):
    url = DATA["booking_base"] + slug
    return url + "?a1=" + quote(topic) if topic else url


def page_path(lang, p):
    return DATA["ui"][lang]["dir"] + "/" + p["slug"][lang] + ".html"


def status_label(p, lang):
    cls = "label live" if p["live"] else "label"
    return f'<span class="{cls}">{escape(p[lang]["status"])}</span>'


def project_page(p, lang):
    ui = DATA["ui"][lang]
    other = "en" if lang == "es" else "es"
    t = p[lang]
    up = "../" * ui["dir"].count("/") + "../"
    self_url = SITE + page_path(lang, p)
    alt = {l: SITE + page_path(l, p) for l in ("es", "en")}
    other_href = up + page_path(other, p)
    how = "\n".join(
        f'        <div><span class="label">0{i + 1}</span><h3>{escape(h)}</h3><p>{escape(d)}</p></div>'
        for i, (h, d) in enumerate(t["how"])
    )
    does = "\n".join(f"        <li>{escape(x)}</li>" for x in t["does"])
    extra = f'\n      <p class="fine">{escape(t["extra"])}</p>' if t.get("extra") else ""
    if p["demo"]:
        cta = (
            f'    <section class="cta">\n'
            f'      <p>{escape(ui["demo_sub"])}</p>\n'
            f'      <a class="btn" href="{escape(booking(DATA["diagnostico"], t["title"]))}" target="_blank" rel="noopener">{escape(ui["demo"])}</a>\n'
            f'    </section>'
        )
    else:
        cta = f'    <section class="cta">\n      <p>{escape(t["soon"])}</p>\n    </section>'
    others = "\n".join(
        f'        <a href="{up + page_path(lang, q)}">{escape(q[lang]["title"])}</a>'
        for q in DATA["proyectos"] if q["id"] != p["id"]
    )
    return f"""<!doctype html>
<html lang="{ui['lang']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{escape(t['title'])} | Disrupthings</title>
<meta name="description" content="{escape(t['lead'])}">
<link rel="canonical" href="{self_url}">
<link rel="alternate" hreflang="es-MX" href="{alt['es']}">
<link rel="alternate" hreflang="en" href="{alt['en']}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Disrupthings">
<meta property="og:title" content="{escape(t['title'])} | Disrupthings">
<meta property="og:description" content="{escape(t['lead'])}">
<meta property="og:url" content="{self_url}">
<meta property="og:image" content="{SITE}assets/{'og.png' if lang == 'es' else 'og-en.png'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F7F8F7">
<link rel="icon" href="{up}assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{up}assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="{up}assets/site.css?v={CSS_V}">
</head>
<body>
<div class="wrap">
  <header class="top">
    <a class="mark" href="{up + ('' if lang == 'es' else 'en/')}">Disrupthings<span>.</span></a>
    <nav aria-label="{'Principal' if lang == 'es' else 'Main'}">
      <a href="{up + ('' if lang == 'es' else 'en/')}">{escape(ui['back'])}</a>
      <a class="lang" href="{other_href}" hreflang="{DATA['ui'][other]['lang']}" lang="{DATA['ui'][other]['lang']}">{escape(ui['other_lang'])}</a>
    </nav>
  </header>
  <main class="proj">
    <section class="proj-hero">
      {status_label(p, lang)}
      <h1>{escape(t['title'])}</h1>
      <p class="lead">{escape(t['lead'])}</p>
    </section>
    <section>
      <h2>{escape(ui['problem'])}</h2>
      <p class="body">{escape(t['problem'])}</p>
    </section>
    <section>
      <h2>{escape(ui['how'])}</h2>
      <div class="cols c3">
{how}
      </div>
    </section>
    <section>
      <h2>{escape(ui['does'])}</h2>
      <ul class="does">
{does}
      </ul>
    </section>
    <section>
      <h2>{escape(ui['care'])}</h2>
      <p class="promise">{escape(t['care'])}</p>{extra}
    </section>
{cta}
    <nav class="others" aria-label="{escape(ui['others'])}">
      <span class="label">{escape(ui['others'])}</span>
      <div>
{others}
      </div>
    </nav>
  </main>
  <footer>
    <span>{escape(ui['rights'])}</span>
    <nav aria-label="Legal"><a href="{up}terminos.html">{escape(ui['terms'])}</a><a href="{up}privacidad.html">{escape(ui['privacy'])}</a></nav>
  </footer>
</div>
</body>
</html>
"""


def home_panel(lang):
    ui = DATA["ui"][lang]
    prefix = "proyectos/" if lang == "es" else "projects/"
    cards = "\n".join(
        f"""        <div>
          {status_label(p, lang)}
          <h3>{escape(p[lang]['title'])}</h3>
          <p>{escape(p[lang]['lead'])}</p>
          <a href="{prefix}{p['slug'][lang]}.html">{escape(ui['more'])}</a>
        </div>"""
        for p in DATA["proyectos"]
    )
    pid = "productos" if lang == "es" else "products"
    return f"""{START}
    <section data-name="{escape(ui['section'])}" class="panel block" id="{pid}"><div class="pin">
      <div class="head"><h2>{escape(ui['section'])}</h2><p class="sub">{escape(ui['section_sub'])}</p></div>
      <div class="cols c3">
{cards}
      </div>
    </div></section>
    {END}"""


def patch_home(path, lang):
    html = path.read_text(encoding="utf-8")
    panel = home_panel(lang)
    if START in html:
        html = re.sub(re.escape(START) + r".*?" + re.escape(END), lambda m: panel, html, flags=re.S)
    else:
        name = "Lo que funciona" if lang == "es" else "What works"
        pattern = r'    <section data-name="' + re.escape(name) + r'".*?</div></section>'
        html, n = re.subn(pattern, lambda m: "    " + panel, html, count=1, flags=re.S)
        if n != 1:
            raise SystemExit(f"no products panel in {path}")
    html = re.sub(r'https://calendly\.com/disrupthings/[a-z0-9-]+', booking(DATA["diagnostico"]), html)
    html = re.sub(r'site\.css\?v=\d+', f"site.css?v={CSS_V}", html)
    path.write_text(html, encoding="utf-8")


def sitemap():
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    day = "2026-10-20"
    pairs = [("", "en/")] + [(page_path("es", p), page_path("en", p)) for p in DATA["proyectos"]]
    for es, en in pairs:
        for loc in (es, en):
            lines.append(f'  <url><loc>{SITE}{loc}</loc><lastmod>{day}</lastmod>')
            lines.append(f'    <xhtml:link rel="alternate" hreflang="es-MX" href="{SITE}{es}"/>')
            lines.append(f'    <xhtml:link rel="alternate" hreflang="en" href="{SITE}{en}"/></url>')
    for legal in ("privacidad.html", "terminos.html"):
        lines.append(f"  <url><loc>{SITE}{legal}</loc><lastmod>2026-10-13</lastmod></url>")
    lines.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    for lang in ("es", "en"):
        out = ROOT / DATA["ui"][lang]["dir"]
        out.mkdir(parents=True, exist_ok=True)
        for p in DATA["proyectos"]:
            (ROOT / page_path(lang, p)).write_text(project_page(p, lang), encoding="utf-8")
    patch_home(ROOT / "index.html", "es")
    patch_home(ROOT / "en" / "index.html", "en")
    sitemap()
    for f in ("privacidad.html", "terminos.html", "404.html"):
        fp = ROOT / f
        fp.write_text(re.sub(r'site\.css\?v=\d+', f"site.css?v={CSS_V}", fp.read_text(encoding="utf-8")), encoding="utf-8")
    print("ok")


if __name__ == "__main__":
    main()
