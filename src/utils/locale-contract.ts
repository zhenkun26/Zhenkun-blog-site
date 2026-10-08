import { assertSafePostId, isPostVisible } from "./post-contract.ts";

export type UiLocale = "zh_CN" | "en";

export function normalizeUiLocale(value: string): UiLocale | null {
	const code = value.toLowerCase().replaceAll("-", "_");
	if (["zh", "zh_cn", "zh_hans"].includes(code)) return "zh_CN";
	if (["en", "en_us", "en_gb", "en_au"].includes(code)) return "en";
	return null;
}

/** Content metadata, independently of route preferences. Legacy empty values are Chinese. */
export function normalizeContentLocale(value: unknown): UiLocale {
	if (value === undefined || value === "") return "zh_CN";
	if (typeof value !== "string")
		throw new Error("Content language must be a string");
	const locale = normalizeUiLocale(value);
	if (!locale) throw new Error("Unsupported content language");
	return locale;
}

/** Input is a logical route after deployment-base removal. */
export function splitLocalePath(path: string): {
	locale: UiLocale;
	logicalPath: string;
} {
	if (path === "/en" || path === "/en/")
		return { locale: "en", logicalPath: "/" };
	if (path.startsWith("/en/"))
		return { locale: "en", logicalPath: path.slice(3) };
	return { locale: "zh_CN", logicalPath: path };
}
export function localePath(path: string, locale: UiLocale): string {
	if (!path.startsWith("/") || path.startsWith("//"))
		throw new Error("Locale routes must be rooted logical paths");
	return locale === "en" ? `/en${path}` : path;
}
export function htmlLocale(locale: UiLocale): string {
	return locale === "en" ? "en" : "zh-CN";
}
export function assertContentLocale(value: unknown, locale: UiLocale): void {
	if (normalizeContentLocale(value) !== locale)
		throw new Error("Content language does not match its page route");
}
export interface TranslationVariant {
	id: string;
	locale: UiLocale;
	translationKey?: string;
	draft?: boolean;
	private?: boolean;
}
/** Only actual eligible content participates; this cannot approve a draft or private item. */
export function buildTranslationPairs(
	variants: readonly TranslationVariant[],
): Map<string, Partial<Record<UiLocale, TranslationVariant>>> {
	const pairs = new Map<
		string,
		Partial<Record<UiLocale, TranslationVariant>>
	>();
	for (const variant of variants) {
		assertSafePostId(variant.id);
		if (!isPostVisible(variant, true)) continue;
		if (!variant.translationKey) continue;
		assertSafePostId(variant.translationKey);
		const locale = normalizeContentLocale(variant.locale);
		const pair = pairs.get(variant.translationKey) ?? {};
		if (pair[locale]) throw new Error("Duplicate translation language");
		pair[locale] = variant;
		pairs.set(variant.translationKey, pair);
	}
	return pairs;
}
export function sharedCommentId(variant: TranslationVariant): string {
	const id = variant.translationKey || variant.id;
	assertSafePostId(id);
	return id;
}
