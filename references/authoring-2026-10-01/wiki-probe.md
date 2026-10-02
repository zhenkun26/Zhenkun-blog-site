# Read-only Wiki Link probe

Run independently during the 2026-10-01 authoring assessment against the existing working-tree plugin. Source SHA-256: `66fdb097715117f33ee5de61e746aad487121eb77e5fe86fe403bd3751c9f710`. This experiment checks AST transformation, not final Astro rendering or a production artifact. No fixture was written to disk, and no build, deletion, network request, or dependency installation occurred.

Run from the repository root with the already installed dependencies. The command reads the plugin, substitutes a virtual filesystem in memory, and prints synthetic results. The image API helpers are stubbed; that branch is not exercised. The inferred filename ID is checked against the inspected Astro default algorithm rather than by running the loader.

```sh
node --input-type=module <<'JS'
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import matter from 'gray-matter';
import { slug } from 'github-slugger';
const fixtureRoot = '/readonly-fixture/posts';
const files = new Map([
 ['published.md', '---\ntitle: Public Title\nslug: public-entry\npublished: 2026-01-01\ndraft: false\n---\n# Repeat\n# Repeat'],
 ['draft.md', '---\ntitle: Draft Title\nslug: private-draft\ndescription: Unapproved draft description\ndraft: true\nimage: /assets/draft-cover.png\n---\nPrivate body'],
 ['One Name.md', '---\ntitle: Filename With Spaces\ndraft: false\n---\nText'],
 ['first/duplicate.md', '---\ntitle: First Duplicate\nslug: identical-slug\n---\nText'],
 ['second/duplicate.md', '---\ntitle: Second Duplicate\nslug: identical-slug\n---\nText'],
 ['excluded.markdown', '---\ntitle: Not In Astro Glob\n---\nText'],
]);
const absoluteFiles = new Map([...files].map(([name, content]) => [path.join(fixtureRoot, name), content]));
const warnings = [];
const mocks = {
 readdirSync(dir) {
  const children = new Map();
  for (const full of absoluteFiles.keys()) {
   const rel = path.relative(dir, full);
   if (rel.startsWith('..')) continue;
   const parts = rel.split(path.sep), name = parts[0], directory = parts.length > 1;
   if (name) children.set(name, {name, isDirectory:()=>directory});
  }
  return [...children.values()];
 },
 readFileSync(file) { if (!absoluteFiles.has(file)) throw new Error('not found'); return absoluteFiles.get(file); },
 statSync(file) { if (!absoluteFiles.has(file)) throw new Error('not found'); return {mtimeMs:1, isFile:()=>true}; },
};
const pluginPath = 'src/plugins/remark-wiki-link.js';
const source = fs.readFileSync(pluginPath, 'utf8')
 .replace(/^import .*;\n/gm, '')
 .replace(/^const POSTS_DIR = .*;$/m, `const POSTS_DIR = ${JSON.stringify(fixtureRoot)};`)
 .replace('export function remarkWikiLink()', 'function remarkWikiLink()')
 + '\nthis.runPlugin = remarkWikiLink;';
const context = {...mocks, path, slug, matter, Date, console:{warn:message=>warnings.push(message)}, getApiUrlList:()=>[], processCoverImageSync:()=>''};
vm.createContext(context);
vm.runInContext(source, context, {filename:pluginPath});
function transform(input, nodeType='paragraph') {
 const tree = {type:'root', children:[{type:nodeType, children:[{type:'text', value:input}]}]};
 context.runPlugin()(tree, {path:'/readonly-fixture/posts/current.md'});
 const output = {links:[], images:[], texts:[], cards:0};
 function walk(node) {
  if (node.type === 'link') output.links.push(node.url);
  if (node.data?.hName === 'a') output.links.push(node.data.hProperties.href);
  if (node.data?.hName === 'img') output.images.push(node.data.hProperties.src);
  if (node.type === 'text') output.texts.push(node.value);
  if (node.data?.hProperties?.class?.includes('card-wiki-link')) output.cards++;
  for (const child of node.children || []) walk(child);
 }
 walk(tree);
 return output;
}
const cases = [
 ['public', '[[public-entry]]'], ['alias', 'before [[public-entry|Alias]] after'],
 ['heading', '[[public-entry#Repeat]]'], ['same-page-heading', '[[#Repeat]]'],
 ['draft', '[[private-draft]]'], ['missing', '[[missing-note]]'],
 ['ambiguous-basename', '[[duplicate]]'], ['duplicate-slug', '[[identical-slug]]'],
 ['embed-note', '![[public-entry]]'], ['embed-image', '![[image.png]]'],
 ['filename-ID', '[[One Name]]'], ['excluded-markdown-extension', '[[excluded]]'],
 ['MDX-JSX-skipped', '[[public-entry]]', 'mdxJsxFlowElement'],
];
console.log(JSON.stringify({
 verification:'Readonly in-memory AST fixtures; no full Astro rendering or build',
 source:pluginPath,
 results:cases.map(([name, input, nodeType])=>({name, input, ...transform(input,nodeType)})),
 filenameIdComparison:{filename:'One Name.md', pluginHref:'/posts/One%20Name/', expectedAstroId:slug('One Name'), expectedAstroHref:`/posts/${slug('One Name')}/`},
 warnings,
 limits:['Fake filesystem and synthetic metadata', 'No network or persistent files', 'Image API branch stubbed and not exercised', 'Expected Astro filename ID derives from inspected default ID algorithm, not a loader integration run', 'No production artifact/base-path acceptance'],
}, null, 2));
JS
```

Selected observed output, compacted without changing the reported values:

```json
[
 {"name":"public","links":["/posts/public-entry/"],"images":[],"texts":["Public Title","2026-01-01"],"cards":1},
 {"name":"draft","links":["/posts/private-draft/"],"images":["/assets/draft-cover.png"],"texts":["Draft Title","Unapproved draft description"],"cards":1},
 {"name":"missing","links":["/posts/missing-note/"],"images":[],"texts":["missing-note"],"cards":0},
 {"name":"ambiguous-basename","links":["/posts/duplicate/"],"images":[],"texts":["duplicate"],"cards":0},
 {"name":"duplicate-slug","links":["/posts/identical-slug/"],"images":[],"texts":["Second Duplicate"],"cards":1},
 {"name":"embed-note","links":[],"images":[],"texts":["![[public-entry]]"],"cards":0},
 {"name":"embed-image","links":[],"images":[],"texts":["![[image.png]]"],"cards":0},
 {"name":"filename-ID","links":["/posts/One%20Name/"],"images":[],"texts":["Filename With Spaces"],"cards":1},
 {"name":"excluded-markdown-extension","links":["/posts/excluded/"],"images":[],"texts":["Not In Astro Glob"],"cards":1},
 {"name":"MDX-JSX-skipped","links":[],"images":[],"texts":["[[public-entry]]"],"cards":0}
]
```

The basename warning identifies both synthetic duplicate files but transformation still emits a fabricated link. The duplicate slug selects the first metadata entry encountered, which is `second/duplicate.md` in this traversal; no ambiguity rejection occurs. Filename `One Name.md` would receive normalized Astro ID `one-name` under the inspected default algorithm, while the plugin emits the encoded raw name. A final artifact under the configured deployment base was not generated.
