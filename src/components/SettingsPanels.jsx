"use client";
import { useEffect, useState } from "react";
import { Btn, Card, Field, Notice, inputCls } from "./ui";
import { getIn, setIn } from "@/core/util";
import { settingsRepository } from "@/repositories/settingsRepository";
import { log } from "@/services/activityService";
import { healthCheck, repairSafeIssues, exportBackup, downloadJson, previewBackup, restoreBackup, resetApplication, storageUsage } from "@/services/dbService";
import { bytes } from "@/lib/format";
import { idb } from "@/db/idb";

const OPT = (a) => a.map(([value, label]) => ({ value, label }));
export const SECTIONS = [
  { title: "ทั่วไป", fields: [
    { path: "general.appName", label: "ชื่อแอป", type: "text" },
    { path: "general.currency", label: "สกุลเงิน", type: "select", options: OPT([["THB", "บาท (THB)"]]) },
    { path: "general.timezone", label: "เขตเวลา", type: "select", options: OPT([["Asia/Bangkok", "Asia/Bangkok"]]) },
    { path: "general.accent", label: "สีหลัก", type: "select", options: OPT([["jade", "เขียวหยก"], ["blue", "น้ำเงิน"], ["violet", "ม่วง"], ["rose", "ชมพู"]]) }] },
  { title: "การชำระเงิน", fields: [
    { path: "payment.defaultStatus", label: "สถานะเริ่มต้น", type: "select", options: OPT([["UNPAID", "ยังไม่ชำระ"], ["PARTIAL", "ชำระบางส่วน"]]) },
    { path: "payment.decimals", label: "ทศนิยม", type: "number" }] },
  { title: "สลิปและ OCR", fields: [
    { path: "slip.ocrEnabled", label: "เปิด OCR ในเครื่อง", type: "checkbox" },
    { path: "slip.expectedReceiver", label: "ชื่อผู้รับที่คาดหวัง", type: "text" },
    { path: "slip.receiverMatch", label: "วิธีตรวจผู้รับ", type: "select", options: OPT([["exact", "ตรงทั้งหมด"], ["contains", "มีส่วนที่ตรงกัน"], ["disabled", "ไม่ตรวจ"]]) },
    { path: "slip.amountTolerance", label: "ยอมให้ยอดต่างได้ (บาท)", type: "number" },
    { path: "slip.dateToleranceDays", label: "ช่วงวันที่ยอมรับ", type: "select", num: true, options: OPT([[0, "วันเดียวกัน"], [1, "±1 วัน"], [3, "±3 วัน"], [-1, "ไม่ตรวจ"]]) },
    { path: "slip.confidenceThreshold", label: "เกณฑ์ความมั่นใจ OCR (%)", type: "number" },
    { path: "slip.detectDuplicates", label: "ตรวจสลิปซ้ำ", type: "checkbox" },
    { path: "slip.maxFileSizeMB", label: "ขนาดไฟล์สูงสุด (MB)", type: "number" }] },
  { title: "บริการภายนอก", fields: [
    { path: "external.ocrProvider", label: "OCR Provider", type: "select", options: OPT([["local", "ในเครื่อง (Tesseract.js)"], ["proxy", "ผ่านเซิร์ฟเวอร์ (/api/slip/ocr)"]]) },
    { path: "external.verificationProvider", label: "Verification Provider", type: "select", options: OPT([["none", "ไม่ใช้"], ["proxy", "ผ่านเซิร์ฟเวอร์ (/api/slip/verify)"]]) }] },
  { title: "การแชร์", fields: [
    { path: "share.defaultExpiry", label: "หมดอายุเริ่มต้น", type: "select", options: OPT([["none", "ไม่หมดอายุ"], ["1", "1 วัน"], ["3", "3 วัน"], ["7", "7 วัน"], ["30", "30 วัน"]]) },
    { path: "share.tokenLength", label: "ความยาว token", type: "number" },
    { path: "share.permissions.showSlip", label: "แสดงข้อมูลสลิปเป็นค่าเริ่มต้น", type: "checkbox" },
    { path: "share.permissions.showPhone", label: "แสดงเบอร์โทรเป็นค่าเริ่มต้น", type: "checkbox" }] }
];

export function SettingsForm() {
  const [s, setS] = useState(() => settingsRepository.get()); const [saved, setSaved] = useState(false);
  const change = (f, val) => { setSaved(false); setS(setIn(s, f.path, val)); };
  return (
    <div className="space-y-4">
      {SECTIONS.map((sec) => (
        <Card key={sec.title} className="space-y-4"><h2 className="font-semibold">{sec.title}</h2>
          {sec.fields.map((f) => f.type === "checkbox"
            ? <label key={f.path} className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={!!getIn(s, f.path)} onChange={(e) => change(f, e.target.checked)} />{f.label}</label>
            : <Field key={f.path} label={f.label}>{f.type === "select"
                ? <select className={inputCls} value={getIn(s, f.path)} onChange={(e) => change(f, f.num ? Number(e.target.value) : e.target.value)}>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                : <input className={inputCls} type={f.type} inputMode={f.type === "number" ? "decimal" : undefined} value={getIn(s, f.path)} onChange={(e) => change(f, f.type === "number" ? Number(e.target.value) : e.target.value)} />}</Field>)}
          {sec.title === "บริการภายนอก" && <ApiStatus />}
        </Card>))}
      <Notice>API Key ตั้งที่เซิร์ฟเวอร์ในไฟล์ <code>.env.local</code> (OCR_API_URL, OCR_API_KEY, VERIFY_API_URL, VERIFY_API_KEY) แอปจะไม่เก็บ secret ใน LocalStorage</Notice>
      <Btn className="w-full" onClick={() => { settingsRepository.save(s); log("SETTINGS_UPDATE", "settings", "-"); setSaved(true); }}>บันทึกตั้งค่า</Btn>
      {saved && <Notice kind="ok">บันทึกตั้งค่าแล้ว</Notice>}
    </div>
  );
}

function ApiStatus() {
  const [st, setSt] = useState(null);
  const test = async () => {
    setSt("กำลังทดสอบ…");
    try { const [a, b] = await Promise.all([fetch("/api/slip/ocr").then((r) => r.json()), fetch("/api/slip/verify").then((r) => r.json())]);
      setSt(`OCR: ${a.configured ? "ตั้งค่าแล้ว" : "ยังไม่ตั้งค่า"} · Verify: ${b.configured ? "ตั้งค่าแล้ว" : "ยังไม่ตั้งค่า"}`); }
    catch { setSt("เชื่อมต่อ API ของแอปไม่ได้"); }
  };
  return <div className="space-y-2"><Btn variant="soft" onClick={test}>ทดสอบการเชื่อมต่อ</Btn>{st && <Notice>{st}</Notice>}</div>;
}

export function DatabasePanel() {
  const [h, setH] = useState(null), [usage, setUsage] = useState(null), [fixed, setFixed] = useState(null), [busy, setBusy] = useState(false);
  const run = async () => { setBusy(true); setH(await healthCheck()); setUsage(await storageUsage()); setBusy(false); };
  useEffect(() => { run(); }, []);
  const TONE = { HEALTHY: "ok", WARNING: "warn", ERROR: "error", NOT_INITIALIZED: "info" };
  return (
    <Card className="space-y-3"><h2 className="font-semibold">ฐานข้อมูลและพื้นที่เก็บข้อมูล</h2>
      {h && <><Notice kind={TONE[h.status]}>สถานะ: <b>{h.status}</b> · เวอร์ชัน {h.version ?? "-"} · IndexedDB: {h.idb || "-"}</Notice>
        <ul className="grid grid-cols-2 gap-1 text-sm text-slate-600"><li>คน {h.counts.people ?? 0}</li><li>Payment {h.counts.payments ?? 0}</li><li>สลิป {h.counts.slips ?? 0}</li><li>ผลตรวจ {h.counts.verifications ?? 0}</li><li>ลิงก์แชร์ {h.counts.shares ?? 0}</li></ul>
        {usage && <p className="text-sm text-slate-600">LocalStorage ใช้ {bytes(usage.localStorageBytes)}{usage.used != null && ` · พื้นที่ทั้งเว็บ ${bytes(usage.used)} / ${bytes(usage.quota)}`}</p>}
        {h.issues.length > 0 && <ul className="space-y-1 text-sm">{h.issues.map((i, k) => <li key={k} className={i.severity === "error" ? "text-red-700" : "text-amber-800"}>• {i.message}{i.safe ? " (ซ่อมได้อย่างปลอดภัย)" : ""}</li>)}</ul>}</>}
      {fixed && <Notice kind="ok">{fixed.length ? fixed.join(" · ") : "ไม่มีรายการที่ต้องซ่อม"}</Notice>}
      <div className="flex flex-wrap gap-2"><Btn variant="soft" onClick={run} disabled={busy}>ตรวจสอบฐานข้อมูล</Btn>
        <Btn variant="soft" disabled={busy || !h?.issues.some((i) => i.safe)} onClick={async () => { setFixed(repairSafeIssues()); await run(); }}>Repair Safe Issues</Btn>
        <Btn variant="soft" onClick={async () => { if (confirm("ล้าง OCR cache และภาพย่อชั่วคราว? (ไม่กระทบสลิป)")) { await idb.clear("ocrCache"); await idb.clear("thumbnails"); setFixed(["ล้าง cache แล้ว"]); } }}>ล้าง cache ชั่วคราว</Btn></div>
      <p className="text-xs text-slate-500">การซ่อมจะไม่ลบข้อมูล: ออกรหัสใหม่ให้รายการซ้ำ, สร้างส่วนที่ขาด, ยกเลิกลิงก์ที่วันหมดอายุเสีย ส่วนข้อมูลที่อ้างอิงขาดจะรายงานให้ตรวจเอง</p>
    </Card>
  );
}

export function BackupPanel() {
  const [prev, setPrev] = useState(null), [msg, setMsg] = useState(null), [files, setFiles] = useState(true);
  return (
    <Card className="space-y-3"><h2 className="font-semibold">สำรองและกู้คืน</h2>
      <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={files} onChange={(e) => setFiles(e.target.checked)} />รวมรูปสลิปในไฟล์สำรอง (ไฟล์จะใหญ่ขึ้น)</label>
      <Btn variant="soft" onClick={async () => { downloadJson(await exportBackup({ includeFiles: files }), `slip-manager-backup-${new Date().toISOString().slice(0, 10)}.json`); setMsg({ kind: "ok", text: "ส่งออกไฟล์สำรองแล้ว" }); }}>ส่งออก JSON</Btn>
      <Field label="นำเข้าไฟล์สำรอง"><input type="file" accept="application/json" className="block w-full text-sm" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setMsg(null); setPrev(previewBackup(await f.text())); } e.target.value = ""; }} /></Field>
      {prev && !prev.ok && <Notice kind="error">{prev.errors.join(" · ")}</Notice>}
      {prev?.ok && <div className="space-y-2"><Notice kind="warn">ตัวอย่างข้อมูลที่จะกู้คืน: คน {prev.counts.people}, Payment {prev.counts.payments}, สลิป {prev.counts.slips}, ลิงก์แชร์ {prev.counts.shares}, ไฟล์รูป {prev.counts.files} — <b>ข้อมูลปัจจุบันจะถูกแทนที่ทั้งหมด</b></Notice>
        {prev.issues.length > 0 && <p className="text-sm text-amber-800">พบปัญหาในไฟล์สำรอง {prev.issues.length} รายการ (ตรวจได้หลังกู้คืนในหน้าฐานข้อมูล)</p>}
        <div className="flex gap-2"><Btn onClick={async () => { const p = await restoreBackup(prev.data); setPrev(null); setMsg(p.length ? { kind: "warn", text: "กู้คืนแล้ว แต่ตรวจพบ: " + p.join(" · ") } : { kind: "ok", text: "กู้คืนสำเร็จ และตรวจความสมบูรณ์ผ่านแล้ว" }); }}>ยืนยันกู้คืน</Btn><Btn variant="soft" onClick={() => setPrev(null)}>ยกเลิก</Btn></div></div>}
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
    </Card>
  );
}

export function DangerZone() {
  const [t, setT] = useState("");
  return (
    <Card className="space-y-3 border border-red-200"><h2 className="font-semibold text-red-700">Danger Zone</h2>
      <p className="text-sm text-slate-600">ลบข้อมูลทั้งหมดในเครื่องนี้ (คน, Payment, สลิป, ลิงก์แชร์, ตั้งค่า) กู้คืนไม่ได้ถ้าไม่มีไฟล์สำรอง</p>
      <Field label="พิมพ์ DELETE เพื่อยืนยัน"><input className={inputCls} value={t} onChange={(e) => setT(e.target.value)} /></Field>
      <Btn variant="danger" disabled={t !== "DELETE"} onClick={async () => { await resetApplication(); location.href = "/app"; }}>รีเซ็ตแอป</Btn>
    </Card>
  );
}
