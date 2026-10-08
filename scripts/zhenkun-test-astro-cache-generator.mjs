import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { createRequire, registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const generatorURL = pathToFileURL(
	join(dirname(require.resolve("astro")), "assets/build/generate.js"),
).href;
const baseline = process.env.ZHENKUN_ASTRO_CACHE_BASELINE === "1";
if (baseline) {
	const source = readFileSync(
		"references/dependency-cache-final-2026-10-04/astro-generator-official.js",
	);
	assert.equal(
		createHash("sha256").update(source).digest("hex"),
		"d35fda4e0a924ab0034f2c43983ccad4a7918667333fe381f355f057d9cb20db",
	);
	registerHooks({
		load(url, context, nextLoad) {
			return url === generatorURL
				? { format: "module", source, shortCircuit: true }
				: nextLoad(url, context);
		},
	});
}
const { generateImagesForPath } = await import(generatorURL);
const oldBytes = Buffer.from("old restricted cache bytes");
const freshBytes = Buffer.from("fresh origin image bytes");
const source = "https://example.invalid/image.png";
function fixture(meta, local = false) {
	// Retained owned fixtures: no cleanup of source or other workspaces.
	const root = mkdtempSync(join(tmpdir(), "zhenkun-generator-"));
	for (const sub of ["cache", "out"]) mkdirSync(join(root, sub));
	const cache = join(root, "cache/image.png");
	const metadata = `${cache}.json`;
	if (meta) {
		writeFileSync(cache, oldBytes);
		writeFileSync(metadata, JSON.stringify(meta));
	}
	const output = join(root, "out/image.png");
	const calls = [];
	globalThis.astroAsset = {
		imageService: {
			transform: async (data) => {
				calls.push(Buffer.from(data));
				return { data: Buffer.concat([Buffer.from("transformed:"), data]) };
			},
		},
	};
	const env = {
		logger: { info() {}, warn() {}, debug() {} },
		clientRoot: pathToFileURL(`${root}/out/`),
		serverRoot: pathToFileURL(`${root}/out/`),
		assetsCacheDir: pathToFileURL(`${root}/cache/`),
		useCache: true,
		count: { current: 1, total: 1 },
		imageConfig: { domains: ["example.invalid"], remotePatterns: [] },
	};
	const run = () =>
		generateImagesForPath(
			local ? "/local.png" : source,
			{
				transforms: new Map([
					[
						"one",
						{
							finalPath: "/image.png",
							transform: {
								src: local
									? { src: "/local.png", width: 1, height: 1, format: "png" }
									: source,
								format: "png",
							},
						},
					],
				]),
			},
			env,
		);
	return { root, cache, metadata, output, calls, run, env };
}
async function fetching(fn, body) {
	const original = globalThis.fetch;
	globalThis.fetch = fn;
	try {
		await body();
	} finally {
		globalThis.fetch = original;
		delete globalThis.astroAsset;
	}
}
const restrictions = [
	{ "cache-control": "no-store,max-age=600" },
	{ "cache-control": "private,max-age=600" },
	{ "cache-control": "no-cache,max-age=600" },
	{ "cache-control": "must-revalidate,max-age=0,stale-if-error=600" },
	{ "cache-control": "s-maxage=0,stale-if-error=600" },
	{ "cache-control": "max-age=600", "set-cookie": "private=session" },
	{ "cache-control": "max-age=600", vary: "*" },
];
for (const [index, headers] of restrictions.entries()) {
	test(`generator restriction ${index}: ignores fresh old metadata, transforms current bytes, leaves no reusable remote writes`, async () => {
		const meta = { expires: Date.now() + 600000, etag: '"old"' };
		const f = fixture(meta);
		let requests = 0;
		await fetching(
			async (req) => {
				requests++;
				assert.equal(req.headers.get("if-none-match"), null);
				return new Response(freshBytes, { headers });
			},
			async () => {
				await f.run();
				assert.equal(requests, 1);
				assert.deepEqual(
					readFileSync(f.output),
					Buffer.concat([Buffer.from("transformed:"), freshBytes]),
				);
				assert.deepEqual(f.calls, [freshBytes]);
				assert.deepEqual(readFileSync(f.cache), oldBytes);
				assert.deepEqual(JSON.parse(readFileSync(f.metadata)), meta);
			},
		);
	});
}
for (const failure of ["network", 304, 404, 500, 503]) {
	test(`generator failure ${failure}: stale validators cannot publish old bytes`, async () => {
		const f = fixture({
			expires: 0,
			etag: '"old"',
			lastModified: "Thu, 01 Oct 2026 00:00:00 GMT",
		});
		await fetching(
			async (req) => {
				assert.equal(req.headers.get("if-none-match"), null);
				assert.equal(req.headers.get("if-modified-since"), null);
				if (failure === "network") throw new Error("owned network failure");
				return new Response(null, {
					status: failure,
					headers: { "cache-control": "no-store", vary: "*" },
				});
			},
			async () => {
				await assert.rejects(f.run());
				assert.equal(existsSync(f.output), false);
				assert.equal(f.calls.length, 0);
				assert.deepEqual(readFileSync(f.cache), oldBytes);
			},
		);
	});
}
test("generator successful remote miss does not create persistent cache", async () => {
	const f = fixture(null);
	await fetching(
		async () =>
			new Response(freshBytes, {
				headers: { "cache-control": "public,max-age=600", etag: '"fresh"' },
			}),
		async () => {
			await f.run();
			assert.deepEqual(
				readFileSync(f.output),
				Buffer.concat([Buffer.from("transformed:"), freshBytes]),
			);
			assert.equal(existsSync(f.cache), false);
			assert.equal(existsSync(f.metadata), false);
		},
	);
});
test("generator local image cache positive control remains usable offline", async () => {
	const f = fixture({ expires: 0 }, true);
	await fetching(
		async () => {
			throw new Error("must not fetch local image");
		},
		async () => {
			await f.run();
			assert.deepEqual(readFileSync(f.output), oldBytes);
			assert.equal(f.calls.length, 0);
		},
	);
});

test("generator local first transform writes reusable local cache", async () => {
	const f = fixture(null, true);
	writeFileSync(join(f.root, "out/local.png"), freshBytes);
	await fetching(
		async () => {
			throw new Error("local must not fetch");
		},
		async () => {
			await f.run();
			const expected = Buffer.concat([Buffer.from("transformed:"), freshBytes]);
			assert.deepEqual(readFileSync(f.output), expected);
			assert.deepEqual(readFileSync(f.cache), expected);
			assert.equal(existsSync(f.metadata), false);
			assert.equal(f.calls.length, 1);
		},
	);
});
test("generator same remote source multi-size transforms fetch once within invocation", async () => {
	const f = fixture(null);
	let requests = 0;
	await fetching(
		async () => {
			requests++;
			return new Response(freshBytes);
		},
		async () => {
			await generateImagesForPath(
				source,
				{
					transforms: new Map(
						[100, 200].map((width) => [
							String(width),
							{
								finalPath: `/size-${width}.png`,
								transform: { src: source, width, format: "png" },
							},
						]),
					),
				},
				f.env,
			);
			assert.equal(requests, 1);
			assert.deepEqual(f.calls, [freshBytes, freshBytes]);
			for (const width of [100, 200]) {
				assert.deepEqual(
					readFileSync(join(f.root, `out/size-${width}.png`)),
					Buffer.concat([Buffer.from("transformed:"), freshBytes]),
				);
				assert.equal(
					existsSync(join(f.root, `cache/size-${width}.png`)),
					false,
				);
			}
		},
	);
});
test("generator deliberately refetches valid public unexpired cache", async () => {
	const f = fixture({ expires: Date.now() + 600000, etag: '"public"' });
	let requests = 0;
	await fetching(
		async () => {
			requests++;
			return new Response(freshBytes, {
				headers: { "cache-control": "public,max-age=600" },
			});
		},
		async () => {
			await f.run();
			assert.equal(requests, 1);
			assert.deepEqual(
				readFileSync(f.output),
				Buffer.concat([Buffer.from("transformed:"), freshBytes]),
			);
			assert.deepEqual(readFileSync(f.cache), oldBytes);
		},
	);
});
