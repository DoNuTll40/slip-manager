export const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
export function deepMerge(base, over) {
  if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = isObj(base[k]) && isObj(over[k]) ? deepMerge(base[k], over[k]) : over[k];
  return out;
}
export const getIn = (o, p) => p.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
export function setIn(o, p, v) {
  const [h, ...r] = p.split(".");
  return { ...o, [h]: r.length ? setIn(o?.[h] || {}, r.join("."), v) : v };
}
export const dayNumber = (iso) => { const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };
export const daysBetween = (a, b) => dayNumber(a) - dayNumber(b);
export const todayBangkok = (now = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(now);
export const normalizeText = (s) => String(s || "").toLowerCase().replace(/[\s\u200b]+/g, "").replace(/[.,\-_/\\()'"`:;]/g, "");
