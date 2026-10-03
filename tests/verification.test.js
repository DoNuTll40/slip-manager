import test from "node:test"; import assert from "node:assert/strict";
import { verifySlip } from "../src/core/verification.js";
import { settings, payment, goodOcr } from "./helpers.js";
const run = (ocr, set = {}, pay = {}, ctx) => verifySlip({ ocrData: goodOcr(ocr), payment: payment(pay), settings: settings(set), context: ctx });
test("correct amount → VERIFIED, bank never verified", () => {
  const r = run({}); assert.equal(r.status, "VERIFIED"); assert.equal(r.levels.bank, "NOT_VERIFIED"); assert.equal(r.levels.slip, "DOCUMENT_VERIFIED");
});
test("wrong amount → REVIEW_REQUIRED", () => { const r = run({ amount: 400 }); assert.equal(r.status, "REVIEW_REQUIRED"); assert.equal(r.checks.amount.difference, -100); });
test("amount tolerance accepted", () => assert.equal(run({ amount: 499 }, { amountTolerance: 1 }).status, "VERIFIED"));
test("receiver match / mismatch", () => {
  assert.equal(run({}).checks.receiver.matched, true);
  assert.equal(run({ receiverName: "นาย อื่น" }).checks.receiver.matched, false);
  assert.equal(run({ receiverName: "นาย อื่น" }, { receiverMatch: "disabled" }).status, "VERIFIED");
});
test("date tolerance", () => {
  assert.equal(run({ transferDate: "2026-10-04" }).checks.date.matched, true);
  assert.equal(run({ transferDate: "2026-10-09" }).checks.date.matched, false);
  assert.equal(run({ transferDate: "2026-10-09" }, { dateToleranceDays: 3 }).checks.date.matched, false);
  assert.equal(run({ transferDate: "2026-10-06" }, { dateToleranceDays: 3 }).checks.date.matched, true);
  assert.equal(run({ transferDate: "2026-12-01" }, { dateToleranceDays: -1 }).checks.date.matched, true);
});
test("missing reference → warning only", () => { const r = run({ referenceNumber: null }); assert.equal(r.status, "VERIFIED"); assert.ok(r.warnings.some((w) => w.includes("เลขอ้างอิง"))); });
test("duplicate slip never VERIFIED", () => assert.equal(run({}, {}, {}, { duplicate: true }).status, "REVIEW_REQUIRED"));
test("unreadable slip → REJECTED", () => assert.equal(run({ amount: null, transferDate: null, referenceNumber: null, receiverName: null }).status, "REJECTED"));
