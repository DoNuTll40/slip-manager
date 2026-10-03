"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, Empty, Loading } from "@/components/ui";
import ShareLimit from "@/components/ShareLimit";
import { useLiveData } from "@/hooks/useLiveData";
import { shareService } from "@/services/shareService";
import { shareState } from "@/core/shareLogic";
import { dateTimeTH } from "@/lib/format";
const STATE = { ACTIVE: ["ใช้งานอยู่", "bg-jade-soft text-jade"], REVOKED: ["ยกเลิกแล้ว", "bg-red-100 text-red-700"], EXPIRED: ["หมดอายุ", "bg-slate-200 text-slate-700"] };
export default function SharesPage() {
  const shares = useLiveData(() => shareService.list());
  if (!shares) return <Loading />;
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">ลิงก์แชร์</h1><Link href="/app/shares/new" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-jade px-5 text-white"><Plus className="h-4 w-4" />สร้าง</Link></div>
      <ShareLimit />
      {!shares.length ? <Empty title="ยังไม่มีลิงก์แชร์" text="สร้างลิงก์เพื่อให้ผู้อื่นดูสรุปการชำระ โดยเลือกได้ว่าจะแสดงอะไร" /> :
        shares.map((s) => { const st = shareState(s), [l, c] = STATE[st]; return (
          <Link key={s.id} href={`/app/shares/${s.id}`} className="block"><Card><div className="flex items-start justify-between gap-3"><div><div className="font-medium">{s.title}</div>
            <div className="text-sm text-slate-500">สร้าง {dateTimeTH(s.createdAt)} · {s.expiresAt ? `หมดอายุ ${dateTimeTH(s.expiresAt)}` : "ไม่หมดอายุ"} · {s.passwordHash ? "มีรหัสผ่าน" : "ไม่มีรหัสผ่าน"}</div></div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${c}`}>{l}</span></div></Card></Link>); })}
    </section>
  );
}
