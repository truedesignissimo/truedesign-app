import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_MS = 72 * 60 * 60 * 1000;

export type ApprovalTokenResult =
  | { ok: true; userId: string; expiresAt: number }
  | { ok: false; reason: "invalid" | "expired" };

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createApprovalToken(userId: string, secret: string, nowMs = Date.now()) {
  if (!userId || secret.length < 32) throw new Error("Configurazione token non valida.");
  const payload = Buffer.from(JSON.stringify({
    userId,
    expiresAt: nowMs + TTL_MS,
  })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyApprovalToken(
  token: string,
  secret: string,
  nowMs = Date.now()
): ApprovalTokenResult {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || secret.length < 32) {
    return { ok: false, reason: "invalid" };
  }
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return { ok: false, reason: "invalid" };
  }
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof value.userId !== "string" || !value.userId || typeof value.expiresAt !== "number") {
      return { ok: false, reason: "invalid" };
    }
    if (nowMs > value.expiresAt) return { ok: false, reason: "expired" };
    return { ok: true, userId: value.userId, expiresAt: value.expiresAt };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
