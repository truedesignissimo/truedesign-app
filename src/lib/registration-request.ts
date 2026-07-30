export type RegistrationIdentity = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
};

export type RegistrationAccount = {
  id: string;
  status: "pending" | "approved" | "rejected";
  emailConfirmed: boolean;
  hasSignedIn: boolean;
};

export type RegistrationRequestGateway = {
  findByEmail(email: string): Promise<RegistrationAccount | null>;
  createPendingAccount(identity: RegistrationIdentity): Promise<string>;
  refreshPendingAccount(userId: string, identity: RegistrationIdentity): Promise<void>;
  notifyOwner(userId: string, identity: RegistrationIdentity): Promise<void>;
};

export type RegistrationRequestResult = {
  status:
    | "created"
    | "recovered-pending"
    | "awaiting-confirmation"
    | "already-active"
    | "notification-failed";
  userId: string;
};

export async function submitRegistrationRequest(
  identity: RegistrationIdentity,
  gateway: RegistrationRequestGateway
): Promise<RegistrationRequestResult> {
  const existing = await gateway.findByEmail(identity.email);
  if (
    existing?.status === "approved" &&
    existing.emailConfirmed &&
    existing.hasSignedIn
  ) {
    return { status: "already-active", userId: existing.id };
  }

  const userId = existing
    ? existing.id
    : await gateway.createPendingAccount(identity);

  if (existing && existing.status !== "approved") {
    await gateway.refreshPendingAccount(userId, identity);
  }

  try {
    await gateway.notifyOwner(userId, identity);
  } catch {
    return { status: "notification-failed", userId };
  }

  return {
    status: existing?.status === "approved"
      ? "awaiting-confirmation"
      : existing ? "recovered-pending" : "created",
    userId,
  };
}
