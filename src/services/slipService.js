import { slipRepository } from "@/repositories/slipRepository";
import { verificationRepository } from "@/repositories/verificationRepository";
import { settingsRepository } from "@/repositories/settingsRepository";
import { sha256Hex } from "@/core/crypto";
import { idb } from "@/db/idb";
import { log } from "./activityService";

const ALLOWED = { "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"], "image/webp": ["webp"] };

export async function validateFile(file) {
  const s = settingsRepository.get().slip, errors = [];
  const ext = file.name.split(".").pop().toLowerCase();
  if (!ALLOWED[file.type]) errors.push("รองรับเฉพาะไฟล์ JPG, PNG และ WebP (ยังไม่รองรับ PDF)");
  else if (!ALLOWED[file.type].includes(ext)) errors.push("นามสกุลไฟล์ไม่ตรงกับชนิดไฟล์");
  if (file.size > s.maxFileSizeMB * 1048576) errors.push(`ไฟล์ใหญ่เกิน ${s.maxFileSizeMB} MB`);
  let width = 0, height = 0;
  if (!errors.length) {
    try { const b = await createImageBitmap(file); width = b.width; height = b.height; b.close(); if (width < 200 || height < 200) errors.push("รูปเล็กเกินไป (ต้องอย่างน้อย 200×200 พิกเซล)"); }
    catch { errors.push("เปิดไฟล์รูปไม่ได้ ไฟล์อาจเสียหาย"); }
  }
  return { ok: errors.length === 0, errors, width, height };
}

export const getSlipForPayment = (paymentId) => slipRepository.list().find((s) => s.paymentId === paymentId) || null;
export const getVerification = (slipId) => verificationRepository.list().find((v) => v.slipId === slipId) || null;
export const getSlipBlob = (id) => idb.get("slipFiles", id);

export async function removeSlip(slipId, { silent = false } = {}) {
  const slip = slipRepository.get(slipId); if (!slip) return;
  verificationRepository.list().filter((v) => v.slipId === slipId).forEach((v) => verificationRepository.remove(v.id));
  slipRepository.remove(slipId);
  try { await idb.delete("slipFiles", slipId); } catch {}
  if (!silent) log("SLIP_DELETE", "slip", slipId, { fileName: slip.fileName });
}

export async function saveSlip({ file, personId, paymentId }) {
  const v = await validateFile(file); if (!v.ok) throw new Error(v.errors[0]);
  const fileHash = await sha256Hex(await file.arrayBuffer());
  const old = getSlipForPayment(paymentId); if (old) await removeSlip(old.id, { silent: true });
  const dup = settingsRepository.get().slip.detectDuplicates ? slipRepository.list().find((s) => s.fileHash === fileHash) : null;
  const meta = slipRepository.create({ personId, paymentId, fileName: file.name, mimeType: file.type, fileSize: file.size, fileHash, width: v.width, height: v.height, uploadedAt: new Date().toISOString(), duplicateOf: dup ? dup.id : null });
  try { await idb.put("slipFiles", meta.id, file); } catch (e) { slipRepository.remove(meta.id); throw new Error("บันทึกไฟล์ลง IndexedDB ไม่สำเร็จ: " + e.message); }
  log("SLIP_UPLOAD", "slip", meta.id, { fileName: file.name, duplicate: Boolean(dup) });
  return meta;
}
