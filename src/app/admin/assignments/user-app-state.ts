export type UserAppAssignment = {
  user_id: string;
  app_id: string;
};

export function replaceUserAssignments(
  current: UserAppAssignment[],
  userId: string,
  appIds: string[]
) {
  return [
    ...current.filter((item) => item.user_id !== userId),
    ...appIds.map((appId) => ({ user_id: userId, app_id: appId })),
  ];
}
