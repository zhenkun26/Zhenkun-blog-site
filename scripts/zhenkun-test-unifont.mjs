import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer, request as httpRequest } from "node:http";
import { createRequire } from "node:module";
import { connect } from "node:net";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const require = createRequire(import.meta.url);
const astroRequire = createRequire(require.resolve("astro"));
const unifontEntry = astroRequire.resolve("unifont");
const unifontRequire = createRequire(unifontEntry);
const undici = unifontRequire("undici");
const font = readFileSync("public/assets/fonts/GreatVibes-Regular-2.otf");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function child(mode, origin) {
	assert.equal(unifontRequire("undici/package.json").version, "8.10.2");
	const { createUnifont, providers } = await import(
		pathToFileURL(unifontEntry).href
	);
	class OwnedDispatcher extends undici.Dispatcher {
		inner = new undici.Agent();
		calls = 0;
		dispatch(options, handler) {
			this.calls++;
			return this.inner.dispatch(options, handler);
		}
		close() {
			return this.inner.close();
		}
	}
	const before = mode === "custom" ? new OwnedDispatcher() : new undici.Agent();
	undici.setGlobalDispatcher(before);
	try {
		const fonts = await createUnifont([providers.npm({ cdn: origin })], {
			throwOnError: true,
		});
		const selected = undici.getGlobalDispatcher();
		if (mode === "proxy" || mode === "no_proxy") {
			assert.ok(
				selected instanceof undici.EnvHttpProxyAgent,
				"silent proxy catch must not pass",
			);
			assert.notEqual(selected, before);
		} else assert.equal(selected, before);
		const options = {
			formats: ["otf"],
			options: {
				npm: {
					version: "1.0.0",
					file: mode === "retry" ? "retry.css" : "index.css",
				},
			},
		};
		const result = await fonts.resolveFont("Owned Fixture", options);
		assert.equal(result.provider, "npm");
		assert.equal(result.fonts.length, 1);
		const url = result.fonts[0].src[0].url;
		assert.equal(url, `${origin}/assets/font.otf`);
		const downloaded = await fetch(url);
		assert.equal(downloaded.status, 200);
		const bytes = Buffer.from(await downloaded.arrayBuffer());
		assert.equal(digest(bytes), digest(font));
		assert.equal(bytes.subarray(0, 4).toString(), "OTTO");
		const missing = await fonts.resolveFont("Owned Fixture", {
			...options,
			options: { npm: { version: "1.0.0", file: "missing.css" } },
		});
		assert.deepEqual(missing, { fonts: [] });
		const failed = await fetch(`${origin}/assets/missing.otf`);
		assert.equal(failed.status, 404);
		await failed.arrayBuffer();
		const controller = new AbortController();
		controller.abort();
		await assert.rejects(
			fetch(`${origin}/cancelled`, { signal: controller.signal }),
			{ name: "AbortError" },
		);
		const active = new AbortController();
		const streaming = await fetch(`${origin}/slow-font.otf`, {
			signal: active.signal,
		});
		const reader = streaming.body.getReader();
		assert.equal((await reader.read()).value.length, 64);
		active.abort();
		await assert.rejects(reader.read(), { name: "AbortError" });
		if (mode === "custom") assert.ok(before.calls > 0);
		console.log(
			JSON.stringify({
				mode,
				selected: selected.constructor.name,
				fontBytes: bytes.length,
				fontSha256: digest(bytes),
				customCalls: before.calls ?? 0,
				downloadVerified: true,
				missingCssEmpty: true,
				missingFont404: true,
				aborted: true,
				activeDownloadAborted: true,
			}),
		);
	} finally {
		const selected = undici.getGlobalDispatcher();
		undici.setGlobalDispatcher(before);
		await selected.close();
		if (selected !== before) await before.close();
	}
}

async function listen(server) {
	await new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", resolve);
	});
	return server.address().port;
}

if (process.argv[2] === "--proxy-child") {
	await child(process.argv[3], process.argv[4]);
} else {
	for (const mode of ["none", "proxy", "no_proxy", "custom", "retry"]) {
		test(`createUnifont ${mode}: observable dispatcher and real local font chain`, {
			timeout: 15000,
		}, async (t) => {
			const sockets = new Set();
			const requests = [];
			let proxyConnections = 0;
			let retried = 0;
			let origin;
			const server = createServer((request, response) => {
				requests.push(request.url);
				if (
					request.url.endsWith("missing.css") ||
					request.url.endsWith("missing.otf")
				) {
					response.writeHead(404);
					response.end("owned missing fixture");
					return;
				}
				if (request.url.endsWith("retry.css") && retried++ === 0) {
					response.writeHead(500);
					response.end("owned retry fixture");
					return;
				}
				if (request.url.endsWith("index.css")) {
					response.writeHead(302, { location: "/fonts/font.css" });
					response.end();
					return;
				}
				if (
					request.url.endsWith("font.css") ||
					request.url.endsWith("retry.css")
				) {
					const css = `@font-face{font-family:"Owned Fixture";font-style:normal;font-weight:400;src:url(${origin}/assets/font.otf) format("opentype");}`;
					response.writeHead(200, {
						"content-type": "text/css",
						"content-encoding": "gzip",
					});
					response.end(gzipSync(css));
					return;
				}
				if (request.url === "/assets/font.otf") {
					response.writeHead(200, { "content-type": "font/otf" });
					response.end(font);
					return;
				}
				if (request.url === "/slow-font.otf") {
					response.writeHead(200, { "content-type": "font/otf" });
					response.write(font.subarray(0, 64));
					const timer = setTimeout(() => response.end(font.subarray(64)), 100);
					response.on("close", () => clearTimeout(timer));
					return;
				}
				response.writeHead(400);
				response.end("unexpected owned fixture path");
			});
			let port;
			const proxy = createServer((request, response) => {
				const target = new URL(request.url);
				if (
					target.protocol !== "http:" ||
					target.hostname !== "127.0.0.1" ||
					Number(target.port) !== port
				) {
					response.writeHead(400);
					response.end();
					return;
				}
				proxyConnections++;
				const forwarded = httpRequest(
					target,
					{ method: request.method, headers: request.headers },
					(upstream) => {
						response.writeHead(upstream.statusCode, upstream.headers);
						upstream.pipe(response);
					},
				);
				forwarded.on("error", () => {
					response.writeHead(502);
					response.end();
				});
				request.pipe(forwarded);
			});
			for (const listener of [server, proxy])
				listener.on("connection", (socket) => {
					sockets.add(socket);
					socket.on("close", () => sockets.delete(socket));
				});
			proxy.on("connect", (request, socket, head) => {
				const target = new URL(`http://${request.url}`);
				if (target.hostname !== "127.0.0.1" || Number(target.port) !== port) {
					socket.destroy();
					return;
				}
				proxyConnections++;
				const upstream = connect(port, "127.0.0.1", () => {
					socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
					if (head.length) upstream.write(head);
					socket.pipe(upstream);
					upstream.pipe(socket);
				});
				sockets.add(upstream);
				upstream.on("close", () => sockets.delete(upstream));
				upstream.on("error", () => socket.destroy());
				socket.on("error", () => upstream.destroy());
			});
			try {
				port = await listen(server);
				origin = `http://127.0.0.1:${port}`;
				const proxyPort = await listen(proxy);
				const env = { ...process.env };
				for (const key of [
					"HTTP_PROXY",
					"HTTPS_PROXY",
					"http_proxy",
					"https_proxy",
					"NO_PROXY",
					"no_proxy",
					"ALL_PROXY",
					"all_proxy",
				])
					delete env[key];
				if (["proxy", "no_proxy", "custom"].includes(mode))
					env.HTTP_PROXY = `http://127.0.0.1:${proxyPort}`;
				if (mode === "no_proxy") env.NO_PROXY = "127.0.0.1";
				const subprocess = spawn(
					process.execPath,
					[fileURLToPath(import.meta.url), "--proxy-child", mode, origin],
					{ env, stdio: ["ignore", "pipe", "pipe"] },
				);
				let stdout = "";
				let stderr = "";
				subprocess.stdout.on("data", (data) => {
					stdout += data;
				});
				subprocess.stderr.on("data", (data) => {
					stderr += data;
				});
				const code = await new Promise((resolve, reject) => {
					subprocess.once("error", reject);
					subprocess.once("close", resolve);
				});
				assert.equal(code, 0, `${stdout}\n${stderr}`);
				const receipt = JSON.parse(stdout.trim());
				t.diagnostic(
					JSON.stringify({
						...receipt,
						proxyRequests: proxyConnections,
						originRequests: requests.length,
					}),
				);
				assert.equal(receipt.fontSha256, digest(font));
				assert.ok(requests.includes("/assets/font.otf"));
				assert.equal(
					requests.filter((path) => path.endsWith("missing.css")).length,
					1,
				);
				assert.ok(!requests.includes("/cancelled"));
				if (mode === "proxy") assert.ok(proxyConnections > 0);
				else assert.equal(proxyConnections, 0);
				if (mode === "retry") assert.equal(retried, 2);
				else assert.ok(requests.includes("/fonts/font.css"));
			} finally {
				for (const socket of sockets) socket.destroy();
				await Promise.all(
					[server, proxy].map(
						(listener) => new Promise((resolve) => listener.close(resolve)),
					),
				);
			}
		});
	}
}
