"""Bind retained verification to source bytes and read-only preservation guards."""
import hashlib
import json
import pathlib
import subprocess
import urllib.parse

ROOT = pathlib.Path.cwd()
OUT = ROOT / "references/owner-profile-2026-10-02"
ORIGINAL = pathlib.Path("/Users/zhenkun/GitHub/Zhenkun-blog-site")
PROTECTED = pathlib.Path("/Users/zhenkun/Documents/Codex/2026-10-02/task/zhenkun-blog-site")
BASE = "a3d1a9a80b5acbe305720dbc09d28af23c8247d8"
SOURCE = "f0ea5164ab7e0ccc34ecfc478c6c3e5813a50db7"
MAIN = "bc21bfd92dd7081f2cf0acbec80d446f9d02c7de"
FILES = ["src/config/profileConfig.ts", "src/config/siteConfig.ts",
         "src/content/spec/about.md", "src/pages/about.astro"]


def git(repo, *args):
    return subprocess.check_output(["git", "-C", str(repo), *args])


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load(name):
    return json.loads((OUT / name).read_text(encoding="utf-8"))


def github_remote(repo, name):
    raw = git(repo, "remote", "get-url", name).decode().strip()
    if raw.startswith("git@github.com:"):
        return "github.com/" + raw.split(":", 1)[1].removesuffix(".git")
    url = urllib.parse.urlsplit(raw)
    assert url.hostname == "github.com", "unexpected remote host"
    return "github.com" + url.path.removesuffix(".git")


assert git(ROOT, "branch", "--show-current").decode().strip() == "codex/profile-zhenkun"
changed = git(ROOT, "diff", "--name-only", BASE, SOURCE).decode().splitlines()
assert sorted(changed) == sorted(FILES), changed
changed_refs = git(ROOT, "diff", "--name-only", BASE, "--", "references").decode().splitlines()
assert all(name.startswith("references/owner-profile-2026-10-02/") for name in changed_refs), changed_refs
assert git(ROOT, "diff", "--name-only", SOURCE, "--", "src", "scripts", "public",
           ".github", "package.json", "pnpm-lock.yaml", "astro.config.mjs", "LICENSE") == b""
source_hashes = {}
for name in FILES:
    data = (ROOT / name).read_bytes()
    assert data == git(ROOT, "show", f"{SOURCE}:{name}"), name
    source_hashes[name] = sha(data)

before = load("before.json")
unchanged_hashes = {}
for name in before["sha256"]:
    if name not in FILES:
        current = sha((ROOT / name).read_bytes())
        assert current == before["sha256"][name], name
        unchanged_hashes[name] = current

assert git(ORIGINAL, "rev-parse", "HEAD").decode().strip() == BASE
assert git(ORIGINAL, "branch", "--show-current").decode().strip() == "codex/refactor-publication-contracts"
assert not git(ORIGINAL, "status", "--porcelain", "--untracked-files=no").strip()
assert git(ORIGINAL, "rev-parse", "refs/heads/main").decode().strip() == MAIN
protection = json.loads((ROOT / "references/plan-reconciliation-2026-10-02/preservation-before.json").read_text())
assert git(PROTECTED, "rev-parse", "HEAD").decode().strip() == protection["isolated_head"]
assert len(protection["p3_files"]) == 50
for name, expected in protection["p3_files"].items():
    assert sha((PROTECTED / name).read_bytes()) == expected, name
workbuddy = ".workbuddy/memory/2026-10-02.md"
assert sha((ORIGINAL / workbuddy).read_bytes()) == protection["original_files"][workbuddy]

for name in ["config-audit.json", "artifact-audit.json", "browser-checks.json", "preview-cleanup.json"]:
    assert load(name)["status"] == "PASS", name
stages = load("build-stages.json")
assert len(stages["results"]) == 8 and all(x["exitCode"] == 0 for x in stages["results"])
assert load("browser-checks.json")["source"] == SOURCE
native = (OUT / "native-tests-147.log").read_text()
assert "tests 147" in native and "pass 147" in native and "fail 0" in native
assert (OUT / "type-check.log").stat().st_size == 0
astro = (OUT / "astro-check.log").read_text()
assert "Result (257 files)" in astro and "0 errors" in astro and "0 warnings" in astro and "12 hints" in astro
assert "Checked 298 files" in (OUT / "biome-full-source.log").read_text()

artifact_manifest = {}
for path in sorted((ROOT / "dist").rglob("*")):
    if path.is_file():
        artifact_manifest[str(path.relative_to(ROOT / "dist"))] = sha(path.read_bytes())
assert artifact_manifest
(OUT / "artifact-sha256.json").write_text(json.dumps(artifact_manifest, indent=2) + "\n")

snapshot = {
    "status": "PASS",
    "verificationRole": "Implementer execution and fresh read-only guards; independent profile review pending",
    "baseline": BASE, "source": SOURCE, "branch": "codex/profile-zhenkun",
    "sourceFiles": source_hashes, "preservedSourceFiles": unchanged_hashes,
    "original": {"head": BASE, "branch": "codex/refactor-publication-contracts",
                 "trackedClean": True, "main": MAIN,
                 "origin": github_remote(ORIGINAL, "origin"),
                 "upstream": github_remote(ORIGINAL, "upstream")},
    "protection": {"isolatedHead": protection["isolated_head"], "unchangedP3Files": 50,
                   "workbuddySha256": protection["original_files"][workbuddy]},
    "ownerDirection": {"source": "Parent relayed exact user correction",
                       "sentinel": "Sentinel_f04a413208d08191a4e56aa919a1bbc7",
                       "ownerTimestamp": "2026-10-02 09:28 UTC",
                       "acceptedIdentity": "Site display/title/navbar and author all Zhenkun"},
    "checks": [
        {"command": "./node_modules/.bin/biome ci ./src --max-diagnostics=0", "exitCode": 0, "files": 298},
        {"command": "node --test scripts/zhenkun-test-*.mjs", "exitCode": 0, "pass": 147, "fail": 0},
        {"command": "./node_modules/.bin/tsc --noEmit --isolatedDeclarations", "exitCode": 0},
        {"command": "./node_modules/.bin/astro check", "exitCode": 0, "files": 257, "errors": 0, "warnings": 0, "hints": 12},
        {"command": "node --import tsx references/owner-profile-2026-10-02/config-audit.mjs", "exitCode": 0},
        {"command": "NODE_ENV=production DEPLOY_BASE=/Zhenkun-blog-site/ node references/owner-profile-2026-10-02/run-declared-build.mjs", "exitCode": 0, "declaredStagesPassed": 8},
        {"command": "python3 references/owner-profile-2026-10-02/artifact-audit.py", "exitCode": 0, "routes": 6},
        {"command": "node scripts/zhenkun-verify-ci-artifacts.mjs --base /Zhenkun-blog-site/", "exitCode": 0},
        {"command": "CUA selected Edge GUI DOM/screenshots", "status": "PASS", "desktop": "1462x839 DPR2", "mobileEmulation": "390x844 DPR1"}
    ],
    "build": {"node": stages["node"], "base": stages["base"], "stages": stages["results"],
              "artifactFiles": len(artifact_manifest),
              "artifactManifestSha256": sha((OUT / "artifact-sha256.json").read_bytes()),
              "boundary": stages["boundary"]},
    "cleanup": load("preview-cleanup.json"),
    "notRun": ["Root-base rebuild for this profile packet", "fresh per-route HTTP byte matrix",
               "literal pnpm build", "frozen/clean installation", "Linux and hosted Actions",
               "required-check compatibility", "physical phone", "real article OG PNG/comment",
               "remote push/main merge/deployment"],
    "retainedDiagnostics": ["build-subpath-sandbox-failed.log", "build-stages-sandbox-failed.json", "preview-stop.log"]
}
(OUT / "source-snapshot.json").write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps({"status": "PASS", "sourceFiles": len(source_hashes), "protectedFiles": 50,
                  "artifactFiles": len(artifact_manifest), "originalHead": BASE}))
