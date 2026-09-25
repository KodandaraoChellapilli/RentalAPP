import assert from "node:assert/strict";
import test from "node:test";
import { resolveCorsOrigin } from "./cors";

test("development allows localhost and a configured origin", () => {
  const env = { NODE_ENV: "development", CORS_ORIGINS: "https://yard.example" };
  assert.equal(resolveCorsOrigin("http://localhost:3001", env), "http://localhost:3001");
  assert.equal(resolveCorsOrigin("http://127.0.0.1:3001", env), "http://127.0.0.1:3001");
  assert.equal(resolveCorsOrigin("https://yard.example", env), "https://yard.example");
});

test("unapproved and missing origins are not allowed", () => {
  const env = { NODE_ENV: "development", CORS_ORIGINS: "https://yard.example" };
  assert.equal(resolveCorsOrigin("https://evil.example", env), null);
  assert.equal(resolveCorsOrigin(null, env), null);
  assert.equal(resolveCorsOrigin("", env), null);
});

test("production never uses a wildcard", () => {
  assert.equal(resolveCorsOrigin("https://anywhere.example", { NODE_ENV: "production", CORS_ORIGINS: "*" }), null);
  assert.equal(resolveCorsOrigin("https://yard.example", { NODE_ENV: "production", CORS_ORIGINS: "https://yard.example" }), "https://yard.example");
  assert.equal(resolveCorsOrigin("http://localhost:3001", { NODE_ENV: "production", CORS_ORIGINS: "" }), null);
});
