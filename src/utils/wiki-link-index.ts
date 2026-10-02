import { readdirSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { assertSafePostId, getPostId, isPostVisible } from "./post-contract.ts";

export type WikiPost = {
	id: string;
	filePath: string;
	contentPath: string;
	data: Record<string, unknown> & { draft?: boolean };
	body: string;
};

export type WikiResolution =
	| { status: "resolved"; post: WikiPost }
	| { status: "missing" | "hidden" | "ambiguous" | "invalid" };

/** Read only the files admitted by the posts collection, without following symlinks. */
export function readWikiPosts(directory: string): WikiPost[] {
	if (realpathSync(directory) !== path.resolve(directory)) {
		throw new Error(
			"The posts source directory must not pass through symlinks.",
		);
	}
	const posts: WikiPost[] = [];
	function visit(current: string): void {
		for (const entry of readdirSync(current, { withFileTypes: true }).sort(
			(a, b) => a.name.localeCompare(b.name),
		)) {
			// Match the loader's dot:false glob behavior.
			if (entry.name.startsWith(".")) continue;
			const filePath = path.join(current, entry.name);
			if (entry.isSymbolicLink()) {
				throw new Error(
					`Symlinks are not publishing inputs: ${path.relative(directory, filePath)}`,
				);
			}
			if (entry.isDirectory()) {
				visit(filePath);
				continue;
			}
			if (!entry.isFile() || !/\.(md|mdx)$/.test(entry.name)) continue;
			const relative = path.relative(directory, filePath).replaceAll("\\", "/");
			let parsed: ReturnType<typeof matter>;
			try {
				parsed = matter(readFileSync(filePath, "utf8"));
			} catch {
				throw new Error(`Invalid Markdown frontmatter: ${relative}`);
			}
			if (
				parsed.data.draft !== undefined &&
				typeof parsed.data.draft !== "boolean"
			) {
				throw new Error(`The draft field must be boolean: ${relative}`);
			}
			posts.push({
				id: getPostId(relative, parsed.data),
				filePath,
				contentPath: relative.replace(/\.(md|mdx)$/, ""),
				data: parsed.data,
				body: parsed.content,
			});
		}
	}
	visit(directory);
	return posts;
}

function sourceTarget(value: string): string | null {
	const target = value
		.replace(/^\.\//, "")
		.replace(/^posts\//, "")
		.replace(/\.(md|mdx)$/, "");
	if (
		!target ||
		target.startsWith("/") ||
		target.includes("\\") ||
		target
			.split("/")
			.some((segment) => !segment || segment === "." || segment === "..")
	)
		return null;
	return target;
}

/** A per-render snapshot: reject identity collisions before selecting public targets. */
export class WikiPostIndex {
	readonly posts: readonly WikiPost[];

	constructor(posts: readonly WikiPost[]) {
		const ids = new Map<string, WikiPost>();
		for (const post of posts) {
			assertSafePostId(post.id);
			const existing = ids.get(post.id);
			if (existing) {
				throw new Error(
					`Duplicate post ID "${post.id}": ${existing.contentPath}, ${post.contentPath}`,
				);
			}
			ids.set(post.id, post);
		}
		this.posts = posts;
	}

	resolve(target: string, production: boolean): WikiResolution {
		const exactId = this.posts.find((post) => post.id === target);
		if (exactId) {
			return isPostVisible(exactId.data, production)
				? { status: "resolved", post: exactId }
				: { status: "hidden" };
		}
		const normalized = sourceTarget(target);
		if (!normalized) return { status: "invalid" };
		const exactPaths = this.posts.filter(
			(post) =>
				post.contentPath === normalized ||
				post.contentPath === `${normalized}/index`,
		);
		if (exactPaths.length) return this.select(exactPaths, production);
		if (normalized.includes("/")) return { status: "missing" };
		return this.select(
			this.posts.filter(
				(post) => path.posix.basename(post.contentPath) === normalized,
			),
			production,
		);
	}

	private select(
		matches: readonly WikiPost[],
		production: boolean,
	): WikiResolution {
		const visible = matches.filter((post) =>
			isPostVisible(post.data, production),
		);
		if (visible.length > 1) return { status: "ambiguous" };
		if (visible.length === 1) return { status: "resolved", post: visible[0] };
		return { status: matches.length ? "hidden" : "missing" };
	}
}
