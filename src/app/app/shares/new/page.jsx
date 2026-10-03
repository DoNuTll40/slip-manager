"use client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import ShareForm from "@/components/ShareForm";
import ShareLimit from "@/components/ShareLimit";
import { shareService } from "@/services/shareService";
export default function NewShare() {
  const router = useRouter();
  return (<section className="space-y-4"><h1 className="text-2xl font-semibold">สร้างลิงก์แชร์</h1><ShareLimit /><Card>
    <ShareForm onSubmit={async (v) => { const s = await shareService.create(v); router.push(`/app/shares/${s.id}`); }} onCancel={() => router.back()} /></Card></section>);
}
