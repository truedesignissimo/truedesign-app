import { createApprovalToken } from "./approval-token";

export function buildApprovalUrl(
  userId: string,
  secret: string,
  siteUrl: string,
  nowMs = Date.now()
) {
  const url = new URL("/approva-utente", `${siteUrl}/`);
  url.searchParams.set("token", createApprovalToken(userId, secret, nowMs));
  return url.toString();
}
