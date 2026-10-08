import { htmlLocale, type UiLocale } from "./locale-contract.ts";
import { withDeploymentBase } from "./post-contract.ts";

/** Views implemented by the same component on both routes. */
export const localePages = [
	{ pairId: "home", locale: "zh_CN", path: "/" },
	{ pairId: "home", locale: "en", path: "/en/" },
	{ pairId: "about", locale: "zh_CN", path: "/about/" },
	{ pairId: "about", locale: "en", path: "/en/about/" },
	{ pairId: "archive", locale: "zh_CN", path: "/archive/" },
	{ pairId: "archive", locale: "en", path: "/en/archive/" },
	{ pairId: "categories", locale: "zh_CN", path: "/categories/" },
	{ pairId: "categories", locale: "en", path: "/en/categories/" },
	{ pairId: "tags", locale: "zh_CN", path: "/tags/" },
	{ pairId: "tags", locale: "en", path: "/en/tags/" },
	{ pairId: "series", locale: "zh_CN", path: "/series/" },
	{ pairId: "series", locale: "en", path: "/en/series/" },
	{ pairId: "search", locale: "zh_CN", path: "/search/" },
	{ pairId: "search", locale: "en", path: "/en/search/" },
	{ pairId: "rss", locale: "zh_CN", path: "/rss/" },
	{ pairId: "rss", locale: "en", path: "/en/rss/" },
] as const;

export type LocalePage = (typeof localePages)[number];

export function getLocalePage(path: string): LocalePage | undefined {
	return localePages.find((page) => page.path === path);
}

export function correspondingPage(
	path: string,
	locale: UiLocale,
): LocalePage | undefined {
	const page = getLocalePage(path);
	return page
		? localePages.find(
				(target) => target.pairId === page.pairId && target.locale === locale,
			)
		: undefined;
}

export function approvedAlternates(
	path: string,
	site: string | URL,
	base: string,
): { lang: string; href: string }[] {
	const page = getLocalePage(path);
	if (!page) return [];
	const pair = localePages.filter((target) => target.pairId === page.pairId);
	if (pair.length < 2) return [];
	return pair.map((target) => ({
		lang: htmlLocale(target.locale),
		href: new URL(withDeploymentBase(target.path, base), site).toString(),
	}));
}

/** Fallback keeps the actual Chinese route; callers label/mark cross-language links. */
export function localizedNavigationPath(
	path: string,
	locale: UiLocale,
): string {
	return correspondingPage(path, locale)?.path ?? path;
}

export const ENGLISH_BIO =
	"Exploring the intersection of meteorology, AI, and computer science, and sharing what I learn, build, and experience.";
