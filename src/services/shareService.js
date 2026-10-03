import { shareRepository as R } from "@/repositories/shareRepository";
import { peopleRepository } from "@/repositories/peopleRepository";
import { paymentRepository } from "@/repositories/paymentRepository";
import { slipRepository } from "@/repositories/slipRepository";
import { verificationRepository } from "@/repositories/verificationRepository";
import { settingsRepository } from "@/repositories/settingsRepository";
import { generateToken, computeExpiry, buildSnapshot } from "@/core/shareLogic";
import { hashPassword, randomHex, verifyPassword, encryptJson } from "@/core/crypto";
import { log } from "./activityService";

const snapshotNow = (permissions) => buildSnapshot({ people: peopleRepository.list(), payments: paymentRepository.list(), slips: slipRepository.list(), verifications: verificationRepository.list(), permissions });

// Provider abstraction. Local mode can only resolve links inside THIS browser;
// a RemoteShareProvider (server + database) is needed for URLs that open on other devices.
export const LocalShareProvider = {
  name: "local", crossDevice: false,
  resolve: (token) => R.list().find((s) => s.token === token) || null
};
export const RemoteShareProvider = {
  name: "remote", crossDevice: true,
  resolve() { throw new Error("ยังไม่ได้ตั้งค่า Remote Share Provider"); }
};
export const getShareProvider = () => LocalShareProvider;

export const shareService = {
  list: () => R.list(), get: (id) => R.get(id),
  async create(input) {
    const settings = settingsRepository.get();
    const salt = input.password ? randomHex(16) : null;
    const rec = R.create({
      token: generateToken(settings.share.tokenLength), title: input.title.trim(), description: input.description || "",
      passwordSalt: salt, passwordHash: input.password ? await hashPassword(input.password, salt) : null,
      expiresAt: computeExpiry(input.expiry, new Date(), input.customExpiry), revokedAt: null,
      permissions: input.permissions, snapshot: snapshotNow(input.permissions), snapshotAt: new Date().toISOString()
    });
    log("SHARE_CREATE", "share", rec.id, { title: rec.title }); return rec;
  },
  async update(id, input) {
    const cur = R.get(id), patch = {
      title: input.title.trim(), description: input.description || "", permissions: input.permissions,
      expiresAt: input.expiry === "keep" ? cur.expiresAt : computeExpiry(input.expiry, new Date(), input.customExpiry),
      snapshot: snapshotNow(input.permissions), snapshotAt: new Date().toISOString()
    };
    if (input.removePassword) Object.assign(patch, { passwordHash: null, passwordSalt: null });
    else if (input.password) { const salt = randomHex(16); Object.assign(patch, { passwordSalt: salt, passwordHash: await hashPassword(input.password, salt) }); }
    const rec = R.update(id, patch); log("SHARE_UPDATE", "share", id, { title: rec.title }); return rec;
  },
  refreshSnapshot(id) { const s = R.get(id); R.update(id, { snapshot: snapshotNow(s.permissions), snapshotAt: new Date().toISOString() }); },
  revoke(id) { R.update(id, { revokedAt: new Date().toISOString() }); log("SHARE_REVOKE", "share", id); },
  reenable(id) { R.update(id, { revokedAt: null }); log("SHARE_REENABLE", "share", id); },
  remove(id) { R.remove(id); log("SHARE_DELETE", "share", id); },
  // Share Package: a file the owner sends. Password-protected shares are AES-GCM encrypted with that password.
  async exportPackage(id, password) {
    const s = R.get(id);
    const meta = { token: s.token, title: s.title, description: s.description, expiresAt: s.expiresAt, revokedAt: s.revokedAt, permissions: s.permissions, passwordProtected: Boolean(s.passwordHash) };
    const pkg = { format: "slip-manager-share-package", version: 1, exportedAt: new Date().toISOString(), share: meta };
    if (s.passwordHash) {
      if (!password || !(await verifyPassword(password, s.passwordSalt, s.passwordHash))) throw new Error("รหัสผ่านไม่ถูกต้อง");
      pkg.encrypted = await encryptJson(s.snapshot, password);
    } else pkg.snapshot = s.snapshot;
    log("SHARE_EXPORT", "share", id);
    return pkg;
  }
};
