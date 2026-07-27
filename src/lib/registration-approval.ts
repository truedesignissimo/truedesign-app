export type PendingAccount = {
  id: string;
  email: string;
  fullName: string;
  status: "pending" | "approved" | "rejected";
};

export type ApprovalGateway = {
  getAccount(userId: string): Promise<PendingAccount | null>;
  listActiveAppIds(): Promise<string[]>;
  listAssignedAppIds(userId: string): Promise<string[]>;
  assignApps(userId: string, appIds: string[]): Promise<void>;
  createPasswordSetupUrl(userId: string, redirectTo: string): Promise<string>;
  approveProfile(userId: string, approvedBy: string | null): Promise<void>;
};

export async function approvePendingRegistration(input: {
  userId: string;
  approvedBy: string | null;
  passwordSetupRedirect: string;
  gateway: ApprovalGateway;
  sendActivationEmail: (input: {
    email: string;
    fullName: string;
    appCount: number;
    activationUrl: string;
  }) => Promise<void>;
}) {
  const account = await input.gateway.getAccount(input.userId);
  if (!account) throw new Error("Account non disponibile.");
  if (account.status === "approved") {
    return { status: "already-approved" as const, appCount: 0, emailSent: true };
  }
  const activeAppIds = await input.gateway.listActiveAppIds();
  const assigned = new Set(await input.gateway.listAssignedAppIds(input.userId));
  const missing = activeAppIds.filter((appId) => !assigned.has(appId));
  if (missing.length) {
    try {
      await input.gateway.assignApps(input.userId, missing);
    } catch {
      throw new Error("Non è stato possibile assegnare tutte le app.");
    }
  }
  await input.gateway.approveProfile(input.userId, input.approvedBy);
  let emailSent = true;
  try {
    const activationUrl = await input.gateway.createPasswordSetupUrl(
      input.userId,
      input.passwordSetupRedirect
    );
    await input.sendActivationEmail({
      email: account.email,
      fullName: account.fullName,
      appCount: activeAppIds.length,
      activationUrl,
    });
  } catch {
    emailSent = false;
  }
  return {
    status: "approved" as const,
    appCount: activeAppIds.length,
    emailSent,
  };
}
