/** Native contract regressions; production files are checked separately. */
import assert from "node:assert/strict";
import test from "node:test";
import {
	getDeploymentCanonicalUrl,
	getGeneratedOgUrl,
	getLogicalPathname,
	getLogicalRouteUrl,
	getNotFoundPath,
	getPublicAssetUrl,
	isPageInSitemap,
} from "../src/utils/deployment-contract.ts";

const origin = "https://example.test";
const closed = {
	booknav: false,
	friends: false,
	sponsor: false,
	guestbook: false,
	bangumi: false,
	vndb: false,
	mal: false,
	gallery: false,
	bilibili: false,
	dynamic: false,
};

for (const [base, expectedAbout, expectedArchive] of [
	[
		"/",
		"https://example.test/about/",
		"https://example.test/archive/?category=Engineering",
	],
	[
		"/Zhenkun-blog-site/",
		"https://example.test/Zhenkun-blog-site/about/",
		"https://example.test/Zhenkun-blog-site/archive/?category=Engineering",
	],
	[
		"/about/",
		"https://example.test/about/about/",
		"https://example.test/about/archive/?category=Engineering",
	],
	[
		"/archive/",
		"https://example.test/archive/about/",
		"https://example.test/archive/archive/?category=Engineering",
	],
]) {
	test(`${base} logical routes retain their identity when the base name collides`, () => {
		assert.equal(getLogicalRouteUrl("/about/", origin, base), expectedAbout);
		assert.equal(
			getLogicalRouteUrl("/archive/?category=Engineering", origin, base),
			expectedArchive,
		);
		assert.equal(
			getPublicAssetUrl(`${base}favicon/logo.png`, origin, base),
			`${origin}${base}favicon/logo.png`,
		);
	});
}

for (const base of ["/", "/Zhenkun-blog-site/"]) {
	const prefix = base === "/" ? "" : "/Zhenkun-blog-site";
	for (const route of [
		"booknav/",
		"friends/",
		"sponsor/",
		"guestbook/",
		"bangumi/",
		"vndb/",
		"myanimelist/",
		"gallery/",
		"gallery/album/",
		"bilibili/",
		"dynamic/",
		"dynamic/comments/",
		"404/",
		"404.html",
	]) {
		test(`${base} sitemap excludes closed ${route}`, () => {
			assert.equal(
				isPageInSitemap(`${origin}${base}${route}`, base, closed, true),
				false,
			);
		});
	}
	test(`${base} enabled parent admits its child; unrelated routes survive`, () => {
		assert.equal(
			isPageInSitemap(
				`${origin}${base}gallery/album/`,
				base,
				{ ...closed, gallery: true },
				true,
			),
			true,
		);
		for (const route of [
			"",
			"about/",
			"archive/",
			"search/",
			"posts/article/",
			"friendship/",
		]) {
			assert.equal(
				isPageInSitemap(`${origin}${base}${route}`, base, closed, true),
				true,
			);
		}
	});
	test(`${base} comments require both the parent and comment capability`, () => {
		const page = `${origin}${base}dynamic/comments/`;
		assert.equal(
			isPageInSitemap(page, base, { ...closed, dynamic: true }, false),
			false,
		);
		assert.equal(
			isPageInSitemap(page, base, { ...closed, dynamic: true }, true),
			true,
		);
	});
	test(`${base} public images accept one existing base prefix`, () => {
		assert.equal(
			getPublicAssetUrl("/favicon/logo.png", origin, base),
			`${origin}${prefix}/favicon/logo.png`,
		);
		assert.equal(
			getPublicAssetUrl(
				`${prefix}/favicon/logo.png`,
				`${origin}/Zhenkun-blog-site/`,
				base,
			),
			`${origin}${prefix}/favicon/logo.png`,
		);
		for (const remote of [
			"https://cdn.test/image.png",
			"//cdn.test/image.png",
			"data:image/png;base64,AQ==",
		]) {
			assert.equal(getPublicAssetUrl(remote, origin, base), remote);
		}
	});
	test(`${base} OG uses literal encoded identity under the deployment base`, () => {
		assert.equal(
			getGeneratedOgUrl("notes/中文 index.md", origin, base),
			`${origin}${prefix}/og/notes/%E4%B8%AD%E6%96%87%20index.md.png`,
		);
		assert.throws(() => getGeneratedOgUrl("../escape", origin, base));
	});
	test(`${base} canonical strips filter query and fragment without changing the input`, () => {
		for (const route of ["archive/", "search/"]) {
			const page = new URL(`${origin}${base}${route}?q=abc#section`);
			assert.equal(
				getDeploymentCanonicalUrl(page, base),
				`${origin}${base}${route}`,
			);
			assert.equal(page.search, "?q=abc");
			assert.equal(page.hash, "#section");
		}
		assert.equal(
			getDeploymentCanonicalUrl(new URL(`${origin}${base}2/?keep=1`), base),
			`${origin}${base}2/?keep=1`,
		);
	});
	test(`${base} error destination points at the emitted static file`, () => {
		assert.equal(getNotFoundPath(base), `${prefix}/404.html`);
	});
}

test("base stripping is segment aware and strips only once", () => {
	assert.equal(
		getLogicalPathname(
			"/Zhenkun-blog-site/Zhenkun-blog-site/search/",
			"/Zhenkun-blog-site/",
		),
		"/Zhenkun-blog-site/search/",
	);
	assert.equal(
		getLogicalPathname("/Zhenkun-blog-siteger/search/", "/Zhenkun-blog-site/"),
		null,
	);
	assert.equal(
		isPageInSitemap(`${origin}/gallery/`, "/Zhenkun-blog-site/", closed, true),
		false,
	);
	assert.equal(
		getPublicAssetUrl(
			"/Zhenkun-blog-siteger/logo.png",
			origin,
			"/Zhenkun-blog-site/",
		),
		`${origin}/Zhenkun-blog-site/Zhenkun-blog-siteger/logo.png`,
	);
	assert.equal(
		getGeneratedOgUrl("og/article", origin, "/og/"),
		`${origin}/og/og/og/article.png`,
	);
});

test("public asset traversal and unsafe bases fail", () => {
	assert.throws(() =>
		getPublicAssetUrl("/%2e%2e/secret", origin, "/Zhenkun-blog-site/"),
	);
	assert.throws(() => getNotFoundPath("//evil.test/"));
});
