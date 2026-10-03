import { slipRepository } from "@/repositories/slipRepository";
import { paymentRepository } from "@/repositories/paymentRepository";
import { verificationRepository } from "@/repositories/verificationRepository";
import { settingsRepository } from "@/repositories/settingsRepository";
import { parseSlipText } from "@/core/parser";
import { verifySlip } from "@/core/verification";
import { PAYMENT_STATUS as P, VERIFY_STATUS as V, BANK_LEVEL } from "@/core/constants";
import { recognizeSlip } from "@/lib/ocr/engine";
import { getSlipBlob } from "./slipService";
import { log } from "./activityService";

export async function runVerification(slipId, onProgress) {
  const slip = slipRepository.get(slipId); if (!slip) throw new Error("ไม่พบสลิป");
  const payment = paymentRepository.get(slip.paymentId), settings = settingsRepository.get();
  const blob = await getSlipBlob(slipId); if (!blob) throw new Error("ไม่พบไฟล์สลิปใน IndexedDB");
  const ocr = await recognizeSlip(blob, settings, onProgress);
  const ocrData = { ...parseSlipText(ocr.text), confidence: ocr.confidence };
  const result = verifySlip({ ocrData, payment, settings, context: { duplicate: Boolean(slip.duplicateOf) } });
  result.warnings.push(...ocr.warnings);
  verificationRepository.list().filter((v) => v.slipId === slipId).forEach((v) => verificationRepository.remove(v.id));
  const rec = verificationRepository.create({ slipId, paymentId: payment.id, ...result, ocr: ocrData, engine: ocr.engine, verifiedAt: new Date().toISOString() });
  // Slip verification is document-level only: it never sets PAID.
  if (payment.status !== P.PAID) paymentRepository.update(payment.id, { status: result.status === V.REJECTED ? P.REJECTED : P.PENDING_REVIEW });
  log("SLIP_VERIFY", "slip", slipId, { status: result.status, engine: ocr.engine });
  return rec;
}

// Optional: asks the server-side proxy to confirm the transaction with a bank/verification provider.
export async function verifyWithProvider(verificationId) {
  const v = verificationRepository.get(verificationId); if (!v) throw new Error("ไม่พบผลตรวจ");
  const res = await fetch("/api/slip/verify", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference: v.ocr.referenceNumber, amount: v.ocr.amount, date: v.ocr.transferDate }) });
  const j = await res.json();
  if (!res.ok) throw new Error(j.message || "เรียกบริการตรวจสอบไม่สำเร็จ");
  verificationRepository.update(v.id, { levels: { ...v.levels, bank: j.verified ? BANK_LEVEL.VERIFIED : BANK_LEVEL.MISMATCH } });
}
