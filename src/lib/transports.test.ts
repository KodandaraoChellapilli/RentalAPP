import assert from "node:assert/strict";
import test from "node:test";
import { isTransportType, transportStatus, transportStatusLabel } from "./transports";

test("open unassigned job needs transport", () => {
  assert.equal(transportStatus({ completedAt: null, employeeId: null }), "NEEDS_TRANSPORT");
  assert.equal(transportStatusLabel("NEEDS_TRANSPORT"), "Needs transport");
});

test("assigned open job is scheduled", () => {
  assert.equal(transportStatus({ completedAt: null, employeeId: "emp_1" }), "SCHEDULED");
});

test("completed job is completed even if unassigned", () => {
  assert.equal(transportStatus({ completedAt: new Date(), employeeId: null }), "COMPLETED");
});

test("only delivery and pickup are transport types", () => {
  assert.equal(isTransportType("DELIVERY"), true);
  assert.equal(isTransportType("PICKUP"), true);
  assert.equal(isTransportType("RENTAL"), false);
});
