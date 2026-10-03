import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const checkRequire = createRequire(require.resolve("@astrojs/check"));
const languageRequire = createRequire(
	checkRequire.resolve("@astrojs/language-server"),
);
const volarRequire = createRequire(
	languageRequire.resolve("volar-service-yaml"),
);
const yamlRequire = createRequire(volarRequire.resolve("yaml-language-server"));
const Ajv = yamlRequire("ajv");
const ajvRequire = createRequire(yamlRequire.resolve("ajv"));
const uri = ajvRequire("fast-uri");
const { getLanguageService } = yamlRequire(
	"./languageservice/yamlLanguageService.js",
);
const { TextDocument } = yamlRequire("vscode-languageserver-textdocument");
const origin = "https://schema.example.test";
const definitions = {
	$id: `${origin}/defs.json`,
	definitions: { title: { type: "string", minLength: 1 } },
};

test("actual YAML/Ajv parent resolves the approved fast-uri patch", () => {
	assert.equal(yamlRequire("ajv/package.json").version, "8.20.0");
	assert.equal(
		yamlRequire("ajv/package.json").dependencies["fast-uri"],
		"^3.0.1",
	);
	assert.equal(ajvRequire("fast-uri/package.json").version, "3.1.8");
	assert.equal(new Ajv().opts.uriResolver, uri);
});

test("URI normalization preserves encoded path/query and valid IDN/IPv6", () => {
	const encoded = "https://EXAMPLE.test:443/a%2Fb?q=%E4%B8%AD#part";
	assert.equal(
		uri.normalize(encoded),
		"https://example.test/a%2Fb?q=%E4%B8%AD#part",
	);
	assert.equal(uri.parse(encoded).path, "/a%2Fb");
	assert.equal(
		uri.normalize("https://例子.test/路径"),
		"https://xn--fsqu00a.test/%E8%B7%AF%E5%BE%84",
	);
	const ipv6 = "https://[2001:db8::1]:8443/a";
	assert.equal(uri.serialize(uri.parse(ipv6)), ipv6);
});

test("relative schema URI paths, queries and fragments resolve independently", () => {
	const base = `${origin}/base/main.json?old=1`;
	for (const [reference, expected] of [
		[
			"../defs.json#/definitions/title",
			`${origin}/defs.json#/definitions/title`,
		],
		["./child.json", `${origin}/base/child.json`],
		["?new=2", `${origin}/base/main.json?new=2`],
		["#local", `${origin}/base/main.json?old=1#local`],
	]) {
		assert.equal(uri.resolve(base, reference), expected);
	}
});

test("actual Ajv resolves external/local schema refs and reports missing refs", () => {
	const ajv = new Ajv({ allErrors: true });
	ajv.addSchema(definitions);
	const validate = ajv.compile({
		$id: `${origin}/base/main.json`,
		type: "object",
		properties: {
			title: { $ref: "../defs.json#/definitions/title" },
			tags: { type: "array", items: { $ref: "#/definitions/tag" } },
		},
		required: ["title", "tags"],
		definitions: { tag: { type: "string" } },
	});
	assert.equal(validate({ title: "气象 🛰️", tags: ["中文", "weather"] }), true);
	assert.equal(validate({ title: "", tags: [23] }), false);
	assert.deepEqual(
		new Set(validate.errors.map((error) => error.keyword)),
		new Set(["minLength", "type"]),
	);
	assert.throws(
		() => ajv.compile({ $ref: `${origin}/missing.json` }),
		(error) => error.missingRef === `${origin}/missing.json`,
	);
});

test("actual Ajv async schema loading uses normalized owned fixture URIs", async () => {
	const requested = [];
	const ajv = new Ajv({
		loadSchema: async (url) => {
			requested.push(url);
			assert.equal(url, definitions.$id);
			return definitions;
		},
	});
	const validate = await ajv.compileAsync({
		$id: `${origin}/base/async.json`,
		$ref: "../defs.json#/definitions/title",
	});
	assert.equal(validate("中文"), true);
	assert.equal(validate(42), false);
	assert.deepEqual(requested, [definitions.$id]);
});

test("actual YAML service validates Unicode values and relative external schema refs", async () => {
	const requested = [];
	const service = getLanguageService({
		clientCapabilities: {},
		schemaRequestService: async (url) => {
			requested.push(url);
			assert.equal(url, definitions.$id);
			return JSON.stringify(definitions);
		},
		workspaceContext: {
			resolveRelativePath: (relative, resource) =>
				uri.resolve(resource, relative),
		},
	});
	service.configure({
		validate: true,
		schemas: [
			{
				uri: `${origin}/base/yaml.json`,
				fileMatch: ["**/r1b-uri.yaml"],
				schema: {
					$id: `${origin}/base/yaml.json`,
					type: "object",
					properties: { title: { $ref: "../defs.json#/definitions/title" } },
					required: ["title"],
				},
			},
		],
	});
	const document = (text, version) =>
		TextDocument.create("file:///fixtures/r1b-uri.yaml", "yaml", version, text);
	assert.deepEqual(
		await service.doValidation(document('title: "气象 🛰️"\n', 1)),
		[],
	);
	const diagnostics = await service.doValidation(document("title: 42\n", 2));
	assert.equal(diagnostics.length, 1);
	assert.match(diagnostics[0].message, /string/);
	assert.deepEqual(requested, [definitions.$id]);
});
