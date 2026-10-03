import { peopleService } from "./peopleService";
import { paymentService } from "./paymentService";
import { paymentRepository } from "@/repositories/paymentRepository";
import { log } from "./activityService";
const day = (n) => { const d = new Date(Date.now() + n * 86400000); return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(d); };
export function createSampleData() {
  const a = peopleService.create({ name: "สมชาย ตัวอย่าง", code: "A001", phone: "0800000001", note: "ข้อมูลตัวอย่าง" });
  const b = peopleService.create({ name: "สมหญิง ตัวอย่าง", code: "A002", phone: "0800000002", note: "" });
  const p1 = paymentService.create({ personId: a.id, title: "ค่าสมาชิกเดือนนี้", amountDue: 500, amountPaid: 0, dueDate: day(7) });
  paymentService.create({ personId: a.id, title: "ค่ากิจกรรม", amountDue: 1200, amountPaid: 400, dueDate: day(14) });
  const p3 = paymentService.create({ personId: b.id, title: "ค่าสมาชิกเดือนที่แล้ว", amountDue: 500, amountPaid: 0, dueDate: day(-10) });
  paymentService.markPaid(p1.id); paymentRepository.update(p3.id, { status: "UNPAID" });
  log("SAMPLE_DATA", "database", "-");
}
