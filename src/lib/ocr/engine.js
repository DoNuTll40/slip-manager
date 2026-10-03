import { PROFILES, renderProfile } from "./preprocess";
import { parseSlipText } from "@/core/parser";

const score = (text, conf) => { const p = parseSlipText(text); return conf + [p.amount, p.transferDate, p.referenceNumber, p.receiverName].filter((x) => x != null).length * 8; };

async function viaProxy(blob) {
  const fd = new FormData(); fd.append("file", blob, "slip");
  const r = await fetch("/api/slip/ocr", { method: "POST", body: fd });
  if (!r.ok) throw new Error("proxy " + r.status);
  const j = await r.json();
  return { text: j.text, confidence: j.confidence ?? 70, engine: "proxy", warnings: [] };
}

export async function recognizeSlip(blob, settings, onProgress = () => {}) {
  const warnings = [];
  if (settings.external.ocrProvider === "proxy") {
    try { return await viaProxy(blob); } catch { warnings.push("OCR ภายนอกใช้ไม่ได้ จึงใช้ OCR ในเครื่องแทน"); }
  }
  if (!settings.slip.ocrEnabled) throw new Error("ปิด OCR อยู่ในตั้งค่า");
  const { createWorker } = await import("tesseract.js"); // loaded only when needed
  onProgress({ stage: "กำลังโหลด OCR (ครั้งแรกอาจใช้เวลา)", progress: 0 });
  const worker = await createWorker(settings.slip.languages, 1, { logger: (m) => { if (typeof m.progress === "number") onProgress({ stage: m.status, progress: m.progress }); } });
  try {
    let best = null;
    for (const profile of PROFILES) {
      onProgress({ stage: `อ่านสลิป (${profile})`, progress: 0 });
      const { data } = await worker.recognize(await renderProfile(blob, profile));
      const s = score(data.text, data.confidence);
      if (!best || s > best.s) best = { s, text: data.text, confidence: data.confidence };
      if (data.confidence >= settings.slip.confidenceThreshold + 15 && parseSlipText(data.text).amount != null) break;
    }
    return { text: best.text, confidence: Math.round(best.confidence), engine: "local", warnings };
  } finally { await worker.terminate(); }
}
