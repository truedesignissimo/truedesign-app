import type { ApprovalTokenResult } from "@/lib/approval-token";

export function getApprovalPageState(result: ApprovalTokenResult) {
  if (!result.ok) {
    return result.reason === "expired"
      ? { kind: "expired" as const, title: "Link scaduto" }
      : { kind: "invalid" as const, title: "Link non valido" };
  }
  return {
    kind: "ready" as const,
    title: "Approva questo utente",
    userId: result.userId,
  };
}
