import { z } from "zod";
import { DB_VERSION } from "../db/schema.js";
const rows = z.array(z.object({ id: z.string() }).passthrough());
export const backupSchema = z.object({
  version: z.number().int().min(1), exportedAt: z.string(),
  people: rows, payments: rows, slips: rows, verifications: rows, shares: rows, activity: rows,
  settings: z.record(z.any()),
  slipFiles: z.array(z.object({ id: z.string(), dataUrl: z.string() })).optional()
});
export function validateBackup(raw) {
  let obj;
  try { obj = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return { ok: false, errors: ["ไฟล์ไม่ใช่ JSON ที่ถูกต้อง"] }; }
  const r = backupSchema.safeParse(obj);
  if (!r.success) return { ok: false, errors: r.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`) };
  if (r.data.version > DB_VERSION) return { ok: false, errors: ["ไฟล์สำรองนี้ใหม่กว่าเวอร์ชันของแอป"] };
  const d = r.data;
  return { ok: true, data: d, counts: { people: d.people.length, payments: d.payments.length, slips: d.slips.length, verifications: d.verifications.length, shares: d.shares.length, activity: d.activity.length, files: d.slipFiles?.length || 0 } };
}
