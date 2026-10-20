import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

// The optional baseline is only for an explicit diagnostic subprocess; normal CI
// always resolves the real frozen installation from this repository.
const require = createRequire(
	process.env.ZHENKUN_ASTRO_RENDER_BASELINE
		? join(resolve(process.env.ZHENKUN_ASTRO_RENDER_BASELINE), "package.json")
		: import.meta.url,
);
const dist = dirname(require.resolve("astro"));
const { jsx } = await import(pathToFileURL(join(dist, "jsx-runtime/index.js")));
const { renderJSX } = await import(
	pathToFileURL(join(dist, "runtime/server/jsx.js"))
);
const { markHTMLString } = await import(
	pathToFileURL(join(dist, "runtime/server/index.js"))
);
const { stringifyAnimations } = await import(
	pathToFileURL(join(dist, "runtime/server/transition.js"))
);

for (const tag of ["script", "style"]) {
	test(`GHSA-98hj dynamic ${tag} children cannot close their element`, async () => {
		const value = `</${tag}><img src=x onerror=alert(1)>`;
		for (const children of [value, [value, "ordinary & text"]]) {
			const html = String(await renderJSX({}, jsx(tag, { children })));
			assert.equal((html.match(new RegExp(`</${tag}>`, "g")) ?? []).length, 1);
			assert.ok(
				html.includes(`&lt;/${tag}&gt;`) ||
					(tag === "style" && html.includes("\\3C /style>")),
			);
			assert.ok(!html.includes("<img"));
		}
	});
	test(`GHSA-98hj trusted literal ${tag} content retains executable syntax`, async () => {
		const literal =
			tag === "script" ? "if (a < b) run();" : "p > a { color: red; }";
		assert.equal(
			String(
				await renderJSX({}, jsx(tag, { children: markHTMLString(literal) })),
			),
			`<${tag}>${literal}</${tag}>`,
		);
	});
}
for (const prop of [
	"duration",
	"delay",
	"easing",
	"direction",
	"fillMode",
	"name",
]) {
	test(`GHSA-mpr7 ${prop} cannot escape its CSS declaration`, () => {
		const payload = "1ms;}#target{color:red}x{animation-duration:1ms";
		const css = stringifyAnimations([{ name: "safe", [prop]: payload }]);
		assert.ok(!css.includes("#target{color:red}"));
		assert.ok(css.includes("\\3B "));
		assert.ok(css.includes("\\7B "));
		assert.ok(css.includes("\\7D "));
	});
}
test("GHSA-mpr7 normal CSS functions, names and numeric durations remain compatible", () => {
	const css = stringifyAnimations([
		{
			name: "slide",
			duration: 100,
			delay: "calc(1ms + var(--delay))",
			easing: "cubic-bezier(0, 0, 1, 1)",
		},
	]);
	assert.ok(css.includes("animation-duration: 100ms;"));
	assert.ok(css.includes("animation-delay: calc(1ms + var(--delay));"));
	assert.ok(
		css.includes("animation-timing-function: cubic-bezier(0, 0, 1, 1);"),
	);
	assert.ok(css.includes("animation-name: slide;"));
});
