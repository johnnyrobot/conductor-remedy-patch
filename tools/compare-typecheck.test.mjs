import test from "node:test";
import assert from "node:assert/strict";
import { compareTypecheck } from "./compare-typecheck.mjs";
const diagnostic = (root, line = 5) =>
  `> server typecheck\n> tsc --noEmit\n\napi/a.ts(${line},2): error TS2306: File '${root}/server/types/AI.ts' is not a module.\n  Context preserves the exact inferred type.\n`;
const compare = (control, patched, a = 2, b = 2) =>
  compareTypecheck({
    baseline: { text: control, status: a, root: "/control" },
    patched: { text: patched, status: b, root: "/patched" },
  });
test("normalizes only corresponding checkout roots and source positions", () => {
  const result = compare(diagnostic("/control"), diagnostic("/patched", 90));
  assert.equal(result.matches, true);
  assert.equal(result.baselineDiagnostics, 1);
  assert.equal(result.standalonePass, false);
});
test("a new diagnostic or changed nested message is never hidden by equal exit codes", () => {
  assert.equal(
    compare(
      diagnostic("/control"),
      diagnostic("/patched") + "api/new.ts(1,1): error TS9999: new error\n",
    ).matches,
    false,
  );
  assert.equal(
    compare(
      diagnostic("/control"),
      diagnostic("/patched").replace(
        "exact inferred type",
        "different inferred type",
      ),
    ).matches,
    false,
  );
});
test("does not ignore package-version/type/message changes", () => {
  assert.equal(
    compare(
      diagnostic("/control"),
      diagnostic("/patched").replace(
        "is not a module",
        "has a distinct export shape",
      ),
    ).matches,
    false,
  );
});
test("compiler failures without diagnostics and mismatched exits fail closed", () => {
  assert.equal(compare("npm failed", "npm failed", 1, 1).matches, false);
  assert.equal(
    compare(diagnostic("/control"), diagnostic("/patched"), 2, 1).matches,
    false,
  );
});
test("real successful typechecks are recorded separately from inherited failures", () => {
  const result = compare("> tsc --noEmit\n", "> tsc --noEmit\n", 0, 0);
  assert.equal(result.matches, true);
  assert.equal(result.standalonePass, true);
  assert.equal(result.baselineDiagnostics, 0);
});
