"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2, ChevronDown } from "lucide-react";
import { Btn, Card, Empty, Loading, Sheet, StatusBadge } from "@/components/ui";
import { PersonForm, PaymentForm } from "@/components/Forms";
import SlipPanel from "@/components/SlipPanel";
import { useLiveData } from "@/hooks/useLiveData";
import { peopleService } from "@/services/peopleService";
import { paymentService } from "@/services/paymentService";
import { effectiveStatus } from "@/core/payment";
import { money, dateTH } from "@/lib/format";

export default function PersonDetail() {
  const { id } = useParams(), router = useRouter();
  const data = useLiveData(() => ({ person: peopleService.get(id), payments: paymentService.list().filter((p) => p.personId === id) }), [id]);
  const [sheet, setSheet] = useState(null), [open, setOpen] = useState(null);
  if (!data) return <Loading />;
  if (!data.person) return <Empty title="ไม่พบบุคคลนี้" text="อาจถูกลบไปแล้ว"><Link href="/app/people" className="rounded-full bg-jade px-6 py-3 text-white">กลับไปรายชื่อ</Link></Empty>;
  const { person, payments } = data;
  return (
    <section className="space-y-5">
      <Link href="/app/people" className="text-sm text-jade">← รายชื่อ</Link>
      <Card><div className="flex items-start justify-between"><div><h1 className="text-xl font-semibold">{person.name}</h1><p className="text-sm text-slate-500">{[person.code, person.phone].filter(Boolean).join(" · ") || "ไม่มีรหัส/เบอร์"}</p>{person.note && <p className="mt-2 text-sm">{person.note}</p>}</div>
        <div className="flex gap-2"><Btn variant="soft" aria-label="แก้ไข" onClick={() => setSheet({ type: "person" })} className="!px-3"><Pencil className="h-4 w-4" /></Btn>
          <Btn variant="soft" aria-label="ลบ" className="!px-3" onClick={async () => { if (confirm(`ลบ ${person.name} พร้อมรายการชำระและสลิปทั้งหมด?`)) { await peopleService.remove(id); router.push("/app/people"); } }}><Trash2 className="h-4 w-4" /></Btn></div></div></Card>
      <div className="flex items-center justify-between"><h2 className="font-semibold">รายการชำระ</h2><Btn onClick={() => setSheet({ type: "payment" })}><Plus className="h-4 w-4" />เพิ่มรายการ</Btn></div>
      {!payments.length ? <Empty title="ยังไม่มีรายการชำระ" text="เพิ่มรายการแรกเพื่อกำหนดยอด" /> : payments.map((p) => {
        const st = effectiveStatus(p);
        return (<Card key={p.id}>
          <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}>
            <div><div className="font-medium">{p.title}</div><div className="text-sm text-slate-500">{money(p.amountPaid)} / {money(p.amountDue)} · ครบกำหนด {dateTH(p.dueDate)}</div></div>
            <div className="flex items-center gap-2"><StatusBadge status={st} /><ChevronDown className={`h-4 w-4 transition ${open === p.id ? "rotate-180" : ""}`} /></div></button>
          {open === p.id && (<><SlipPanel payment={{ ...p, status: p.status }} />
            <div className="mt-3 flex gap-2"><Btn variant="soft" onClick={() => setSheet({ type: "payment", edit: p })}>แก้ไขรายการ</Btn><Btn variant="soft" onClick={async () => confirm("ลบรายการนี้และสลิป?") && (await paymentService.remove(p.id))}>ลบรายการ</Btn></div></>)}
        </Card>);
      })}
      <Sheet open={sheet?.type === "person"} onClose={() => setSheet(null)} title="แก้ไขข้อมูล"><PersonForm initial={person} onSubmit={(v) => { peopleService.update(id, v); setSheet(null); }} onCancel={() => setSheet(null)} /></Sheet>
      <Sheet open={sheet?.type === "payment"} onClose={() => setSheet(null)} title={sheet?.edit ? "แก้ไขรายการ" : "เพิ่มรายการ"}>
        <PaymentForm personId={id} initial={sheet?.edit} onSubmit={(v) => { sheet.edit ? paymentService.update(sheet.edit.id, { ...v, personId: id }) : paymentService.create({ ...v, personId: id }); setSheet(null); }} onCancel={() => setSheet(null)} /></Sheet>
    </section>
  );
}
