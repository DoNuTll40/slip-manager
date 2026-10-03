import test from "node:test"; import assert from "node:assert/strict";
import { fakeStorage } from "./helpers.js";
import { ls } from "../src/db/storage.js";
import { runMigrations } from "../src/db/migrations.js";
import { getDbStatus } from "../src/db/setup.js";
import { DB_VERSION, DEFAULT_SETTINGS } from "../src/db/schema.js";
import { inspectData, repairSafe, healthStatus } from "../src/core/health.js";
import { validateBackup } from "../src/core/backup.js";
import { createRepository } from "../src/repositories/createRepository.js";

test("setup: not initialized → migrated to latest", () => {
  fakeStorage(); assert.equal(getDbStatus().status, "NOT_INITIALIZED");
  runMigrations(0, DB_VERSION); const s = getDbStatus(); assert.equal(s.status, "READY"); assert.equal(s.version, DB_VERSION);
  assert.deepEqual(ls.get("people"), []);
});
test("migration v1→v2 keeps existing data and adds new settings", () => {
  fakeStorage(); runMigrations(0, 1);
  ls.set("people", [{ id: "x", name: "A" }]); ls.set("settings", { general: { appName: "Mine" } });
  runMigrations(1, 2);
  assert.equal(ls.get("people").length, 1); assert.equal(ls.get("settings").general.appName, "Mine");
  assert.equal(ls.get("settings").slip.maxFileSizeMB, DEFAULT_SETTINGS.slip.maxFileSizeMB);
});
test("repository CRUD", () => {
  fakeStorage(); const r = createRepository("people"); const a = r.create({ name: "A" });
  r.update(a.id, { name: "B" }); assert.equal(r.get(a.id).name, "B"); r.remove(a.id); assert.equal(r.list().length, 0);
});
test("health: detects orphan/duplicate/invalid; repair is non-destructive", () => {
  const data = { people: [{ id: "a" }, { id: "a" }], payments: [{ id: "p", personId: "zzz", title: "T", amountDue: 5, status: "UNPAID" }],
    slips: [], verifications: [], shares: [{ id: "s", title: "S", expiresAt: "not-a-date" }], activity: [] };
  const issues = inspectData(data); const codes = issues.map((i) => i.code);
  assert.ok(codes.includes("DUPLICATE_ID") && codes.includes("PAYMENT_MISSING_PERSON") && codes.includes("INVALID_SHARE_EXPIRATION"));
  assert.equal(healthStatus(issues), "ERROR"); assert.equal(healthStatus([]), "HEALTHY");
  const { data: fixed, fixed: log } = repairSafe(data);
  assert.equal(fixed.people.length, 2); assert.equal(fixed.payments.length, 1); assert.ok(log.length >= 2); assert.ok(fixed.shares[0].revokedAt);
});
test("backup validation: accept valid, reject invalid & newer version", () => {
  const ok = { version: 2, exportedAt: "x", people: [{ id: "1" }], payments: [], slips: [], verifications: [], shares: [], activity: [], settings: {} };
  const r = validateBackup(JSON.stringify(ok)); assert.ok(r.ok); assert.equal(r.counts.people, 1);
  assert.equal(validateBackup("{bad").ok, false); assert.equal(validateBackup({ ...ok, people: "x" }).ok, false); assert.equal(validateBackup({ ...ok, version: 99 }).ok, false);
});
