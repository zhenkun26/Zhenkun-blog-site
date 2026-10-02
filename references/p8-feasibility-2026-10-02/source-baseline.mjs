import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

export const sourceBase = "27e09c220e1ffe16817d5bf02e950a4fbf332b7b";
export function verifySourceBaseline() {
  // Reproducible on a later docs-only review commit without moving HEAD.
  const snapshot = JSON.parse(readFileSync("references/p4-capabilities-2026-10-02/source-snapshot.json", "utf8"));
  const hash = bytes => createHash("sha256").update(bytes).digest("hex");
  const tree = Object.fromEntries(execFileSync("git", ["-c", "core.quotepath=false", "ls-tree", "-r", sourceBase], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }).trim().split("\n").map(line => {
    const [entry, path] = line.split("\t");
    const [mode, , blob] = entry.split(" ");
    return [path, { mode, blob }];
  }));
  assert.equal(Object.keys(snapshot.files).length, 491);
  for (const [path, expected] of Object.entries(snapshot.files)) {
    assert.equal(hash(readFileSync(path)), expected.sha256, path);
    assert.deepEqual(tree[path], { mode: expected.mode, blob: expected.blob }, `frozen baseline:${path}`);
  }
  return { sourceBase, files: Object.keys(snapshot.files).length, sourceDigest: hash(JSON.stringify(snapshot.files)) };
}
