import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { pluginCollapsible } from "expressive-code-collapsible";
import { pluginCollapsibleWithLifecycle } from "../src/plugins/expressive-code-lifecycle.ts";

// Execute the installed client module with a deterministic clock, including its
// actual binding code. Browser gates separately exercise real DOM and clicks.
function harness(source) {
	let now = 0,
		next = 0,
		scans = 0,
		observer;
	const timers = new Map(),
		buttons = [];
	const context = vm.createContext({
		window: {},
		document: {
			readyState: "complete",
			body: {},
			querySelectorAll() {
				scans++;
				return buttons;
			},
		},
		MutationObserver: class {
			constructor(callback) {
				observer = callback;
			}
			observe() {}
		},
		setTimeout(fn, delay) {
			const id = ++next;
			timers.set(id, { fn, due: now + delay });
			return id;
		},
		clearTimeout(id) {
			timers.delete(id);
		},
	});
	vm.runInContext(source, context);
	return {
		add() {
			const handlers = [];
			const button = {
				dataset: {},
				closest() {
					return { dataset: { heightInit: "true" } };
				},
				addEventListener(...args) {
					handlers.push(args);
				},
			};
			buttons.push(button);
			return { button, handlers };
		},
		mutation(relevant) {
			observer([
				{
					addedNodes: [
						{
							nodeType: relevant ? 1 : 3,
							matches() {
								return relevant;
							},
							querySelector() {
								return null;
							},
						},
					],
				},
			]);
		},
		advance(ms) {
			now += ms;
			for (const [id, t] of timers)
				if (t.due <= now) {
					timers.delete(id);
					t.fn();
				}
		},
		scans: () => scans,
	};
}

test("original observer counterexample: unrelated text changes postpone post-Swup binding", () => {
	const h = harness(pluginCollapsible().jsModules[0]);
	const control = h.add();
	h.mutation(true);
	for (let n = 0; n < 40; n++) {
		h.advance(50);
		h.mutation(false);
	}
	assert.equal(control.handlers.length, 0);
	h.advance(100);
	assert.equal(control.handlers.length, 1);
});
test("narrow observer binds each inserted control once despite continuous text mutations", () => {
	const h = harness(pluginCollapsibleWithLifecycle().jsModules[0]);
	for (let page = 0; page < 4; page++) {
		const control = h.add();
		h.mutation(true);
		assert.equal(control.handlers.length, 1);
		const scans = h.scans();
		for (let n = 0; n < 40; n++) {
			h.advance(50);
			h.mutation(false);
		}
		assert.equal(
			h.scans(),
			scans,
			"unrelated mutations must not scan code controls",
		);
		h.mutation(true);
		assert.equal(
			control.handlers.length,
			1,
			"original init guard retains listener uniqueness",
		);
	}
});
test("adapter preserves original plugin hooks, CSS and client toggle implementation", () => {
	const original = pluginCollapsible(),
		adapted = pluginCollapsibleWithLifecycle();
	assert.deepEqual(Object.keys(adapted), Object.keys(original));
	for (const key of Object.keys(original))
		if (key !== "jsModules") {
			if (key === "hooks")
				for (const hook of Object.keys(original.hooks))
					assert.equal(
						String(adapted.hooks[hook]),
						String(original.hooks[hook]),
					);
			else assert.deepEqual(adapted[key], original[key]);
		}
	assert.equal(
		adapted.jsModules[0]
			.split("// Debounced MutationObserver")[0]
			.split("// Text animations elsewhere")[0],
		original.jsModules[0].split("// Debounced MutationObserver")[0],
	);
});
