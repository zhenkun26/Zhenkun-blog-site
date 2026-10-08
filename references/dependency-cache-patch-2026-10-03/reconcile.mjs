import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const req=createRequire(`${process.cwd()}/package.json`), parent=createRequire(req.resolve('astro'));
const yaml=parent('js-yaml'),semver=parent('semver');
const dir='references/dependency-cache-patch-2026-10-03';
const old=JSON.parse(readFileSync('references/dependency-peer-2026-10-03/advisory-reconciliation.json','utf8'));
const lock=yaml.load(readFileSync('pnpm-lock.yaml','utf8'));
const rows=old.known36.rows.map(r=>{
 const versions=Object.keys(lock.packages).filter(k=>k.startsWith(`${r.package}@`)).map(k=>k.slice(r.package.length+1));
 const instances=versions.map(version=>({version,affected:r.officialAffectedRanges.some(range=>semver.satisfies(version,range,{includePrerelease:true}))}));
 return {...r,instances,status:instances.some(i=>i.affected)?'VERSION_MATCH_LOCAL_PATCH_UNREVIEWED':'NO_CURRENT_VERSION_MATCH'};
});
assert.equal(rows.length,36);
const audits={};
for(const kind of ['prod','full']){
 const data=JSON.parse(readFileSync(`${dir}/audit-${kind}.json`,'utf8'));
 const list=Object.values(data.advisories);
 assert.equal(list.length,1);
 assert.equal(list[0].github_advisory_id,'GHSA-ch52-4w7c-c8xp');
 audits[kind]={exit:1,records:list.length,ghsa:list.map(a=>a.github_advisory_id),severity:data.metadata.vulnerabilities,allRawPaths:list.flatMap(a=>a.findings.flatMap(f=>f.paths)),rawPatchedRange:list[0].patched_versions,localPatch:'Does not change version matching; dynamic review pending. No ignore/waiver/filter.'};
}
const sources=[
 {id:'GHSA-ch52-4w7c-c8xp',cve:'CVE-2026-93748',url:'https://github.com/advisories/GHSA-ch52-4w7c-c8xp',severity:'GitHub Reviewed High/CVSS4.0 8.7',range:'<=4.2.0',patched:'None',updated:'2026-10-02'},
 {id:'upstream issue57',url:'https://github.com/kornelski/http-cache-semantics/issues/57',severity:'Reporter Medium/CVSS3.1 5.9',range:'<=4.1.1',note:'Vary wildcard/OWS/list/prototype mechanism; differing range and severity retained'},
 {id:'CVE-2026-93750',url:'https://www.vulncheck.com/advisories/http-cache-semantics-through-4.2.0-cross-client-cache-disclosure-via-vary-wildcard',severity:'Publisher/CNA High/CVSS4.0 8.2',range:'<=4.2.0',published:'2026-09-18',ghsa:'Not established by bounded consulted primary sources; no global absence claim'},
];
const result={basis:'Retained official prod/full raw audit from this candidate before clock-only repair, plus current lock semver reevaluation of retained36 ranges. This continuation audit refresh BLOCKED by automatic approval; not exhaustive discovery or all36 primary-source refresh.',auditRefresh:{state:'BLOCKED',evidence:'audit-refresh-blocked.json'},implementation:{sourceCommit:'af1a0379ec9518931ef3d703dacdcbd4102daacf',boundedMacTests:'45/45 cache;247/247 full native;independent dynamic review pending',patchedSourceSha256:'55eefdf582537830c28f1a17d02c9b476ac3a820cc2eb0211ffb57d163f71c89'},lockSha256:createHash('sha256').update(readFileSync('pnpm-lock.yaml')).digest('hex'),audits,known36:{count:36,affected:rows.filter(r=>r.instances.some(i=>i.affected)).length,rows},additionalCVE93750:{versionMatch:true,belongsToRetained36:false,localPatch:'Unreviewed local candidate targets mechanism, not advisory closure'},sources,review:'Independent static designv2 PASS supplied; implementation/dynamic independent review PENDING',Linux:'NOT_RUN',GUI:'BLOCKED/NOT_RUN',officialPackage:'4.2.0; no fake4.2.1/fork/published repair claim'};
writeFileSync(`${dir}/advisory-reconciliation.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({audits,known36:result.known36.count,affected:result.known36.affected,additionalCVE:result.additionalCVE93750}));
