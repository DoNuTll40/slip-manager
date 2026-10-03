const COLS = ["people", "payments", "slips", "verifications", "shares", "activity"];
const STATUSES = ["UNPAID", "PARTIAL", "PENDING_REVIEW", "PAID", "REJECTED", "OVERDUE"];
const issue = (code, severity, message, extra = {}) => ({ code, severity, message, safe: false, ...extra });

export function inspectData(data) {
  const out = [];
  const ids = (c) => new Set((data[c] || []).map((r) => r.id));
  for (const c of COLS) {
    const seen = new Set();
    for (const r of data[c] || []) {
      if (seen.has(r.id)) out.push(issue("DUPLICATE_ID", "error", `รหัสซ้ำใน ${c}: ${r.id}`, { safe: true, collection: c, id: r.id }));
      seen.add(r.id);
    }
  }
  const people = ids("people"), payments = ids("payments"), slips = ids("slips");
  for (const p of data.payments || []) {
    if (!people.has(p.personId)) out.push(issue("PAYMENT_MISSING_PERSON", "error", `Payment "${p.title}" อ้างถึงบุคคลที่ไม่มีอยู่`, { id: p.id }));
    if (!Number.isFinite(Number(p.amountDue)) || Number(p.amountDue) < 0 || !STATUSES.includes(p.status)) out.push(issue("INVALID_PAYMENT", "error", `Payment "${p.title}" มียอดหรือสถานะไม่ถูกต้อง`, { id: p.id }));
  }
  const hashes = new Map();
  for (const s of data.slips || []) {
    if (!people.has(s.personId) || !payments.has(s.paymentId)) out.push(issue("SLIP_ORPHAN", "warning", `สลิป ${s.fileName} ไม่มี Payment/บุคคลที่อ้างถึง`, { id: s.id }));
    if (hashes.has(s.fileHash)) out.push(issue("DUPLICATE_SLIP_HASH", "warning", `พบสลิปไฟล์เดียวกันซ้ำ: ${s.fileName}`, { id: s.id }));
    hashes.set(s.fileHash, s.id);
  }
  for (const v of data.verifications || []) if (!slips.has(v.slipId)) out.push(issue("VERIFICATION_ORPHAN", "warning", "ผลตรวจสลิปอ้างถึงสลิปที่ไม่มีอยู่", { id: v.id }));
  for (const s of data.shares || []) if (s.expiresAt && isNaN(new Date(s.expiresAt))) out.push(issue("INVALID_SHARE_EXPIRATION", "error", `ลิงก์แชร์ "${s.title}" มีวันหมดอายุไม่ถูกต้อง`, { safe: true, id: s.id }));
  return out;
}
export function healthStatus(issues) { return issues.some((i) => i.severity === "error") ? "ERROR" : issues.length ? "WARNING" : "HEALTHY"; }

// Safe repairs only: never deletes records.
export function repairSafe(data, now = new Date()) {
  const fixed = [], next = Object.fromEntries(COLS.map((c) => [c, (data[c] || []).map((r) => ({ ...r }))]));
  for (const c of COLS) {
    const seen = new Set();
    for (const r of next[c]) {
      if (seen.has(r.id)) { r.id = globalThis.crypto.randomUUID(); fixed.push(`ออกรหัสใหม่ให้ระเบียนซ้ำใน ${c}`); }
      seen.add(r.id);
    }
  }
  for (const s of next.shares) if (s.expiresAt && isNaN(new Date(s.expiresAt))) { s.expiresAt = null; s.revokedAt = now.toISOString(); fixed.push(`ยกเลิกลิงก์ "${s.title}" ที่วันหมดอายุไม่ถูกต้อง`); }
  return { data: next, fixed };
}
