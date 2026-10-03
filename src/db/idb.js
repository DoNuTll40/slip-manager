import { IDB_NAME, IDB_STORES } from "./schema.js";
export function openIdb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => IDB_STORES.forEach((s) => { if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s); });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
const tx = async (store, mode, fn) => {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode); const r = fn(t.objectStore(store));
    t.oncomplete = () => { db.close(); resolve(r.result); }; t.onerror = () => reject(t.error);
  });
};
export const idb = {
  put: (store, key, blob) => tx(store, "readwrite", (s) => s.put(blob, key)),
  get: (store, key) => tx(store, "readonly", (s) => s.get(key)),
  delete: (store, key) => tx(store, "readwrite", (s) => s.delete(key)),
  clear: (store) => tx(store, "readwrite", (s) => s.clear())
};
