import { peopleRepository as R } from "@/repositories/peopleRepository";
import { paymentRepository } from "@/repositories/paymentRepository";
import { personSchema, parseOrThrow } from "@/core/schemas";
import { paymentService } from "./paymentService";
import { log } from "./activityService";

export const peopleService = {
  list: () => R.list(), get: (id) => R.get(id),
  create(input) { const r = R.create(parseOrThrow(personSchema, input)); log("PERSON_CREATE", "person", r.id, { name: r.name }); return r; },
  update(id, input) { const r = R.update(id, parseOrThrow(personSchema, input)); log("PERSON_UPDATE", "person", id, { name: r.name }); return r; },
  async remove(id) {
    const p = R.get(id); if (!p) return;
    for (const pay of paymentRepository.list().filter((x) => x.personId === id)) await paymentService.remove(pay.id);
    R.remove(id); log("PERSON_DELETE", "person", id, { name: p.name });
  }
};
