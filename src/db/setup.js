import { ls } from "./storage.js";
import { openIdb } from "./idb.js";
import { DB_VERSION } from "./schema.js";
import { runMigrations } from "./migrations.js";

export const DB_STATUS = { NOT_INITIALIZED: "NOT_INITIALIZED", READY: "READY", NEEDS_MIGRATION: "NEEDS_MIGRATION", ERROR: "ERROR" };

export function getDbStatus() {
  if (!ls.available()) return { status: DB_STATUS.ERROR, message: "เบราว์เซอร์ไม่อนุญาตให้ใช้ LocalStorage" };
  const meta = ls.get("meta");
  if (!meta) return { status: DB_STATUS.NOT_INITIALIZED };
  if (meta.version < DB_VERSION) return { status: DB_STATUS.NEEDS_MIGRATION, version: meta.version };
  return { status: DB_STATUS.READY, version: meta.version };
}
export async function setupDatabase() {
  await openIdb(); // verifies IndexedDB works and creates stores
  runMigrations(0, DB_VERSION);
  ls.set("meta", { ...(ls.get("meta") || {}), createdAt: new Date().toISOString() });
  return getDbStatus();
}
export function migrateDatabase() {
  const { version = 0 } = ls.get("meta") || {};
  runMigrations(version, DB_VERSION);
  return getDbStatus();
}
