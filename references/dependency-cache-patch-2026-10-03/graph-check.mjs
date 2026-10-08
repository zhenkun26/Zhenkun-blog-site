import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,readdirSync,realpathSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
const req=createRequire(`${process.cwd()}/package.json`);
const parent=createRequire(req.resolve('astro'));
const yaml=parent('js-yaml');
const base=yaml.load(execFileSync('git',['show','ed64aad20e7025afa7834f3eb2008c0c57cc2240:pnpm-lock.yaml'],{encoding:'utf8'}));
const next=yaml.load(readFileSync('pnpm-lock.yaml','utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const patch='scripts/patches/http-cache-semantics@4.2.0.patch';
const patchHash=hash(readFileSync(patch));
assert.deepEqual(next.patchedDependencies,{'http-cache-semantics@4.2.0':patchHash});
const expected=structuredClone(base);
expected.patchedDependencies=next.patchedDependencies;
const parents=Object.keys(expected.snapshots).filter(k=>expected.snapshots[k].dependencies?.['http-cache-semantics']);
assert.equal(parents.length,1);
assert.ok(parents[0].startsWith('astro@7.2.10('));
expected.snapshots[parents[0]].dependencies['http-cache-semantics']=`4.2.0(patch_hash=${patchHash})`;
expected.snapshots[`http-cache-semantics@4.2.0(patch_hash=${patchHash})`]=expected.snapshots['http-cache-semantics@4.2.0'];
delete expected.snapshots['http-cache-semantics@4.2.0'];
assert.deepEqual(next,expected);
assert.equal(execFileSync('git',['diff','ed64aad','--','package.json'],{encoding:'utf8'}),'');
const ws=yaml.load(readFileSync('pnpm-workspace.yaml','utf8'));
const oldws=yaml.load(execFileSync('git',['show','ed64aad:pnpm-workspace.yaml'],{encoding:'utf8'}));
assert.deepEqual(ws,{...oldws,patchedDependencies:{'http-cache-semantics@4.2.0':patch}});
const entry=realpathSync(parent.resolve('http-cache-semantics'));
const instances=readdirSync('node_modules/.pnpm').filter(n=>n.startsWith('http-cache-semantics@')).map(n=>join('node_modules/.pnpm',n,'node_modules/http-cache-semantics/index.js'));
const sourceHash='55eefdf582537830c28f1a17d02c9b476ac3a820cc2eb0211ffb57d163f71c89';
assert.equal(hash(readFileSync(entry)),sourceHash);
const links=[];
function scan(directory){for(const f of readdirSync(directory,{withFileTypes:true})){
 const p=join(directory,f.name);
 if(f.isDirectory())scan(p);
 else if(f.isSymbolicLink()){
  const target=realpathSync(p),manifest=join(target,'package.json');
  if(existsSync(manifest)&&JSON.parse(readFileSync(manifest,'utf8')).name==='http-cache-semantics'){
   assert.equal(realpathSync(join(target,'index.js')),entry);
   assert.equal(hash(readFileSync(join(target,'index.js'))),sourceHash);
   links.push(p);
  }
 }
}}
scan('node_modules');
assert.ok(links.length>=1);
const inactiveInstances=instances.filter(f=>realpathSync(f)!==entry).map(f=>({file:f,hash:hash(readFileSync(f)),state:'INACTIVE_PHYSICAL_CACHE_NO_LINK_OR_CURRENT_LOCK_EDGE'}));
for(const f of inactiveInstances)assert.equal(f.hash,'01b7d66c854b2fe53ac05c98feb6e0d64722ab8898a778e2d2426a8b468d178f');
assert.deepEqual(yaml.load(readFileSync('node_modules/.pnpm/lock.yaml','utf8')),next);
assert.equal(hash(readFileSync(join(dirname(entry),'package.json'))),'bee0609d5ab09a590afe0e1209d3702b0afb0a3c158492f90902a724d889d22b');
assert.equal(hash(readFileSync(join(dirname(entry),'LICENSE'))),'ab868ad5a2ef5068560d9cd3b2180ec63c140bb4c5cae1ba779d300a0ac74fa3');
let refs=0;
for(const body of Object.values(next.snapshots))for(const field of ['dependencies','optionalDependencies'])for(const [name,version] of Object.entries(body[field]??{})){
 refs++;
 assert.ok(Object.hasOwn(next.snapshots,`${name}@${version}`)||Object.hasOwn(next.snapshots,version),`Missing ${name}@${version}`);
}
const report={status:'PASS_EXACT_CACHE_PATCH_SCOPE',base:'ed64aad20e7025afa7834f3eb2008c0c57cc2240',packages:[Object.keys(base.packages).length,Object.keys(next.packages).length],snapshots:[Object.keys(base.snapshots).length,Object.keys(next.snapshots).length],references:refs,parents,patch,patchHash,sourceHash,entry,instances,links,inactiveInstances,allPackageRecordsAndOtherSnapshotsIdentical:true,rootPeerAnd8GuardsAndAllowBuildsUnchanged:true,lockHash:hash(readFileSync('pnpm-lock.yaml'))};
writeFileSync('references/dependency-cache-patch-2026-10-03/graph-verification.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
