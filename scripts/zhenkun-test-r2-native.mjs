import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
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

	for (const [label, parentRequire] of parents) {
		await t.test(
			`${label}: actual native Sharp decodes PNG/JPEG/SVG and rotates/resizes PNG/WebP`,
			async () => {
				const entry = parentRequire.resolve("sharp");
				const sharp = parentRequire("sharp");
				assert.equal(manifest(entry, "sharp").data.version, "0.35.5");
				assert.equal(sharp.versions.sharp, "0.35.5");
				assert.equal(sharp.versions.vips, "8.18.7");
				assert.equal(sharp.versions.rsvg, "2.63.2");
				const binaries = Object.keys(require.cache).filter((file) =>
					/[/\\]sharp-[^/\\]+\.node$/.test(file),
				);
				assert.equal(
					binaries.length,
					1,
					"A real native Sharp module must load; no WASM fallback",
				);
				assert.ok(
					binaries[0].includes(`sharp-${process.platform}-${process.arch}`),
				);
				assert.ok(binaries[0].includes("0.35.5"));
				if (process.platform === "linux" && process.arch === "x64") {
					const glibc = process.report.getReport().header.glibcVersionRuntime;
					assert.ok(glibc, "Linux x64 gate requires glibc");
					const [major, minor] = glibc.split(".").map(Number);
					assert.ok(major > 2 || (major === 2 && minor >= 28));
				}
				t.diagnostic(
					JSON.stringify({
						parent: label,
						entry,
						native: binaries[0],
						nativeSha256: digest(readFileSync(binaries[0])),
						versions: sharp.versions,
					}),
				);
				for (const input of ["png", "jpeg", "svg"]) {
					const metadata = await sharp(fixtures[input]).metadata();
					assert.deepEqual(
						[metadata.width, metadata.height, metadata.format],
						[8, 6, input],
					);
					for (const format of ["png", "webp"]) {
						const { data, info } = await sharp(fixtures[input])
							.rotate(90)
							.resize(3, 4, { fit: "fill" })
							.toFormat(format)
							.toBuffer({ resolveWithObject: true });
						assert.deepEqual(
							[info.width, info.height, info.format],
							[3, 4, format],
						);
						assert.deepEqual(
							[
								(await sharp(data).metadata()).width,
								(await sharp(data).metadata()).height,
							],
							[3, 4],
						);
						saveImage(`${label.toLowerCase()}-${input}.${format}`, data, {
							parent: label,
							input,
							width: info.width,
							height: info.height,
							format,
						});
					}
				}
			},
		);
	}

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

	await t.test(
		"getImagesBinding info parses bitmap and harmless SVG",
		async () => {
			for (const input of ["png", "jpeg"]) {
				const info = await images.info(stream(fixtures[input]));
				assert.deepEqual(
					[info.format, info.width, info.height, info.fileSize],
					[`image/${input}`, 8, 6, fixtures[input].length],
				);
			}
			assert.deepEqual(await images.info(stream(svg)), {
				format: "image/svg+xml",
			});
		},
	);
	await t.test(
		"getImagesBinding input/transform/output uses native PNG/WebP paths",
		async () => {
			for (const input of ["png", "jpeg", "svg"]) {
				for (const format of ["png", "webp"]) {
					const output = await images
						.input(stream(fixtures[input]))
						.transform({ rotate: 90, width: 3, height: 4, fit: "squeeze" })
						.output({ format: `image/${format}` });
					const response = await output.response();
					assert.equal(response.status, 200);
					assert.equal(response.headers.get("content-type"), `image/${format}`);
					const bytes = Buffer.from(await response.arrayBuffer());
					const info = await rootSharp(bytes).metadata();
					assert.deepEqual(
						[info.width, info.height, info.format],
						[3, 4, format],
					);
					saveImage(`binding-${input}.${format}`, bytes, {
						parent: "getImagesBinding",
						input,
						width: info.width,
						height: info.height,
						format,
					});
				}
			}
		},
	);
	await t.test(
		"getImagesBinding exposes its bounded unsupported GIF output error",
		async () => {
			await assert.rejects(
				images.input(stream(png)).output({ format: "image/gif" }),
				(error) => {
					assert.match(String(error), /9520|GIF output/);
					return true;
				},
			);
		},
	);
	for (const format of ["png", "webp"]) {
		await t.test(
			`worker cf.image native ${format} result and headers`,
			async () => {
				const response = await mf.dispatchFetch(url(`/image/jpeg/${format}`));
				assert.equal(response.status, 200);
				assert.equal(response.headers.get("content-type"), `image/${format}`);
				assert.equal(response.headers.get("cf-resized"), "internal=ok/m");
				const bytes = Buffer.from(await response.arrayBuffer());
				const info = await rootSharp(bytes).metadata();
				assert.deepEqual(
					[info.width, info.height, info.format],
					[3, 4, format],
				);
				saveImage(`cf-image.${format}`, bytes, {
					parent: "worker cf.image",
					input: "jpeg",
					width: info.width,
					height: info.height,
					format,
				});
			},
		);
	}
	await t.test(
		"worker cf.image JSON reports original and transformed metadata",
		async () => {
			const response = await mf.dispatchFetch(url("/image/png/json"));
			assert.equal(response.status, 200);
			assert.match(response.headers.get("content-type"), /application\/json/);
			assert.deepEqual(await response.json(), {
				width: 3,
				height: 4,
				original: {
					file_size: png.length,
					width: 8,
					height: 6,
					format: "image/png",
				},
			});
		},
	);
	// The Sharp helper parses metadata before internally rejecting SVG (422).
	// WorkerCore's outbound wrapper returns the original response on conversion
	// failure, so dispatchFetch observes the origin bytes rather than that error.
	for (const input of ["svg", "invalid"]) {
		await t.test(
			`worker cf.image ${input} conversion failure preserves the origin response`,
			async () => {
				const response = await mf.dispatchFetch(url(`/image/${input}/png`));
				const bytes = Buffer.from(await response.arrayBuffer());
				t.diagnostic(
					JSON.stringify({
						input,
						status: response.status,
						headers: Object.fromEntries(response.headers),
						bytes: bytes.length,
						sha256: digest(bytes),
						inputSha256: digest(fixtures[input]),
						inputByteEqual: bytes.equals(fixtures[input]),
					}),
				);
				assert.equal(response.status, 200);
				assert.equal(
					response.headers.get("content-type"),
					input === "svg" ? "image/svg+xml" : "image/invalid",
				);
				assert.equal(response.headers.get("x-r2-source"), "owned");
				assert.equal(response.headers.get("cf-resized"), null);
				assert.deepEqual(bytes, fixtures[input]);
			},
		);
	}
	await t.test(
		"dispatchFetch preserves method, headers and exact binary bytes through real Undici parent",
		async () => {
			const response = await mf.dispatchFetch(url("/echo"), {
				method: "PATCH",
				headers: { "x-client": "owned-r2" },
				body: binary,
			});
			assert.ok(response instanceof miniflareUndici.Response);
			assert.equal(response.headers.get("x-method"), "PATCH");
			assert.equal(response.headers.get("x-client"), "owned-r2");
			assert.deepEqual(Buffer.from(await response.arrayBuffer()), binary);
		},
	);
	await t.test(
		"dispatchFetch accepts streamed uploads and controlled streamed response bytes",
		async () => {
			const response = await mf.dispatchFetch(url("/echo"), {
				method: "POST",
				headers: { "x-client": "owned-stream" },
				body: stream(Buffer.concat([binary, binary])),
				duplex: "half",
			});
			assert.equal(response.headers.get("x-method"), "POST");
			assert.deepEqual(
				Buffer.from(await response.arrayBuffer()),
				Buffer.concat([binary, binary]),
			);
			const download = await mf.dispatchFetch(url("/stream"));
			assert.equal(download.headers.get("x-r2-source"), "owned");
			assert.deepEqual(
				Buffer.from(await download.arrayBuffer()),
				Buffer.concat([binary, binary, binary]),
			);
		},
	);
	await t.test(
		"dispatchFetch handles followed and manual redirects",
		async () => {
			const followed = await mf.dispatchFetch(url("/redirect"));
			assert.equal(followed.status, 200);
			assert.equal(followed.headers.get("x-r2"), "binary");
			assert.deepEqual(Buffer.from(await followed.arrayBuffer()), binary);
			const manual = await mf.dispatchFetch(url("/redirect"), {
				redirect: "manual",
			});
			assert.equal(manual.status, 302);
			assert.equal(manual.headers.get("location"), "/binary");
			await manual.arrayBuffer();
		},
	);
	await t.test(
		"dispatchFetch cancellation of active stream is followed by successful recovery",
		async () => {
			const controller = new AbortController();
			const response = await mf.dispatchFetch(url("/slow"), {
				signal: controller.signal,
			});
			const reader = response.body.getReader();
			const first = await reader.read();
			assert.equal(first.done, false);
			assert.deepEqual(Buffer.from(first.value), binary);
			controller.abort();
			await assert.rejects(reader.read(), { name: "AbortError" });
			reader.releaseLock();
			const recovered = await mf.dispatchFetch(url("/binary"));
			assert.equal(recovered.status, 200);
			assert.deepEqual(Buffer.from(await recovered.arrayBuffer()), binary);
		},
	);
	t.diagnostic(
		JSON.stringify({
			fixtureOrigin: source,
			workerOrigin: origin,
			cf: false,
			telemetry: false,
			remoteBindings: false,
			dispatchTransport: miniflareRequire.resolve("undici"),
		}),
	);
});
