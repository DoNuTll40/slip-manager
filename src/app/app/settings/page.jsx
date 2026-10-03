"use client";
import { SettingsForm, DatabasePanel, BackupPanel, DangerZone } from "@/components/SettingsPanels";
export default function SettingsPage() {
  return (<section className="space-y-4"><h1 className="text-2xl font-semibold">ตั้งค่า</h1><SettingsForm /><DatabasePanel /><BackupPanel /><DangerZone /></section>);
}
