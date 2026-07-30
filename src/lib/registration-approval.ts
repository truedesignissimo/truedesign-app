import {
  defaultAppIdsForRole,
  type AssignableApp,
  type UserRole,
} from "./user-app-policy";

export type PendingAccount = {
  id: string;
  email: string;
  fullName: string;
  userType: UserRole;
  status: "pending" | "approved" | "rejected";
  emailConfirmed: boolean;
  hasSignedIn: boolean;
};

export type ApprovalGateway = {
  getAccount(userId: string): Promise<PendingAccount | null>;
  listActiveApps(): Promise<AssignableApp[]>;
  listAssignedAppIds(userId: string): Promise<string[]>;
  assignApps(userId: string, appIds: string[]): Promise<void>;
  unassignApps(userId: string, appIds: string[]): Promise<void>;
  createPasswordSetupUrl(userId: string, siteUrl: string): Promise<string>;
  approveProfile(userId: string, approvedBy: string | null): Promise<void>;
  restoreProfileStatus(
    userId: string,
    status: PendingAccount["status"]
  ): Promise<void>;
};

export async function approvePendingRegistration(input: {
  userId: string;
  approvedBy: string | null;
  siteUrl: string;
  gateway: ApprovalGateway;
  sendActivationEmail: (input: {
    email: string;
    fullName: string;
    appCount: number;
    activationUrl: string;
    idempotencyKey: string;
  }) => Promise<void>;
}) {
  const account = await input.gateway.getAccount(input.userId);
  if (!account) throw new Error("Account non disponibile.");
  if (
    account.status === "approved" &&
    account.emailConfirmed &&
    account.hasSignedIn
  ) {
    return { status: "already-approved" as const, appCount: 0, emailSent: true };
  }
  const activeApps = await input.gateway.listActiveApps();
  const defaultAppIds = defaultAppIdsForRole(account.userType, activeApps);
  const assigned = new Set(await input.gateway.listAssignedAppIds(input.userId));
  const missing = defaultAppIds.filter((appId) => !assigned.has(appId));
  if (missing.length) {
    try {
      await input.gateway.assignApps(input.userId, missing);
    } catch {
      throw new Error("Non è stato possibile assegnare tutte le app.");
    }
  }
  const changedApprovalStatus = account.status !== "approved";
  if (changedApprovalStatus) {
    await input.gateway.approveProfile(input.userId, input.approvedBy);
  }
  try {
    const activationUrl = await input.gateway.createPasswordSetupUrl(
      input.userId,
      input.siteUrl
    );
    await input.sendActivationEmail({
      email: account.email,
      fullName: account.fullName,
      appCount: defaultAppIds.length,
      activationUrl,
      idempotencyKey: `activation-approval/${input.userId}`,
    });
  } catch {
    try {
      if (changedApprovalStatus) {
        await input.gateway.restoreProfileStatus(input.userId, account.status);
      }
      if (missing.length) {
        await input.gateway.unassignApps(input.userId, missing);
      }
    } catch {
      throw new Error(
        "Invio email fallito e non è stato possibile ripristinare lo stato dell’account."
      );
    }
    return {
      status: "activation-email-failed" as const,
      appCount: defaultAppIds.length,
      emailSent: false,
    };
  }
  return {
    status: "approved" as const,
    appCount: defaultAppIds.length,
    emailSent: true,
  };
}
