import { describe, expect, it } from "vitest";
import { getApprovalActionResult } from "./approval-action-result";

describe("getApprovalActionResult", () => {
  it("mantiene pending l'interfaccia quando l'email non è stata accettata", () => {
    expect(getApprovalActionResult("activation-email-failed")).toEqual({
      ok: false,
      approvalStatus: "pending",
      message: "La mail non è stata accettata dal provider: l’utente resta da approvare.",
    });
  });

  it("aggiorna lo stato solo dopo approvazione o sospensione riuscita", () => {
    expect(getApprovalActionResult("approved").approvalStatus).toBe("approved");
    expect(getApprovalActionResult("rejected").approvalStatus).toBe("rejected");
  });
});
