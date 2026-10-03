import { z } from "zod";
export const runtime = "nodejs";
const MAX = 10 * 1024 * 1024, TYPES = ["image/jpeg", "image/png", "image/webp"];
const out = z.object({ text: z.string(), confidence: z.number().min(0).max(100).nullable().optional() });
const configured = () => Boolean(process.env.OCR_API_URL && process.env.OCR_API_KEY);

export async function GET() { return Response.json({ configured: configured() }); }

export async function POST(req) {
  if (!configured()) return Response.json({ error: "OCR_NOT_CONFIGURED", message: "ยังไม่ได้ตั้งค่า OCR_API_URL / OCR_API_KEY ในเซิร์ฟเวอร์" }, { status: 501 });
  let file;
  try { file = (await req.formData()).get("file"); } catch { return Response.json({ error: "BAD_REQUEST" }, { status: 400 }); }
  if (!(file instanceof Blob)) return Response.json({ error: "NO_FILE" }, { status: 400 });
  if (!TYPES.includes(file.type)) return Response.json({ error: "BAD_MIME" }, { status: 415 });
  if (file.size > MAX) return Response.json({ error: "TOO_LARGE" }, { status: 413 });
  try {
    const fd = new FormData(); fd.append("file", file, "slip");
    const r = await fetch(process.env.OCR_API_URL, { method: "POST", headers: { Authorization: `Bearer ${process.env.OCR_API_KEY}` }, body: fd, signal: AbortSignal.timeout(20000) });
    if (!r.ok) return Response.json({ error: "UPSTREAM_ERROR" }, { status: 502 });
    const j = await r.json();
    const parsed = out.safeParse({ text: j.text ?? j.result?.text, confidence: j.confidence ?? null });
    if (!parsed.success) return Response.json({ error: "BAD_UPSTREAM_RESPONSE" }, { status: 502 });
    return Response.json(parsed.data);
  } catch (e) {
    return Response.json({ error: e.name === "TimeoutError" ? "TIMEOUT" : "UPSTREAM_FAILED" }, { status: 504 });
  }
}
