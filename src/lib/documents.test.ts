import assert from "node:assert/strict";
import test from "node:test";
import { validatePdfFile } from "./documents";
import { requireOperations, requireOwner } from "./api/access";
import { ServiceError } from "./services/errors";

test("pdf uploads accept a real pdf and reject other types", () => {
  assert.equal(validatePdfFile({ name: "coi.pdf", type: "application/pdf", size: 1200 }), null);
  assert.ok(validatePdfFile({ name: "photo.png", type: "image/png", size: 1200 }));
  assert.ok(validatePdfFile({ name: "huge.pdf", type: "application/pdf", size: 11 * 1024 * 1024 }));
});

test("manager can operate the yard but cannot pass the owner-only check", () => {
  const manager = { id: "m", email: "a@example.com", name: "Aaron", role: "MANAGER" as const, customerId: null };
  assert.equal(requireOperations(manager).role, "MANAGER");
  assert.throws(() => requireOwner(manager), (error: unknown) => error instanceof ServiceError && error.status === 403);
});
