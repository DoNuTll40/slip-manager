"use client";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, RefreshCw, ScanText, Trash2, CheckCircle2 } from "lucide-react";
import { Btn, Notice } from "./ui";
import { useLiveData } from "@/hooks/useLiveData";
import { getSlipForPayment, getVerification, getSlipBlob, saveSlip, removeSlip, validateFile } from "@/services/slipService";
import { runVerification, verifyWithProvider } from "@/services/verificationService";
import { paymentService } from "@/services/paymentService";
import { settingsRepository } from "@/repositories/settingsRepository";
import { money, dateTH, dateTimeTH, bytes } from "@/lib/format";
import { VERIFY_LABEL, SLIP_LEVEL_LABEL, BANK_LABEL } from "@/lib/labels";

function useBlobUrl(getBlob, key) {
  const [url, setUrl] = useState(null);
  useEffect(() => { let u, alive = true; (async () => { const b = key && (await getBlob()); if (b && alive) { u = URL.createObjectURL(b); setUrl(u); } else setUrl(null); })(); return () => { alive = false; if (u) URL.revokeObjectURL(u); }; /* eslint-disable-next-line */ }, [key]);
  return url;
}
const Row = ({ k, v }) => <div className="flex justify-between gap-4 text-sm"><span className="text-slate-500">{k}</span><span className="text-right">{v ?? "-"}</span></div>;

export default function SlipPanel({ payment }) {
  const slip = useLiveData(() => getSlipForPayment(payment.id), [payment.id]);
  const ver = useLiveData(() => (slip ? getVerification(slip.id) : null), [slip?.id]);
  const providerOn = settingsRepository.get().external.verificationProvider === "proxy";
  const input = useRef(null);
  const [pending, setPending] = useState(null); // { file, url }
  const [busy, setBusy] = useState(null); const [msg, setMsg] = useState(null);
  const savedUrl = useBlobUrl(() => getSlipBlob(slip.id), slip?.id);
  useEffect(() => () => pending && URL.revokeObjectURL(pending.url), [pending]);

  const choose = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
    const v = await validateFile(file);
    if (!v.ok) return setMsg({ kind: "error", text: v.errors[0] });
    setMsg(null); setPending({ file, url: URL.createObjectURL(file) });
  };
  const verify = async (slipId) => {
    setBusy({ stage: "เริ่มตรวจ", progress: 0 });
    try { await runVerification(slipId, setBusy); setMsg({ kind: "ok", text: "ตรวจสลิปเสร็จแล้ว" }); }
    catch (x) { setMsg({ kind: "error", text: "ตรวจสลิปไม่สำเร็จ: " + x.message }); } finally { setBusy(null); }
  };
  const save = async () => {
    setBusy({ stage: "กำลังบันทึก", progress: 0 });
    try { const m = await saveSlip({ file: pending.file, personId: payment.personId, paymentId: payment.id }); setPending(null); await verify(m.id); }
    catch (x) { setMsg({ kind: "error", text: x.message }); setBusy(null); }
  };

  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={choose} />
      {pending && (
        <div className="space-y-3"><img src={pending.url} alt="ตัวอย่างสลิปก่อนบันทึก" className="max-h-72 w-full rounded-xl bg-mist object-contain" />
          <div className="flex gap-3"><Btn className="flex-1" onClick={save} disabled={!!busy}>บันทึกและตรวจสลิป</Btn><Btn variant="soft" onClick={() => setPending(null)}>ยกเลิก</Btn></div></div>
      )}
      {!pending && slip && (
        <div className="space-y-3">
          {savedUrl && <img src={savedUrl} alt={`สลิป ${slip.fileName}`} className="max-h-72 w-full rounded-xl bg-mist object-contain" />}
          <Row k="ไฟล์" v={`${slip.fileName} (${bytes(slip.fileSize)})`} /><Row k="อัปโหลดเมื่อ" v={dateTimeTH(slip.uploadedAt)} />
          {slip.duplicateOf && <Notice kind="warn">พบสลิปไฟล์เดียวกันในระบบแล้ว ระบบจะไม่เปลี่ยนสถานะเป็นชำระแล้วอัตโนมัติ</Notice>}
        </div>
      )}
      {busy && <Notice>{busy.stage} {Math.round((busy.progress || 0) * 100)}%</Notice>}
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {ver && !pending && (
        <div className="space-y-2 rounded-xl bg-mist p-4">
          <Row k="สถานะ Payment" v={payment.status} /><Row k="ผลตรวจสลิป" v={`${VERIFY_LABEL[ver.status]} · ${SLIP_LEVEL_LABEL[ver.levels.slip]}`} />
          <Row k="ตรวจกับธนาคาร" v={BANK_LABEL[ver.levels.bank]} /><Row k="ความมั่นใจ" v={`${ver.confidence}% (${ver.engine === "proxy" ? "OCR ภายนอก" : "OCR ในเครื่อง"})`} />
          <hr className="border-slate-200" />
          <Row k="ยอดในสลิป" v={ver.ocr.amount != null ? money(ver.ocr.amount) : null} /><Row k="ผู้รับ" v={ver.ocr.receiverName} /><Row k="วันที่โอน" v={ver.ocr.transferDate ? `${dateTH(ver.ocr.transferDate)} ${ver.ocr.transferTime || ""}` : null} /><Row k="เลขอ้างอิง" v={ver.ocr.referenceNumber} />
          <ul className="space-y-1 pt-2 text-sm">{Object.entries(ver.checks).map(([k, c]) => <li key={k} className={c.matched ? "text-jade" : "text-red-700"}>{c.matched ? "✓" : "✗"} {c.message}</li>)}</ul>
          {ver.warnings.map((w, i) => <p key={i} className="text-sm text-amber-800">⚠ {w}</p>)}
          <p className="pt-1 text-xs text-slate-500">ผลนี้ตรวจจากข้อมูลบนรูปสลิปเท่านั้น ไม่ได้ยืนยันว่าเงินเข้าบัญชีจริง</p>
          {providerOn && <Btn variant="soft" onClick={async () => { try { await verifyWithProvider(ver.id); setMsg({ kind: "ok", text: "ตรวจกับผู้ให้บริการแล้ว" }); } catch (x) { setMsg({ kind: "error", text: x.message }); } }}>ตรวจกับผู้ให้บริการ</Btn>}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {!pending && <Btn variant="soft" onClick={() => input.current.click()} disabled={!!busy}><ImagePlus className="h-4 w-4" />{slip ? "เปลี่ยนสลิป" : "อัปโหลดสลิป"}</Btn>}
        {slip && !pending && <Btn variant="soft" onClick={() => verify(slip.id)} disabled={!!busy}><ScanText className="h-4 w-4" />ตรวจอีกครั้ง</Btn>}
        {slip && !pending && <Btn variant="soft" onClick={() => confirm("ลบสลิปนี้?") && removeSlip(slip.id)} disabled={!!busy}><Trash2 className="h-4 w-4" />ลบสลิป</Btn>}
        {payment.status !== "PAID" && (slip || payment.status === "PENDING_REVIEW") && <Btn onClick={() => confirm("ยืนยันว่าได้รับเงินแล้วและตั้งเป็น 'ชำระแล้ว'?") && paymentService.markPaid(payment.id)}><CheckCircle2 className="h-4 w-4" />ยืนยันว่าชำระแล้ว</Btn>}
        {payment.status === "PENDING_REVIEW" && <Btn variant="soft" onClick={() => paymentService.reject(payment.id)}>ปฏิเสธ</Btn>}
      </div>
    </div>
  );
}
