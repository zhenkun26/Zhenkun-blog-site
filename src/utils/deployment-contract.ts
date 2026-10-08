import type { SiteConfig } from "../types/siteConfig";
import { splitLocalePath, type UiLocale } from "./locale-contract.ts";
import { getLocalePage } from "./locale-pages.ts";
import { assertSafePostId, withDeploymentBase } from "./post-contract.ts";

/** Strip only the configured leading base, never a matching route segment. */
export function getLogicalPathname(
	pathname: string,
	base: string,
): string | null {
	const prefix = withDeploymentBase("/", base).replace(/\/$/, "");
	if (!prefix) return pathname;
	if (pathname === prefix) return "/";
	return pathname.startsWith(`${prefix}/`)
		? pathname.slice(prefix.length)
		: null;
}

/** Logical routes always receive the base, even when a route shares its name. */
export function getLogicalRouteUrl(
	pathname: string,
	site: URL | string,
	base: string,
): string {
	return new URL(withDeploymentBase(pathname, base), site).toString();
}

/** Public assets can already include the base; emitted Astro assets need no prefix. */
export function getPublicAssetUrl(
	src: string,
	site: URL | string,
	base: string,
): string {
	if (/^(https?:\/\/|\/\/|data:)/.test(src)) return src;
	return new URL(
		withDeploymentBase(src, base, { allowExistingBase: true }),
		site,
	).toString();
}

export function getGeneratedOgUrl(
	id: string,
	site: URL | string,
	base: string,
): string {
	assertSafePostId(id);
	const encodedId = id.split("/").map(encodeURIComponent).join("/");
	return new URL(
		withDeploymentBase(`/og/${encodedId}.png`, base),
		site,
	).toString();
}

export function getDeploymentCanonicalUrl(page: URL, base: string): string {
	const logicalPath = getLogicalPathname(page.pathname, base);
	const route = logicalPath ? splitLocalePath(logicalPath).logicalPath : null;
	if (
		route === "/archive/" ||
		route === "/search/" ||
		(logicalPath !== null && getLocalePage(logicalPath))
	) {
		const canonical = new URL(page);
		canonical.search = "";
		canonical.hash = "";
		return canonical.toString();
	}
	return page.toString();
}

export function getPageLocale(pathname: string, base: string): UiLocale {
	return splitLocalePath(getLogicalPathname(pathname, base) ?? "/").locale;
}

/** Optional page descendants share their parent's existing switch. */
export function isPageInSitemap(
	page: string,
	base: string,
	pages: SiteConfig["pages"],
	dynamicCommentsEnabled: boolean,
): boolean {
	const deployed = getLogicalPathname(new URL(page).pathname, base);
	if (deployed === null) return false;
	const { locale, logicalPath: pathname } = splitLocalePath(deployed);
	if (pathname === "/404/" || pathname === "/404.html") {
		return false;
	}
	// English routes must be a real approved view, not a prefix-shaped phantom.
	if (
		locale === "en" &&
		!getLocalePage(deployed) &&
		!/^\/(posts\/[^/].*|[2-9]\d*\/)$/.test(pathname)
	)
		return false;
	const root = pathname.split("/")[1];
	const key = root === "myanimelist" ? "mal" : root;
	if (Object.hasOwn(pages, key) && !pages[key as keyof SiteConfig["pages"]]) {
		return false;
	}
	return pathname !== "/dynamic/comments/" || dynamicCommentsEnabled;
}

/** Static Astro emits 404.html even when normal routes use trailing slashes. */
export function getNotFoundPath(base: string): string {
	return withDeploymentBase("/404.html", base);
}
