import assert from "node:assert/strict";
import test from "node:test";
import { signUploadPath, uploadAccessGranted } from "./photo-access";

test("signed upload urls can be checked and bare paths cannot", async () => {
  const signed = await signUploadPath("/uploads/delivery-machine.png");
  const url = new URL(signed, "http://localhost");
  assert.equal(await uploadAccessGranted(url.pathname, url.searchParams.get("exp"), url.searchParams.get("sig")), true);
  assert.equal(await uploadAccessGranted("/uploads/delivery-machine.png", null, null), false);
  assert.equal(await uploadAccessGranted("/uploads/delivery-machine.png", "1", "deadbeef"), false);
  assert.equal(await uploadAccessGranted("/uploads/../storage/private/secret.pdf", "1", "deadbeef"), false);
});
