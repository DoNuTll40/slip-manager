import { VERIFY_STATUS as V, SLIP_LEVEL, BANK_LEVEL } from "./constants.js";
import { normalizeText, daysBetween } from "./util.js";

const check = (matched, expected, actual, difference, message) => ({ matched, expected, actual, difference, message });

export function verifySlip({ ocrData, payment, settings, context = {} }) {
  const s = settings.slip, warnings = [], errors = [];
  const checks = {};

  // amount
  const exp = Number(payment.amountDue) || 0, act = ocrData.amount;
  if (act == null) checks.amount = check(false, exp, null, null, "อ่านยอดเงินจากสลิปไม่ได้");
  else {
    const diff = Math.round((act - exp) * 100) / 100;
    checks.amount = check(Math.abs(diff) <= (s.amountTolerance || 0), exp, act, diff, Math.abs(diff) <= (s.amountTolerance || 0) ? "ยอดเงินตรงกัน" : "ยอดเงินไม่ตรงกับที่ต้องชำระ");
  }
  // receiver
  if (s.receiverMatch === "disabled") checks.receiver = check(true, null, ocrData.receiverName ?? null, null, "ปิดการตรวจผู้รับ");
  else if (!s.expectedReceiver) { checks.receiver = check(true, null, ocrData.receiverName ?? null, null, "ยังไม่ได้ตั้งชื่อผู้รับในตั้งค่า"); warnings.push("ยังไม่ได้ตั้งชื่อผู้รับที่คาดหวังในตั้งค่า จึงไม่ได้ตรวจผู้รับ"); }
  else {
    const e = normalizeText(s.expectedReceiver), a = normalizeText(ocrData.receiverName);
    const ok = a !== "" && (s.receiverMatch === "exact" ? a === e : a.includes(e) || e.includes(a));
    checks.receiver = check(ok, s.expectedReceiver, ocrData.receiverName ?? null, null, ok ? "ชื่อผู้รับตรงกัน" : "ชื่อผู้รับไม่ตรงหรืออ่านไม่ได้");
  }
  // date (compare calendar dates; Asia/Bangkok dates are plain yyyy-mm-dd)
  if (s.dateToleranceDays < 0) checks.date = check(true, null, ocrData.transferDate ?? null, null, "ปิดการตรวจวันที่");
  else if (!payment.dueDate) checks.date = check(true, null, ocrData.transferDate ?? null, null, "รายการไม่มีวันครบกำหนด");
  else if (!ocrData.transferDate) checks.date = check(false, payment.dueDate, null, null, "อ่านวันที่โอนไม่ได้");
  else {
    const diff = daysBetween(ocrData.transferDate, payment.dueDate), ok = Math.abs(diff) <= s.dateToleranceDays;
    checks.date = check(ok, payment.dueDate, ocrData.transferDate, diff, ok ? "วันที่อยู่ในช่วงที่ยอมรับ" : `วันที่โอนห่างจากกำหนด ${Math.abs(diff)} วัน`);
  }
  // reference (informational: missing → warning only)
  const hasRef = Boolean(ocrData.referenceNumber);
  checks.reference = check(hasRef, null, ocrData.referenceNumber ?? null, null, hasRef ? "พบเลขอ้างอิง" : "ไม่พบเลขอ้างอิงในสลิป");
  if (!hasRef) warnings.push("ไม่พบเลขอ้างอิงในสลิป");

  const gating = ["amount", "receiver", "date"];
  const failed = gating.filter((k) => !checks[k].matched);
  const readable = ocrData.amount != null || ocrData.transferDate || ocrData.referenceNumber || ocrData.receiverName;
  const ocrConf = Number(ocrData.confidence) || 0;
  const ratio = gating.filter((k) => checks[k].matched).length / gating.length;
  const confidence = Math.round(ocrConf * 0.5 + ratio * 100 * 0.5);

  if (context.duplicate) warnings.push("พบสลิปไฟล์เดียวกันในระบบแล้ว");
  if (ocrConf < s.confidenceThreshold) warnings.push("ความมั่นใจของ OCR ต่ำกว่าเกณฑ์");
  failed.forEach((k) => errors.push(checks[k].message));

  let status;
  if (!readable) { status = V.REJECTED; errors.push("อ่านข้อมูลจากสลิปไม่ได้เลย"); }
  else if (failed.length || context.duplicate || ocrConf < s.confidenceThreshold) status = V.REVIEW_REQUIRED;
  else status = V.VERIFIED;

  return {
    status, checks, confidence, warnings, errors,
    levels: { payment: "PENDING_REVIEW", slip: status === V.VERIFIED ? SLIP_LEVEL.DOCUMENT_VERIFIED : status === V.REJECTED ? SLIP_LEVEL.REJECTED : SLIP_LEVEL.REVIEW_REQUIRED, bank: BANK_LEVEL.NOT_VERIFIED }
  };
}
