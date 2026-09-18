import assert from "node:assert/strict";
import test from "node:test";
import { validateLoginForm } from "./loginValidation";

test("empty email and password", () => {
  assert.equal(validateLoginForm("", ""), "Please enter your email and password.");
  assert.equal(validateLoginForm("   ", ""), "Please enter your email and password.");
});

test("empty email with password", () => {
  assert.equal(validateLoginForm("", "demo123"), "Please enter your email.");
  assert.equal(validateLoginForm("  ", "demo123"), "Please enter your email.");
});

test("email with empty password", () => {
  assert.equal(validateLoginForm("admin@rental.app", ""), "Please enter your password.");
});

test("invalid email", () => {
  assert.equal(validateLoginForm("not-an-email", "demo123"), "Please enter a valid email address.");
  assert.equal(validateLoginForm("missing@", "demo123"), "Please enter a valid email address.");
});

test("valid shape passes (trims email)", () => {
  assert.equal(validateLoginForm("  admin@rental.app  ", "demo123"), null);
});
