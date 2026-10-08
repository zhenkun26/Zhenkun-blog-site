/** Locale contracts use real helpers; no route/content/config mutations. */
import assert from "node:assert/strict";
import "./zhenkun-native-locale-loader.mjs";
import test from "node:test";

const { default: I18nKey } = await import("../src/i18n/i18nKey.ts");
const { en } = await import("../src/i18n/languages/en.ts");
const { zh_CN } = await import("../src/i18n/languages/zh_CN.ts");
const {
	getDeploymentCanonicalUrl,
	getLogicalRouteUrl,
	getPageLocale,
	isPageInSitemap,
} = await import("../src/utils/deployment-contract.ts");
const {
	buildTranslationPairs,
	normalizeContentLocale,
assertContentLocale,
	normalizeUiLocale,
	sharedCommentId,
	splitLocalePath,
} = await import("../src/utils/locale-contract.ts");
const {
	approvedAlternates,
	correspondingPage,
	localePages,
	localizedNavigationPath,
} = await import("../src/utils/locale-pages.ts");
const { LOCALE_PREFERENCE_KEY, readLocalePreference, saveLocalePreference } =
	await import("../src/utils/locale-preference.ts");

const { i18n, createTranslator, documentI18n } = await import(
	"../src/i18n/translation.ts"
);

for (const base of ["/", "/Zhenkun-blog-site/", "/en/", "/about/"]) {
	test(`${base}: two locale layers follow one deployment prefix`, () => {
		for (const page of localePages) {
			const deployed = getLogicalRouteUrl(
				page.path,
				"https://example.test/Zhenkun-blog-site/",
				base,
			);
			assert.equal(
				new URL(deployed).pathname,
				`${base.replace(/\/$/, "")}${page.path}`,
			);
			assert.equal(
				getPageLocale(new URL(deployed).pathname, base),
				page.locale,
			);
			const canonical = getDeploymentCanonicalUrl(
				new URL(`${deployed}?q=secret#fragment`),
				base,
			);
			assert.equal(canonical, deployed);
			assert.equal(isPageInSitemap(deployed, base, {}, false), true);
			const alternates = approvedAlternates(
				page.path,
				"https://example.test/Zhenkun-blog-site/",
				base,
			);
			assert.equal(alternates.length, 2);
			for (const alternative of alternates)
				assert.equal(
					getDeploymentCanonicalUrl(new URL(alternative.href), base),
					alternative.href,
				);
		}
		for (const path of ["/en/gallery/", "/en/gallery/example/", "/en/404.html"])
			assert.equal(
				isPageInSitemap(
					getLogicalRouteUrl(path, "https://example.test", base),
					base,
					{},
					true,
				),
				false,
			);
		assert.equal(
			getDeploymentCanonicalUrl(
				new URL(
					getLogicalRouteUrl("/en/search/?q=x#y", "https://example.test", base),
				),
				base,
			),
			getLogicalRouteUrl("/en/search/", "https://example.test", base),
		);
	});
}
test("approved pairs are reciprocal and unavailable pages stay honest", () => {
	for (const page of localePages)
		for (const locale of ["zh_CN", "en"]) {
			const paired = correspondingPage(page.path, locale);
			assert.equal(paired.pairId, page.pairId);
			assert.equal(correspondingPage(paired.path, page.locale).path, page.path);
		}
	assert.equal(correspondingPage("/posts/untranslated/", "en"), undefined);
	assert.deepEqual(
		approvedAlternates("/posts/untranslated/", "https://example.test", "/"),
		[],
	);
	assert.equal(localizedNavigationPath("/archive/", "en"), "/en/archive/");
	assert.equal(localizedNavigationPath("/about/", "en"), "/en/about/");
});
test("locale parsing respects segment boundaries and supported aliases", () => {
	assert.deepEqual(splitLocalePath("/english/"), {
		locale: "zh_CN",
		logicalPath: "/english/",
	});
	assert.deepEqual(splitLocalePath("/en/about/"), {
		locale: "en",
		logicalPath: "/about/",
	});
	assert.equal(normalizeUiLocale("en-US"), "en");
	assert.equal(normalizeUiLocale("zh-CN"), "zh_CN");
	assert.equal(normalizeUiLocale("fr"), null);
});
test("explicit UI translators cover both catalogs without changing the global default", () => {
	for (const key of Object.values(I18nKey)) {
		assert.equal(
			createTranslator("en")(key),
			en[key] || "Translation unavailable",
		);
		assert.equal(createTranslator("zh_CN")(key), zh_CN[key]);
	}
	assert.equal(i18n(I18nKey.home), zh_CN[I18nKey.home]);
	const previous = en[I18nKey.home];
	try {
		en[I18nKey.home] = "";
		assert.equal(
			createTranslator("en")(I18nKey.home),
			"Translation unavailable",
		);
		assert.notEqual(createTranslator("en")(I18nKey.home), zh_CN[I18nKey.home]);
	} finally {
		en[I18nKey.home] = previous;
	}
	assert.equal(/\p{Script=Han}/u.test(Object.values(en).join(" ")), false);
});
test("preferences default to Chinese routing and survive blocked storage", () => {
	assert.equal(readLocalePreference({ getItem: () => null }), null);
	assert.equal(readLocalePreference({ getItem: () => "en" }), "en");
	assert.equal(readLocalePreference({ getItem: () => "malformed" }), null);
	assert.equal(
		readLocalePreference({
			getItem() {
				throw Error("blocked");
			},
		}),
		null,
	);
	let saved;
	saveLocalePreference(
		{
			setItem: (key, value) => {
				saved = [key, value];
			},
		},
		"en",
	);
	assert.deepEqual(saved, [LOCALE_PREFERENCE_KEY, "en"]);
	assert.doesNotThrow(() =>
		saveLocalePreference(
			{
				setItem() {
					throw Error("blocked");
				},
			},
			"en",
		),
	);
});
test("client controls use the actual document language rather than global config", () => {
	const previous = globalThis.document;
	try {
		globalThis.document = { documentElement: { lang: "en" } };
		assert.equal(documentI18n(I18nKey.tocEmpty), en[I18nKey.tocEmpty]);
		globalThis.document.documentElement.lang = "zh-CN";
		assert.equal(documentI18n(I18nKey.tocEmpty), zh_CN[I18nKey.tocEmpty]);
	} finally {
		if (previous === undefined) delete globalThis.document;
		else globalThis.document = previous;
	}
});
test("translation and shared comment identity never qualify private/draft/unapproved variants", () => {
	const variants = [
		{
			id: "notes/original",
			translationKey: "notes/original",
			locale: "zh_CN",
		},
		{
			id: "translated/title",
			translationKey: "notes/original",
			locale: "en",
		},
		{
			id: "draft",
			translationKey: "hidden",
			locale: "en",
			draft: true,
		},
		{
			id: "private",
			translationKey: "hidden",
			locale: "zh_CN",
			private: true,
		},
		{ id: "unpaired", locale: "en" },
	];
	const pairs = buildTranslationPairs(variants);
	assert.equal(pairs.size, 1);
	assert.equal(
		sharedCommentId(pairs.get("notes/original").en),
		sharedCommentId(pairs.get("notes/original").zh_CN),
	);
	assert.throws(
		() => buildTranslationPairs([...variants, variants[1]]),
		/Duplicate/,
	);
	assert.throws(() =>
		sharedCommentId({ ...variants[0], translationKey: "../unsafe" }),
	);
});

test("document locales reject unsupported metadata and default legacy content to Chinese", () => {
	for (const value of [undefined, "", "zh-CN", "zh_CN"])
		assert.equal(normalizeContentLocale(value), "zh_CN");
	for (const value of ["en", "en-US"])
		assert.equal(normalizeContentLocale(value), "en");
	for (const value of [null, 3, [], "fr", "en_unknown"])
		assert.throws(() => normalizeContentLocale(value));
});

test("an English spec must declare its body locale; hidden pairs cannot approve publication", () => {
 assert.throws(() => assertContentLocale(undefined,"en"), /does not match/);
 assert.doesNotThrow(() => assertContentLocale("en-US","en"));
 assert.throws(() => buildTranslationPairs([{id:"../unsafe",locale:"en",translationKey:"k"}]));
 assert.throws(() => buildTranslationPairs([{id:"safe",locale:"en",translationKey:"../unsafe"}]));
 assert.equal(buildTranslationPairs([{id:"zh",locale:"zh_CN",translationKey:"k"},{id:"en",locale:"en",translationKey:"k",private:true}]).get("k").en,undefined);
});

test("CI build identifiers do not exempt ordinary or extended UI text", async () => {
	const { unexpectedLanguage } = await import(
		"./zhenkun-audit-locale-html.mjs"
	);
	for (const value of ["GitHub Actions", "Linux / x86_64"]) {
		assert.equal(unexpectedLanguage(value, "zh_CN", false, false, true), false);
		assert.equal(unexpectedLanguage(value, "zh_CN"), true);
		assert.equal(
			unexpectedLanguage(value + " Welcome", "zh_CN", false, false, true),
			true,
		);
	}
	assert.equal(unexpectedLanguage("欢迎", "en", false, false, true), true);
	assert.equal(
		unexpectedLanguage("Play music", "zh_CN", false, false, true),
		true,
	);
});
