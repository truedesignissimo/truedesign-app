export type PasswordRecoveryAccount = {
  email: string;
  firstName: string;
};

export type PasswordRecoveryGateway = {
  findActiveAccount(email: string): Promise<PasswordRecoveryAccount | null>;
  createRecoveryUrl(email: string): Promise<string>;
  sendRecoveryEmail(input: {
    email: string;
    firstName: string;
    recoveryUrl: string;
  }): Promise<void>;
};

export async function requestPasswordRecovery(
  rawEmail: string,
  gateway: PasswordRecoveryGateway
) {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) return { ok: true as const };

  const account = await gateway.findActiveAccount(email);
  if (!account) return { ok: true as const };

  const recoveryUrl = await gateway.createRecoveryUrl(account.email);
  await gateway.sendRecoveryEmail({
    email: account.email,
    firstName: account.firstName,
    recoveryUrl,
  });
  return { ok: true as const };
}
