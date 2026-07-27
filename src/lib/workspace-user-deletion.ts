export type UserDeletionGateway = {
  deleteAuthUser(userId: string): Promise<void>;
  authUserExists(userId: string): Promise<boolean>;
  deleteResidualData(userId: string): Promise<void>;
};

export async function deleteWorkspaceUser(
  userId: string,
  gateway: UserDeletionGateway
) {
  await gateway.deleteAuthUser(userId);
  if (await gateway.authUserExists(userId)) {
    throw new Error("L'utente non è stato eliminato da Supabase Auth.");
  }
  await gateway.deleteResidualData(userId);
}
