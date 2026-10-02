import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const astroRequire = createRequire(require.resolve('astro/package.json'));
const { parseDocument } = astroRequire('yaml');
const paths = ['biome', 'build', 'deploy'].map(name => `.github/workflows/${name}.yml`);
const workflows = paths.map(path => {
  const doc = parseDocument(readFileSync(path, 'utf8'), { uniqueKeys: true });
  assert.deepEqual(doc.errors, [], `${path}: invalid YAML`);
  return doc.toJS();
});
const [biome, build, deploy] = workflows;
for (const [name, workflow] of [['biome', biome], ['build', build], ['deploy', deploy]]) {
  assert.deepEqual(workflow.on.push.branches, ['main'], `${name}: push branch`);
  if (name !== 'deploy') assert.deepEqual(workflow.on.pull_request.branches, ['main']);
}
assert.ok(Object.hasOwn(build.on, 'workflow_call'));
assert.ok(Object.hasOwn(deploy.on, 'workflow_dispatch'));
assert.deepEqual(build.permissions, { contents: 'read' });
const beforeDeploy = parseDocument(spawnSync('git', ['show', 'c6118323cd7e82e03304eb391b5ea95db951019e:.github/workflows/deploy.yml'], {encoding:'utf8'}).stdout).toJS();
assert.deepEqual(deploy.permissions, beforeDeploy.permissions, 'Pages permission scope preserved');
assert.deepEqual(deploy.concurrency, beforeDeploy.concurrency, 'Pages serialization preserved');
assert.deepEqual(deploy.jobs.deploy.environment, beforeDeploy.jobs.deploy.environment);
assert.equal(deploy.jobs.quality.uses, './.github/workflows/build.yml');
assert.deepEqual(deploy.jobs.quality.permissions, { contents: 'read' });
assert.equal(deploy.jobs.build.needs, 'quality');
assert.equal(deploy.jobs.deploy.needs, 'build');
assert.ok(!Object.hasOwn(deploy.jobs.build, 'if'));
assert.ok(!Object.hasOwn(deploy.jobs.deploy, 'if'));
assert.notEqual(build.concurrency.group, deploy.concurrency.group);
const quality = build.jobs.quality;
assert.deepEqual(quality.strategy.matrix.base, ['/', '/Zhenkun-blog-site/']);
assert.equal(quality.env.DEPLOY_BASE, '${{ matrix.base }}');
assert.equal(deploy.jobs.build.env.DEPLOY_BASE, '/Zhenkun-blog-site/');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
let shellSyntaxChecks = 0;
for (const workflow of workflows) {
  for (const job of Object.values(workflow.jobs)) {
    assert.ok(!job['continue-on-error'], 'No quality bypass');
    for (const step of job.steps ?? []) {
      assert.ok(!step['continue-on-error'], 'No step bypass');
      if (step.run) {
        const syntax = spawnSync('bash', ['-n'], {input:step.run.replace(/\$\{\{[\s\S]*?\}\}/g, 'ci-expression'), encoding:'utf8'});
        assert.equal(syntax.status, 0, `${step.name}: ${syntax.stderr}`);
        shellSyntaxChecks++;
      }
    }
  }
}
for (const job of [quality, deploy.jobs.build]) {
  assert.equal(job.steps.find(step => step.name === 'Setup Node.js').with['node-version'], '24.20.0');
  const pnpm = job.steps.find(step => step.name === 'Setup pnpm').with;
  assert.equal(`pnpm@${pnpm.version}`, packageJson.packageManager);
  assert.equal(pnpm.run_install, false);
  assert.equal(job.steps.find(step => step.name === 'Install dependencies').run, 'pnpm install --frozen-lockfile');
  const runs = job.steps.filter(step => step.run).map(step => step.run);
  assert.ok(runs.some(run => run === 'pnpm build' || run === 'pnpm run build'));
  assert.ok(!runs.some(run => run.includes('pnpm astro build') || run.includes('no-frozen-lockfile')));
  assert.ok(runs.includes('node scripts/zhenkun-verify-ci-artifacts.mjs --base "$DEPLOY_BASE"'));
  const buildAt = job.steps.findIndex(step => step.run === 'pnpm build' || step.run === 'pnpm run build');
  const verifyAt = job.steps.findIndex(step => step.run?.startsWith('node scripts/zhenkun-verify-ci-artifacts'));
  assert.ok(buildAt < verifyAt);
  const uploadAt = job.steps.findIndex(step => step.uses?.startsWith('actions/upload-pages-artifact@'));
  if (uploadAt >= 0) assert.ok(verifyAt < uploadAt);
}
for (const command of ['pnpm exec biome ci ./src --reporter=github', 'pnpm check', 'pnpm type-check', 'node --test scripts/zhenkun-test-*.mjs']) {
  assert.ok(quality.steps.some(step => step.run === command), `Missing ${command}`);
}
console.log(JSON.stringify({status:'PASS', kind:'local static audit only', node:process.version, yamlParser:astroRequire('yaml/package.json').version, workflows:paths, shellSyntaxChecks, assertions:['main triggers','same-commit reusable quality gate for push and manual deploy','root and subpath matrix','runtime/package-manager consistency','frozen install in both workflows','formal build entry and Pagefind artifact checks','unchanged Pages permission/environment/serialization','no continue-on-error or conditional bypass'], notRun:['GitHub Actions expression evaluator/actionlint','Linux clean frozen installation','hosted workflow execution','new full dual-base builds']},null,2));
