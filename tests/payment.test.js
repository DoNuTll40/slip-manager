import test from "node:test"; import assert from "node:assert/strict";
import { effectiveStatus, summarize } from "../src/core/payment.js";
import { payment } from "./helpers.js";
const now = new Date("2026-10-03T05:00:00Z");
test("amount paid in full → PAID", () => assert.equal(effectiveStatus(payment({ amountPaid: 500 }), now), "PAID"));
test("partial", () => assert.equal(effectiveStatus(payment({ amountPaid: 100, dueDate: "2026-10-30" }), now), "PARTIAL"));
test("overdue after due date (Bangkok)", () => assert.equal(effectiveStatus(payment({ dueDate: "2026-10-01" }), now), "OVERDUE"));
test("PENDING_REVIEW / REJECTED are kept", () => { assert.equal(effectiveStatus(payment({ status: "PENDING_REVIEW", dueDate: "2020-01-01" }), now), "PENDING_REVIEW"); });
test("summary totals", () => {
  const s = summarize([payment({ amountPaid: 500 }), payment({ id: "2", status: "PENDING_REVIEW", amountDue: 200, dueDate: "2026-12-01" }), payment({ id: "3", amountDue: 300, dueDate: "2026-12-01" })], now);
  assert.equal(s.amountTotal, 1000); assert.equal(s.amountPaid, 500); assert.equal(s.amountPending, 200); assert.equal(s.amountOutstanding, 300);
});
