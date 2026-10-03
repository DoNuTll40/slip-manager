export const DB_VERSION = 2;
export const COLLECTIONS = ["people", "payments", "slips", "verifications", "shares", "activity"];
export const IDB_NAME = "slip-manager-files";
export const IDB_STORES = ["slipFiles", "thumbnails", "ocrCache"];
export const DEFAULT_SETTINGS = {
  general: { appName: "Slip Manager", currency: "THB", timezone: "Asia/Bangkok", accent: "jade" },
  payment: { defaultStatus: "UNPAID", decimals: 2 },
  slip: { ocrEnabled: true, languages: ["tha", "eng"], amountTolerance: 0, dateToleranceDays: 1,
          receiverMatch: "contains", expectedReceiver: "", confidenceThreshold: 60,
          detectDuplicates: true, maxFileSizeMB: 10 },
  external: { ocrProvider: "local", verificationProvider: "none" },
  share: { defaultExpiry: "7", requirePassword: false, tokenLength: 24,
           permissions: { showKPI: true, showPeople: true, showAmount: true, showStatus: true, showSlip: false, showPhone: false, showNote: false } }
};
