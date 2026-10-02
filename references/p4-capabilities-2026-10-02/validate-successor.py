import hashlib
import json
import os
import pathlib
import re
import signal
import subprocess
import tarfile
import time

workspace = pathlib.Path('/Users/zhenkun/Documents/Codex/2026-10-02/task-4')
repo = pathlib.Path('/Users/zhenkun/Documents/Codex/2026-10-02/task/tmp/zhenkun-g1/p4-policy')
guard = json.loads((workspace / 'tmp/handoff-guard.json').read_text())
evidence = repo / 'references/p4-capabilities-2026-10-02'
os.chdir(repo)

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def git(*args):
    return subprocess.check_output(['git', *args], text=True).strip()

assert git('rev-parse', 'HEAD') == guard['p4Source']
assert git('branch', '--show-current') == 'codex/p4-toggle-consistency'
assert not git('status', '--porcelain', '--untracked-files=no')
assert all(sha(repo / name) == digest for name, digest in guard['p4Tracked'].items())
assert all(sha(repo / name) == digest for name, digest in guard['initialEvidence'].items())
for port in [4342, 4343]:
    result = subprocess.run(['lsof', '-nP', f'-iTCP:{port}', '-sTCP:LISTEN'], capture_output=True, text=True)
    assert result.returncode == 1 and not result.stdout, result.stdout
processes = subprocess.check_output(['ps', '-axo', 'pid,ppid,etime,command'], text=True)
competitors = [line for line in processes.splitlines() if ('astro/bin/astro.mjs' in line or 'run-declared-build.mjs' in line) and str(repo) in line]
assert not competitors, competitors
archive = workspace / 'tmp/p4-root-dist-a353c2e.tar.gz'
assert not archive.exists()
with tarfile.open(archive, 'w:gz') as output:
    output.add(repo / 'dist', arcname='dist')

commands = []
def run(label, args, env=None):
    path = evidence / label
    assert not path.exists(), path
    with path.open('w') as log:
        result = subprocess.run(args, stdout=log, stderr=subprocess.STDOUT, env=env)
    commands.append({'log': label, 'command': args, 'exitCode': result.returncode})
    assert result.returncode == 0, f'{label}: exit {result.returncode}'
    print(f'PASS {label}', flush=True)

run('native-tests-fresh-151.log', ['node', '--import', 'tsx', '--test', *sorted(str(x) for x in pathlib.Path('scripts').glob('zhenkun-test-*.mjs'))])
run('type-check-fresh.log', ['./node_modules/.bin/tsc', '--noEmit', '--isolatedDeclarations'])
run('astro-check-fresh.log', ['./node_modules/.bin/astro', 'check'])
run('biome-fresh.log', ['./node_modules/.bin/biome', 'check', './src', 'scripts/zhenkun-test-capabilities.mjs'])
run('deployment-artifacts-root-fresh.json', ['node', 'scripts/zhenkun-verify-ci-artifacts.mjs', '--base', '/'])
run('build-subpath.log', ['node', 'references/p4-capabilities-2026-10-02/run-declared-build.mjs', '/Zhenkun-blog-site/'])
run('deployment-artifacts-subpath.json', ['node', 'scripts/zhenkun-verify-ci-artifacts.mjs', '--base', '/Zhenkun-blog-site/'])
env = {**os.environ, 'NODE_ENV': 'production', 'DEPLOY_BASE': '/Zhenkun-blog-site/'}
run('preview-subpath.log', ['./node_modules/.bin/astro', 'preview', '--background', '--port', '4343', '--host', '127.0.0.1', '--json'], env)
match = re.search(r'pid (\d+)', (evidence / 'preview-subpath.log').read_text())
assert match
pid = int(match.group(1))
command = subprocess.check_output(['ps', '-p', str(pid), '-o', 'args='], text=True).strip()
assert 'astro/bin/astro.mjs preview' in command and '--port 4343' in command and '--host 127.0.0.1' in command, command
try:
    run('artifact-audit-subpath.log', ['python3', 'references/p4-capabilities-2026-10-02/artifact-audit.py', '--base', '/Zhenkun-blog-site/', '--http', 'http://127.0.0.1:4343'])
finally:
    os.kill(pid, signal.SIGTERM)
    for _ in range(30):
        status = subprocess.run(['lsof', '-nP', '-iTCP:4343', '-sTCP:LISTEN'], capture_output=True, text=True)
        if status.returncode == 1 and not status.stdout:
            break
        time.sleep(0.1)
    assert status.returncode == 1 and not status.stdout, status.stdout
    (evidence / 'preview-subpath-cleanup.json').write_text(json.dumps({'status': 'PASS', 'pid': pid, 'verifiedCommand': command, 'port': 4343, 'remainingListeners': 0, 'method': 'Exact task PID SIGTERM after command/port guards'}, indent=2) + '\n')
assert not git('status', '--porcelain', '--untracked-files=no')
assert all(sha(repo / name) == digest for name, digest in guard['p4Tracked'].items())
assert all(sha(repo / name) == digest for name, digest in guard['initialEvidence'].items())
result = {'status': 'PASS', 'source': guard['p4Source'], 'canonicalBase': guard['canonicalHead'], 'node': subprocess.check_output(['node', '--version'], text=True).strip(), 'system': subprocess.check_output(['uname', '-srm'], text=True).strip(), 'commands': commands, 'initialEvidencePreserved': len(guard['initialEvidence']), 'rootDistArchive': str(archive), 'rootDistArchiveSHA256': sha(archive), 'rootDistHashes': guard['rootDistHashes'], 'boundary': 'Direct existing tools; no pnpm setup/install, Linux/hosted run, config change, feature activation, real article/comments, remote write or deployment.'}
(evidence / 'successor-validation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': 'PASS', 'source': guard['p4Source'], 'commands': len(commands), 'previewStopped': True}), flush=True)
