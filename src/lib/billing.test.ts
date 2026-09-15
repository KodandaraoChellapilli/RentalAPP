import assert from "node:assert/strict";
import test from "node:test";
import { calculateCharge, formatRate, rentalCharge, roundMoney } from "./billing";

test("hourly rental bills at least one hour and rounds up", () => {
  const start = new Date("2026-09-10T08:00:00");
  const end = new Date("2026-09-10T09:20:00");
  const charge = calculateCharge(start, end, 85, "HOURLY");
  assert.equal(charge.billedUnits, 2);
  assert.equal(charge.amount, 170);
});

test("daily rental uses the equipment rate, not a hardcoded amount", () => {
  const start = new Date("2026-09-10T08:00:00");
  const end = new Date("2026-09-12T08:00:00");
  const charge = calculateCharge(start, end, 300, "DAILY");
  assert.equal(charge.billedUnits, 2);
  assert.equal(charge.amount, 600);
  assert.equal(formatRate(300, "DAILY"), "$300.00/day");
});

test("weekly rental rounds up partial weeks", () => {
  const start = new Date("2026-09-01T08:00:00");
  const end = new Date("2026-09-09T08:00:00");
  const charge = calculateCharge(start, end, 1200, "WEEKLY");
  assert.equal(charge.billedUnits, 2);
  assert.equal(charge.amount, 2400);
});

test("active rentals return an estimated current charge", () => {
  const start = new Date(Date.now() - 1000 * 60 * 60 * 24);
  const charge = rentalCharge(start, null, 300, "DAILY", "ACTIVE", null);
  assert.equal(charge.isEstimate, true);
  assert.ok(charge.amount >= 300);
});

test("completed rentals use the stored final amount", () => {
  const charge = rentalCharge(new Date(), new Date(), 300, "DAILY", "COMPLETED", 925.5);
  assert.equal(charge.isEstimate, false);
  assert.equal(charge.amount, roundMoney(925.5));
});
