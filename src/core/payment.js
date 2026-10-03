import { PAYMENT_STATUS as S } from "./constants.js";
import { todayBangkok, daysBetween } from "./util.js";
const AUTO = [S.UNPAID, S.PARTIAL, S.OVERDUE];
export function effectiveStatus(p, now = new Date()) {
  if (!AUTO.includes(p.status)) return p.status;
  const due = Number(p.amountDue) || 0, paid = Number(p.amountPaid) || 0;
  if (due > 0 && paid >= due) return S.PAID;
  if (p.dueDate && daysBetween(todayBangkok(now), p.dueDate) > 0) return S.OVERDUE;
  return paid > 0 ? S.PARTIAL : S.UNPAID;
}
export function summarize(payments, now = new Date()) {
  const byStatus = Object.fromEntries(Object.keys(S).map((k) => [k, 0]));
  const t = { total: payments.length, byStatus, amountTotal: 0, amountPaid: 0, amountOutstanding: 0, amountPending: 0, abnormal: 0 };
  for (const p of payments) {
    const st = effectiveStatus(p, now), due = Number(p.amountDue) || 0, paid = Number(p.amountPaid) || 0;
    byStatus[st]++; t.amountTotal += due; t.amountPaid += paid;
    if (st === S.PENDING_REVIEW) t.amountPending += Math.max(due - paid, 0);
    else if (st !== S.PAID) t.amountOutstanding += Math.max(due - paid, 0);
    if (st === S.REJECTED || st === S.OVERDUE) t.abnormal++;
  }
  return t;
}
