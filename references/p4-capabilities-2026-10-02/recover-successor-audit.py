import hashlib
import json
import os
import pathlib
import re
import signal
import subprocess
import time

workspace = pathlib.Path('/Users/zhenkun/Documents/Codex/2026-10-02/task-4')
repo = pathlib.Path('/Users/zhenkun/Documents/Codex/2026-10-02/task/tmp/zhenkun-g1/p4-policy')
os.chdir(repo)
evidence = repo / 'references/p4-capabilities-2026-10-02'
guard = json.loads((workspace / 'tmp/handoff-guard.json').read_text())
assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip() == guard['p4Source']
assert not subprocess.check_output(['git', 'status', '--porcelain', '--untracked-files=no'], text=True).strip()
for name, digest in guard['initialEvidence'].items():
    assert hashlib.sha256((repo / name).read_bytes()).hexdigest() == digest
for name in ['artifact-audit-v2.py', 'pagefind-probe.mjs']:
    dest = evidence / name
    assert not dest.exists()
    dest.write_bytes((workspace / 'tmp' / name).read_bytes())
port_status = subprocess.run(['lsof', '-nP', '-iTCP:4343', '-sTCP:LISTEN'], capture_output=True, text=True)
assert port_status.returncode == 1 and not port_status.stdout
env = {**os.environ, 'NODE_ENV': 'production', 'DEPLOY_BASE': '/Zhenkun-blog-site/'}
with (evidence / 'preview-subpath-v2.log').open('w') as log:
    subprocess.run(['./node_modules/.bin/astro', 'preview', '--background', '--port', '4343', '--host', '127.0.0.1', '--json'], env=env, stdout=log, stderr=subprocess.STDOUT, check=True)
match = re.search(r'pid (\d+)', (evidence / 'preview-subpath-v2.log').read_text())
assert match
pid = int(match.group(1))
command = subprocess.check_output(['ps', '-p', str(pid), '-o', 'args='], text=True).strip()
assert 'astro/bin/astro.mjs preview' in command and '--port 4343' in command and '--host 127.0.0.1' in command
commands = []
try:
    for label, args in [
        ('artifact-audit-subpath-v2.log', ['python3', str(evidence / 'artifact-audit-v2.py'), '--base', '/Zhenkun-blog-site/', '--http', 'http://127.0.0.1:4343']),
        ('pagefind-runtime-subpath.log', ['node', str(evidence / 'pagefind-probe.mjs')]),
    ]:
        with (evidence / label).open('w') as log:
            result = subprocess.run(args, stdout=log, stderr=subprocess.STDOUT)
        commands.append({'command': args, 'log': label, 'exitCode': result.returncode})
        assert result.returncode == 0, label
        print(f'PASS {label}', flush=True)
finally:
    os.kill(pid, signal.SIGTERM)
    for _ in range(30):
        result = subprocess.run(['lsof', '-nP', '-iTCP:4343', '-sTCP:LISTEN'], capture_output=True, text=True)
        if result.returncode == 1 and not result.stdout:
            break
        time.sleep(0.1)
    assert result.returncode == 1 and not result.stdout
    (evidence / 'preview-subpath-v2-cleanup.json').write_text(json.dumps({'status': 'PASS', 'pid': pid, 'verifiedCommand': command, 'port': 4343, 'remainingListeners': 0}, indent=2) + '\n')
assert not subprocess.check_output(['git', 'status', '--porcelain', '--untracked-files=no'], text=True).strip()
assert all(hashlib.sha256((repo / name).read_bytes()).hexdigest() == digest for name, digest in guard['p4Tracked'].items())
assert all(hashlib.sha256((repo / name).read_bytes()).hexdigest() == digest for name, digest in guard['initialEvidence'].items())
archive = workspace / 'tmp/p4-root-dist-a353c2e.tar.gz'
(evidence / 'successor-validation.json').write_text(json.dumps({
    'status': 'PASS_AFTER_AUDIT_RECOVERY', 'source': guard['p4Source'], 'canonicalBase': guard['canonicalHead'],
    'node': subprocess.check_output(['node', '--version'], text=True).strip(), 'system': subprocess.check_output(['uname', '-srm'], text=True).strip(),
    'freshStatic': {'nativeTests': 151, 'astro': {'files': 257, 'errors': 0, 'warnings': 0, 'hints': 12}, 'biome': 'src plus new endpoint regression', 'typescript': 'tsc --noEmit --isolatedDeclarations'},
    'buildSubpath': 'build-stages-subpath.json: all eight declared stages exit 0',
    'recoveryCommands': commands, 'auditV1Failure': 'artifact-audit-subpath.log: raw Pagefind /about/ mistaken for deployment-prefixed stored URL',
    'initialEvidencePreserved': guard['initialEvidence'], 'rootDistArchive': str(archive), 'rootDistArchiveSHA256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'rootDistHashes': guard['rootDistHashes'],
    'boundary': 'Root build/28 HTTP are immutable handoff evidence plus fresh root artifact checker and preserved archive; no root full rebuild. Fresh static/subpath build/33 HTTP/real Pagefind module in Node. No browser UI, clean install/Linux/hosted, real article/comments, feature activation, external write or deployment.'
}, ensure_ascii=False, indent=2) + '\n')
print('PASS: additive corrected audit, runtime index resolution, preview cleanup, source/evidence preservation', flush=True)
