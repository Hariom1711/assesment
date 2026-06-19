import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

test("package exposes API scripts", () => {
  const pkg = require("../package.json");
  assert.equal(pkg.scripts.build, "tsc -p tsconfig.json");
});
