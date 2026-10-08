import { getTranslation } from "../i18n/translation";
import { getLogicalPathname, getPageLocale } from "./deployment-contract";
import { normalizeUiLocale, type UiLocale } from "./locale-contract";
import { correspondingPage } from "./locale-pages";
import { withDeploymentBase } from "./post-contract";

export const LOCALE_PREFERENCE_KEY = "zhenkun-locale";

export function readLocalePreference(
	storage: Pick<Storage, "getItem">,
): UiLocale | null {
	try {
		return normalizeUiLocale(storage.getItem(LOCALE_PREFERENCE_KEY) ?? "");
	} catch {
		return null;
	}
}

export function saveLocalePreference(
	storage: Pick<Storage, "setItem">,
	locale: UiLocale,
): void {
	try {
		storage.setItem(LOCALE_PREFERENCE_KEY, locale);
	} catch {
		// Native anchors still navigate when storage is blocked.
	}
}

let initialized = false;
export function initializeLanguageSwitch(base: string): void {
	if (initialized) return;
	initialized = true;
	const refresh = () => {
		const path = getLogicalPathname(location.pathname, base) ?? "/";
		const locale = getPageLocale(location.pathname, base);
		const text = getTranslation(locale);
		for (const nav of document.querySelectorAll<HTMLElement>(
			"[data-language-switch]",
		)) {
			nav.setAttribute("aria-label", text.uiLanguage);
			for (const target of ["zh_CN", "en"] as const) {
				const link = nav.querySelector<HTMLAnchorElement>(
					`[data-locale-choice="${target}"]`,
				);
				if (!link) continue;
				const manifest = document.querySelector<HTMLElement>(
					"[data-public-locale-paths]",
				);
				const href =
					(target === "zh_CN" ? manifest?.dataset.zh : manifest?.dataset.en) ??
					correspondingPage(path, target)?.path;
				if (href) {
					link.href =
						withDeploymentBase(href, base) + location.search + location.hash;
					link.removeAttribute("aria-disabled");
					link.removeAttribute("aria-describedby");
				} else {
					link.removeAttribute("href");
					link.setAttribute("aria-disabled", "true");
					link.setAttribute("aria-describedby", "locale-missing");
				}
				if (target === locale) link.setAttribute("aria-current", "true");
				else link.removeAttribute("aria-current");
			}
			const target = locale === "en" ? "zh_CN" : "en";
			const unavailable =
				nav
					.querySelector(`[data-locale-choice="${target}"]`)
					?.hasAttribute("aria-disabled") ?? true;
			const notice = nav.querySelector<HTMLElement>("#locale-missing");
			if (notice) {
				notice.textContent =
					target === "en" ? text.uiMissing : text.uiMissingChinese;
				notice.hidden = !unavailable;
			}
			const home = nav.querySelector<HTMLAnchorElement>("[data-locale-home]");
			if (home) {
				home.hidden = !unavailable;
				home.textContent =
					target === "en" ? text.uiEnglishHome : text.uiChineseHome;
				home.href = withDeploymentBase(target === "en" ? "/en/" : "/", base);
			}
		}
		const hint = document.querySelector<HTMLElement>(
			"[data-locale-preference-hint]",
		);
		if (hint) {
			let stored: UiLocale | null = null;
			try {
				stored = readLocalePreference(localStorage);
			} catch {
				/* storage getter can throw */
			}
			hint.hidden = !(path === "/" && stored === "en");
		}
	};
	document.addEventListener("click", (event) => {
		const element = event.target;
		if (!(element instanceof Element)) return;
		const link = element.closest<HTMLAnchorElement>("[data-locale-choice]");
		if (!link) return;
		if (!link.hasAttribute("href")) {
			event.preventDefault();
			return;
		}
		const locale = normalizeUiLocale(link.dataset.localeChoice ?? "");
		if (locale) {
			try {
				saveLocalePreference(localStorage, locale);
			} catch {
				/* keep native navigation */
			}
		}
	});
	// The header persists on same-language Swup visits: update pair availability/hrefs.
	// Stop before Swup or menu handlers consume a link to an untranslated view.
	document.addEventListener(
		"click",
		(event) => {
			if (
				event.button !== 0 ||
				event.ctrlKey ||
				event.metaKey ||
				event.shiftKey ||
				event.altKey
			)
				return;
			if (getPageLocale(location.pathname, base) !== "en") return;
			if (!(event.target instanceof Element)) return;
			const link = event.target.closest<HTMLAnchorElement>("a[href]");
			if (
				!link ||
				link.hasAttribute("data-locale-choice") ||
				link.hasAttribute("data-original-version") ||
				link.target === "_blank" ||
				link.hasAttribute("download")
			)
				return;
			const target = new URL(link.href, location.href);
			if (
				target.origin !== location.origin ||
				target.pathname === location.pathname
			)
				return;
			const logical = getLogicalPathname(target.pathname, base);
			if (
				!logical ||
				getPageLocale(target.pathname, base) === "en" ||
				/\.[a-z0-9]+$/i.test(logical)
			)
				return;
			const dialog = document.querySelector<HTMLDialogElement>(
				"#missing-translation-dialog",
			);
			const original = dialog?.querySelector<HTMLAnchorElement>(
				"[data-original-version]",
			);
			if (!dialog || !original) return;
			event.preventDefault();
			event.stopImmediatePropagation();
			original.href = target.href;
			dialog.showModal();
		},
		true,
	);
	document.addEventListener("astro:page-load", refresh);
	document.addEventListener("swup:contentReplaced", refresh);
	document.addEventListener("DOMContentLoaded", refresh);
	window.addEventListener("popstate", refresh);
	refresh();
}
