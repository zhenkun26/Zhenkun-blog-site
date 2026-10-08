"""Verify actual static deployment output with Python's standard library.

Run after pnpm build: python3 scripts/zhenkun-verify-deployment.py --base /Zhenkun-blog-site/
Optional --http http://127.0.0.1:4336 checks the same paths on an Astro preview.
The closed-page expectations apply to Zhenkun's current configuration, not every theme.
"""
import argparse
import hashlib
import json
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from urllib.request import urlopen
import xml.etree.ElementTree as ET


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.meta, self.links, self.jsonld = {}, [], []
        self.script = None
        self.html_lang = None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "html":
            self.html_lang = attrs.get("lang")
        if tag == "meta":
            self.meta[attrs.get("property", attrs.get("name", attrs.get("http-equiv")))] = attrs.get("content")
        if tag in ("link", "a"):
            self.links.append(attrs)
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.script = ""

    def handle_data(self, data):
        if self.script is not None:
            self.script += data

    def handle_endtag(self, tag):
        if tag == "script" and self.script is not None:
            self.jsonld.append(json.loads(self.script))
            self.script = None


parser = argparse.ArgumentParser()
parser.add_argument("--root", default="dist")
parser.add_argument("--base", required=True)
parser.add_argument("--http")
parser.add_argument("--expected-english-posts", type=int, default=0)
parser.add_argument("--expected-posts", type=int, default=0)
parser.add_argument("--post", help="Synthetic article ID for a separate, ignored fixture build")
args = parser.parse_args()
root = Path(args.root).resolve()
base = "/" + args.base.strip("/") + "/" if args.base.strip("/") else "/"
origin = "https://zhenkun26.github.io"
closed = ["bangumi", "bilibili", "booknav", "dynamic", "friends", "gallery", "guestbook", "myanimelist", "sponsor", "vndb"]
assets, requests, verified_pages = set(), [], []


def artifact(url):
    parsed = urlsplit(url)
    assert parsed.netloc == urlsplit(origin).netloc, url
    assert parsed.path.startswith(base), url
    # Repeated route/base segments can be legitimate (/about/about/).
    # Actual artifact existence, rather than substring deduplication, validates URLs.
    relative = unquote(parsed.path[len(base):])
    path = root / relative
    if parsed.path.endswith("/"):
        path /= "index.html"
    assert path.is_file(), (url, str(path))
    if args.http:
        with urlopen(args.http.rstrip("/") + parsed.path, timeout=10) as response:
            body = response.read()
            assert response.status == 200, url
            assert body == path.read_bytes(), (url, "HTTP bytes differ from artifact")
            requests.append({"path": parsed.path, "status": response.status, "bytes": len(body)})
    return path


def collect_images(value, locale="zh-CN"):
    if isinstance(value, dict):
        if value.get("@type") == "Person":
            assert value.get("url") == origin + base + ("en/" if locale == "en" else "") + "about/", value
        image = value.get("image")
        if isinstance(image, str):
            assets.add(image)
        elif isinstance(image, dict):
            assets.add(image["url"])
        logo = value.get("logo")
        if isinstance(logo, dict):
            assets.add(logo["url"])
        for child in value.values():
            collect_images(child, locale)
    elif isinstance(value, list):
        for child in value:
            collect_images(child, locale)


routes = [prefix + route for prefix in ["", "en/"] for route in ["", "about/", "archive/", "categories/", "tags/", "series/", "search/", "rss/"]]
if args.post:
    routes.append("posts/" + args.post + "/")
for route in routes:
    expected = origin + base + route
    page = Page(artifact(expected).read_text())
    assert any(link.get("rel") == "canonical" and link.get("href") == expected for link in page.links), expected
    locale = "en" if route.startswith("en/") else "zh-CN"
    assert page.html_lang == locale, (route, page.html_lang)
    if not route.startswith("posts/"):
        alternates = [link for link in page.links if link.get("hreflang")]
        expected_count = 3 if route in ["", "en/"] else 2
        assert len(alternates) == expected_count, (route, alternates)
        assert any(link["hreflang"] == locale and link["href"] == expected for link in alternates)
        for link in alternates:
            target = Page(artifact(link["href"]).read_text())
            assert any(other.get("href") == expected and other.get("hreflang") == locale for other in target.links), link

    assert page.meta["og:url"] == expected
    assert page.meta["og:image"] == page.meta["twitter:image"]
    assets.add(page.meta["og:image"])
    for data in page.jsonld:
        collect_images(data, page.html_lang)
    verified_pages.append(expected)
    if args.post and route.startswith("posts/"):
        assert page.meta["og:image"] == origin + base + "og/" + args.post + ".png"
        breadcrumb = next(entity for data in page.jsonld for entity in data.get("@graph", [])
                          if entity.get("@type") == "BreadcrumbList")
        assert breadcrumb["itemListElement"][1]["item"] == origin + base + "archive/?category=Engineering", breadcrumb

images = []
for image in sorted(assets):
    path = artifact(image)
    data = path.read_bytes()
    assert len(data) > 100, (image, "truncated image")
    images.append({"url": image, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})

namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
sitemap = ET.parse(artifact(origin + base + "sitemap-0.xml"))
sitemap_urls = [node.text for node in sitemap.findall(".//s:loc", namespace)]
assert all(url.startswith(origin + base) for url in sitemap_urls)
for url in sitemap_urls:
    route = urlsplit(url).path[len(base):]
    assert route.split("/")[0] not in closed + ["404", "404.html"], url
assert all(url in sitemap_urls for url in verified_pages)
sitemap_index = ET.parse(artifact(origin + base + "sitemap-index.xml"))
assert sitemap_index.findtext("s:sitemap/s:loc", namespaces=namespace) == origin + base + "sitemap-0.xml"

redirects = []
for path in sorted(root.rglob("index.html")):
    relative = path.relative_to(root).as_posix()
    if relative.split("/")[0] not in closed:
        continue
    page = Page(path.read_text())
    assert page.meta["refresh"] == "2;url=" + base + "404.html", relative
    assert any(link.get("href") == base + "404.html" for link in page.links), relative
    artifact(origin + base + relative.removesuffix("index.html"))
    redirects.append(relative)
assert len(redirects) == 13, redirects
error = Page(artifact(origin + base + "404.html").read_text())
assert any(link.get("href") == base for link in error.links), "404 lacks home recovery link"

feeds = {}
for prefix, expected_count, locale in [("", args.expected_posts, "zh_CN"), ("en/", args.expected_english_posts, "en")]:
    feed = ET.parse(artifact(origin + base + prefix + "rss.xml"))
    date = feed.findtext("channel/lastBuildDate")
    assert parsedate_to_datetime(date).utcoffset().total_seconds() == 0, date
    assert feed.findtext("channel/link") == origin + base + prefix, feed.findtext("channel/link")
    items = feed.findall("channel/item")
    assert len(items) == expected_count, (prefix, len(items))
    metadata = json.loads(artifact(origin + base + prefix + "api/allPostMeta.json").read_text())
    assert len(metadata) == expected_count
    for post in metadata:
        assert post["lang"] == locale
        assert post["url"].startswith(base + prefix + "posts/")
        artifact(origin + post["url"])
    for item in items:
        artifact(item.findtext("link"))
        assert parsedate_to_datetime(item.findtext("pubDate")).tzinfo is not None
        assert "开博记" not in item.findtext("title", ""), "owner draft was published"
    feeds[locale] = {"date": date, "items": len(items)}
robots = artifact(origin + base + "robots.txt").read_text()
assert "Sitemap: " + origin + base + "sitemap-index.xml" in robots, robots

print(json.dumps({"status": "PASS", "base": base, "pages": verified_pages, "images": images,
                  "sitemap": sitemap_urls, "redirects": redirects, "rssDate": date,
                  "rssItems": args.expected_posts, "feeds": feeds, "http": requests}, ensure_ascii=False, indent=2))
