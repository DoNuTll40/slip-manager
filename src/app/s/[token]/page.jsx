"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { getShareProvider } from "@/services/shareService";
import { shareState } from "@/core/shareLogic";
import { verifyPassword, decryptJson } from "@/core/crypto";
import { PAYMENT_LABEL } from "@/lib/labels";
import { money, dateTimeTH, dateTH } from "@/lib/format";

const KEY = (t) => "psm-pkg:" + t;
const Box = ({ children }) => <div className="rounded-3xl bg-white p-6 shadow-sm">{children}</div>;
const Msg = ({ title, text }) => <Box><ShieldAlert className="mb-3 h-8 w-8 text-slate-400" aria-hidden /><h1 className="text-xl font-semibold">{title}</h1><p className="mt-2 text-slate-600">{text}</p></Box>;

function View({ share, snap }) {
  const k = snap.kpi;
  return (
    <div className="space-y-4">
      <Box><h1 className="text-xl font-semibold">{share.title}</h1>{share.description && <p className="mt-1 text-slate-600">{share.description}</p>}<p className="mt-2 text-xs text-slate-400">ข้อมูล ณ {dateTimeTH(snap.generatedAt)}</p></Box>
      {k && <div className="grid grid-cols-2 gap-3">
        {k.people != null && <Box><div className="text-sm text-slate-500">คน</div><div className="text-xl font-semibold">{k.people}</div></Box>}
        <Box><div className="text-sm text-slate-500">รายการ</div><div className="text-xl font-semibold">{k.payments}</div></Box>
        {k.amountTotal != null && <><Box><div className="text-sm text-slate-500">ยอดรวม</div><div className="text-xl font-semibold">{money(k.amountTotal)}</div></Box><Box><div className="text-sm text-slate-500">ชำระแล้ว</div><div className="text-xl font-semibold text-jade">{money(k.amountPaid)}</div></Box></>}
      </div>}
      <ul className="space-y-3">{snap.rows.map((r, i) => (
        <li key={i}><Box><div className="flex items-start justify-between gap-3"><div><div className="font-medium">{r.person}</div><div className="text-sm text-slate-500">{r.title}</div></div>
          {r.status && <span className="rounded-full bg-mist px-3 py-1 text-xs">{PAYMENT_LABEL[r.status]}</span>}</div>
          {r.amountDue != null && <div className="mt-2 text-sm">{money(r.amountPaid)} / {money(r.amountDue)}</div>}
          {r.phone && <div className="mt-1 text-sm text-slate-500">โทร {r.phone}</div>}{r.note && <div className="mt-1 text-sm text-slate-500">{r.note}</div>}
          {"slip" in r && <div className="mt-1 text-sm text-slate-500">{r.slip ? `สลิป: ${r.slip.fileName} (${dateTH(r.slip.uploadedAt)})` : "ยังไม่มีสลิป"}</div>}</Box></li>))}</ul>
    </div>
  );
}

export default function PublicShare() {
  const { token } = useParams();
  const [state, setState] = useState({ phase: "loading" });
  const [pw, setPw] = useState(""), [err, setErr] = useState("");

  const load = () => {
    const local = getShareProvider().resolve(token);
    if (local) return setState({ phase: "found", share: local, snapshot: local.snapshot, local: true });
    try { const p = JSON.parse(sessionStorage.getItem(KEY(token)) || "null"); if (p) return setState({ phase: "found", share: p.share, snapshot: p.snapshot || null, encrypted: p.encrypted || null }); } catch {}
    setState({ phase: "missing" });
  };
  useEffect(load, [token]);

  const openFile = async (e) => {
    const f = e.target.files?.[0]; if (!f) return; setErr("");
    try {
      const p = JSON.parse(await f.text());
      if (p.format !== "slip-manager-share-package" || p.share?.token !== token) throw new Error();
      sessionStorage.setItem(KEY(token), JSON.stringify(p)); load();
    } catch { setErr("ไฟล์นี้ไม่ใช่ Share Package ของลิงก์นี้"); }
  };
  const unlock = async (e) => {
    e.preventDefault(); setErr("");
    try {
      if (state.encrypted) { const snap = await decryptJson(state.encrypted, pw); setState({ ...state, snapshot: snap, unlocked: true }); }
      else if (await verifyPassword(pw, state.share.passwordSalt, state.share.passwordHash)) setState({ ...state, unlocked: true });
      else throw new Error();
    } catch { setErr("รหัสผ่านไม่ถูกต้อง"); }
  };

  if (state.phase === "loading") return <p className="py-10 text-center text-slate-500">กำลังโหลด…</p>;
  if (state.phase === "missing") return (
    <Box><ShieldAlert className="mb-3 h-8 w-8 text-slate-400" aria-hidden /><h1 className="text-xl font-semibold">ไม่พบข้อมูลของลิงก์นี้ในเครื่องนี้</h1>
      <p className="mt-2 text-slate-600">ข้อมูลของระบบเก็บในเบราว์เซอร์ของเจ้าของ จึงเปิดข้ามเครื่องผ่าน URL ไม่ได้ หากเจ้าของส่ง Share Package (ไฟล์ .json) มาให้ เลือกไฟล์ด้านล่าง</p>
      <input type="file" accept="application/json" onChange={openFile} aria-label="เลือกไฟล์ Share Package" className="mt-4 block w-full text-sm" />{err && <p role="alert" className="mt-3 text-red-700">{err}</p>}</Box>);
  const { share } = state, st = shareState(share);
  if (st === "REVOKED") return <Msg title="ลิงก์ถูกยกเลิก" text="เจ้าของยกเลิกการแชร์นี้แล้ว" />;
  if (st === "EXPIRED") return <Msg title="Link expired" text="ลิงก์นี้หมดอายุแล้ว" />;
  const needPw = (share.passwordHash || share.passwordProtected) && !state.unlocked;
  if (needPw) return (
    <Box><LockKeyhole className="mb-3 h-8 w-8 text-jade" aria-hidden /><h1 className="text-xl font-semibold">ลิงก์นี้มีรหัสผ่าน</h1>
      <form onSubmit={unlock} className="mt-4 space-y-3"><input type="password" autoFocus aria-label="รหัสผ่าน" value={pw} onChange={(e) => setPw(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 px-4" />
        {err && <p role="alert" className="text-red-700">{err}</p>}<button className="min-h-11 w-full rounded-full bg-jade font-medium text-white">เปิดดู</button></form></Box>);
  return <View share={share} snap={state.snapshot} />;
}
