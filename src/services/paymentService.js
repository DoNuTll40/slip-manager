import { paymentRepository as R } from "@/repositories/paymentRepository";
import { settingsRepository } from "@/repositories/settingsRepository";
import { slipRepository } from "@/repositories/slipRepository";
import { paymentSchema, parseOrThrow } from "@/core/schemas";
import { PAYMENT_STATUS } from "@/core/constants";
import { removeSlip } from "./slipService";
import { log } from "./activityService";

export const paymentService = {
  list: () => R.list(), get: (id) => R.get(id),
  create(input) {
    const d = parseOrThrow(paymentSchema, input);
    const r = R.create({ ...d, status: settingsRepository.get().payment.defaultStatus });
    log("PAYMENT_CREATE", "payment", r.id, { title: r.title }); return r;
  },
  update(id, input) { const r = R.update(id, parseOrThrow(paymentSchema, input)); log("PAYMENT_UPDATE", "payment", id, { title: r.title }); return r; },
  async remove(id) {
    const p = R.get(id); if (!p) return;
    for (const s of slipRepository.list().filter((s) => s.paymentId === id)) await removeSlip(s.id, { silent: true });
    R.remove(id); log("PAYMENT_DELETE", "payment", id, { title: p.title });
  },
  // Owner's decision. OCR never marks a payment PAID by itself.
  markPaid(id) { const p = R.get(id); R.update(id, { status: PAYMENT_STATUS.PAID, amountPaid: p.amountDue }); log("PAYMENT_PAID", "payment", id, { title: p.title }); },
  reject(id) { R.update(id, { status: PAYMENT_STATUS.REJECTED }); log("PAYMENT_REJECT", "payment", id); }
};
