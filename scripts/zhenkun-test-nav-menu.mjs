/** Execute the actual Astro script repeatedly, as Swup does, without DOM packages. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createContext, runInContext } from "node:vm";
import { transformSync } from "esbuild";

const source = readFileSync(
	new URL("../src/components/layout/NavMenuPanel.astro", import.meta.url),
	"utf8",
);
const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, "NavMenuPanel script is present");
const code = transformSync(script, { loader: "ts", format: "iife" }).code;

function fixture() {
	class Element {
		attributes = new Map();
		getAttribute(name) {
			return this.attributes.get(name) ?? null;
		}
		setAttribute(name, value) {
			this.attributes.set(name, value);
		}
	}
	class HTMLElement extends Element {
		inert = true;
	}
	const trigger = new Element();
	const submenu = new HTMLElement();
	const dropdown = new Element();
	dropdown.querySelector = (selector) =>
		selector === "[data-mobile-submenu]" ? submenu : trigger;
	trigger.closest = (selector) =>
		selector === "[data-mobile-dropdown]" ? dropdown : trigger;
	const listeners = new Map();
	const document = {
		addEventListener(name, handler) {
			const list = listeners.get(name) ?? [];
			list.push(handler);
			listeners.set(name, list);
		},
		querySelectorAll(selector) {
			return selector === "[data-mobile-dropdown]" ? [dropdown] : [];
		},
	};
	const context = createContext({
		window: {},
		document,
		Element,
		HTMLElement,
		location: { pathname: "/about/", href: "https://example.test/about/" },
		URL,
	});
	const run = () => runInContext(code, context);
	const click = () => {
		for (const handler of listeners.get("click") ?? []) {
			handler({ target: trigger, preventDefault() {} });
		}
	};
	// An accordion trigger is not a link or close target.
	const closest = trigger.closest;
	trigger.closest = (selector) =>
		selector.startsWith(".mobile-menu-scrim") ? null : closest(selector);
	return { run, click, listeners, dropdown, trigger, submenu };
}

test("repeated SPA script execution installs only one set of document delegates", () => {
	const f = fixture();
	for (let visit = 0; visit < 5; visit++) f.run();
	for (const name of [
		"click",
		"DOMContentLoaded",
		"astro:page-load",
		"swup:contentReplaced",
	]) {
		assert.equal(f.listeners.get(name)?.length, 1, name);
	}
});

test("one accordion click makes exactly one transition after repeated SPA visits", () => {
	const f = fixture();
	for (let visit = 0; visit < 5; visit++) f.run();
	f.click();
	assert.equal(f.dropdown.getAttribute("data-expanded"), "true");
	assert.equal(f.trigger.getAttribute("aria-expanded"), "true");
	assert.equal(f.submenu.inert, false);
	f.click();
	assert.equal(f.dropdown.getAttribute("data-expanded"), "false");
	assert.equal(f.trigger.getAttribute("aria-expanded"), "false");
	assert.equal(f.submenu.inert, true);
});
