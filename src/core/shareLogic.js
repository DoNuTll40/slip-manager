import { effectiveStatus, summarize } from "./payment.js";
export const EXPIRY_OPTIONS = [
  { value: "none", label: "ไม่หมดอายุ" }, { value: "1", label: "1 วัน" }, { value: "3", label: "3 วัน" },
  { value: "7", label: "7 วัน" }, { value: "30", label: "30 วัน" }, { value: "custom", label: "กำหนดเอง" }
];
const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
export const generateToken = (len = 24) => [...globalThis.crypto.getRandomValues(new Uint8Array(len))].map((x) => ABC[x % ABC.length]).join("");
export function computeExpiry(option, now = new Date(), custom) {
  if (option === "none") return null;
  if (option === "custom") { const d = custom ? new Date(custom) : null; return d && !isNaN(d) ? d.toISOString() : null; }
  return new Date(now.getTime() + Number(option) * 86400000).toISOString();
}
export function shareState(s, now = new Date()) {
  if (s.revokedAt) return "REVOKED";
  if (s.expiresAt && new Date(s.expiresAt) <= now) return "EXPIRED";
  return "ACTIVE";
}
export function buildSnapshot({ people, payments, slips = [], verifications = [], permissions: P }, now = new Date()) {
  const rows = payments.map((pay, i) => {
    const person = people.find((x) => x.id === pay.personId);
    const row = { title: pay.title, person: P.showPeople ? person?.name ?? "-" : `รายการ ${i + 1}` };
    if (P.showAmount) { row.amountDue = Number(pay.amountDue) || 0; row.amountPaid = Number(pay.amountPaid) || 0; }
    if (P.showStatus) row.status = effectiveStatus(pay, now);
    if (P.showPeople && P.showPhone) row.phone = person?.phone || "";
    if (P.showPeople && P.showNote) row.note = person?.note || "";
    if (P.showSlip) {
      const slip = slips.find((s) => s.paymentId === pay.id);
      const v = slip && verifications.find((x) => x.slipId === slip.id);
      row.slip = slip ? { fileName: slip.fileName, uploadedAt: slip.uploadedAt, verification: v?.status || null } : null;
    }
    return row;
  });
  let kpi = null;
  if (P.showKPI) {
    const t = summarize(payments, now);
    kpi = { payments: t.total };
    if (P.showPeople) kpi.people = people.length;
    if (P.showStatus) kpi.byStatus = t.byStatus;
    if (P.showAmount) Object.assign(kpi, { amountTotal: t.amountTotal, amountPaid: t.amountPaid, amountOutstanding: t.amountOutstanding, amountPending: t.amountPending });
  }
  return { generatedAt: now.toISOString(), kpi, rows };
}
