"use client";
import { useState } from "react";
import { Btn, Field, Notice, inputCls } from "./ui";
export function PersonForm({ initial = {}, onSubmit, onCancel }) {
  const [v, setV] = useState({ name: "", code: "", phone: "", note: "", ...initial }); const [err, setErr] = useState("");
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); try { setErr(""); await onSubmit(v); } catch (x) { setErr(x.message); } }}>
      <Field label="ชื่อ"><input className={inputCls} value={v.name} onChange={set("name")} autoFocus /></Field>
      <Field label="รหัส"><input className={inputCls} value={v.code} onChange={set("code")} /></Field>
      <Field label="เบอร์โทร"><input className={inputCls} inputMode="tel" value={v.phone} onChange={set("phone")} /></Field>
      <Field label="หมายเหตุ"><textarea className={inputCls + " py-3"} rows={2} value={v.note} onChange={set("note")} /></Field>
      {err && <Notice kind="error">{err}</Notice>}
      <div className="flex gap-3"><Btn type="submit" className="flex-1">บันทึก</Btn>{onCancel && <Btn variant="soft" onClick={onCancel}>ยกเลิก</Btn>}</div>
    </form>
  );
}
export function PaymentForm({ initial = {}, people, personId, onSubmit, onCancel }) {
  const [v, setV] = useState({ personId: personId || "", title: "", amountDue: "", amountPaid: 0, dueDate: "", ...initial }); const [err, setErr] = useState("");
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); try { setErr(""); await onSubmit(v); } catch (x) { setErr(x.message); } }}>
      {people && <Field label="บุคคล"><select className={inputCls} value={v.personId} onChange={set("personId")}><option value="">เลือกบุคคล</option>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>}
      <Field label="ชื่อรายการ"><input className={inputCls} value={v.title} onChange={set("title")} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="ยอดที่ต้องชำระ (บาท)"><input className={inputCls} inputMode="decimal" value={v.amountDue} onChange={set("amountDue")} /></Field>
        <Field label="ชำระแล้ว (บาท)"><input className={inputCls} inputMode="decimal" value={v.amountPaid} onChange={set("amountPaid")} /></Field>
      </div>
      <Field label="วันครบกำหนด"><input type="date" className={inputCls} value={v.dueDate} onChange={set("dueDate")} /></Field>
      {err && <Notice kind="error">{err}</Notice>}
      <div className="flex gap-3"><Btn type="submit" className="flex-1">บันทึก</Btn><Btn variant="soft" onClick={onCancel}>ยกเลิก</Btn></div>
    </form>
  );
}
