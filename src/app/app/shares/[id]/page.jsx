"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Download, RefreshCw } from "lucide-react";
import { Btn, Card, Empty, Field, Loading, Notice, Sheet, inputCls } from "@/components/ui";
import ShareForm from "@/components/ShareForm";
import ShareLimit from "@/components/ShareLimit";
import { useLiveData } from "@/hooks/useLiveData";
import { shareService } from "@/services/shareService";
import { downloadJson } from "@/services/dbService";
import { shareState } from "@/core/shareLogic";
import { dateTimeTH } from "@/lib/format";

export default function ShareDetail() {
  const { id } = useParams(), router = useRouter();
  const s = useLiveData(() => shareService.get(id), [id]);
  const [edit, setEdit] = useState(false), [pkg, setPkg] = useState(false), [pw, setPw] = useState(""), [msg, setMsg] = useState(null);
  if (s === undefined) return <Loading />;
  if (!s) return <Empty title="ไม่พบลิงก์นี้"><Link href="/app/shares" className="rounded-full bg-jade px-6 py-3 text-white">กลับ</Link></Empty>;
  const st = shareState(s), url = `${location.origin}/s/${s.token}`;
  const doExport = async () => { try { downloadJson(await shareService.exportPackage(s.id, pw), `share-${s.token.slice(0, 6)}.json`); setPkg(false); setPw(""); setMsg({ kind: "ok", text: "ส่งออก Share Package แล้ว" }); } catch (x) { setMsg({ kind: "error", text: x.message }); } };
  return (
    <section className="space-y-4">
      <Link href="/app/shares" className="text-sm text-jade">← ลิงก์แชร์</Link>
      <h1 className="text-2xl font-semibold">{s.title}</h1><ShareLimit />
      <Card className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">สถานะ</span><span className="font-medium">{{ ACTIVE: "ใช้งานอยู่", REVOKED: "ยกเลิกแล้ว", EXPIRED: "หมดอายุ" }[st]}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">หมดอายุ</span><span>{s.expiresAt ? dateTimeTH(s.expiresAt) : "ไม่หมดอายุ"}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">รหัสผ่าน</span><span>{s.passwordHash ? "มี" : "ไม่มี"}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Snapshot ล่าสุด</span><span>{dateTimeTH(s.snapshotAt)}</span></div>
        <div className="break-all rounded-xl bg-mist p-3">{url}</div>
      </Card>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="flex flex-wrap gap-2">
        <Btn variant="soft" onClick={async () => { await navigator.clipboard.writeText(url); setMsg({ kind: "ok", text: "คัดลอกลิงก์แล้ว (เปิดได้เฉพาะในเครื่องนี้)" }); }}><Copy className="h-4 w-4" />คัดลอก</Btn>
        <Btn variant="soft" onClick={() => (s.passwordHash ? setPkg(true) : doExport())}><Download className="h-4 w-4" />ส่งออก Share Package</Btn>
        <Btn variant="soft" onClick={() => { shareService.refreshSnapshot(s.id); setMsg({ kind: "ok", text: "อัปเดต snapshot เป็นข้อมูลล่าสุดแล้ว" }); }}><RefreshCw className="h-4 w-4" />อัปเดต snapshot</Btn>
        <Btn variant="soft" onClick={() => setEdit(true)}>แก้ไข</Btn>
        {st === "REVOKED" ? <Btn onClick={() => shareService.reenable(s.id)}>เปิดใช้อีกครั้ง</Btn> : <Btn variant="soft" onClick={() => confirm("ยกเลิกลิงก์นี้? (ยังไม่ลบ เปิดใช้ใหม่ได้)") && shareService.revoke(s.id)}>ยกเลิกลิงก์</Btn>}
        <Btn variant="danger" onClick={() => { if (confirm("ลบลิงก์นี้ถาวร?")) { shareService.remove(s.id); router.push("/app/shares"); } }}>ลบ</Btn>
      </div>
      <Sheet open={edit} onClose={() => setEdit(false)} title="แก้ไขลิงก์"><ShareForm initial={s} onSubmit={async (v) => { await shareService.update(s.id, v); setEdit(false); }} onCancel={() => setEdit(false)} /></Sheet>
      <Sheet open={pkg} onClose={() => setPkg(false)} title="เข้ารหัส Share Package"><div className="space-y-4"><p className="text-sm text-slate-600">ลิงก์นี้มีรหัสผ่าน ใส่รหัสผ่านเพื่อเข้ารหัสข้อมูลในไฟล์ (AES-GCM) ผู้รับต้องใช้รหัสเดียวกันจึงเปิดได้</p>
        <Field label="รหัสผ่านของลิงก์"><input type="password" className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} /></Field><Btn onClick={doExport} className="w-full">ส่งออก</Btn></div></Sheet>
    </section>
  );
}
