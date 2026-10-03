"use client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { PersonForm } from "@/components/Forms";
import { peopleService } from "@/services/peopleService";
export default function NewPerson() {
  const router = useRouter();
  return (<section className="space-y-4"><h1 className="text-2xl font-semibold">เพิ่มคน</h1><Card>
    <PersonForm onSubmit={(v) => { const p = peopleService.create(v); router.push(`/app/people/${p.id}`); }} onCancel={() => router.back()} /></Card></section>);
}
