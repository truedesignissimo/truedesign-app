export type PasswordSetupGateway = {
  verifyRecoveryToken(tokenHash: string): Promise<boolean>;
  updatePassword(password: string): Promise<boolean>;
};

export async function completePasswordSetup(input: {
  tokenHash: string;
  password: string;
  gateway: PasswordSetupGateway;
}) {
  if (input.password.length < 8) {
    return {
      ok: false as const,
      error: "La password deve contenere almeno 8 caratteri.",
    };
  }
  const verified = await input.gateway.verifyRecoveryToken(input.tokenHash);
  if (!verified) {
    return {
      ok: false as const,
      error: "Il link non è valido o è scaduto. Richiedi una nuova email.",
    };
  }
  const updated = await input.gateway.updatePassword(input.password);
  if (!updated) {
    return {
      ok: false as const,
      error: "Non è stato possibile impostare la password. Richiedi una nuova email.",
    };
  }
  return { ok: true as const };
}
