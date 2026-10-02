import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const base = 'decd04b084c917648163c44225451ad1ceb5ecbe';
const paths = ['src/components/widget/Announcement.astro','src/layouts/Layout.astro',...['bangumi','bilibili','booknav','dynamic/comments','dynamic/index','friends','gallery/[album]','gallery/index','guestbook','myanimelist','sponsor','vndb'].map(name=>`src/pages/${name}.astro`),'src/config/backgroundWallpaper.ts'];
const changed = execFileSync('git',['diff','--name-only',base,'--','src'],{encoding:'utf8'}).trim().split('\n').sort();
assert.deepEqual(changed,[...paths].sort());
function tokens(text) {
  const scanner=ts.createScanner(ts.ScriptTarget.Latest,true,ts.LanguageVariant.Standard,text);
  const result=[];
  for(let kind=scanner.scan();kind!==ts.SyntaxKind.EndOfFileToken;kind=scanner.scan())result.push([kind,scanner.getTokenText()]);
  return result;
}
const files=[];
for(const path of paths) {
  const before=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8'});
  const after=readFileSync(path,'utf8');
  if(path.endsWith('.astro')) {
    const oldMatch=/^---\n([\s\S]*?)\n---/.exec(before);
    const newMatch=/^---\n([\s\S]*?)\n---/.exec(after);
    assert.ok(oldMatch && newMatch);
    assert.equal(before.slice(oldMatch[0].length),after.slice(newMatch[0].length),'Astro template/script/style bytes unchanged');
    assert.deepEqual(oldMatch[1].split('\n').sort(),newMatch[1].split('\n').sort(),'Only existing frontmatter lines reordered');
    function frontmatter(text) {
      const sf=ts.createSourceFile(path+'.ts',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
      assert.equal(sf.parseDiagnostics.length,0,'Frontmatter parse');
      return {imports:sf.statements.filter(ts.isImportDeclaration).map(node=>JSON.stringify(tokens(node.getText(sf)))).sort(),body:sf.statements.filter(node=>!ts.isImportDeclaration(node)).map(node=>tokens(node.getText(sf)))};
    }
    assert.deepEqual(frontmatter(oldMatch[1]),frontmatter(newMatch[1]),'Import multiset and non-import statement order/tokens unchanged');
    files.push({path,status:'PASS',invariants:['template/script/style byte equality','frontmatter line multiset','import token multiset','non-import statement order/token equality']});
  } else {
    // TypeScript's printer retains source line breaks/trailing comma; compare AST nodes and literal values.
    function canonical(text) {
      const sf=ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
      assert.equal(sf.parseDiagnostics.length,0);
      function walk(node) {
        const children=[];
        ts.forEachChild(node,child=>{children.push(walk(child));});
        return {kind:node.kind,...(ts.isIdentifier(node)||ts.isStringLiteral(node)||ts.isNumericLiteral(node)?{text:node.text}:{}),children};
      }
      return walk(sf);
    }
    assert.deepEqual(canonical(before),canonical(after),'Wallpaper AST/values/order unchanged');
    files.push({path,status:'PASS',invariants:['TypeScript AST equality including property names, array values and order; source positions/trailing comma ignored']});
  }
}
for(const path of ['src/utils/deployment-contract.ts','src/utils/post-contract.ts']) {
  const sf=ts.createSourceFile(path,readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true);
  assert.ok(sf.statements.every(node=>ts.isImportDeclaration(node)||ts.isFunctionDeclaration(node)),`${path}: no new top-level effect statement`);
}
console.log(JSON.stringify({status:'PASS',base,typescript:ts.version,files,sourceUtilityTopLevelAudit:['deployment-contract.ts and post-contract.ts contain only imports and function declarations'],boundary:'Syntax/token/transpile invariants plus reviewed import relocation. Not a production rebuild, runtime behavior equivalence proof or GitHub Actions run.'},null,2));
