"""Local-only production artifact server for Pagefind latency/failure acceptance.

Example: python3 scripts/zhenkun-preview-faults.py --port 4337 --pagefind-delay 5
No generated HTML/JS is changed: responses come from the actual dist files.
"""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from time import sleep
from urllib.parse import urlsplit

parser = argparse.ArgumentParser()
parser.add_argument("--root", default="dist")
parser.add_argument("--base", default="/Zhenkun-blog-site/")
parser.add_argument("--port", type=int, required=True)
parser.add_argument("--pagefind-delay", type=float, default=0)
parser.add_argument("--pagefind-status", type=int, choices=[200, 503], default=200)
args = parser.parse_args()
root = Path(args.root).resolve(strict=True)
base = "/" + args.base.strip("/") + "/" if args.base.strip("/") else "/"


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        route = urlsplit(path).path
        if not route.startswith(base):
            return str(root / "__outside_deployment_base__")
        return super().translate_path("/" + route[len(base):])

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_head(self):
        if "/pagefind/" in urlsplit(self.path).path:
            sleep(args.pagefind_delay)
            if args.pagefind_status != 200:
                self.send_error(args.pagefind_status, "Intentional local Pagefind failure")
                return None
        return super().send_head()


print(f"Local artifact fixture: http://127.0.0.1:{args.port}{base}", flush=True)
print(f"Pagefind delay={args.pagefind_delay}s status={args.pagefind_status}", flush=True)
ThreadingHTTPServer(("127.0.0.1", args.port), partial(Handler, directory=str(root))).serve_forever()
