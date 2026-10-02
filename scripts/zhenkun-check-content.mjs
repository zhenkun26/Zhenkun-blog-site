import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createMarkdownProcessor, unified } from "@astrojs/markdown-remark";
import { remarkWikiLink } from "../src/plugins/remark-wiki-link.js";
import { isPostVisible } from "../src/utils/post-contract.ts";
import { readWikiPosts, WikiPostIndex } from "../src/utils/wiki-link-index.ts";

const POSTS_DIRECTORY = fileURLToPath(
	new URL("../src/content/posts/", import.meta.url),
);

/** Admit source paths and identities before Astro's loader can follow links. */
export function validatePostSources(directory = POSTS_DIRECTORY) {
	return new WikiPostIndex(readWikiPosts(directory));
}

/** A read-only publication gate, independent of Astro's caught early-render errors. */
export async function checkPostContent({
	directory = POSTS_DIRECTORY,
	base = "/",
} = {}) {
	const postIndex = validatePostSources(directory);
	const posts = postIndex.posts;
	const publicPosts = posts.filter((post) => isPostVisible(post.data, true));
	const remarkPlugins = [
		[remarkWikiLink, { base, production: true, postIndex }],
	];
	const markdown = await createMarkdownProcessor({
		syntaxHighlight: false,
		smartypants: false,
		remarkPlugins,
	});
	const mdx = await unified({
		smartypants: false,
		remarkPlugins,
	}).createMdxRenderer(
		{ syntaxHighlight: false },
		{
			srcDir: new URL("../src/", import.meta.url),
			sourcemap: false,
			optimize: false,
		},
	);
	for (const post of publicPosts) {
		// Parse the native syntax without executing MDX imports or generating assets.
		// Module resolution, site rendering and image output still require the full build.
		if (path.extname(post.filePath) === ".mdx") {
			await mdx.process(post.body, post.filePath, post.data);
		} else {
			await markdown.render(post.body, {
				fileURL: pathToFileURL(post.filePath),
				frontmatter: post.data,
			});
		}
	}
	return { totalPosts: posts.length, publicPosts: publicPosts.length, base };
}

if (
	process.argv[1] &&
	pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
	try {
		const result = await checkPostContent({
			base: process.env.DEPLOY_BASE ?? "/",
		});
		console.log(JSON.stringify(result));
	} catch (error) {
		console.error(
			error instanceof Error ? error.message : "Content preflight failed.",
		);
		process.exitCode = 1;
	}
}
