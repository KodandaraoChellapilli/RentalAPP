import assert from "node:assert/strict";
import test from "node:test";
import { resolveStoredFile } from "./files";

test("private storage rejects path traversal", () => {
  const safe = resolveStoredFile("customers/abc/file.pdf");
  assert.match(safe, /storage\/private\/customers\/abc\/file\.pdf$/);
  for (const key of ["../.env", "/etc/passwd", "customers/../../.env", "customers/%2e%2e/%2e%2e/.env", "customers/%252e%252e/.env"]) {
    assert.throws(() => resolveStoredFile(key), /Invalid storage path/);
  }
});
