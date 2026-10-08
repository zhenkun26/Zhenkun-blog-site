import { createHash } from "node:crypto";
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// Use the existing renderer's installed serializer. No dependency is added.
const ecRequire = createRequire(realpathSync("node_modules/astro-expressive-code/package.json"));
const rehypeRequire = createRequire(ecRequire.resolve("rehype-expressive-code"));
const { toHtml } = await import(pathToFileURL(rehypeRequire.resolve("hast-util-to-html")));
const output = "references/s2-locale-spike-2026-10-08/";
const raw = readFileSync("tmp/s2-20261008/code-locale-probe.json");
const probe = JSON.parse(raw);
const chineseControl = /^(?=.*\p{Script=Han})[\p{Script=Han}\p{Punctuation}\p{White_Space}]+$/u;
function hast(node) {
	if (node.tag) return { type: "element", tagName: node.tag, properties: node.attrs, children: (node.children || []).map(hast) };
	if (typeof node.text === "string") return { type: "text", value: node.text };
	return { type: "root", children: (node.children || []).map(hast) };
}
function collect(node, found = { collapseText: [], announcements: [], copy: [] }) {
	const attrs = node.attrs || {};
	if ((attrs.className || []).some((c) => c === "ec-collapse__text-expand" || c === "ec-collapse__text-collapse")) {
		found.collapseText.push((node.children || []).map((c) => c.text || "").join(""));
	}
	if (attrs.dataExpandedAnnouncement) found.announcements.push(attrs.dataExpandedAnnouncement, attrs.dataCollapsedAnnouncement);
	if (attrs.dataCopied) found.copy.push({ title: attrs.title, dataCopied: attrs.dataCopied });
	for (const child of node.children || []) collect(child, found);
	return found;
}
const htmlFiles = [];
const results = probe.results.map(({ index, locale, ast }) => {
	const controls = collect(ast);
	if (index < 2) {
		const file = locale === "en" ? "code-en.html" : "code-zh.html";
		const html = toHtml(hast(ast)) + "\n";
		writeFileSync(output + file, html);
		htmlFiles.push({ file, sha256: createHash("sha256").update(html).digest("hex") });
	}
	const copyMatches = controls.copy.length > 0 && controls.copy.every(({ title, dataCopied }) => locale === "en"
		? title === "Copy to clipboard" && dataCopied === "Copied!"
		: chineseControl.test(title) && chineseControl.test(dataCopied));
	const collapseMatches = controls.collapseText.length > 0 && controls.announcements.length === 2 && (locale === "en"
		? controls.collapseText.every((s) => s === "Show more" || s === "Show less") && controls.announcements.join("|") === "Code block expanded|Code block collapsed"
		: controls.collapseText.every((s) => s === "展开" || s === "收起") && controls.announcements.join("|") === "代码块已展开|代码块已折叠");
	return { index, locale, controls, copyLocale: copyMatches ? "PASS" : "FAIL", collapseLocale: collapseMatches ? "PASS" : "FAIL", monolingualControls: copyMatches && collapseMatches ? "PASS" : "FAIL" };
});
const summary = {
	kind: probe.kind,
	source: probe.source,
	rendererExecution: "PASS",
	rendererProcessExit: 0,
	languageContract: results.every((r) => r.monolingualControls === "PASS") ? "PASS" : "FAIL",
	wholeSiteAcceptance: false,
	rawSnapshotSha256: createHash("sha256").update(raw).digest("hex"),
	htmlMeaning: "Installed toHtml serialization of the captured renderedGroupAst; code fragments only, not Astro page/build/HTTP/browser evidence.",
	htmlFiles,
	results,
};
writeFileSync(output + "renderer-result.json", JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify({ languageContract: summary.languageContract, cases: results.length, failed: results.filter((r) => r.monolingualControls === "FAIL").length, wholeSiteAcceptance: false }));
