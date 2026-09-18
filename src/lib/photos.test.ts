import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedPhotoFile } from "./photo-files";

test("jpeg and png photos are allowed", () => {
  assert.equal(isAllowedPhotoFile({ name: "before.jpg", type: "image/jpeg", size: 12 }), true);
  assert.equal(isAllowedPhotoFile({ name: "after.png", type: "image/png", size: 12 }), true);
});

test("svg uploads are rejected even if the mime type looks like an image", () => {
  assert.equal(isAllowedPhotoFile({ name: "machine.svg", type: "image/svg+xml", size: 40 }), false);
  assert.equal(isAllowedPhotoFile({ name: "machine.png", type: "image/svg+xml", size: 40 }), false);
});

test("empty and non-image files are rejected", () => {
  assert.equal(isAllowedPhotoFile({ name: "empty.png", type: "image/png", size: 0 }), false);
  assert.equal(isAllowedPhotoFile({ name: "notes.pdf", type: "application/pdf", size: 40 }), false);
});
