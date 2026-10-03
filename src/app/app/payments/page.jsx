"use client";
import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Btn, Card, Empty, Loading, Sheet, StatusBadge } from "@/components/ui";
import { PaymentForm } from "@/components/Forms";
import { useLiveData } from "@/hooks/useLiveData";
import { peopleService } from "@/services/peopleService";
import { paymentService } from "@/services/paymentService";
import { effectiveStatus } from "@/core/payment";
import { PAYMENT_LABEL } from "@/lib/labels";
import { money, dateTH } from "@/lib/format";

export default function PaymentsPage() {
  const data = useLiveData(() => ({ people: peopleService.list(), payments: paymentService.list() }));
  const [filter, setFilter] = useState("ALL"), [add, setAdd] = useState(false);
  if (!data) return <Loading />;
  const rows = data.payments.map((p) => ({ ...p, eff: effectiveStatus(p), person: data.people.find((x) => x.id === p.personId) })).filter((p) => filter === "ALL" || p.eff === filter).sort((a, b) => (a.dueDate || "9").localeCompare(b.dueDate || "9"));
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">การชำระเงิน</h1><Btn onClick={() => setAdd(true)} disabled={!data.people.length}><Plus className="h-4 w-4" />เพิ่ม</Btn></div>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="tablist" aria-label="กรองสถานะ">
        {["ALL", ...Object.keys(PAYMENT_LABEL)].map((s) => <button key={s} role="tab" aria-selected={filter === s} onClick={() => setFilter(s)} className={`min-h-11 shrink-0 rounded-full px-4 text-sm ${filter === s ? "bg-jade text-white" : "bg-white text-slate-600"}`}>{s === "ALL" ? "ทั้งหมด" : PAYMENT_LABEL[s]}</button>)}
      </div>
      {!data.people.length ? <Empty title="ต้องมีรายชื่อก่อน" text="เพิ่มคนก่อนจึงจะสร้างรายการชำระได้"><Link href="/app/people/new" className="rounded-full bg-jade px-6 py-3 text-white">เพิ่มคน</Link></Empty>
        : !rows.length ? <Empty title="ไม่มีรายการ" text={filter === "ALL" ? "กด เพิ่ม เพื่อสร้างรายการแรก" : "ไม่มีรายการในสถานะนี้"} />
        : rows.map((p) => (<Link key={p.id} href={`/app/people/${p.personId}`} className="block"><Card className="flex items-center justify-between"><div><div className="font-medium">{p.title}</div><div className="text-sm text-slate-500">{p.person?.name || "-"} · {money(p.amountDue)} · {dateTH(p.dueDate)}</div></div><StatusBadge status={p.eff} /></Card></Link>))}
      <Sheet open={add} onClose={() => setAdd(false)} title="เพิ่มรายการชำระ"><PaymentForm people={data.people} onSubmit={(v) => { paymentService.create(v); setAdd(false); }} onCancel={() => setAdd(false)} /></Sheet>
    </section>
  );
}
