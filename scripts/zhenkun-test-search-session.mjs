import assert from "node:assert/strict";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { createSearchSession } from "../src/utils/search-session.ts";

function deferred() {
	let resolve;
	let reject;
	const promise = new Promise((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return { promise, resolve, reject };
}

function fixture(search, debounceMs = 0) {
	const states = [];
	const session = createSearchSession({
		search,
		debounceMs,
		publish: (state) => states.push(state),
	});
	return { session, states, last: () => states.at(-1) };
}

test("first query survives lazy backend initialization", async () => {
	const ready = deferred();
	const f = fixture(async (query) => {
		await ready.promise;
		return [query];
	});
	f.session.setQuery("气象");
	await delay(5);
	assert.equal(f.last().status, "loading");
	ready.resolve();
	await delay(5);
	assert.deepEqual(f.last(), {
		query: "气象",
		status: "ready",
		results: ["气象"],
	});
	f.session.dispose();
});

test("rapid edits debounce to the latest query", async () => {
	const calls = [];
	const f = fixture(async (query) => {
		calls.push(query);
		return [query];
	}, 10);
	for (const query of ["气", "气象", "气象学"]) f.session.setQuery(query);
	await delay(25);
	assert.deepEqual(calls, ["气象学"]);
	assert.deepEqual(f.last().results, ["气象学"]);
	f.session.dispose();
});

for (const stage of ["search response", "result data"]) {
	test(`older ${stage} cannot replace a newer result`, async () => {
		const old = deferred();
		const f = fixture(async (query) => {
			const response =
				query === "old"
					? stage === "search response"
						? await old.promise
						: { results: [{ data: () => old.promise }] }
					: { results: [{ data: async () => query }] };
			return Promise.all(response.results.map((item) => item.data()));
		});
		f.session.setQuery("old");
		await delay(5);
		f.session.setQuery("new");
		await delay(5);
		old.resolve(
			stage === "search response"
				? { results: [{ data: async () => "old" }] }
				: "old",
		);
		await delay(5);
		assert.deepEqual(f.last().results, ["new"]);
		f.session.dispose();
	});
}

for (const value of ["", "  \n "]) {
	test(`clearing to ${JSON.stringify(value)} invalidates an in-flight query`, async () => {
		const pending = deferred();
		const f = fixture(() => pending.promise);
		f.session.setQuery("气象");
		await delay(5);
		f.session.setQuery(value);
		pending.resolve(["obsolete"]);
		await delay(5);
		assert.deepEqual(f.last(), { query: "", status: "idle", results: [] });
		f.session.dispose();
	});
}

test("empty query never loads or searches the backend", async () => {
	let calls = 0;
	const f = fixture(async () => {
		calls++;
		return [];
	});
	f.session.setQuery("  ");
	await delay(5);
	assert.equal(calls, 0);
	assert.equal(f.last().status, "idle");
	f.session.dispose();
});

test("zero results complete without leaving a spinner", async () => {
	const f = fixture(async () => []);
	f.session.setQuery("absent");
	await delay(5);
	assert.deepEqual(f.last(), { query: "absent", status: "ready", results: [] });
	f.session.dispose();
});

test("backend failure clears stale results and permits a retry", async () => {
	const error = new Error("unavailable");
	const f = fixture(async (query) => {
		if (query === "fail") throw error;
		return [query];
	});
	f.session.setQuery("ok");
	await delay(5);
	f.session.setQuery("fail");
	await delay(5);
	assert.deepEqual(f.last(), {
		query: "fail",
		status: "error",
		results: [],
		error,
	});
	f.session.setQuery("retry");
	await delay(5);
	assert.deepEqual(f.last().results, ["retry"]);
	f.session.dispose();
});

test("stale failure cannot clear the newer success", async () => {
	const pending = deferred();
	const f = fixture((query) =>
		query === "old" ? pending.promise : Promise.resolve([query]),
	);
	f.session.setQuery("old");
	await delay(5);
	f.session.setQuery("new");
	await delay(5);
	pending.reject(new Error("old failure"));
	await delay(5);
	assert.deepEqual(f.last().results, ["new"]);
	assert.equal(f.last().status, "ready");
	f.session.dispose();
});

for (const action of ["cancel", "dispose"]) {
	test(`${action} before debounce prevents any backend call`, async () => {
		let calls = 0;
		const f = fixture(async () => {
			calls++;
			return [];
		}, 10);
		f.session.setQuery("气象");
		f.session[action]();
		await delay(20);
		assert.equal(calls, 0);
	});
	test(`${action} during initialization cannot resurrect a closed panel`, async () => {
		const ready = deferred();
		const f = fixture(async () => {
			await ready.promise;
			return ["obsolete"];
		});
		f.session.setQuery("气象");
		await delay(5);
		f.session[action]();
		const count = f.states.length;
		ready.resolve();
		await delay(5);
		assert.equal(f.states.length, count);
	});
}

test("a new SPA session is independent of disposed work", async () => {
	const pending = deferred();
	const old = fixture(() => pending.promise);
	old.session.setQuery("old");
	await delay(5);
	old.session.dispose();
	const next = fixture(async (query) => [query]);
	next.session.setQuery("new");
	await delay(5);
	pending.resolve(["old"]);
	await delay(5);
	assert.deepEqual(next.last().results, ["new"]);
	next.session.dispose();
});

test("dispose is idempotent and future edits publish nothing", async () => {
	const f = fixture(async () => ["unexpected"]);
	f.session.dispose();
	f.session.dispose();
	f.session.setQuery("after unmount");
	f.session.cancel();
	await delay(5);
	assert.deepEqual(f.states, []);
});

test("closing and reopening the same query searches again", async () => {
	const calls = [];
	const f = fixture(async (query) => {
		calls.push(query);
		return [query];
	});
	f.session.setQuery("气象");
	await delay(5);
	f.session.cancel();
	assert.deepEqual(f.last().results, []);
	f.session.setQuery("气象");
	await delay(5);
	assert.deepEqual(calls, ["气象", "气象"]);
	assert.deepEqual(f.last().results, ["气象"]);
	f.session.dispose();
});

test("old completion does not stop a newer pending query", async () => {
	const old = deferred();
	const next = deferred();
	const f = fixture((query) => (query === "old" ? old.promise : next.promise));
	f.session.setQuery("old");
	await delay(5);
	f.session.setQuery("new");
	await delay(5);
	old.resolve(["old"]);
	await delay(5);
	assert.deepEqual(f.last(), { query: "new", status: "loading", results: [] });
	next.resolve(["new"]);
	await delay(5);
	assert.deepEqual(f.last().results, ["new"]);
	f.session.dispose();
});
