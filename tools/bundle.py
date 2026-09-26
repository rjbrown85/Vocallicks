"""Bundle the multi-file app into one page for a claude.ai artifact preview.
Inlines CSS (fonts as data URIs) and app scripts; loads Tone.js from cdnjs; piano samples stay as files."""
import re, base64, pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text()
css = (root / "css/zine.css").read_text()
def font(m):
    f = root / "fonts" / m.group(1)
    return "url(data:font/woff2;base64," + base64.b64encode(f.read_bytes()).decode() + ")"
css = re.sub(r"url\(\.\./fonts/([^)]+)\)", font, css)
title = re.search(r"<title>.*?</title>", html).group(0)
body = html[html.index("<body"):]
body = body[body.index(">") + 1:body.rindex("</body>")]
def script(m):
    src = m.group(1)
    if src.startswith("vendor/Tone"):
        return '<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/15.5.42/Tone.min.js"></script>'
    return "<script>\n" + (root / src).read_text() + "\n</script>"
body = re.sub(r'<script src="([^"]+)"></script>', script, body)
out = title + "\n<style>\n" + css + "\n</style>\n" + body
dest = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else root / "dist/artifact.html")
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(out)
print(dest, len(out))
