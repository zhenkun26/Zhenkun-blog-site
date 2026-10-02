import hashlib, json, subprocess, re
from pathlib import Path

repo = Path.cwd()
out = repo / 'references/p8-feasibility-2026-10-02'
workspace = repo.parent.parent
original = Path('/Users/zhenkun/GitHub/Zhenkun-blog-site')
protected = Path('/Users/zhenkun/Documents/Codex/2026-10-02/task/zhenkun-blog-site')
p4 = Path('/Users/zhenkun/Documents/Codex/2026-10-02/task/tmp/zhenkun-g1/p4-policy')
historical = Path('/Users/zhenkun/Documents/Codex/2026-10-02/task/tmp/zhenkun-g1/review')
def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def save(name, value):
    (out / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
guard = json.loads((workspace / 'tmp/handoff-guard.json').read_text())
checkpoint = json.loads((out / 'canonical-checkpoint.json').read_text())
snapshot = json.loads((repo / 'references/p4-capabilities-2026-10-02/source-snapshot.json').read_text())
expected_original = checkpoint['after']
assert git(original, 'rev-parse', 'HEAD') == expected_original
assert git(original, 'branch', '--show-current') == 'codex/refactor-publication-contracts'
assert git(original, 'status', '--porcelain=v1', '--untracked-files=all') == guard['originalStatus']
assert git(original, 'rev-parse', 'main') == guard['main']
assert sha(original / '.workbuddy/memory/2026-10-02.md') == guard['workbuddy']
assert git(protected, 'rev-parse', 'HEAD') == guard['protectedHead']
assert git(protected, 'status', '--porcelain=v1', '--untracked-files=all') == guard['protectedStatus']
assert git(p4, 'rev-parse', 'HEAD') == 'b0017e24ce813fb43fefb3046737660e8e70a5ad'
assert not git(p4, 'diff', '--name-only') and not git(p4, 'diff', '--cached', '--name-only')
assert git(historical, 'rev-parse', 'HEAD') == '7ec53a2a7d9557ecbda89319e55c48d3fdca2e66'
protected_hashes = {path: sha(protected / path) for path in guard['protectedFiles']}
assert protected_hashes == guard['protectedFiles']
for path, expected in snapshot['files'].items():
    assert sha(repo / path) == expected['sha256'], path
    assert sha(original / path) == expected['sha256'], path
assert len(snapshot['files']) == 491
configs = {path: expected['sha256'] for path, expected in snapshot['files'].items() if path.startswith('src/config/')}
assert len(configs) == 27
draft = repo / 'src/content/posts/blog-launch.md'
assert re.search(r'^draft:\s*true\s*$', draft.read_text(), re.M)
assert sha(original / 'docs/ROADMAP.md') == sha(repo / 'docs/ROADMAP.md')
assert not git(repo, 'diff', '27e09c220e1ffe16817d5bf02e950a4fbf332b7b', '--', 'src', 'public', 'scripts', '.github', 'astro.config.mjs', 'package.json', 'pnpm-lock.yaml')
evidence_prior = json.loads((repo / 'references/p4-capabilities-2026-10-02/evidence-sha256.json').read_text())
# File keys are relative to the old evidence folder; preserve its entire committed set too.
p4_evidence_files = git(p4, 'ls-files', 'references/p4-capabilities-2026-10-02').splitlines()
for path in p4_evidence_files:
    assert sha(repo / path) == sha(original / path) == sha(p4 / path), path
inventory = json.loads((out / 'inventory.json').read_text())
probe = json.loads((out / 'existing-contract-probe.json').read_text())
fixture = json.loads((out / 'astro-locale-fixture.json').read_text())
assert inventory['status'] == 'PASS_SOURCE_INVENTORY'
assert inventory['enumKeyCount'] == 419 and inventory['i18nCallCount'] == 510 and inventory['candidateCount'] == 146
assert not inventory['parseDiagnostics'] and not inventory['placeholderMismatches']
assert probe['status'] == 'PASS_OBSERVED_EXISTING_CONTRACTS'
assert fixture['status'] == 'PASS_SYNTHETIC_ASTRO_DUAL_BASE_LOCALES'
assert len(fixture['cases']) == 2 and all(case['serverClosed'] for case in fixture['cases'])
assert sum(len(case['httpChecks']) for case in fixture['cases']) == 12
for case in fixture['cases']:
    assert {result['locale']: result['count'] for result in case['pagefind']['search']} == {'unknown': 3, 'zh-cn': 3, 'en': 2}
    name = case['name']
    dist = repo / f'tmp/p8-astro-locale-fixture/dist-{name}'
    if dist.exists():
        assert {path.relative_to(dist).as_posix(): sha(path) for path in dist.rglob('*') if path.is_file()} == case['emitted']
for path, expected in fixture['fixtureSources'].items():
    local = repo / 'tmp/p8-astro-locale-fixture' / path
    if local.exists():
        assert sha(local) == expected
for path in out.glob('*.mjs'):
    subprocess.run(['node', '--check', str(path)], check=True, capture_output=True)
subprocess.run(['git', 'diff', '--check', '--', 'docs'], check=True)
save('production-snapshot.json', {'measurementBase': '27e09c220e1ffe16817d5bf02e950a4fbf332b7b', 'canonicalCheckpoint': expected_original, 'applicationDelta': [], 'fileCount': 491, 'configs': configs, 'files': snapshot['files']})
save('preservation.json', {'status': 'PASS', 'originalHead': expected_original, 'main': guard['main'], 'originalStatus': guard['originalStatus'], 'workbuddySha256': guard['workbuddy'], 'protectedHead': guard['protectedHead'], 'protectedFileCount': len(protected_hashes), 'protectedFiles': protected_hashes, 'protectedStatusUnchanged': True, 'p4Head': git(p4, 'rev-parse', 'HEAD'), 'p4EvidencePreservedFiles': len(p4_evidence_files), 'historicalReviewHead': git(historical, 'rev-parse', 'HEAD'), 'sourceFilesUnchanged': 491, 'configFilesUnchanged': 27, 'draftPreserved': {'path': 'src/content/posts/blog-launch.md', 'sha256': sha(draft), 'draft': True}, 'canonicalRoadmapMatchesCandidate': True, 'fixtureServersClosed': True})
save('validation.json', {'status': 'PASS_DOCS_ANALYSIS_ONLY', 'base': '27e09c220e1ffe16817d5bf02e950a4fbf332b7b', 'canonicalCheckpoint': expected_original, 'inventory': {'keys': 419, 'calls': 510, 'hanCandidates': 146}, 'actualSourceFunctions': 'PASS', 'syntheticAstro': {'bases': 2, 'pagesPerBase': 5, 'httpChecks': 12, 'searchInitializationCases': 6}, 'scriptsSyntax': 'PASS', 'docsDiffCheck': 'PASS', 'productionSha256Files': 491, 'configSha256Files': 27, 'protectedSha256Files': 50, 'limits': fixture['boundaries'], 'productionTestsAndFullBuild': 'Not rerun: no production source/config/content delta; P4 measurements and acceptance remain separately bound.'})
manifest = {path.name: sha(path) for path in sorted(out.iterdir()) if path.is_file() and path.name != 'evidence-sha256.json'}
save('evidence-sha256.json', {'algorithm': 'SHA256', 'scope': 'All other files in this P8 evidence directory; excludes this manifest itself.', 'files': manifest})
print(json.dumps({'status': 'PASS', 'canonical': expected_original, 'sourceFiles': 491, 'configFiles': 27, 'protectedFiles': 50, 'oldP4EvidenceFiles': len(p4_evidence_files), 'p8EvidenceFiles': len(manifest) + 1, 'evidenceManifestSha256': sha(out / 'evidence-sha256.json')}))
