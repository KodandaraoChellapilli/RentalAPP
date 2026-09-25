import assert from "node:assert/strict";
import test from "node:test";
import { isPdfBytes, safeDownloadName, validatePdfFile } from "./documents";
import { requireOperations, requireOwner } from "./api/access";
import { ServiceError } from "./services/errors";

test("pdf uploads accept a real pdf and reject other types", () => {
  assert.equal(validatePdfFile({ name: "coi.pdf", type: "application/pdf", size: 1200 }), null);
  assert.equal(validatePdfFile({ name: "exact.pdf", type: "application/pdf", size: 10 * 1024 * 1024 }), null);
  assert.ok(validatePdfFile({ name: "photo.png", type: "image/png", size: 1200 }));
  assert.ok(validatePdfFile({ name: "photo.jpg", type: "image/jpeg", size: 1200 }));
  assert.ok(validatePdfFile({ name: "notes.txt", type: "text/plain", size: 20 }));
  assert.ok(validatePdfFile({ name: "bundle.zip", type: "application/zip", size: 20 }));
  assert.ok(validatePdfFile({ name: "page.html", type: "text/html", size: 20 }));
  assert.ok(validatePdfFile({ name: "run.exe", type: "application/octet-stream", size: 20 }));
  assert.ok(validatePdfFile({ name: "huge.pdf", type: "application/pdf", size: 10 * 1024 * 1024 + 1 }));
  assert.equal(isPdfBytes(Buffer.from("%PDF-1.4")), true);
  assert.equal(isPdfBytes(Buffer.from("<html>")), false);
  assert.equal(safeDownloadName('evil"\r\n.pdf'), "evil.pdf");
});

test("manager can operate the yard but cannot pass the owner-only check", () => {
  const manager = { id: "m", email: "a@example.com", name: "Aaron", role: "MANAGER" as const, customerId: null };
  assert.equal(requireOperations(manager).role, "MANAGER");
  assert.throws(() => requireOwner(manager), (error: unknown) => error instanceof ServiceError && error.status === 403);
});
