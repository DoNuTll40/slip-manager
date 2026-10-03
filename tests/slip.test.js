import test from "node:test"; import assert from "node:assert/strict";
import { parseSlipText, extractAmount, extractDate } from "../src/core/parser.js";
import { sha256Hex } from "../src/core/crypto.js";
const now = new Date("2026-10-03T05:00:00Z");
test("hash: SHA-256 known vector", async () => {
  assert.equal(await sha256Hex(new TextEncoder().encode("abc")), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});
test("hash: same bytes → same hash (duplicate detection)", async () => {
  const a = await sha256Hex(new Uint8Array([1, 2, 3])), b = await sha256Hex(new Uint8Array([1, 2, 3]));
  assert.equal(a, b);
});
test("amount formats", () => {
  for (const [t, v] of [["จำนวนเงิน 500.00", 500], ["500 บาท", 500], ["฿500", 500], ["amount: 1,250.50", 1250.5], ["จำนวนเงิน ๕๐๐.๐๐", 500]]) assert.equal(extractAmount(t), v, t);
});
test("date formats incl. Buddhist era", () => {
  for (const t of ["03/10/2569", "03/10/69", "03-10-2026", "03 Oct 2026", "3 ต.ค. 69", "3 ตุลาคม 2569"]) assert.equal(extractDate(t, now), "2026-10-03", t);
});
test("reference + receiver extraction", () => {
  const p = parseSlipText("ธนาคารกสิกรไทย\nผู้รับ: นาย สมชาย ใจดี\nเลขที่รายการ: 015276123456AB\nจำนวนเงิน 500.00 บาท\n03/10/2569 14:22", now);
  assert.equal(p.referenceNumber, "015276123456AB"); assert.equal(p.receiverName, "นาย สมชาย ใจดี");
  assert.equal(p.bankName, "KBank"); assert.equal(p.transferTime, "14:22"); assert.equal(p.amount, 500);
});
