import { z } from "zod";
export const personSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อ"),
  code: z.string().trim().default(""), phone: z.string().trim().default(""), note: z.string().trim().default("")
});
export const paymentSchema = z.object({
  personId: z.string().min(1, "กรุณาเลือกบุคคล"),
  title: z.string().trim().min(1, "กรุณากรอกชื่อรายการ"),
  amountDue: z.coerce.number({ invalid_type_error: "ยอดต้องเป็นตัวเลข" }).min(0, "ยอดต้องไม่ติดลบ"),
  amountPaid: z.coerce.number().min(0, "ยอดต้องไม่ติดลบ").default(0),
  dueDate: z.string().default("")
});
export function parseOrThrow(schema, data) {
  const r = schema.safeParse(data);
  if (!r.success) throw new Error(r.error.issues[0].message);
  return r.data;
}
