const PREFIX = "psm:";
const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };
export const ls = {
  available: () => safe(() => { localStorage.setItem(PREFIX + "_t", "1"); localStorage.removeItem(PREFIX + "_t"); return true; }, false),
  get: (key, fallback = null) => safe(() => { const r = localStorage.getItem(PREFIX + key); return r === null ? fallback : JSON.parse(r); }, fallback),
  set: (key, value) => localStorage.setItem(PREFIX + key, JSON.stringify(value)),
  remove: (key) => localStorage.removeItem(PREFIX + key),
  keys: () => Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).map((k) => k.slice(PREFIX.length))
};
