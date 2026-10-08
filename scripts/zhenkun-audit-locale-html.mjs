import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { fromHtml } from "hast-util-from-html";

const allowedChineseTokens = [
	"Zhenkun",
	"EN",
	"GitHub Pages",
	"GitHub",
	"RSS",
	"Firefly",
	"Fuwari",
	"Astro",
	"Node",
	"pnpm",
	"macOS",
	"ARM64",
	"CC BY-NC-SA",
	"AI",
	"RAG",
	"Really Simple Syndication",
	"Feedly",
	"Inoreader",
	"Agent",
	"HOYO-MiX",
	"Chevy",
	"zhenkun26.github.io/Zhenkun-blog-site",
	"@zhenkun26",
	"zhenkunz25@gmail.com",
];
const authoredMusicNames = new Set([
	"使一颗心免于哀伤",
	"知更鸟 / HOYO-MiX / Chevy",
	"使一颗心免于哀伤 - 知更鸟 / HOYO-MiX / Chevy",
]);
export function unexpectedLanguage(
	text,
	locale,
	languageChoice = false,
	musicMetadata = false,
) {
	if (locale === "en")
		return (
			/\p{Script=Han}/u.test(text) &&
			!(languageChoice && text === "中文") &&
			!(musicMetadata && authoredMusicNames.has(text))
		);
	if (
		/^https:\/\/zhenkun26\.github\.io\/(Zhenkun-blog-site\/)?(en\/)?rss\.xml$/.test(
			text,
		)
	)
		return false;
	let remaining = text;
	for (const token of [...allowedChineseTokens].sort(
		(a, b) => b.length - a.length,
	))
		remaining = remaining.replaceAll(token, "");
	return /[A-Za-z]{2}/.test(remaining);
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	const pages = [
		"",
		"about/",
		"archive/",
		"categories/",
		"tags/",
		"series/",
		"search/",
		"rss/",
	].flatMap((path) => [path + "index.html", "en/" + path + "index.html"]);
	const out = {};
	for (const file of pages) {
		const document = fromHtml(fs.readFileSync(`dist/${file}`, "utf8"));
		const texts = [];
		function walk(
			node,
			ancestorPath = "",
			parentLanguageChoice = false,
			parentMusicMetadata = false,
		) {
			let path = ancestorPath;
			let languageChoice = parentLanguageChoice;
			let musicMetadata = parentMusicMetadata;
			if (node.type === "element") {
				if (["script", "style", "svg"].includes(node.tagName)) return;
				path +=
					"/" +
					node.tagName +
					(node.properties.id ? `#${node.properties.id}` : "");
				languageChoice =
					parentLanguageChoice ||
					(node.tagName === "a" &&
						node.properties.dataLocaleChoice === "zh_CN");
				musicMetadata =
					parentMusicMetadata || /music/i.test(node.properties.id ?? "");
				for (const key of ["ariaLabel", "title", "alt", "placeholder"])
					if (node.properties[key])
						texts.push({
							path,
							attribute: key,
							text: node.properties[key],
							languageChoice,
							musicMetadata,
						});
			}
			if (node.type === "text" && node.value.trim())
				texts.push({
					path,
					text: node.value.trim(),
					languageChoice,
					musicMetadata,
				});
			for (const child of node.children ?? [])
				walk(child, path, languageChoice, musicMetadata);
		}
		walk(document);
		out[file] = texts;
	}
	fs.writeFileSync(
		process.argv[2] ?? "/tmp/zhenkun-locale-rendered.json",
		`${JSON.stringify(out, null, 2)}\n`,
	);
	for (const [file, texts] of Object.entries(out)) {
		const leaks = texts.filter(({ text, languageChoice, musicMetadata }) =>
			unexpectedLanguage(
				text,
				file.startsWith("en/") ? "en" : "zh_CN",
				languageChoice,
				musicMetadata,
			),
		);
		console.log(file, JSON.stringify({ records: texts.length, leaks }));
		assert.deepEqual(
			leaks,
			[],
			`${file}: opposite-language rendered text/accessibility attributes`,
		);
	}
	// Demonstrate both directions and narrow language-chooser exemptions reject leaks.
	assert.equal(unexpectedLanguage("Welcome to my blog", "zh_CN"), true);
	assert.equal(unexpectedLanguage("欢迎来到我的博客", "en"), true);
	assert.equal(unexpectedLanguage("中文", "en", false), true);
	assert.equal(unexpectedLanguage("中文", "en", true), false);
	assert.equal(unexpectedLanguage("中文提示", "en", true), true);
	assert.equal(
		unexpectedLanguage("使一颗心免于哀伤", "en", false, true),
		false,
	);
	assert.equal(
		unexpectedLanguage("使一颗心免于哀伤", "en", false, false),
		true,
	);
	assert.equal(unexpectedLanguage("播放音乐", "en", false, true), true);
}
