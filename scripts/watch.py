"""Check menu evidence against manually accepted source fingerprints."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / 'data/source-fingerprints.json'
SHOPS = json.loads((ROOT / 'web/data/shops.json').read_text())
BY_ID = {s['id']: s for s in SHOPS}
SOURCES = {
    'tonys': BY_ID['tonys']['menu'], 'zesty-menu': BY_ID['zesty']['menu'],
    'zesty-hours': BY_ID['zesty']['contact'], 'kod-menu': BY_ID['kod-quinpool']['menu'],
    'kod-location': BY_ID['kod-quinpool']['contact'], 'metro-menu': BY_ID['metro']['menu'],
    'metro-hours': BY_ID['metro']['contact'],
}


class Parts(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text, self.links, self.scripts = [], [], []
        self.hidden = 0

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag in ('script', 'style', 'svg'):
            self.hidden += 1
        if tag == 'a' and values.get('href'):
            self.links.append(values['href'])
        if tag == 'script' and values.get('src'):
            self.scripts.append(values['src'])

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'svg'):
            self.hidden = max(0, self.hidden - 1)

    def handle_data(self, value):
        if not self.hidden:
            self.text.append(value)


def fetch(url):
    req = Request(url, headers={'User-Agent': 'CoolCode-MenuReview/1.0 (+https://github.com/jsdyer/donairafterdark)'})
    with urlopen(req, timeout=35) as response:
        data = response.read(10_000_001)
    if len(data) > 10_000_000:
        raise ValueError('source exceeded 10 MB')
    return data


def section(text, start, end):
    a = text.index(start)
    return text[a:text.index(end, a + len(start))].strip()


def metro_schedule(parts, url):
    for path in reversed(parts.scripts):
        script = urljoin(url, path)
        if urlsplit(script).hostname != 'img1.wsimg.com' or not urlsplit(script).path.endswith('/script.js'):
            continue
        widget = fetch(script).decode().replace(r'\"', '"')
        hours = [json.loads(h) for h in re.findall(r'"hour":(\{[^}]+\})', widget)]
        if len(hours) == 7 and len({h['dayOfWeek'] for h in hours}) == 7:
            return json.dumps(hours, sort_keys=True)
    raise ValueError('weekly hours widget could not be parsed')


def fingerprint(key):
    url = SOURCES[key]
    data = fetch(url)
    if key == 'kod-menu':
        if not data.startswith(b'%PDF'):
            raise ValueError('expected a PDF')
        return sha256(data).hexdigest()
    page = Parts()
    page.feed(data.decode())
    text = ' '.join(' '.join(page.text).lower().split())
    if key == 'kod-location':
        material = section(text, 'choose a location', '©') + ' ' + ' '.join(x for x in page.links if '.pdf' in x.lower())
        if '.pdf' not in material:
            raise ValueError('branch menu link missing')
    elif key == 'zesty-hours':
        material = section(text, 'monday', 'pizza & more for')
    elif key == 'zesty-menu':
        material = section(text, 'served on a warm pita', "donair pogo")
    elif key == 'metro-hours':
        material = section(text, '6021 lady hammond', 'hours') + metro_schedule(page, url)
    elif key == 'metro-menu':
        material = section(text, 'traditional donair', 'nachos')
    else:
        material = text[text.index('all donairs are served'):]
    return sha256(material.encode()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--accept-reviewed', action='store_true', help='accept all current source fingerprints after the manual review')
    args = parser.parse_args()
    reference = {} if args.accept_reviewed else json.loads(BASELINE.read_text())
    failures, actual = [], {}
    with ThreadPoolExecutor(max_workers=4) as pool:
        jobs = {k: pool.submit(fingerprint, k) for k in SOURCES}
        for key, job in jobs.items():
            try:
                actual[key] = job.result()
                if not args.accept_reviewed and actual[key] != reference.get(key):
                    failures.append(f'- {key} changed. Review {SOURCES[key]}')
            except Exception as exc:
                failures.append(f'- {key} check failed ({exc}). Review {SOURCES[key]}')
    if failures:
        print('\n'.join(failures))
        return 1
    if args.accept_reviewed:
        BASELINE.write_text(json.dumps(actual, sort_keys=True, indent=2) + '\n')
    print('All seven source checks succeeded.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
