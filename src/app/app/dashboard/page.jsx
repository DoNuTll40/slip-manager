"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Card, Empty, Loading, StatusBadge } from "@/components/ui";
import { useLiveData } from "@/hooks/useLiveData";
import { peopleService } from "@/services/peopleService";
import { paymentService } from "@/services/paymentService";
import { recent } from "@/services/activityService";
import { summarize, effectiveStatus } from "@/core/payment";
import { ACTION_LABEL, PAYMENT_LABEL } from "@/lib/labels";
import { money, dateTimeTH } from "@/lib/format";

const Kpi = ({ label, value, tone = "" }) => <Card className="!p-4"><div className="text-sm text-slate-500">{label}</div><div className={`mt-1 text-xl font-semibold ${tone}`}>{value}</div></Card>;
const BAR = { UNPAID: "bg-slate-300", PARTIAL: "bg-amber-400", PENDING_REVIEW: "bg-sky-400", PAID: "bg-jade", REJECTED: "bg-red-500", OVERDUE: "bg-orange-500" };

export default function Dashboard() {
  const data = useLiveData(() => ({ people: peopleService.list(), payments: paymentService.list(), activity: recent(6) }));
  const s = useMemo(() => (data ? summarize(data.payments) : null), [data]);
  if (!data) return <Loading />;
  const pct = s.amountTotal ? Math.min(100, Math.round((s.amountPaid / s.amountTotal) * 100)) : 0;
  const latest = [...data.payments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-semibold">ภาพรวม</h1>
      {!data.payments.length && <Empty title="ยังไม่มีรายการชำระ" text="เพิ่มคนและกำหนดยอดชำระ ตัวเลขจะแสดงที่นี่"><Link href="/app/people/new" className="rounded-full bg-jade px-6 py-3 text-white">เพิ่มคนแรก</Link></Empty>}
      <div className="grid grid-cols-2 gap-3">
        <Kpi label="คนทั้งหมด" value={data.people.length} /><Kpi label="Payment ทั้งหมด" value={s.total} />
        <Kpi label="ชำระแล้ว" value={s.byStatus.PAID} tone="text-jade" /><Kpi label="ยังไม่ชำระ" value={s.byStatus.UNPAID + s.byStatus.PARTIAL} />
        <Kpi label="รอตรวจ" value={s.byStatus.PENDING_REVIEW} tone="text-sky-700" /><Kpi label="ผิดปกติ" value={s.abnormal} tone={s.abnormal ? "text-red-700" : ""} />
        <Kpi label="ยอดรวม" value={money(s.amountTotal)} /><Kpi label="ยอดชำระแล้ว" value={money(s.amountPaid)} tone="text-jade" />
        <Kpi label="ยอดค้าง" value={money(s.amountOutstanding)} tone="text-orange-700" /><Kpi label="ยอดรอตรวจ" value={money(s.amountPending)} tone="text-sky-700" />
      </div>
      <Card><div className="flex justify-between text-sm"><span>ความคืบหน้าการชำระ</span><span className="font-medium">{pct}%</span></div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-jade" style={{ width: pct + "%" }} /></div></Card>
      <Card><h2 className="mb-3 font-semibold">สัดส่วนตามสถานะ</h2>
        <div className="flex h-3 overflow-hidden rounded-full bg-mist">{Object.keys(BAR).map((k) => s.total && s.byStatus[k] ? <div key={k} className={BAR[k]} style={{ width: (s.byStatus[k] / s.total) * 100 + "%" }} /> : null)}</div>
        <ul className="mt-3 grid grid-cols-2 gap-1 text-sm">{Object.keys(BAR).map((k) => <li key={k} className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${BAR[k]}`} />{PAYMENT_LABEL[k]} {s.byStatus[k]}</li>)}</ul></Card>
      {!!latest.length && <Card><h2 className="mb-3 font-semibold">Payment ล่าสุด</h2><ul className="space-y-3">{latest.map((p) => <li key={p.id} className="flex items-center justify-between"><span>{p.title}<span className="block text-sm text-slate-500">{money(p.amountDue)}</span></span><StatusBadge status={effectiveStatus(p)} /></li>)}</ul></Card>}
      {!!data.activity.length && <Card><h2 className="mb-3 font-semibold">กิจกรรมล่าสุด</h2><ul className="space-y-2 text-sm">{data.activity.map((a) => <li key={a.id} className="flex justify-between gap-3"><span>{ACTION_LABEL[a.action] || a.action}{a.metadata?.title || a.metadata?.name ? ` · ${a.metadata.title || a.metadata.name}` : ""}</span><span className="shrink-0 text-slate-400">{dateTimeTH(a.timestamp)}</span></li>)}</ul></Card>}
    </section>
  );
}
