import { verifySourceBaseline } from "./source-baseline.mjs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { parse as parseSvelte } from "svelte/compiler";

const requireAstro = createRequire(import.meta.resolve("astro/package.json"));
const { parse: parseAstro } = await import(requireAstro.resolve("@astrojs/compiler-rs"));
const base = "27e09c220e1ffe16817d5bf02e950a4fbf332b7b";
verifySourceBaseline();
const out = "references/p8-feasibility-2026-10-02";
const all = execFileSync("git", ["ls-files", "src", "astro.config.mjs"], { encoding: "utf8" }).trim().split("\n");
const sha = (text) => createHash("sha256").update(text).digest("hex");
const enumSource = ts.createSourceFile("i18nKey.ts", readFileSync("src/i18n/i18nKey.ts", "utf8"), ts.ScriptTarget.Latest, true);
const enumDecl = enumSource.statements.find(ts.isEnumDeclaration);
const enumKeys = Object.fromEntries(enumDecl.members.map((member) => [member.name.getText(enumSource), member.initializer.text]));
const dictionaries = {};
for (const file of all.filter((f) => f.startsWith("src/i18n/languages/") && f.endsWith(".ts"))) {
  const text = readFileSync(file, "utf8");
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const entries = [];
  function visit(node) {
    if (ts.isPropertyAssignment(node) && ts.isComputedPropertyName(node.name) && ts.isPropertyAccessExpression(node.name.expression)) {
      const member = node.name.expression.name.text;
      assert.ok(ts.isStringLiteral(node.initializer), `${file}:${member} must remain literal for this inventory`);
      entries.push([enumKeys[member], node.initializer.text]);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  const map = Object.fromEntries(entries);
  const name = file.split("/").pop().replace(/\.ts$/, "");
  dictionaries[name] = { file, sha256: sha(text), entryOccurrences: entries.length, uniqueKeys: Object.keys(map).length,
    duplicateKeys: entries.map(([key]) => key).filter((key, index, keys) => keys.indexOf(key) !== index),
    missingKeys: Object.values(enumKeys).filter((key) => !Object.hasOwn(map, key)),
    extraKeys: Object.keys(map).filter((key) => !Object.values(enumKeys).includes(key)),
    emptyKeys: Object.entries(map).filter(([, value]) => !value.trim()).map(([key]) => key),
    hanValueKeys: Object.entries(map).filter(([, value]) => /\p{Script=Han}/u.test(value)).map(([key]) => key),
    placeholders: Object.fromEntries(Object.entries(map).map(([key, value]) => [key, [...value.matchAll(/\{([A-Za-z_][\w]*)\}/g)].map((m) => m[1]).sort()])),
    values: map };
}
const placeholderMismatches = [];
for (const key of Object.values(enumKeys)) {
  const en = dictionaries.en.placeholders[key];
  const zh = dictionaries.zh_CN.placeholders[key];
  if (JSON.stringify(en) !== JSON.stringify(zh)) placeholderMismatches.push({ key, en, zh_CN: zh });
}
const candidates = [], calls = [], parseDiagnostics = [], sourceHashes = {};
const attributeNames = new Set(["title", "alt", "placeholder", "aria-label", "aria-description", "aria-valuetext", "value", "label", "name", "message", "summary", "heading", "data-template"]);
let currentFile, currentSource;
function lineAt(offset) { return currentSource.slice(0, offset).split("\n").length; }
function add(kind, text, offset, extra = {}) {
  if (typeof text !== "string" || !/\p{Script=Han}/u.test(text)) return;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return;
  candidates.push({ file: currentFile, line: lineAt(offset), offset, kind, text: normalized.slice(0, 180), ...extra });
}
function callRecord(offset, key = null) { calls.push({ file: currentFile, line: lineAt(offset), offset, key }); }
function scanTs(text, offset = 0, kind = "runtime-string") {
  const sf = ts.createSourceFile(currentFile, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(sf) === "i18n") {
      callRecord(offset + node.getStart(sf), node.arguments[0] && ts.isPropertyAccessExpression(node.arguments[0]) ? node.arguments[0].name.text : null);
    }
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) && !ts.isImportDeclaration(node.parent) && !ts.isLiteralTypeNode(node.parent)) {
      let diagnostic = false;
      for (let p = node.parent; p; p = p.parent) {
        if (ts.isThrowStatement(p) || (ts.isCallExpression(p) && /^console\./.test(p.expression.getText(sf)))) diagnostic = true;
      }
      add(diagnostic ? "diagnostic-string" : kind, node.text, offset + node.getStart(sf));
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
}
function walkAst(node, context = "markup", attribute = null) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) { for (const child of node) walkAst(child, context, attribute); return; }
  if (node.type === "Comment" || node.type === "JSXComment" || node.type === "StyleSheet") return;
  if (node.type === "JSXElement") {
    const tag = node.openingElement?.name?.name;
    if (tag === "style") return;
    if (tag === "script") {
      const content = node.children?.filter((c) => c.type === "JSXText");
      for (const part of content || []) scanTs(part.value, part.start, "client-script-string");
      return;
    }
  }
  if (node.type === "JSXAttribute" || node.type === "Attribute") {
    const name = node.name?.name || node.name;
    if (!attributeNames.has(name)) return;
    walkAst(node.value, context, name);
    return;
  }
  if ((node.type === "JSXText" || node.type === "Text") && context === "markup") {
    add(attribute ? "markup-attribute" : "markup-text", node.value || node.data, node.start || 0, attribute ? { attribute } : {});
  }
  if ((node.type === "Literal" || node.type === "StringLiteral") && typeof node.value === "string") add(attribute ? "markup-attribute" : "expression-or-frontmatter-string", node.value, node.start || 0, attribute ? { attribute } : {});
  if (node.type === "TemplateElement") add("expression-template-text", node.value?.raw, node.start || 0);
  if (node.type === "CallExpression" && node.callee?.type === "Identifier" && node.callee.name === "i18n") {
    const arg = node.arguments?.[0];
    callRecord(node.start || 0, arg?.type === "MemberExpression" ? arg.property?.name : null);
  }
  for (const [key, value] of Object.entries(node)) {
    if (["comments", "css", "loc", "position", "start", "end", "parent", "openingElement", "closingElement"].includes(key)) {
      if (key === "openingElement") walkAst(value?.attributes, context, attribute);
      continue;
    }
    if (key === "instance" || key === "module" || key === "frontmatter") walkAst(value, "script", attribute);
    else walkAst(value, context, attribute);
  }
}
const scanned = all.filter((file) => (file.match(/\.(astro|svelte|ts|js|mjs|html)$/) && !file.startsWith("src/i18n/languages/") && !file.startsWith("src/content/")));
for (const file of scanned) {
  currentFile = file; currentSource = readFileSync(file, "utf8"); sourceHashes[file] = sha(currentSource);
  try {
    if (file.endsWith(".astro") || file.endsWith(".html")) {
      const parsed = parseAstro(currentSource);
      parseDiagnostics.push(...(parsed.diagnostics || []).map((diagnostic) => ({ file, diagnostic })));
      walkAst(parsed.ast);
    } else if (file.endsWith(".svelte")) walkAst(parseSvelte(currentSource, { modern: true }));
    else scanTs(currentSource);
  } catch (error) { parseDiagnostics.push({ file, error: String(error) }); }
}
const deduped = [...new Map(candidates.map((item) => [`${item.file}:${item.offset}:${item.kind}:${item.attribute || ""}`, item])).values()];
const dedupCalls = [...new Map(calls.map((item) => [`${item.file}:${item.offset}`, item])).values()];
function countBy(items, key) { return Object.fromEntries([...new Set(items.map((item) => item[key]))].sort().map((value) => [value, items.filter((item) => item[key] === value).length])); }
const localeFiles = all.filter((f) => f.startsWith("src/pages/"));
const result = { status: parseDiagnostics.length ? "INVENTORY_WITH_PARSER_DIAGNOSTICS" : "PASS_SOURCE_INVENTORY", base, node: process.version,
  tools: { typescript: ts.version, astro: requireAstro("astro/package.json").version, compiler: "Existing Astro dependency @astrojs/compiler-rs", svelte: "Existing svelte/compiler" },
  method: "Git-tracked source only. TypeScript AST dictionaries/literals; installed Astro compiler-rs ESTree/JSX AST and Svelte modern AST. Excludes comments, styles, dictionaries from hardcoded candidates and all manuscript bodies. Han-bearing occurrences are candidates, not confirmed UI defects or unique translation tasks; owner copy, aliases, diagnostic/plugin strings and assets still require triage. AST diagnostic list is explicit.",
  enumKeyCount: Object.keys(enumKeys).length, dictionaries, placeholderMismatches,
  scannedFiles: scanned, scannedFileCount: scanned.length, sourceHashes, parseDiagnostics,
  candidateCount: deduped.length, candidateFiles: new Set(deduped.map((x) => x.file)).size, candidateKinds: countBy(deduped, "kind"), candidates: deduped,
  i18nCallCount: dedupCalls.length, i18nCallFiles: new Set(dedupCalls.map((x) => x.file)).size, i18nCalls: dedupCalls,
  pageRouteFiles: localeFiles, pageRouteFileCount: localeFiles.length,
  localizedRouteFiles: localeFiles.filter((f) => /^src\/pages\/(en|zh|zh-cn|zh_CN)\//.test(f)),
  hreflangSourceFiles: scanned.filter((f) => /hreflang/i.test(readFileSync(f, "utf8"))),
  boundary: "Read-only inventory. No UI rewrite, content translation/schema change, runtime setup, private manuscript reading/upload, dependency change or publication." };
writeFileSync(`${out}/inventory.json`, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({status: result.status, enumKeys: result.enumKeyCount, dictionaries: Object.fromEntries(Object.entries(dictionaries).map(([k,v])=>[k,{keys:v.uniqueKeys,missing:v.missingKeys.length,empty:v.emptyKeys.length}])), placeholderMismatches: placeholderMismatches.length, scannedFiles: scanned.length,candidates:deduped.length,candidateFiles:result.candidateFiles,i18nCalls:dedupCalls.length,routeFiles:localeFiles.length,localizedRoutes:result.localizedRouteFiles.length,parseDiagnostics:parseDiagnostics.length}));
