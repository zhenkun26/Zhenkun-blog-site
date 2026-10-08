import { slug as githubSlug } from "github-slugger";

function hasControlCharacter(value: string): boolean {
	return Array.from(value).some((character) => {
		const codePoint = character.codePointAt(0) ?? 0;
		return codePoint < 32 || codePoint === 127;
	});
}

/**
 * Production publishes non-drafts; development can preview every article.
 * This controls visibility, not confidentiality or access to source files.
 */
export function isPostVisible(
	data: { draft?: boolean; private?: boolean },
	production = true,
): boolean {
	return !production || (data.draft !== true && data.private !== true);
}

/** Prevent a build from selecting development drafts while preflight checks public posts. */
export function assertProductionBuild(
	command: string,
	nodeEnvironment: string | undefined,
): void {
	if (command === "build" && nodeEnvironment !== "production") {
		throw new Error(
			"Publication builds require NODE_ENV=production. Use dev for draft previews.",
		);
	}
}

/**
 * Reject IDs that cannot be shared unchanged by routes, URLs and Wiki targets.
 * Astro normalizes route parameters to NFC, so reject other Unicode forms
 * rather than silently changing an author's declared identity.
 */
export function assertSafePostId(id: string): void {
	if (typeof id !== "string" || id.length === 0) {
		throw new Error("Post ID must be a nonempty string.");
	}
	if (id !== id.normalize("NFC")) {
		throw new Error("Post ID must use NFC Unicode normalization.");
	}
	if (/[\\%?#:]/.test(id) || hasControlCharacter(id)) {
		throw new Error(
			"Post ID cannot contain backslashes, %, ?, #, colons or control characters.",
		);
	}
	if (
		id
			.split("/")
			.some(
				(segment) =>
					segment.length === 0 ||
					segment === "." ||
					segment === ".." ||
					segment !== segment.trim(),
			)
	) {
		throw new Error(
			"Post ID segments cannot be empty, . or .., or have edge whitespace.",
		);
	}
}

/**
 * Match Astro's glob-loader identity for valid article entries. Truthy explicit
 * slugs stay literal, including /index and .md; unlike Astro's String coercion,
 * non-string declarations fail clearly. Filename IDs slugify each segment and
 * remove only a terminal /index. The entry is relative to the posts directory.
 */
export function getPostId(entry: string, data: { slug?: unknown }): string {
	if (data.slug) {
		if (typeof data.slug !== "string") {
			throw new Error("A truthy article slug must be a string.");
		}
		assertSafePostId(data.slug);
		return data.slug;
	}

	if (entry.includes("\\")) {
		throw new Error("Article entry paths must use forward slashes.");
	}
	const segments = entry.split("/");
	const filename = segments.at(-1) ?? "";
	const extensionStart = filename.lastIndexOf(".");
	// A leading dot alone is not an extension, matching path.extname semantics.
	if (extensionStart > 0) {
		segments[segments.length - 1] = filename.slice(0, extensionStart);
	}
	const id = segments
		.map((segment) => githubSlug(segment))
		.join("/")
		.replace(/\/index$/, "");
	assertSafePostId(id);
	return id;
}

/**
 * Encode the identity once per path segment; never reinterpret it as a filename.
 * Deployment prefixes belong to withDeploymentBase, not to article identity.
 */
export function getPostPath(id: string): string {
	assertSafePostId(id);
	return `/posts/${id.split("/").map(encodeURIComponent).join("/")}/`;
}

/** Reject paths that a browser can reinterpret as authority or traversal. */
function assertRootedPath(value: string): void {
	if (
		!value.startsWith("/") ||
		value.startsWith("//") ||
		value.includes("\\") ||
		hasControlCharacter(value)
	) {
		throw new Error(
			"Internal paths must start with one slash and use safe characters.",
		);
	}
	const pathname = value.split(/[?#]/, 1)[0];
	for (const segment of pathname.split("/")) {
		let decoded: string;
		try {
			decoded = decodeURIComponent(segment);
		} catch {
			throw new Error("Internal paths must use valid percent encoding.");
		}
		if (
			decoded === "." ||
			decoded === ".." ||
			decoded.includes("/") ||
			decoded.includes("\\") ||
			hasControlCharacter(decoded)
		) {
			throw new Error(
				"Internal paths cannot contain traversal or encoded separators.",
			);
		}
	}
}

/**
 * Prefix a logical internal route. Public asset callers can explicitly accept
 * an existing deployment prefix; a logical /posts route can share a base name
 * without being mistaken for an already-prefixed path. Query/fragment stay intact.
 */
export function withDeploymentBase(
	rootedPath: string,
	base: string,
	{ allowExistingBase = false }: { allowExistingBase?: boolean } = {},
): string {
	assertRootedPath(rootedPath);
	assertRootedPath(base);
	if (/[?#:]/.test(base) || base !== base.trim()) {
		throw new Error("Deployment base must be a rooted pathname.");
	}
	const normalizedBase = base.replace(/\/+/g, "/").replace(/\/$/, "");
	const suffixStart = rootedPath.search(/[?#]/);
	const pathname =
		suffixStart < 0 ? rootedPath : rootedPath.slice(0, suffixStart);
	const suffix = suffixStart < 0 ? "" : rootedPath.slice(suffixStart);
	if (
		!normalizedBase ||
		(allowExistingBase &&
			(pathname === normalizedBase ||
				pathname.startsWith(`${normalizedBase}/`)))
	) {
		return rootedPath;
	}
	return `${normalizedBase}${pathname}${suffix}`;
}
