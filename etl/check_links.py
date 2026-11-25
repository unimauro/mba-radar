"""Verifica que las URLs citadas en los JSON del dashboard respondan.

Uso:  python3 etl/check_links.py [--workers N] [--timeout S] [archivos.json ...]
Sin archivos revisa data/paises/*.json y data/global.json.
Código de salida: 1 si alguna URL devuelve 404 (las demás fallas solo se informan), 0 si no.
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / 'data'
URL_RE = re.compile(r'https?://[^\s"\\)]+')
USER_AGENT = 'Mozilla/5.0'
HTTP_OK, HTTP_NOT_FOUND = 200, 404


def default_files() -> list[Path]:
    return sorted(DATA.glob('paises/*.json')) + [DATA / 'global.json']


def collect_urls(files: list[Path]) -> list[str]:
    urls: set[str] = set()
    for f in files:
        urls |= set(URL_RE.findall(f.read_text(encoding='utf-8')))
    return sorted(urls)


def check(url: str, timeout: float) -> tuple[str, int | str]:
    """(url, código HTTP o nombre de la excepción). Prueba HEAD y, si falla, GET."""
    result: int | str = 'sin respuesta'
    for method in ('HEAD', 'GET'):
        try:
            req = urllib.request.Request(url, method=method, headers={'User-Agent': USER_AGENT})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return url, r.status
        except urllib.error.HTTPError as e:
            result = e.code
        except Exception as e:  # red, TLS, timeout…
            result = type(e).__name__
    return url, result


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('files', nargs='*', type=Path, help='JSON a revisar (por defecto, los del dashboard)')
    ap.add_argument('--workers', type=int, default=12, help='peticiones en paralelo (12)')
    ap.add_argument('--timeout', type=float, default=20, help='segundos por petición (20)')
    args = ap.parse_args(argv)

    urls = collect_urls(args.files or default_files())
    with cf.ThreadPoolExecutor(args.workers) as ex:
        results = list(ex.map(lambda u: check(u, args.timeout), urls))
    bad = [(u, s) for u, s in results if s != HTTP_OK]
    print(f'{len(results)} URLs, {len(results) - len(bad)} OK')
    for u, s in bad:
        print(s, u)
    return 1 if any(s == HTTP_NOT_FOUND for _, s in bad) else 0


if __name__ == '__main__':
    sys.exit(main())
