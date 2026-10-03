import { activityRepository } from "@/repositories/activityRepository";
const MAX = 500;
export function log(action, entityType, entityId, metadata = {}) {
  const rows = activityRepository.list();
  activityRepository.create({ action, entityType, entityId, timestamp: new Date().toISOString(), metadata });
  if (rows.length >= MAX) activityRepository.replaceAll(activityRepository.list().slice(-MAX));
}
export const recent = (n = 8) => [...activityRepository.list()].reverse().slice(0, n);
