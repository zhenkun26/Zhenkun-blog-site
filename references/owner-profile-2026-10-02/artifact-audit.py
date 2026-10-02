"""Inspect real production identity output; does not publish or fabricate posts."""
from pathlib import Path
from html.parser import HTMLParser
import base64
import json
import xml.etree.ElementTree as ET

BIO = "探索气象学、人工智能与计算机科学的交叉，记录学习、实践与生活。"
BASE = "/Zhenkun-blog-site/"
ORIGIN = "https://zhenkun26.github.io"


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.stack, self.text, self.nav, self.title = [], [], [], []
        self.meta, self.links, self.jsonld, self.script = {}, [], [], None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            self.meta[attrs.get("property", attrs.get("name"))] = attrs.get("content")
        if tag == "a":
            self.links.append(attrs)
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.script = ""
        if tag not in {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}:
            self.stack.append((tag, attrs.get("id")))

    def handle_data(self, data):
        if self.script is not None:
            self.script += data
        if any(tag == "title" for tag, _ in self.stack):
            self.title.append(data)
        if not any(tag in {"script", "style", "title"} for tag, _ in self.stack):
            self.text.append(data)
            if any(identifier == "navbar" for _, identifier in self.stack):
                self.nav.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self.script is not None:
            self.jsonld.append(json.loads(self.script))
            self.script = None
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                self.stack = self.stack[:index]
                break


root = Path("dist")
results = []
for route in ["", "about/", "archive/", "search/", "categories/", "tags/"]:
    file = root / route / "index.html"
    page = Page(file.read_text(encoding="utf-8"))
    title = "".join(page.title)
    text = " ".join(" ".join(page.text).split())
    nav = " ".join(" ".join(page.nav).split())
    assert "Zhenkun" in title and "Zhenkun" not in title, (route, title)
    assert "Zhenkun" in nav, (route, nav)
    assert "Zhenkun. All Rights Reserved." in text, route
    # The explicit owner direction preserves the repository/domain URL shown by site info.
    identity_text = text.replace("zhenkun26.github.io/Zhenkun-blog-site", "")
    assert not any(old in identity_text for old in ["Zhenkun", "Zhenkun", "zzk26personal@163.com"]), route
    assert page.meta["author"] == "Zhenkun", route
    assert page.meta["og:site_name"] == "Zhenkun", route
    assert page.meta["og:title"] == title and page.meta["twitter:title"] == title, route
    assert page.meta["og:url"] == ORIGIN + BASE + route, route
    assert any(link.get("href") == "https://github.com/zhenkun26" for link in page.links)
    encoded = [link["data-encoded-email"] for link in page.links if "data-encoded-email" in link]
    assert encoded and all(base64.b64decode(value).decode() == "zhenkunz25@gmail.com" for value in encoded)
    assert "Astro" in text and "Firefly" in text, route
    assert any(link.get("href") == "https://github.com/CuteLeaf/Firefly" for link in page.links)
    if route in ["", "about/"]:
        assert page.meta["description"] == BIO and page.meta["og:description"] == BIO and page.meta["twitter:description"] == BIO, route
    entities = [entity for data in page.jsonld for entity in data.get("@graph", [])]
    if route == "":
        for kind in ["Person", "WebSite", "Organization"]:
            entity = next(value for value in entities if value.get("@type") == kind)
            assert entity["name"] == "Zhenkun", (kind, entity)
        person = next(value for value in entities if value.get("@type") == "Person")
        assert person["description"] == BIO and person["url"] == ORIGIN + BASE + "about/"
    if route == "about/":
        person = next(data["mainEntity"] for data in page.jsonld if data.get("@type") == "ProfilePage")
        assert person["name"] == "Zhenkun" and person["description"] == BIO
        assert "zhenkunz25@gmail.com" in text
        for topic in ["AI", "大气科学", "生活随笔"]:
            assert topic in text
        assert any(link.get("href") == "https://github.com/saicaca/fuwari" for link in page.links)
    results.append({"route": BASE + route, "title": title, "author": page.meta["author"], "nav": nav, "footer": "Zhenkun. All Rights Reserved.", "ogTitle": page.meta["og:title"]})

channel = ET.parse(root / "rss.xml").getroot().find("channel")
assert channel.findtext("title") == "Zhenkun"
assert channel.findtext("link") == ORIGIN + BASE
assert not channel.findall("item")
assert channel.findtext("templateTheme") == "Firefly"
assert json.loads((root / "api/allPostMeta.json").read_text()) == []
print(json.dumps({"status": "PASS", "base": BASE, "pages": results, "rss": {"title": channel.findtext("title"), "link": channel.findtext("link"), "items": 0}, "publicPosts": 0, "boundary": "Actual built metadata/text and protected-link decode; empty corpus emits no real article OG PNG. OG renderer source still consumes siteConfig.title/profileConfig.name; no fabricated article."}, ensure_ascii=False, indent=2))
