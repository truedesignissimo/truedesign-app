export type AccessSource = "homepage" | "login";

export type AccessLogGateway = {
  getAuthenticatedUserId(): Promise<string | null>;
  insert(userId: string, source: AccessSource): Promise<void>;
};

export async function recordAuthenticatedAccess(
  source: AccessSource,
  gateway: AccessLogGateway
) {
  const userId = await gateway.getAuthenticatedUserId();
  if (!userId) {
    return { ok: false as const, error: "Sessione non disponibile." };
  }

  try {
    await gateway.insert(userId, source);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Accesso non registrato." };
  }
}
