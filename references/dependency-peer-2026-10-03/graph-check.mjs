import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const req=createRequire(`${process.env.ZHENKUN_PEER_PARSER_ROOT??process.cwd()}/package.json`);
const yaml=createRequire(req.resolve('astro/package.json'))('js-yaml');
const base=yaml.load(execFileSync('git',['show','b974258753ca07347eae535a3f5ca94e902f033a:pnpm-lock.yaml'],{encoding:'utf8'}));
const next=yaml.load(readFileSync('pnpm-lock.yaml','utf8'));
assert.deepEqual(next.packages,base.packages);
assert.deepEqual(next.overrides,base.overrides);
assert.deepEqual(next.settings,base.settings);
assert.equal(next.lockfileVersion,base.lockfileVersion);
const expected=structuredClone(base.importers);
expected['.'].dependencies['@astrojs/markdown-satteri']={specifier:'0.3.7',version:'0.3.7'};
expected['.'].dependencies['@astrojs/mdx'].version=expected['.'].dependencies['@astrojs/mdx'].version.replace('@astrojs/markdown-satteri@0.4.0','@astrojs/markdown-satteri@0.3.7');
assert.deepEqual(next.importers,expected);
const obsolete=Object.keys(base.snapshots).filter(k=>k.startsWith('@astrojs/mdx@7.0.8(@astrojs/markdown-satteri@0.4.0)'));
assert.equal(obsolete.length,1);
const expectedSnapshots=structuredClone(base.snapshots);
delete expectedSnapshots[obsolete[0]];
assert.deepEqual(next.snapshots,expectedSnapshots);
const referenceErrors=[];
let refs=0;
for(const [owner,body] of Object.entries(next.snapshots))for(const field of ['dependencies','optionalDependencies'])for(const [name,version] of Object.entries(body[field]??{})){
 refs++;
 const direct=`${name}@${version}`;
 if(!next.snapshots[direct]){
  assert.equal(base.snapshots[owner]?.[field]?.[name],version,'Alias must be inherited unchanged');
  if(!next.snapshots[version])referenceErrors.push({owner,name,version});
 }
}
assert.deepEqual(referenceErrors,[]);
const report={status:'PASS_EXACT_PEER_SCOPE',packages:[Object.keys(base.packages).length,Object.keys(next.packages).length],snapshots:[Object.keys(base.snapshots).length,Object.keys(next.snapshots).length],references:refs,removedSnapshot:obsolete,importerChanges:['root exact markdown-satteri0.3.7','root MDX peer context reuses existing0.3.7 variant'],allCommonRecordsAndSnapshotsIdentical:true,overridesSettingsUnchanged:true,lockSha256:createHash('sha256').update(readFileSync('pnpm-lock.yaml')).digest('hex')};
writeFileSync('references/dependency-peer-2026-10-03/graph-verification.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
