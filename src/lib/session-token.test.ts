import assert from "node:assert/strict";
import test from "node:test";
import { authSecret, decodeSession, encodeSession, type SessionUser } from "./session-token";

const user: SessionUser = {
  id: "user-1",
  email: "owner@example.com",
  name: "Owner",
  role: "ADMIN",
  customerId: null,
};

test("expired sessions are rejected", async () => {
  const token = await encodeSession(user, -1000);
  assert.equal(await decodeSession(token), null);
  assert.equal(await decodeSession("not-a-session"), null);
});

test("production refuses a missing or development auth secret", () => {
  assert.throws(() => authSecret({ NODE_ENV: "production" }), /AUTH_SECRET/);
  assert.throws(() => authSecret({ NODE_ENV: "production", AUTH_SECRET: "rental-app-dev-secret-change-me" }), /AUTH_SECRET/);
  assert.equal(typeof authSecret({ NODE_ENV: "production", AUTH_SECRET: "a-long-unique-production-secret" }), "string");
});
