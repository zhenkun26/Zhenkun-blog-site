import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import test from "node:test";
import {safeStorage} from "../src/utils/zhenkun-storage.ts";
test("real module and pre-render storage fall back when the getter or methods throw", () => {
 const inline=readFileSync(new URL("../src/components/features/zhenkun-Storage.astro",import.meta.url),"utf8").match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
 const previous=globalThis.window;
 try {
  for (const window of [Object.defineProperty({},"localStorage",{get(){throw Error("denied")}}),{localStorage:{getItem(){throw Error("denied")},setItem(){throw Error("denied")},removeItem(){throw Error("denied")}}}]) {
   globalThis.window=window;
   assert.equal(safeStorage.getItem("theme"),null);assert.doesNotThrow(()=>safeStorage.setItem("theme","dark"));assert.doesNotThrow(()=>safeStorage.removeItem("theme"));
   runInNewContext(inline,{window});assert.equal(window.__zhenkunStorage.getItem("theme"),null);assert.doesNotThrow(()=>window.__zhenkunStorage.setItem("theme","dark"));
  }
 } finally {globalThis.window=previous;}
});
