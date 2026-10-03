"use client";
import { useState } from "react";
import { Btn, Field, Notice, inputCls } from "./ui";
import { EXPIRY_OPTIONS } from "@/core/shareLogic";
import { settingsRepository } from "@/repositories/settingsRepository";
const PERMS = [["showKPI", "สรุปตัวเลข (KPI)"], ["showPeople", "ชื่อบุคคล"], ["showAmount", "ยอดเงิน"], ["showStatus", "สถานะ"], ["showSlip", "ข้อมูลสลิป (ชื่อไฟล์/ผลตรวจ ไม่รวมรูป)"], ["showPhone", "เบอร์โทร"], ["showNote", "หมายเหตุ"]];
export default function ShareForm({ initial, onSubmit, onCancel }) {
  const d = settingsRepository.get().share, editing = Boolean(initial);
  const [v, setV] = useState({ title: initial?.title || "", description: initial?.description || "", expiry: editing ? "keep" : d.defaultExpiry, customExpiry: "", password: "", removePassword: false, permissions: initial?.permissions || d.permissions });
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const opts = editing ? [{ value: "keep", label: "คงวันหมดอายุเดิม" }, ...EXPIRY_OPTIONS] : EXPIRY_OPTIONS;
  return (
    <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); setErr(""); if (!v.title.trim()) return setErr("กรุณากรอกชื่อลิงก์"); if (v.expiry === "custom" && !v.customExpiry) return setErr("กรุณาเลือกวันหมดอายุ"); setBusy(true); try { await onSubmit(v); } catch (x) { setErr(x.message); setBusy(false); } }}>
      <Field label="ชื่อลิงก์"><input className={inputCls} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} /></Field>
      <Field label="คำอธิบาย"><textarea className={inputCls + " py-3"} rows={2} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></Field>
      <Field label="หมดอายุ"><select className={inputCls} value={v.expiry} onChange={(e) => setV({ ...v, expiry: e.target.value })}>{opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
      {v.expiry === "custom" && <Field label="วันที่หมดอายุ"><input type="datetime-local" className={inputCls} value={v.customExpiry} onChange={(e) => setV({ ...v, customExpiry: e.target.value })} /></Field>}
      <Field label={editing && initial.passwordHash ? "รหัสผ่านใหม่ (เว้นว่างเพื่อใช้ของเดิม)" : "รหัสผ่าน (ไม่บังคับ)"}><input type="password" autoComplete="new-password" className={inputCls} value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} /></Field>
      {editing && initial.passwordHash && <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={v.removePassword} onChange={(e) => setV({ ...v, removePassword: e.target.checked })} />ลบรหัสผ่าน</label>}
      <fieldset className="space-y-1"><legend className="mb-1 text-sm text-slate-600">สิทธิ์การมองเห็น</legend>
        {PERMS.map(([k, l]) => <label key={k} className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={!!v.permissions[k]} onChange={(e) => setV({ ...v, permissions: { ...v.permissions, [k]: e.target.checked } })} />{l}</label>)}</fieldset>
      {err && <Notice kind="error">{err}</Notice>}
      <div className="flex gap-3"><Btn type="submit" className="flex-1" disabled={busy}>บันทึก</Btn><Btn variant="soft" onClick={onCancel}>ยกเลิก</Btn></div>
    </form>
  );
}
