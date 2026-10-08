import { getVisiblePosts } from "./content-utils";
import {
	buildTranslationPairs,
	htmlLocale,
	localePath,
	type UiLocale,
} from "./locale-contract";
import { correspondingPage } from "./locale-pages";
import { getPostPath, withDeploymentBase } from "./post-contract";

export type PublicLocalePaths = Partial<Record<UiLocale, string>>;
/** Only eligible source entries can create article alternates. No route rewriting fallback. */
export async function getPublicLocalePaths(
	path: string,
	pageSize = 6,
): Promise<PublicLocalePaths> {
	const paths: PublicLocalePaths = {};
	for (const locale of ["zh_CN", "en"] as const) {
		const page = correspondingPage(path, locale);
		if (page) paths[locale] = page.path;
	}
	if (Object.keys(paths).length) return paths;
	const posts = await getVisiblePosts({ production: true });
	const pagination = /^(\/en)?\/(\d+)\/$/.exec(path);
	if (pagination) {
		const number = Number(pagination[2]);
		for (const locale of ["zh_CN", "en"] as const) {
			if (
				number >= 2 &&
				number <=
					Math.ceil(
						posts.filter((post) => post.data.lang === locale).length / pageSize,
					)
			)
				paths[locale] = localePath(`/${number}/`, locale);
		}
		return paths;
	}
	const variants = posts.map((post) => ({
		id: post.id,
		locale: post.data.lang,
		translationKey: post.data.translationKey,
		draft: post.data.draft,
		private: post.data.private,
	}));
	const current = variants.find(
		(post) => localePath(getPostPath(post.id), post.locale) === path,
	);
	if (!current) return paths;
	paths[current.locale] = path;
	if (current.translationKey) {
		const pair = buildTranslationPairs(variants).get(current.translationKey);
		for (const locale of ["zh_CN", "en"] as const) {
			const variant = pair?.[locale];
			if (variant) paths[locale] = localePath(getPostPath(variant.id), locale);
		}
	}
	return paths;
}
export function getLocaleAlternates(
	paths: PublicLocalePaths,
	site: string | URL,
	base: string,
): { lang: string; href: string }[] {
	const entries = Object.entries(paths) as [UiLocale, string][];
	if (entries.length < 2) return [];
	const alternates = entries.map(([locale, path]) => ({
		lang: htmlLocale(locale),
		href: new URL(withDeploymentBase(path, base), site).toString(),
	}));
	if (paths.zh_CN === "/" && paths.en === "/en/")
		alternates.push({
			lang: "x-default",
			href: new URL(withDeploymentBase("/", base), site).toString(),
		});
	return alternates;
}
