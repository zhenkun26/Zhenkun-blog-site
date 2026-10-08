import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

const require = createRequire(resolve("scripts/zhenkun-test-r2-native.mjs"));
const astroRequire = createRequire(require.resolve("astro"));
const wranglerRequire = createRequire(require.resolve("wrangler"));
const cloudflareRequire = createRequire(require.resolve("@astrojs/cloudflare"));
const vitePluginRequire = publicImportRequire(
	cloudflareRequire,
	"@cloudflare/vite-plugin",
);
const miniflareEntry = wranglerRequire.resolve("miniflare");
const miniflareRequire = createRequire(miniflareEntry);
const { Miniflare, convertV4MiniflareOptions } = miniflareRequire("miniflare");
const miniflareUndici = miniflareRequire("undici");
const parents = [
	["root", require],
	["Astro", astroRequire],
	["Miniflare", miniflareRequire],
];
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const stream = (bytes) => new Blob([bytes]).stream();
const binary = Buffer.from([0, 255, 1, 127, 128, 42, 0, 10]);
const svg = Buffer.from(
	'<svg xmlns="http://www.w3.org/2000/svg" width="8" height="6"><rect width="8" height="6" fill="#ff6600"/><rect width="3" height="2" fill="#003399"/></svg>',
);

function publicImportRequire(parentRequire, name) {
	// Resolve the real parent's ESM-only public import entry without loading it as CJS.
	const file = parentRequire.resolve
		.paths(name)
		.map((directory) => join(directory, name, "package.json"))
		.find((candidate) => existsSync(candidate));
	assert.ok(file, `Missing actual parent dependency ${name}`);
	const data = JSON.parse(readFileSync(file, "utf8"));
	assert.equal(data.name, name);
	const entry = join(dirname(file), data.exports["."].import);
	assert.ok(existsSync(entry));
	return createRequire(entry);
}

function manifest(entry, name) {
	let directory = dirname(entry);
	for (;;) {
		const file = join(directory, "package.json");
		if (existsSync(file)) {
			const data = JSON.parse(readFileSync(file, "utf8"));
			if (data.name === name) return { file, data };
		}
		const parent = dirname(directory);
		assert.notEqual(parent, directory, `Missing manifest for ${name}`);
		directory = parent;
	}
}

function saveImage(name, bytes, metadata) {
	if (process.env.ZHENKUN_R2_EVIDENCE !== "1") return;
	const directory = resolve(
		"references/dependency-r2-native-2026-10-03/images",
	);
	mkdirSync(directory, { recursive: true });
	writeFileSync(join(directory, name), bytes);
	writeFileSync(
		join(directory, `${name}.json`),
		`${JSON.stringify({ ...metadata, bytes: bytes.length, sha256: digest(bytes) }, null, 2)}\n`,
	);
}

const worker = `
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === "/binary") return new Response(new Uint8Array([0,255,1,127,128,42,0,10]), {
      headers: {"content-type":"application/octet-stream", "x-r2":"binary"}
    });
    if (path === "/echo") return new Response(request.body, {
      headers: {"content-type":"application/octet-stream", "x-method":request.method,
        "x-client":request.headers.get("x-client") || ""}
    });
    if (path === "/redirect") return new Response(null, {status:302, headers:{location:"/binary"}});
    if (path === "/stream" || path === "/slow") return fetch(env.SOURCE + path);
    if (path.startsWith("/image/")) {
      const [, , input, format] = path.split("/");
      if (!["png", "jpeg", "svg", "invalid"].includes(input)) return new Response("unknown fixture", {status:400});
      return fetch(env.SOURCE + "/" + input, {cf:{image:{rotate:90,width:3,height:4,fit:"squeeze",format}}});
    }
    return new Response("unknown fixture", {status:404});
  }
};
`;

test("R2 real Sharp parents and local Miniflare APIs", {
	timeout: 60000,
}, async (t) => {
	assert.equal(process.env.CF_WORKERS, undefined, "CF_WORKERS must be absent");
	assert.equal(vitePluginRequire.resolve("miniflare"), miniflareEntry);
	assert.equal(
		manifest(miniflareEntry, "miniflare").data.version,
		"5.20260828.0-alpha",
	);
	assert.equal(
		manifest(miniflareRequire.resolve("undici"), "undici").data.version,
		"7.29.1",
	);
	const unifontRequire = createRequire(astroRequire.resolve("unifont"));
	assert.equal(
		manifest(unifontRequire.resolve("undici"), "undici").data.version,
		"8.10.2",
	);
	const rootSharp = require("sharp");
	const pixels = Buffer.from(
		Array.from({ length: 8 * 6 * 3 }, (_, index) => (index * 37) % 256),
	);
	const png = await rootSharp(pixels, {
		raw: { width: 8, height: 6, channels: 3 },
	})
		.png()
		.toBuffer();
	const jpeg = await rootSharp(pixels, {
		raw: { width: 8, height: 6, channels: 3 },
	})
		.jpeg()
		.toBuffer();
	const fixtures = {
		png,
		jpeg,
		svg,
		invalid: Buffer.from("owned non-image fixture"),
	};

	const timers = new Set();
	const fixture = createServer((request, response) => {
		const path = new URL(request.url, "http://127.0.0.1").pathname;
		if (path === "/stream" || path === "/slow") {
			response.writeHead(200, {
				"content-type": "application/octet-stream",
				"x-r2-source": "owned",
			});
			response.write(binary);
			let remaining = path === "/slow" ? 200 : 2;
			const timer = setInterval(() => {
				response.write(binary);
				if (--remaining === 0) response.end();
			}, 25);
			timers.add(timer);
			response.once("close", () => {
				clearInterval(timer);
				timers.delete(timer);
			});
			return;
		}
		const input = path.slice(1);
		if (Object.hasOwn(fixtures, input)) {
			response.writeHead(200, {
				"content-type": input === "svg" ? "image/svg+xml" : `image/${input}`,
				"x-r2-source": "owned",
			});
			response.end(fixtures[input]);
		} else {
			response.writeHead(404);
			response.end("owned missing fixture");
		}
	});
	let mf;
	t.after(async () => {
		try {
			if (mf) await mf.dispose();
		} finally {
			for (const timer of timers) clearInterval(timer);
			fixture.closeAllConnections();
			await new Promise((done) => fixture.close(done));
		}
	});
	await new Promise((done, reject) => {
		fixture.once("error", reject);
		fixture.listen(0, "127.0.0.1", done);
	});
	const source = `http://127.0.0.1:${fixture.address().port}`;
	const options = convertV4MiniflareOptions({
		name: "r2-native-fixture",
		script: worker,
		modules: true,
		compatibilityDate: "2026-08-28",
		host: "127.0.0.1",
		port: 0,
		cf: false,
		telemetry: { enabled: false },
		images: { binding: "IMAGES" },
		bindings: { SOURCE: source },
	});
	assert.equal(options.cf, false);
	assert.equal(options.telemetry.enabled, false);
	mf = new Miniflare(options);
	const origin = (await mf.ready).origin;
	const url = (path) => new URL(path, origin).href;
	const images = await mf.getImagesBinding("IMAGES");

	const records = [];
	for (const input of ["svg", "invalid", "jpeg"]) {
		const record = {input, inputSha256:digest(fixtures[input])};
		try {
			const response = await mf.dispatchFetch(url(`/image/${input}/png`), {signal:AbortSignal.timeout(8000)});
			const body = Buffer.from(await response.arrayBuffer());
			Object.assign(record, {status:response.status, headers:Object.fromEntries(response.headers), bytes:body.length, sha256:digest(body), inputByteEqual:body.equals(fixtures[input])});
			if (input === "jpeg") {
				const info = await rootSharp(body).metadata();
				record.decoded = {width:info.width, height:info.height, format:info.format};
			}
		} catch (error) { record.error = {name:error.name, message:error.message}; }
		records.push(record);
	}
	writeFileSync("references/dependency-r2-native-2026-10-03/cf-image-contract-probe.json", JSON.stringify({originalScriptSha256:digest(readFileSync("scripts/zhenkun-test-r2-native.mjs")), fixtureOrigin:source, workerOrigin:origin, cf:false, telemetry:false, records}, null, 2)+"\n");
	for (const record of records) {
		assert.equal(record.error, undefined);
		assert.equal(record.status, 200);
		assert.equal(record.headers["x-r2-source"], "owned");
		if (record.input === "jpeg") {
			assert.equal(record.headers["content-type"], "image/png");
			assert.equal(record.headers["cf-resized"], "internal=ok/m");
			assert.deepEqual(record.decoded, {width:3,height:4,format:"png"});
		} else {
			assert.equal(record.headers["content-type"], record.input === "svg" ? "image/svg+xml" : "image/invalid");
			assert.equal(record.headers["cf-resized"], undefined);
			assert.equal(record.inputByteEqual, true);
		}
	}
});
