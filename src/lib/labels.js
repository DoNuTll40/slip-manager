export const PAYMENT_LABEL = { UNPAID: "ยังไม่ชำระ", PARTIAL: "ชำระบางส่วน", PENDING_REVIEW: "รอตรวจ", PAID: "ชำระแล้ว", REJECTED: "ไม่ผ่าน", OVERDUE: "เกินกำหนด" };
export const PAYMENT_TONE = { UNPAID: "bg-slate-100 text-slate-700", PARTIAL: "bg-amber-100 text-amber-800", PENDING_REVIEW: "bg-sky-100 text-sky-800", PAID: "bg-jade-soft text-jade", REJECTED: "bg-red-100 text-red-700", OVERDUE: "bg-orange-100 text-orange-800" };
export const VERIFY_LABEL = { VERIFIED: "ข้อมูลสลิปตรงกัน", REVIEW_REQUIRED: "ต้องตรวจเอง", REJECTED: "ไม่ผ่าน" };
export const SLIP_LEVEL_LABEL = { NONE: "ยังไม่มีสลิป", DOCUMENT_VERIFIED: "ตรวจเอกสารแล้ว (DOCUMENT_VERIFIED)", REVIEW_REQUIRED: "ต้องตรวจเอง", REJECTED: "ไม่ผ่าน" };
export const BANK_LABEL = { NOT_VERIFIED: "ยังไม่ได้ตรวจกับธนาคาร (NOT_VERIFIED)", VERIFIED: "ผู้ให้บริการยืนยันแล้ว", MISMATCH: "ผู้ให้บริการไม่พบรายการ" };
export const ACTION_LABEL = { PERSON_CREATE: "เพิ่มคน", PERSON_UPDATE: "แก้ไขข้อมูลคน", PERSON_DELETE: "ลบคน", PAYMENT_CREATE: "สร้าง Payment", PAYMENT_UPDATE: "แก้ไข Payment", PAYMENT_DELETE: "ลบ Payment", PAYMENT_PAID: "ยืนยันว่าชำระแล้ว", PAYMENT_REJECT: "ปฏิเสธการชำระ",
  SLIP_UPLOAD: "อัปโหลดสลิป", SLIP_DELETE: "ลบสลิป", SLIP_VERIFY: "ตรวจสลิป", SHARE_CREATE: "สร้างลิงก์แชร์", SHARE_UPDATE: "แก้ไขลิงก์แชร์", SHARE_REVOKE: "ยกเลิกลิงก์แชร์", SHARE_REENABLE: "เปิดลิงก์แชร์อีกครั้ง", SHARE_DELETE: "ลบลิงก์แชร์", SHARE_EXPORT: "ส่งออก Share Package",
  SETTINGS_UPDATE: "แก้ไขตั้งค่า", BACKUP_EXPORT: "สำรองข้อมูล", BACKUP_RESTORE: "กู้คืนข้อมูล", DB_REPAIR: "ซ่อมฐานข้อมูล", SAMPLE_DATA: "สร้างข้อมูลตัวอย่าง" };
