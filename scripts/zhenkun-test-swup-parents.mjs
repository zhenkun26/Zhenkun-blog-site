import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootRequire = createRequire(import.meta.url);
const astroRequire = createRequire(rootRequire.resolve("@swup/astro"));
const parentNames = ["@swup/parallel-plugin", "@swup/route-name-plugin"];
const parents = parentNames.map((name) => {
	const cjs = astroRequire.resolve(name);
	const dir = dirname(dirname(cjs));
	const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
	const require = createRequire(cjs);
	const basePath = require.resolve("@swup/plugin");
	const baseManifest = JSON.parse(
		readFileSync(join(dirname(dirname(basePath)), "package.json"), "utf8"),
	);
	return { name, cjs, dir, manifest, require, basePath, baseManifest };
});

// A bounded DOM stand-in isolates the real published Swup hook/plugin APIs.
// Browser navigation and actual DOM rendering are separate acceptance gates.
class ElementFixture {
	constructor(id, nodes) {
		this.id = id;
		this.nodes = nodes;
		this.classes = new Set();
		this.attributes = new Map();
		this.properties = new Map();
		this.classList = {
			add: (...values) =>
				values.forEach((v) => {
					this.classes.add(v);
				}),
			remove: (...values) =>
				values.forEach((v) => {
					this.classes.delete(v);
				}),
			contains: (value) => this.classes.has(value),
		};
		this.style = { setProperty: (k, v) => this.properties.set(k, v) };
	}
	get className() {
		return [...this.classes].join(" ");
	}
	matches(selectors) {
		return selectors.split(",").includes(`#${this.id}`);
	}
	setAttribute(k, v) {
		this.attributes.set(k, v);
	}
	before(next) {
		next.nodes = this.nodes;
		this.nodes.splice(this.nodes.indexOf(this), 0, next);
	}
	remove() {
		this.nodes.splice(this.nodes.indexOf(this), 1);
	}
}

function domFixture() {
	const nodes = [];
	const html = new ElementFixture("html", nodes);
	const events = [];
	globalThis.document = {
		baseURI: "https://fixture.invalid/",
		documentElement: html,
		querySelector: (s) => nodes.find((el) => el.matches(s)) ?? null,
		querySelectorAll: (s) => nodes.filter((el) => el.matches(s)),
		dispatchEvent: (event) => events.push(event.type),
	};
	globalThis.window = {
		location: new URL(document.baseURI),
		history: {
			state: { source: "swup", index: 1 },
			replaceState(state) {
				this.state = state;
			},
		},
	};
	return { nodes, html, events };
}

for (const format of ["ESM", "CJS"]) {
	for (const parent of parents) {
		test(`${format}: ${parent.name} resolves exact cross-major base and requirements`, async () => {
			domFixture();
			assert.equal(parent.manifest.dependencies["@swup/plugin"], "^3.0.0");
			assert.equal(parent.baseManifest.version, "4.0.0");
			const Parent =
				format === "ESM"
					? (
							await import(
								pathToFileURL(
									join(parent.dir, parent.manifest.exports["."].import),
								).href
							)
						).default
					: parent.require(parent.cjs);
			const Base =
				format === "ESM"
					? (
							await import(
								pathToFileURL(
									join(
										dirname(dirname(parent.basePath)),
										parent.baseManifest.exports["."].import,
									),
								).href
							)
						).default
					: parent.require("@swup/plugin");
			const plugin = new Parent();
			assert.ok(plugin instanceof Base);
			plugin.swup = { version: "4.9.2", findPlugin: () => undefined };
			assert.equal(plugin._checkRequirements(), true);
			plugin.swup.version = "3.9.9";
			assert.throws(
				() => plugin._checkRequirements(),
				/Plugin version mismatch/,
			);
			plugin.swup.version = "4.5.9";
			if (parent.name.includes("parallel")) {
				assert.throws(() => plugin._checkRequirements(), /requires swup >=4.6/);
			} else assert.equal(plugin._checkRequirements(), true);
			plugin.requires = { FixtureDependency: [">=2", "<3"] };
			plugin.swup.findPlugin = () => ({ version: "2.5.0" });
			assert.equal(plugin._checkRequirements(), true);
			plugin.swup.findPlugin = () => ({ version: "3.0.0" });
			assert.throws(() => plugin._checkRequirements(), /version mismatch/);
			plugin.swup.findPlugin = () => undefined;
			assert.throws(() => plugin._checkRequirements(), /version mismatch/);
		});
	}

	test(`${format}: actual Swup hooks mount/unmount twice, route naming and classes`, async () => {
		const f = domFixture();
		const parent = parents[1];
		const module = await import(
			pathToFileURL(join(parent.dir, parent.manifest.exports["."].import)).href
		);
		const Parent =
			format === "ESM" ? module.default : parent.require(parent.cjs);
		const Swup =
			format === "ESM"
				? (
						await import(
							pathToFileURL(
								parent.require
									.resolve("swup")
									.replace("Swup.cjs", "Swup.modern.js"),
							).href
						)
					).default
				: parent.require("swup").default;
		class IsolatedSwup extends Swup {
			enable() {}
		}
		const swup = new IsolatedSwup({ containers: ["#swup"] });
		const plugin = new Parent({
			routes: [
				{ name: "Home !", path: "/" },
				{ name: "About", path: "/about/:slug?" },
			],
			paths: true,
		});
		const count = () =>
			[...swup.hooks.registry.values()].reduce(
				(n, ledger) => n + ledger.size,
				0,
			);
		for (let i = 0; i < 2; i++) {
			swup.use(plugin);
			assert.equal(count(), 5);
			assert.equal(swup.visit.to.route, "Home");
			assert.equal(window.history.state.route, "Home");
			assert.equal(plugin.getRouteName("/about/example"), "About");
			assert.equal(plugin.getRouteName("/missing"), undefined);
			const visit = swup.createVisit({ from: "/", to: "/about/" });
			await swup.hooks.call("visit:start", visit, undefined);
			assert.equal(visit.from.route, "Home");
			assert.equal(visit.to.route, "About");
			await swup.hooks.call("animation:out:start", visit, undefined);
			assert.ok(f.html.classList.contains("from-route-Home"));
			assert.ok(f.html.classList.contains("to-route-About"));
			await swup.hooks.call("content:replace", visit, { page: {} });
			assert.equal(window.history.state.route, "About");
			await swup.hooks.call("animation:in:end", visit, undefined);
			assert.ok(!f.html.classList.contains("from-route-Home"));
			swup.unuse(plugin);
			assert.equal(count(), 0);
			assert.equal(plugin.handlersToUnregister.length, 0);
			const detached = swup.createVisit({ from: "/", to: "/about/" });
			await swup.hooks.call("visit:start", detached, undefined);
			assert.equal(detached.to.route, undefined);
		}
		assert.ok(f.events.includes("swup:visit:start"));
	});

	test(`${format}: parallel visit marking, insertion, restoration, cleanup and disabled visit`, async () => {
		const f = domFixture();
		const parent = parents[0];
		const Parent =
			format === "ESM"
				? (
						await import(
							pathToFileURL(
								join(parent.dir, parent.manifest.exports["."].import),
							).href
						)
					).default
				: parent.require(parent.cjs);
		const Swup =
			format === "ESM"
				? (
						await import(
							pathToFileURL(
								parent.require
									.resolve("swup")
									.replace("Swup.cjs", "Swup.modern.js"),
							).href
						)
					).default
				: parent.require("swup").default;
		class IsolatedSwup extends Swup {
			enable() {}
		}
		const swup = new IsolatedSwup({ containers: ["#swup", "#other"] });
		const plugin = new Parent({ containers: ["#swup"] });
		const count = () =>
			[...swup.hooks.registry.values()].reduce(
				(n, ledger) => n + ledger.size,
				0,
			);
		for (let i = 0; i < 2; i++) {
			const previous = new ElementFixture("swup", f.nodes);
			f.nodes.push(previous);
			const next = new ElementFixture("swup", []);
			swup.use(plugin);
			assert.equal(count(), 5);
			assert.ok(swup.hooks.exists("content:insert"));
			const visit = swup.createVisit({ to: "/next" });
			visit.animation.animate = false;
			visit.to.document = { querySelector: () => next };
			swup.visit = visit;
			await swup.hooks.call("visit:start", visit, undefined);
			assert.equal(visit.animation.parallel, true);
			assert.equal(visit.animation.wait, true);
			const args = { skip: false };
			await swup.hooks.call("animation:out:await", visit, args);
			assert.equal(args.skip, true);
			await swup.hooks.call("content:replace", visit, { page: {} }, () => {
				assert.deepEqual(visit.containers, ["#other"]);
			});
			assert.deepEqual(visit.containers, ["#swup", "#other"]);
			assert.equal(previous.attributes.get("aria-hidden"), "true");
			assert.ok(previous.classList.contains("is-previous-container"));
			await swup.hooks.call("visit:end", visit, undefined);
			assert.ok(!f.nodes.includes(previous));
			assert.ok(f.nodes.includes(next));
			assert.deepEqual(plugin.parallelContainers, []);
			const disabled = swup.createVisit({ to: "/disabled" });
			disabled.animation.parallel = false;
			await swup.hooks.call("visit:start", disabled, undefined);
			assert.equal(disabled.animation.parallel, false);
			const skip = { skip: false };
			await swup.hooks.call("animation:out:await", disabled, skip);
			assert.equal(skip.skip, false);
			swup.unuse(plugin);
			assert.equal(count(), 0);
			assert.equal(plugin.handlersToUnregister.length, 0);
			next.remove();
		}
	});
}
