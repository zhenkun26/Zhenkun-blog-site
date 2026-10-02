"""Inspect actual toggle output and, optionally, compare local HTTP bytes."""
import argparse
import gzip
import hashlib
import json
import pathlib
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

parser = argparse.ArgumentParser()
parser.add_argument('--base', required=True, choices=['/', '/Zhenkun-blog-site/'])
parser.add_argument('--http')
args = parser.parse_args()
base = args.base
label = 'root' if base == '/' else 'subpath'
root = pathlib.Path('dist')
out = pathlib.Path('references/p4-capabilities-2026-10-02')
closed = ['friends', 'guestbook', 'dynamic', 'gallery', 'booknav', 'bilibili', 'bangumi', 'vndb', 'myanimelist', 'sponsor']


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.links = []
        self.scripts = []
        self.meta = {}
        self.feed(text)

    def handle_starttag(self, tag, values):
        data = dict(values)
        if tag == 'a':
            self.links.append(data.get('href', ''))
        if tag == 'script' and data.get('src'):
            self.scripts.append(data['src'])
        if tag == 'meta':
            self.meta[data.get('name') or data.get('http-equiv') or data.get('property')] = data.get('content')


origin = 'https://zhenkun26.github.io'
html_files = sorted(root.rglob('*.html'))
regular = []
stubs = []
for path in html_files:
    relative = path.relative_to(root).as_posix()
    route = base + relative.removesuffix('index.html')
    page = Page(path.read_text(encoding='utf-8'))
    if relative.split('/')[0] in closed:
        assert page.meta.get('refresh') == '2;url=' + base + '404.html', relative
        assert base + '404.html' in page.links, relative
        assert not page.scripts, relative
        stubs.append(relative)
        continue
    regular.append(relative)
    assert not any(any(href.startswith(base + name + '/') for name in closed) for href in page.links), relative
    assert not any(any(domain in src for domain in ['giscus.app', 'googletagmanager.com', 'clarity.ms', 'umami', 'js.users.51.la']) for src in page.scripts), relative
    assert 'latest-dynamics' not in path.read_text(encoding='utf-8'), relative
assert len(stubs) == 13
assert json.loads((root / 'api/dynamic.json').read_text()) == []
assert json.loads((root / 'api/allPostMeta.json').read_text()) == []
namespace = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
sitemap = [node.text for node in ET.parse(root / 'sitemap-0.xml').findall('.//s:loc', namespace)]
for url in sitemap:
    assert url.startswith(origin + base), url
    logical = url.removeprefix(origin + base)
    assert logical.split('/')[0] not in closed + ['api', '404', '404.html'], url
feed = ET.parse(root / 'rss.xml')
assert feed.findtext('channel/title') == 'Zhenkun'
assert not feed.findall('channel/item')
fragments = []
for path in sorted((root / 'pagefind/fragment').glob('*.pf_fragment')):
    data = gzip.decompress(path.read_bytes())
    assert data.startswith(b'pagefind_dcd'), path
    fragment = json.loads(data[len(b'pagefind_dcd'):])
    logical = fragment['url'].lstrip('/')
    assert logical.split('/')[0] not in closed, fragment['url']
    assert fragment['url'] == '/about/', fragment['url']
    fragments.append({'file': path.name, 'url': fragment['url'], 'word_count': fragment['word_count'], 'resolvedRoute': base + logical})
assert len(fragments) == 1
retained_gallery_assets = sorted(str(path.relative_to(root)) for path in (root / 'gallery').rglob('*') if path.is_file() and path.suffix not in ['.html'])
assert (root / 'gallery/firefly-2026/1.avif').is_file()
assert not (root / 'pio').exists()
http_checks = []
missing_route = None
if args.http:
    targets = [*html_files, root / 'api/dynamic.json', root / 'api/allPostMeta.json', root / 'rss.xml', root / 'sitemap-0.xml', root / 'pagefind/pagefind.js', *[root / relative for relative in retained_gallery_assets], *[root / 'assets/music/使一颗心免于哀伤-哼唱.mp3', root / 'assets/music/cover/109951169585655912.webp']]
    for path in targets:
        relative = path.relative_to(root).as_posix()
        route = base + relative.removesuffix('index.html')
        url = args.http.rstrip('/') + urllib.parse.quote(route, safe='/')
        with urllib.request.urlopen(url, timeout=5) as response:
            data = response.read()
            assert response.status == 200, relative
            assert data == path.read_bytes(), relative
            if relative == 'api/dynamic.json':
                assert response.headers.get_content_type() == 'application/json'
            http_checks.append({'route': route, 'status': response.status, 'sha256': hashlib.sha256(data).hexdigest()})
    try:
        urllib.request.urlopen(args.http.rstrip('/') + base + 'missing-p4-probe/', timeout=5)
        raise AssertionError('nonexistent route must return HTTP 404')
    except urllib.error.HTTPError as error:
        assert error.code == 404
        data = error.read()
        assert data == (root / '404.html').read_bytes()
        missing_route = {'route': base + 'missing-p4-probe/', 'status': error.code, 'sha256': hashlib.sha256(data).hexdigest()}
result = {'status': 'PASS', 'source': 'a353c2ee800bbff2865541288ea04308c245cdc5', 'base': base,
          'regularHtml': regular, 'closedStubs': stubs, 'dynamicEndpoint': {'body': [], 'policy': 'disabled GET guard before collection/processor, separately executed in-memory regression'},
          'sitemap': sitemap, 'pagefindFragments': fragments, 'rssItems': 0, 'publicPosts': 0,
          'retainedGalleryAssets': retained_gallery_assets, 'pioArtifactAbsent': True, 'http': http_checks, 'missingRoute': missing_route,
          'boundary': 'Closed static page stubs are HTTP 200 with meta refresh; source/public assets are retained. No real external comment, enabled service activation, private-storage promise or production acceptance.'}
(out / f'artifacts-v2-{label}.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'status': 'PASS', 'base': base, 'regularHtml': len(regular), 'closedStubs': len(stubs), 'pagefindFragments': len(fragments), 'httpChecks': len(http_checks)}))
