"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Card, Empty, Loading, inputCls } from "@/components/ui";
import { useLiveData } from "@/hooks/useLiveData";
import { peopleService } from "@/services/peopleService";
import { paymentService } from "@/services/paymentService";
import { effectiveStatus } from "@/core/payment";
import { money } from "@/lib/format";

export default function PeoplePage() {
  const data = useLiveData(() => ({ people: peopleService.list(), payments: paymentService.list() }));
  const [q, setQ] = useState(""), [sort, setSort] = useState("name"), [filter, setFilter] = useState("all");
  const rows = useMemo(() => {
    if (!data) return [];
    let r = data.people.map((p) => { const pays = data.payments.filter((x) => x.personId === p.id); return { ...p, count: pays.length, owed: pays.filter((x) => effectiveStatus(x) !== "PAID").reduce((s, x) => s + Math.max(x.amountDue - x.amountPaid, 0), 0) }; });
    const t = q.trim().toLowerCase();
    if (t) r = r.filter((p) => [p.name, p.code, p.phone].some((v) => (v || "").toLowerCase().includes(t)));
    if (filter === "owing") r = r.filter((p) => p.owed > 0); if (filter === "clear") r = r.filter((p) => p.owed === 0);
    return r.sort((a, b) => (sort === "owed" ? b.owed - a.owed : sort === "recent" ? b.createdAt.localeCompare(a.createdAt) : a.name.localeCompare(b.name, "th")));
  }, [data, q, sort, filter]);
  if (!data) return <Loading />;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">รายชื่อ</h1>
      <div className="relative"><Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" aria-hidden /><input aria-label="ค้นหา" placeholder="ค้นหาชื่อ รหัส หรือเบอร์" className={inputCls + " pl-12"} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="flex gap-2">
        <select aria-label="กรอง" className={inputCls} value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">ทั้งหมด</option><option value="owing">มียอดค้าง</option><option value="clear">ไม่มียอดค้าง</option></select>
        <select aria-label="เรียง" className={inputCls} value={sort} onChange={(e) => setSort(e.target.value)}><option value="name">เรียงตามชื่อ</option><option value="owed">ยอดค้างมากสุด</option><option value="recent">เพิ่มล่าสุด</option></select>
      </div>
      {!data.people.length ? <Empty title="ยังไม่มีรายชื่อ" text="เพิ่มคนแรกเพื่อเริ่มกำหนดยอดชำระ"><Link href="/app/people/new" className="rounded-full bg-jade px-6 py-3 font-medium text-white">เพิ่มคน</Link></Empty>
        : !rows.length ? <Empty title="ไม่พบรายชื่อที่ค้นหา" /> :
        <ul className="space-y-3">{rows.map((p) => (
          <li key={p.id}><Link href={`/app/people/${p.id}`}><Card className="flex items-center justify-between"><div><div className="font-medium">{p.name}</div><div className="text-sm text-slate-500">{[p.code, `${p.count} รายการ`].filter(Boolean).join(" · ")}</div></div>
            <div className={`text-right text-sm ${p.owed ? "font-medium text-orange-700" : "text-slate-400"}`}>{p.owed ? `ค้าง ${money(p.owed)}` : "ไม่มียอดค้าง"}</div></Card></Link></li>))}</ul>}
      <Link href="/app/people/new" aria-label="เพิ่มคน" className="fixed bottom-20 right-5 z-10 grid h-14 w-14 place-items-center rounded-full bg-jade text-white shadow-lg md:bottom-8"><Plus /></Link>
    </section>
  );
}
