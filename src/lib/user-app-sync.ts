import { assignmentDelta } from "./user-app-policy";

export type UserAppSyncGateway = {
  list(userId: string): Promise<string[]>;
  add(userId: string, appIds: string[]): Promise<void>;
  remove(userId: string, appIds: string[]): Promise<void>;
};

export async function syncUserApps(
  userId: string,
  desiredIds: string[],
  gateway: UserAppSyncGateway
) {
  const currentIds = await gateway.list(userId);
  const delta = assignmentDelta(currentIds, desiredIds);

  if (delta.add.length) await gateway.add(userId, delta.add);
  if (delta.remove.length) await gateway.remove(userId, delta.remove);

  return desiredIds;
}
