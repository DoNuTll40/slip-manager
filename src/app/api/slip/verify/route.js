import { z } from "zod";
export const runtime = "nodejs";
const body = z.object({ reference: z.string().min(4).max(64), amount: z.number().positive().nullable().optional(), date: z.string().max(10).nullable().optional() });
const configured = () => Boolean(process.env.VERIFY_API_URL && process.env.VERIFY_API_KEY);

export async function GET() { return Response.json({ configured: configured() }); }

export async function POST(req) {
  if (!configured()) return Response.json({ error: "VERIFY_NOT_CONFIGURED", message: "ยังไม่ได้ตั้งค่า VERIFY_API_URL / VERIFY_API_KEY ในเซิร์ฟเวอร์" }, { status: 501 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "BAD_REQUEST", message: "ต้องมีเลขอ้างอิงจากสลิป" }, { status: 400 });
  try {
    const r = await fetch(process.env.VERIFY_API_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.VERIFY_API_KEY}` }, body: JSON.stringify(parsed.data), signal: AbortSignal.timeout(15000) });
    if (!r.ok) return Response.json({ error: "UPSTREAM_ERROR", message: "ผู้ให้บริการตอบกลับผิดพลาด" }, { status: 502 });
    const j = await r.json();
    return Response.json({ verified: Boolean(j.verified ?? j.success) });
  } catch { return Response.json({ error: "UPSTREAM_FAILED", message: "เชื่อมต่อผู้ให้บริการไม่ได้" }, { status: 504 }); }
}
