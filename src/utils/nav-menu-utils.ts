import { navBarConfig, siteConfig } from "@/config";
import type { NavBarLink } from "@/types/navBarConfig";
import { resolveNavbarLinks } from "@/utils/navbar-i18n";
import { getTranslation } from "../i18n/translation";
import type { UiLocale } from "./locale-contract";
import { correspondingPage } from "./locale-pages";

/** 解析导航栏链接：按 siteConfig.pages 过滤 + i18n 名称解析。Navbar 与 NavMenuPanel 共用。 */
export function resolveNavMenuLinks(locale?: UiLocale): NavBarLink[] {
	const pages = siteConfig.pages;

	function isPageEnabled(link: NavBarLink): boolean {
		if (!link.pageKey) return true;
		return pages[link.pageKey as keyof typeof pages] !== false;
	}

	function filterLinks(link: NavBarLink): NavBarLink | null {
		if (!link.children) {
			return isPageEnabled(link) ? link : null;
		}

		const filteredChildren = link.children.filter(isPageEnabled);

		if (filteredChildren.length === 0) return null;
		if (filteredChildren.length === 1) return filteredChildren[0];
		return { ...link, children: filteredChildren };
	}

	const links = resolveNavbarLinks(
		navBarConfig.links
			.map(filterLinks)
			.filter((link): link is NavBarLink => link !== null),
		locale,
	);
	if (locale !== "en") return links;
	const localize = (link: NavBarLink): NavBarLink => {
		if (link.children)
			return { ...link, children: link.children.map(localize) };
		if (link.external) return link;
		const target = correspondingPage(link.url, "en");
		return target
			? { ...link, url: target.path }
			: { ...link, name: `${link.name} (${getTranslation("en").uiMissing})` };
	};
	return links.map(localize);
}
