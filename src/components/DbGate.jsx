"use client";
import { Database, Loader2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useDatabase } from "@/hooks/useDatabase";
import { createSampleData } from "@/services/sampleData";
import { DB_STATUS } from "@/db/setup";
const Card = ({ icon: Icon, title, text, action, onClick }) => (
  <div className="mx-auto mt-16 max-w-sm rounded-card bg-white p-8 text-center shadow-sm">
    <Icon className="mx-auto mb-4 h-10 w-10 text-jade" aria-hidden />
    <h1 className="text-xl font-semibold">{title}</h1>
    <p className="mt-2 text-slate-600">{text}</p>
    {action && <button onClick={onClick} className="mt-6 min-h-11 w-full rounded-full bg-jade px-6 font-medium text-white">{action}</button>}
  </div>
);
export default function DbGate({ children }) {
  const db = useDatabase();
  const [askSample, setAskSample] = useState(false);
  if (askSample && db.status === DB_STATUS.READY)
    return (
      <div className="mx-auto mt-16 max-w-sm space-y-3 rounded-card bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold">สร้างข้อมูลตัวอย่างไหม?</h1><p className="text-slate-600">ใช้ลองระบบได้ แล้วลบทิ้งภายหลังที่ ตั้งค่า &gt; Danger Zone</p>
        <button onClick={() => { createSampleData(); setAskSample(false); }} className="min-h-11 w-full rounded-full bg-jade font-medium text-white">สร้างข้อมูลตัวอย่าง</button>
        <button onClick={() => setAskSample(false)} className="min-h-11 w-full rounded-full bg-mist font-medium">เริ่มระบบเปล่า</button>
      </div>
    );
  if (db.loading) return <Card icon={Loader2} title="กำลังตรวจฐานข้อมูล" text="รอสักครู่" />;
  if (db.status === DB_STATUS.NOT_INITIALIZED)
    return <Card icon={Database} title="ยังไม่มีฐานข้อมูล" text="ข้อมูลทั้งหมดเก็บในเครื่องนี้ เริ่มต้นด้วยการตั้งค่าฐานข้อมูล" action="ตั้งค่าฐานข้อมูล" onClick={async () => { await db.setup(); setAskSample(true); }} />;
  if (db.status === DB_STATUS.NEEDS_MIGRATION)
    return <Card icon={Database} title="ฐานข้อมูลต้องอัปเกรด" text="ข้อมูลเดิมจะไม่ถูกลบ" action="อัปเกรดตอนนี้" onClick={db.migrate} />;
  if (db.status === DB_STATUS.ERROR)
    return <Card icon={TriangleAlert} title="ใช้งานฐานข้อมูลไม่ได้" text={db.error || db.message || "ตรวจสอบว่าเบราว์เซอร์เปิด LocalStorage และ IndexedDB"} action="ลองอีกครั้ง" onClick={db.setup} />;
  return children;
}
