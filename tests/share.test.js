import test from "node:test"; import assert from "node:assert/strict";
import { generateToken, computeExpiry, shareState, buildSnapshot } from "../src/core/shareLogic.js";
import { hashPassword, verifyPassword, encryptJson, decryptJson } from "../src/core/crypto.js";
import { payment } from "./helpers.js";
const people = [{ id: "a", name: "สมหญิง", phone: "0812345678", note: "ลับ" }];
const perms = { showKPI: true, showPeople: true, showAmount: true, showStatus: true, showSlip: false, showPhone: false, showNote: false };
test("token length & uniqueness", () => { const a = generateToken(24), b = generateToken(24); assert.equal(a.length, 24); assert.notEqual(a, b); });
test("expiration options", () => {
  const now = new Date("2026-10-03T00:00:00Z");
  assert.equal(computeExpiry("none", now), null); assert.equal(computeExpiry("7", now), "2026-10-10T00:00:00.000Z");
  assert.equal(shareState({ expiresAt: "2026-10-02T00:00:00Z" }, now), "EXPIRED"); assert.equal(shareState({ expiresAt: null }, now), "ACTIVE");
});
test("revoke wins over expiry; revoke ≠ delete", () => assert.equal(shareState({ revokedAt: "2026-10-01T00:00:00Z", expiresAt: null }), "REVOKED"));
test("password hash verifies, plaintext not stored", async () => {
  const h = await hashPassword("secret", "salt1"); assert.ok(!h.includes("secret"));
  assert.ok(await verifyPassword("secret", "salt1", h)); assert.ok(!(await verifyPassword("wrong", "salt1", h)));
});
test("package encryption round-trip, wrong password fails", async () => {
  const p = await encryptJson({ a: 1 }, "pw"); assert.deepEqual(await decryptJson(p, "pw"), { a: 1 });
  await assert.rejects(() => decryptJson(p, "bad"));
});
test("permission filtering hides phone/note/slip/amount/names", () => {
  const snap = buildSnapshot({ people, payments: [payment()], permissions: perms });
  const r = snap.rows[0]; assert.equal(r.phone, undefined); assert.equal(r.note, undefined); assert.equal(r.slip, undefined);
  const hidden = buildSnapshot({ people, payments: [payment()], permissions: { ...perms, showPeople: false, showAmount: false, showStatus: false } });
  assert.equal(hidden.rows[0].person, "รายการ 1"); assert.equal(hidden.rows[0].amountDue, undefined); assert.equal(hidden.rows[0].status, undefined); assert.equal(hidden.kpi.amountTotal, undefined);
  assert.ok(!JSON.stringify(hidden).includes("สมหญิง"));
});
