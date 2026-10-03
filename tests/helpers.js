export function fakeStorage() {
  const m = new Map();
  globalThis.localStorage = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), get length() { return m.size; }, key: (i) => [...m.keys()][i] };
  return m;
}
export const settings = (over = {}) => ({ slip: { amountTolerance: 0, dateToleranceDays: 1, receiverMatch: "contains", expectedReceiver: "สมชาย ใจดี", confidenceThreshold: 60, ...over } });
export const payment = (over = {}) => ({ id: "p1", personId: "a", title: "ค่าส่วนกลาง", amountDue: 500, amountPaid: 0, dueDate: "2026-10-03", status: "UNPAID", ...over });
export const goodOcr = (over = {}) => ({ amount: 500, transferDate: "2026-10-03", receiverName: "นาย สมชาย ใจดี", referenceNumber: "ABC123456", confidence: 90, ...over });
