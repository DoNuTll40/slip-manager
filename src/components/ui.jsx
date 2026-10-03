"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { PAYMENT_LABEL, PAYMENT_TONE } from "@/lib/labels";
export const inputCls = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-jade";
export const Card = ({ children, className = "" }) => <div className={`rounded-card bg-white p-5 shadow-sm ${className}`}>{children}</div>;
export const Btn = ({ variant = "primary", className = "", ...p }) => (
  <button type="button" {...p} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-medium disabled:opacity-50 ${variant === "primary" ? "bg-jade text-white" : variant === "danger" ? "bg-red-600 text-white" : "bg-mist text-ink"} ${className}`} />
);
export const Field = ({ label, children }) => <label className="block space-y-1.5"><span className="text-sm text-slate-600">{label}</span>{children}</label>;
export const Notice = ({ kind = "info", children }) => (
  <div role={kind === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${kind === "error" ? "bg-red-50 text-red-700" : kind === "ok" ? "bg-jade-soft text-jade" : kind === "warn" ? "bg-amber-50 text-amber-800" : "bg-sky-50 text-sky-800"}`}>{children}</div>
);
export const Loading = () => <div className="py-10 text-center text-slate-500" role="status">กำลังโหลด…</div>;
export const Empty = ({ title, text, children }) => (
  <Card className="py-10 text-center"><h2 className="font-semibold">{title}</h2>{text && <p className="mt-1 text-slate-600">{text}</p>}{children && <div className="mt-5 flex justify-center">{children}</div>}</Card>
);
export const StatusBadge = ({ status }) => <span className={`rounded-full px-3 py-1 text-xs font-medium ${PAYMENT_TONE[status]}`}>{PAYMENT_LABEL[status]}</span>;
export function Sheet({ open, onClose, title, children }) {
  useEffect(() => { if (!open) return; const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/40 md:items-center md:justify-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 md:max-w-md md:rounded-3xl">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="ปิด" className="grid h-11 w-11 place-items-center rounded-full bg-mist"><X className="h-5 w-5" /></button></div>
        {children}
      </div>
    </div>
  );
}
