export type ApprovalStatus = "pending" | "approved" | "rejected";

export function getUserActivationStatus(
  approvalStatus: ApprovalStatus,
  emailConfirmedAt: string | null,
  lastSignInAt: string | null
) {
  if (approvalStatus === "rejected") {
    return { label: "Sospeso", tone: "pending" as const };
  }
  if (approvalStatus === "pending") {
    return { label: "Da approvare", tone: "pending" as const };
  }
  if (!emailConfirmedAt) {
    return { label: "In attesa di conferma email", tone: "pending" as const };
  }
  if (!lastSignInAt) {
    return { label: "Accesso mai completato", tone: "pending" as const };
  }
  return { label: "Attivo", tone: "active" as const };
}
