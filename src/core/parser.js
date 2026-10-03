import { todayBangkok } from "./util.js";
const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4, "พ.ค.": 5, "มิ.ย.": 6, "ก.ค.": 7, "ส.ค.": 8, "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
  "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4, "พฤษภาคม": 5, "มิถุนายน": 6, "กรกฎาคม": 7, "สิงหาคม": 8, "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12 };
const BANKS = [["กสิกร", "KBank"], ["kbank", "KBank"], ["ไทยพาณิชย์", "SCB"], ["scb", "SCB"], ["กรุงเทพ", "BBL"], ["bangkok bank", "BBL"], ["กรุงไทย", "KTB"], ["ktb", "KTB"],
  ["ออมสิน", "GSB"], ["ทหารไทย", "ttb"], ["ttb", "ttb"], ["กรุงศรี", "Krungsri"], ["krungsri", "Krungsri"], ["พร้อมเพย์", "PromptPay"], ["promptpay", "PromptPay"]];

export const normalizeDigits = (s) => String(s || "").replace(/[๐-๙]/g, (c) => String(THAI_DIGITS.indexOf(c)));
const num = (s) => { const n = Number(String(s).replace(/,/g, "")); return Number.isFinite(n) ? n : null; };
const pad = (n) => String(n).padStart(2, "0");

function fixYear(y, now) {
  if (y > 2400) return y - 543;
  if (y >= 100) return y;
  const nowY = Number(todayBangkok(now).slice(0, 4));
  const ce = 2000 + y, be = 2500 + y - 543;
  return Math.abs(ce - nowY) <= Math.abs(be - nowY) ? ce : be;
}
const validDate = (y, m, d) => m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1990 && y <= 2100;

export function extractAmount(text) {
  const t = normalizeDigits(text);
  const patterns = [/(?:จำนวนเงิน|จำนวน|amount)[^\d\n]{0,15}([\d,]+(?:\.\d{1,2})?)/i, /฿\s*([\d,]+(?:\.\d{1,2})?)/, /([\d,]+(?:\.\d{1,2})?)\s*(?:บาท|THB|baht)/i];
  for (const p of patterns) { const m = t.match(p); if (m && num(m[1]) !== null) return num(m[1]); }
  const dec = [...t.matchAll(/(?<![\d/.:-])(\d{1,3}(?:,\d{3})*\.\d{2})(?![\d/])/g)].map((m) => num(m[1])).filter((n) => n > 0);
  return dec.length ? Math.max(...dec) : null;
}
export function extractDate(text, now = new Date()) {
  const t = normalizeDigits(text);
  let m = t.match(/(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{2,4})/);
  if (m) { const d = +m[1], mo = +m[2], y = fixYear(+m[3], now); if (validDate(y, mo, d)) return `${y}-${pad(mo)}-${pad(d)}`; }
  m = t.match(/(\d{1,2})\s+([A-Za-z]{3,9}|[ก-๙.]{3,12})\s*(\d{2,4})/);
  if (m) {
    const key = m[2].toLowerCase(); const mo = MONTHS[key] || MONTHS[key.slice(0, 3)];
    const d = +m[1], y = fixYear(+m[3], now);
    if (mo && validDate(y, mo, d)) return `${y}-${pad(mo)}-${pad(d)}`;
  }
  return null;
}
export function extractTime(text) { const m = normalizeDigits(text).match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?/); return m ? `${pad(m[1])}:${m[2]}` : null; }
export function extractReference(text) {
  const m = normalizeDigits(text).match(/(?:reference|ref\.?|transaction\s*id|transaction|เลขที่รายการ|รหัสอ้างอิง)\s*[:：]?\s*([A-Za-z0-9]{6,})/i);
  return m ? m[1] : null;
}
const lineAfter = (text, re) => { const m = text.match(re); return m ? m[1].trim().replace(/\s{2,}/g, " ") : null; };
export function parseSlipText(raw, now = new Date()) {
  const text = normalizeDigits(raw || "");
  const ref = extractReference(text);
  const bankHit = BANKS.find(([k]) => text.toLowerCase().includes(k));
  const acct = text.match(/([\dxX*]{3}-[\dxX*]-[\dxX*]{4,6}-[\dxX*])/);
  return {
    amount: extractAmount(text), transferDate: extractDate(text, now), transferTime: extractTime(text),
    senderName: lineAfter(text, /^\s*(?:จาก|ผู้โอน|from(?=[\s:：]))\s*[:：]?\s*(.{2,60})$/im),
    receiverName: lineAfter(text, /^\s*(?:ผู้รับ|ไปยัง|receiver(?=[\s:：])|to(?=[\s:：]))\s*[:：]?\s*(.{2,60})$/im),
    receiverAccount: acct ? acct[1] : null, bankName: bankHit ? bankHit[1] : null,
    referenceNumber: ref, transactionId: ref, rawText: raw || ""
  };
}
