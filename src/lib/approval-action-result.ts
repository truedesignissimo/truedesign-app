export type ApprovalActionStatus =
  | "approved"
  | "activation-email-failed"
  | "rejected";

export function getApprovalActionResult(status: ApprovalActionStatus) {
  if (status === "activation-email-failed") {
    return {
      ok: false,
      approvalStatus: "pending" as const,
      message: "La mail non è stata accettata dal provider: l’utente resta da approvare.",
    };
  }
  if (status === "rejected") {
    return {
      ok: true,
      approvalStatus: "rejected" as const,
      message: "Accesso sospeso.",
    };
  }
  return {
    ok: true,
    approvalStatus: "approved" as const,
    message: "Utente approvato, app assegnate e conferma inviata.",
  };
}
