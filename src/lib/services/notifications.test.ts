import assert from "node:assert/strict";
import test from "node:test";
import { buildNotificationMessage, notifyRentalEvent } from "./notifications";

test("delivery scheduled message includes date, time, and location", () => {
  const message = buildNotificationMessage({
    type: "DELIVERY_SCHEDULED",
    equipmentLabel: "#306 Mini Excavator",
    when: new Date("2026-06-10T08:00:00"),
    location: "910 Audit Lane",
  });
  assert.match(message.body, /910 Audit Lane/);
  assert.match(message.body, /#306 Mini Excavator/);
  assert.equal(message.subject.includes("delivery scheduled"), true);
});

test("notifyRentalEvent does not pretend a message was sent without a provider", async () => {
  const result = await notifyRentalEvent({
    type: "PICKUP_REQUESTED",
    customerEmail: "abc@rental.app",
    equipmentLabel: "#306 Mini Excavator",
    when: new Date(),
    location: "Jobsite A",
  });
  assert.equal(result.sent, false);
  assert.equal(result.skipped, true);
  assert.equal(result.reason, "No email/SMS provider configured");
});
