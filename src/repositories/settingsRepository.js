import { ls } from "../db/storage.js";
import { DEFAULT_SETTINGS } from "../db/schema.js";
import { deepMerge } from "../core/util.js";
export const settingsRepository = {
  get: () => deepMerge(DEFAULT_SETTINGS, ls.get("settings") || {}),
  save: (settings) => { ls.set("settings", settings); if (typeof window !== "undefined") window.dispatchEvent(new Event("psm:change")); }
};
