"""Verifica que todas las URLs de data/ respondan (no 404). Uso: python3 etl/check_links.py"""
import json, re, sys, urllib.request, concurrent.futures as cf
from pathlib import Path
D = Path(__file__).resolve().parent.parent / 'data'
urls = set()
for f in list(D.glob('paises/*.json')) + [D / 'global.json']:
    urls |= set(re.findall(r'https?://[^\s"\\)]+', f.read_text(encoding='utf-8')))
def check(u):
    for m in ('HEAD', 'GET'):
        try:
            r = urllib.request.urlopen(urllib.request.Request(u, method=m, headers={'User-Agent': 'Mozilla/5.0'}), timeout=20)
            return u, r.status
        except urllib.error.HTTPError as e:
            if m == 'GET': return u, e.code
        except Exception as e:
            if m == 'GET': return u, type(e).__name__
with cf.ThreadPoolExecutor(12) as ex:
    res = list(ex.map(check, sorted(urls)))
bad = [r for r in res if r[1] != 200]
print(f'{len(res)} URLs, {len(res) - len(bad)} OK')
for u, s in bad: print(s, u)
