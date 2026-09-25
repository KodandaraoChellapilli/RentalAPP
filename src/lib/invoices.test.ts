import assert from "node:assert/strict";
import test from "node:test";
import { buildInvoiceDraft, formatInvoiceNumber, nextInvoiceSequence, parseInvoiceStatus } from "./invoices";

const rental = {
  status: "COMPLETED",
  startAt: "2026-01-01T00:00:00.000Z",
  endAt: "2026-01-04T00:00:00.000Z",
  rateSnapshot: 300,
  billingUnitSnapshot: "DAILY",
  finalAmount: 900,
  equipment: { number: "306", name: "Mini Excavator" },
};

test("completed invoice uses the stored final amount", () => {
  const draft = buildInvoiceDraft(rental);
  assert.equal(draft.total, 900);
  assert.equal(draft.subtotal, 900);
  assert.equal(draft.line.amount, 900);
  assert.equal(draft.isEstimate, false);
});

test("active invoice uses the existing rental charge", () => {
  const draft = buildInvoiceDraft(
    { ...rental, status: "ACTIVE", finalAmount: null, endAt: null, startAt: "2026-01-01T00:00:00.000Z" },
    new Date("2026-01-03T00:00:00.000Z"),
  );
  assert.equal(draft.total, 600);
  assert.equal(draft.isEstimate, true);
});

test("invoice numbers stay sequential", () => {
  assert.equal(formatInvoiceNumber(nextInvoiceSequence([])), "INV-0001");
  assert.equal(formatInvoiceNumber(nextInvoiceSequence(["INV-0001", "INV-0008"])), "INV-0009");
});

test("only paid and unpaid can be set", () => {
  assert.equal(parseInvoiceStatus("paid"), "PAID");
  assert.equal(parseInvoiceStatus("UNPAID"), "UNPAID");
  assert.equal(parseInvoiceStatus("OVERDUE"), null);
});
