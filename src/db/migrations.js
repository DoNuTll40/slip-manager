import { ls } from "./storage.js";
import { COLLECTIONS, DEFAULT_SETTINGS } from "./schema.js";
import { deepMerge } from "../core/util.js";
// Add entries for v3, v4... Migrations only transform data; they never clear it.
export const migrations = [
  { version: 1, up() {
      COLLECTIONS.forEach((c) => { if (ls.get(c) === null) ls.set(c, []); });
      if (ls.get("settings") === null) ls.set("settings", DEFAULT_SETTINGS);
  } },
  { version: 2, up() { ls.set("settings", deepMerge(DEFAULT_SETTINGS, ls.get("settings") || {})); } }
];
export function runMigrations(from, to) {
  migrations.filter((m) => m.version > from && m.version <= to)
    .sort((a, b) => a.version - b.version)
    .forEach((m) => { m.up(); ls.set("meta", { ...(ls.get("meta") || {}), version: m.version, updatedAt: new Date().toISOString() }); });
}
