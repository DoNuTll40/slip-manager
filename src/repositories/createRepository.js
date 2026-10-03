import { ls } from "../db/storage.js";
const now = () => new Date().toISOString();
const uid = () => globalThis.crypto.randomUUID();
const emit = () => { if (typeof window !== "undefined") window.dispatchEvent(new Event("psm:change")); };
export function createRepository(collection) {
  const all = () => ls.get(collection, []);
  const save = (rows) => { ls.set(collection, rows); emit(); };
  return {
    list: all,
    get: (id) => all().find((r) => r.id === id) || null,
    create(data) { const rec = { ...data, id: uid(), createdAt: now(), updatedAt: now() }; save([...all(), rec]); return rec; },
    update(id, patch) {
      let out = null;
      save(all().map((r) => (r.id === id ? (out = { ...r, ...patch, id, updatedAt: now() }) : r)));
      return out;
    },
    remove(id) { save(all().filter((r) => r.id !== id)); },
    replaceAll: save
  };
}
