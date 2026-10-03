"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Wallet, Share2, Settings } from "lucide-react";
import { useEffect } from "react";
import DbGate from "./DbGate";
import { settingsRepository } from "@/repositories/settingsRepository";
import { useLiveData } from "@/hooks/useLiveData";
const ACCENTS = { jade: ["14 124 107", "223 243 239"], blue: ["37 99 235", "219 234 254"], violet: ["124 58 237", "237 233 254"], rose: ["225 29 72", "255 228 230"] };
const NAV = [
  { href: "/app/dashboard", label: "หน้าหลัก", icon: Home },
  { href: "/app/people", label: "รายชื่อ", icon: Users },
  { href: "/app/payments", label: "ชำระเงิน", icon: Wallet },
  { href: "/app/shares", label: "แชร์", icon: Share2 },
  { href: "/app/settings", label: "เพิ่มเติม", icon: Settings }
];
export default function AppShell({ children }) {
  const path = usePathname();
  const accent = useLiveData(() => settingsRepository.get().general.accent);
  useEffect(() => { const [a, b] = ACCENTS[accent] || ACCENTS.jade; document.documentElement.style.setProperty("--jade", a); document.documentElement.style.setProperty("--jade-soft", b); }, [accent]);
  const active = (h) => path === h || path.startsWith(h + "/");
  return (
    <div className="min-h-screen md:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-1 bg-white p-4 md:flex">
        <div className="mb-4 px-3 py-2 text-lg font-semibold">Slip Manager</div>
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-full px-4 ${active(href) ? "bg-jade-soft font-medium text-jade" : "text-slate-600 hover:bg-mist"}`}>
            <Icon className="h-5 w-5" aria-hidden />{label}
          </Link>
        ))}
      </aside>
      <header className="sticky top-0 z-10 bg-mist/90 px-5 py-3 backdrop-blur md:hidden"><span className="font-semibold">Slip Manager</span></header>
      <main className="mx-auto max-w-3xl p-5 pb-28 md:pb-10"><DbGate>{children}</DbGate></main>
      <nav aria-label="เมนูหลัก" className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_#e2e8f0] md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${active(href) ? "font-medium text-jade" : "text-slate-500"}`}>
            <Icon className="h-5 w-5" aria-hidden />{label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
