import { describe, expect, it } from "vitest";
import { normalizePcInput, toPcRecord } from "./editor";

describe("Editor Archivio PC", () => {
  it("normalizza i campi consentiti senza accettare metadati di scrittura", () => {
    const result = normalizePcInput({
      assegnatario: "  Flavia ", tipologia: "Notebook", profilo: "Ufficio", area: "Da assegnare",
      id: 100, is_archived: true, updated_by: "forged",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fields).toMatchObject({ assegnatario: "Flavia", area: "", gpu: "" });
    expect(result.fields).not.toHaveProperty("updated_by");
    expect(result.fields).not.toHaveProperty("is_archived");
  });

  it.each([{}, { assegnatario: "A", tipologia: "Notebook", profilo: "Admin" },
    { assegnatario: "A", tipologia: "Server", profilo: "Tecnico" },
    { assegnatario: "A", tipologia: "Notebook", profilo: "Ufficio", note: "A".repeat(2001) },
  ])("rifiuta input incompleti o non validi", (input) => {
    expect(normalizePcInput(input).ok).toBe(false);
  });

  it("converte la data senza esporre i dati interni di modifica", () => {
    const result = normalizePcInput({ assegnatario: "A", tipologia: "Notebook", profilo: "Ufficio" });
    if (!result.ok) throw new Error("Dati di test non validi");
    expect(toPcRecord({ ...result.fields, id: 1, updated_on: "2026-11-25", updated_at: "versione" })).toEqual({
      ...result.fields, id: 1, aggiornata: "25/11/2026",
    });
  });
});
