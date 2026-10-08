import { siteConfig } from "../config";
import type { UiLocale } from "../utils/locale-contract";
import { normalizeUiLocale } from "../utils/locale-contract";
import type I18nKey from "./i18nKey";
import { en } from "./languages/en";
import { ja } from "./languages/ja";
import { ko } from "./languages/ko";
import { ru } from "./languages/ru";
import { zh_CN } from "./languages/zh_CN";
import { zh_TW } from "./languages/zh_TW";

export type Translation = {
	[K in I18nKey]: string;
};

const defaultTranslation = en;

const map: { [key: string]: Translation } = {
	en: en,
	en_us: en,
	en_gb: en,
	en_au: en,
	zh_cn: zh_CN,
	zh_tw: zh_TW,
	ja: ja,
	ja_jp: ja,
	ru: ru,
	ru_ru: ru,
	ko: ko,
	ko_kr: ko,
};

export function getTranslation(lang: string): Translation {
	return map[lang.toLowerCase()] || defaultTranslation;
}

export function i18n(key: I18nKey, locale?: UiLocale): string {
	const lang = locale || siteConfig.lang || "en";
	const currentLang = getTranslation(lang);
	const value = currentLang[key];
	// Explicit page UI must never silently change language for a missing key.
	if (locale && !value) {
		return locale === "en" ? "Translation unavailable" : "暂无翻译";
	}

	// 如果当前语言没有翻译（或为空），则使用中文作为备选
	if (!value && lang.toLowerCase() !== "zh_cn") {
		const chineseValue = zh_CN[key];
		if (chineseValue) {
			return chineseValue;
		}
	}

	return value || defaultTranslation[key];
}

/** Explicit render/client locale; never mutates build-wide configuration. */
export function createTranslator(locale: UiLocale): (key: I18nKey) => string {
	return (key: I18nKey): string => i18n(key, locale);
}

/** Client controls read the active document, including after a same-language visit. */
export function documentI18n(key: I18nKey): string {
	const locale =
		typeof document === "undefined"
			? null
			: normalizeUiLocale(document.documentElement.lang);
	return i18n(key, locale ?? "zh_CN");
}
