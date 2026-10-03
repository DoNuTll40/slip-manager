export const money = (n) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(n) || 0);
export const dateTH = (iso) => (iso ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(new Date(iso.length === 10 ? iso + "T00:00:00+07:00" : iso)) : "-");
export const dateTimeTH = (iso) => (iso ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(iso)) : "-");
export const bytes = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.round(n / 1024) + " KB");
