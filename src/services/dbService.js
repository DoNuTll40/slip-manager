import { ls } from "@/db/storage";
import { openIdb, idb } from "@/db/idb";
import { COLLECTIONS, DB_VERSION, DEFAULT_SETTINGS, IDB_STORES } from "@/db/schema";
import { inspectData, healthStatus, repairSafe } from "@/core/health";
import { validateBackup } from "@/core/backup";
import { settingsRepository } from "@/repositories/settingsRepository";
import { slipRepository } from "@/repositories/slipRepository";
import { log } from "./activityService";

const readRaw = (name) => {
  const raw = localStorage.getItem("psm:" + name);
  if (raw === null) return { state: "missing" };
  try { return { state: "ok", value: JSON.parse(raw) }; } catch { return { state: "corrupt" }; }
};
const loadAll = () => Object.fromEntries(COLLECTIONS.map((c) => [c, ls.get(c, [])]));

export async function healthCheck() {
  const meta = ls.get("meta");
  if (!meta) return { status: "NOT_INITIALIZED", issues: [], counts: {}, version: null };
  const issues = [];
  if (meta.version !== DB_VERSION) issues.push({ code: "VERSION", severity: "warning", message: `เวอร์ชันฐานข้อมูล ${meta.version} (แอปต้องการ ${DB_VERSION})` });
  for (const c of COLLECTIONS) {
    const r = readRaw(c);
    if (r.state === "missing") issues.push({ code: "MISSING_COLLECTION", severity: "warning", message: `ไม่พบ collection: ${c}`, safe: true, collection: c });
    else if (r.state === "corrupt") issues.push({ code: "CORRUPTED_JSON", severity: "error", message: `ข้อมูล ${c} เสียหาย (JSON อ่านไม่ได้) กู้จากไฟล์สำรอง` });
    else if (!Array.isArray(r.value)) issues.push({ code: "BAD_SCHEMA", severity: "error", message: `${c} ไม่ใช่รายการ` });
  }
  if (readRaw("settings").state !== "ok") issues.push({ code: "MISSING_SETTINGS", severity: "warning", message: "ไม่พบหรืออ่านตั้งค่าไม่ได้", safe: true });
  const data = loadAll();
  for (const c of COLLECTIONS) if (!Array.isArray(data[c])) data[c] = [];
  issues.push(...inspectData(data));
  let idbStatus = "OK";
  try { (await openIdb()).close(); } catch (e) { idbStatus = "ERROR"; issues.push({ code: "IDB", severity: "error", message: "ใช้ IndexedDB ไม่ได้: " + e.message }); }
  let storage = null;
  try { storage = await navigator.storage.estimate(); } catch {}
  const missingFiles = [];
  if (idbStatus === "OK") for (const s of data.slips) { if (!(await idb.get("slipFiles", s.id))) missingFiles.push(s.fileName); }
  if (missingFiles.length) issues.push({ code: "SLIP_FILE_MISSING", severity: "warning", message: `ไม่พบไฟล์รูปสลิปใน IndexedDB: ${missingFiles.join(", ")}` });
  return { status: healthStatus(issues), version: meta.version, issues, idb: idbStatus, storage,
    counts: { people: data.people.length, payments: data.payments.length, slips: data.slips.length, verifications: data.verifications.length, shares: data.shares.length } };
}

export function repairSafeIssues() {
  const fixed = [];
  for (const c of COLLECTIONS) if (readRaw(c).state === "missing") { ls.set(c, []); fixed.push(`สร้าง collection ${c}`); }
  if (readRaw("settings").state !== "ok") { ls.set("settings", DEFAULT_SETTINGS); fixed.push("สร้างตั้งค่าเริ่มต้น"); }
  const safe = COLLECTIONS.every((c) => readRaw(c).state === "ok");
  if (safe) {
    const r = repairSafe(loadAll()); fixed.push(...r.fixed);
    if (r.fixed.length) for (const c of COLLECTIONS) ls.set(c, r.data[c]);
  }
  if (fixed.length) log("DB_REPAIR", "database", "-", { fixed: fixed.length });
  window.dispatchEvent(new Event("psm:change"));
  return fixed;
}

const blobToDataUrl = (b) => new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res(f.result); f.onerror = rej; f.readAsDataURL(b); });
const dataUrlToBlob = async (u) => (await fetch(u)).blob();

export async function exportBackup({ includeFiles = true } = {}) {
  const data = loadAll();
  const out = { version: DB_VERSION, exportedAt: new Date().toISOString(), ...data, settings: settingsRepository.get() };
  if (includeFiles) {
    out.slipFiles = [];
    for (const s of data.slips) { const b = await idb.get("slipFiles", s.id); if (b) out.slipFiles.push({ id: s.id, dataUrl: await blobToDataUrl(b) }); }
  }
  log("BACKUP_EXPORT", "database", "-", { files: out.slipFiles?.length || 0 });
  return out;
}
export function downloadJson(obj, name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(obj)], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name }); a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const previewBackup = (text) => {
  const v = validateBackup(text); if (!v.ok) return v;
  return { ...v, issues: inspectData(v.data) };
};
export async function restoreBackup(data) {
  for (const c of COLLECTIONS) ls.set(c, data[c]);
  ls.set("settings", data.settings);
  ls.set("meta", { ...(ls.get("meta") || {}), version: DB_VERSION, updatedAt: new Date().toISOString() });
  await openIdb().then((d) => d.close());
  await idb.clear("slipFiles");
  for (const f of data.slipFiles || []) await idb.put("slipFiles", f.id, await dataUrlToBlob(f.dataUrl));
  // verify integrity
  const now = loadAll(), problems = [];
  for (const c of COLLECTIONS) if (now[c].length !== data[c].length) problems.push(`จำนวน ${c} ไม่ตรงกับไฟล์สำรอง`);
  for (const s of slipRepository.list()) if ((data.slipFiles || []).length && !(await idb.get("slipFiles", s.id))) problems.push(`ไฟล์สลิป ${s.fileName} หาย`);
  log("BACKUP_RESTORE", "database", "-", { problems: problems.length });
  window.dispatchEvent(new Event("psm:change"));
  return problems;
}
export async function resetApplication() {
  ls.keys().forEach((k) => ls.remove(k));
  for (const s of IDB_STORES) { try { await idb.clear(s); } catch {} }
  window.dispatchEvent(new Event("psm:change"));
}
export async function storageUsage() {
  let bytes = 0; ls.keys().forEach((k) => { bytes += (localStorage.getItem("psm:" + k) || "").length * 2; });
  let est = null; try { est = await navigator.storage.estimate(); } catch {}
  return { localStorageBytes: bytes, used: est?.usage ?? null, quota: est?.quota ?? null };
}
