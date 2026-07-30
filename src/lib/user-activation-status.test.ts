import { describe, expect, it } from "vitest";
import { getUserActivationStatus } from "./user-activation-status";

describe("getUserActivationStatus", () => {
  it("considera attivo solo un account approvato con email confermata", () => {
    expect(getUserActivationStatus(
      "approved",
      "2026-07-30T10:00:00Z",
      "2026-07-30T10:05:00Z"
    )).toEqual({
      label: "Attivo",
      tone: "active",
    });
    expect(getUserActivationStatus("approved", null, null)).toEqual({
      label: "In attesa di conferma email",
      tone: "pending",
    });
  });

  it("non considera attivi gli account preconfermati che non hanno mai effettuato accesso", () => {
    expect(getUserActivationStatus(
      "approved",
      "2026-07-30T10:00:00Z",
      null
    )).toEqual({
      label: "Accesso mai completato",
      tone: "pending",
    });
  });

  it("distingue le richieste da approvare dagli accessi sospesi", () => {
    expect(getUserActivationStatus("pending", null, null).label).toBe("Da approvare");
    expect(getUserActivationStatus("rejected", null, null).label).toBe("Sospeso");
  });
});
