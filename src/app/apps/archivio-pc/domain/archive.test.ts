import { describe, expect, it } from "vitest";
import pcsData from "../data/pcs.json";
import { filterPcs, summarizePcs, uniqueValues, type PcRecord } from "./archive";

const pcs = pcsData as PcRecord[];

describe("Archivio PC", () => {
  it("contiene 33 record e non duplica il notebook del cantiere", () => {
    expect(pcs).toHaveLength(33);
    expect(pcs.filter((pc) => pc.processore.includes("i7-1255U"))).toHaveLength(1);
    expect(pcs.find((pc) => pc.id === 16)?.assegnatario).toBe("Notebook Cantiere");
    expect(pcs.find((pc) => pc.id === 33)).toMatchObject({
      assegnatario: "NbUfficioT2",
      modello: "ThinkPad P16s Gen 3",
      numero_serie: "21KS0004IX",
      area: "Ufficio Tecnico",
    });
  });

  it("cerca senza distinguere maiuscole e accenti in tutti i campi principali", () => {
    const result = filterPcs(pcs, {
      query: "Uffício Técnico 21ks0004ix",
      area: "",
      type: "",
      sort: "assignee",
    });

    expect(result.map((pc) => pc.id)).toEqual([33]);
  });

  it("combina i filtri e ordina per assegnatario", () => {
    const result = filterPcs(pcs, {
      query: "",
      area: "Ufficio Tecnico",
      type: "Notebook",
      sort: "assignee",
    });

    expect(result.length).toBeGreaterThan(1);
    expect(result.every((pc) => pc.area === "Ufficio Tecnico" && pc.tipologia === "Notebook")).toBe(true);
    expect(result.map((pc) => pc.assegnatario)).toEqual(
      [...result.map((pc) => pc.assegnatario)].sort((a, b) => a.localeCompare(b, "it")),
    );
  });

  it("ordina per aggiornamento più recente e produce riepiloghi", () => {
    const result = filterPcs(pcs, { query: "", area: "", type: "", sort: "updated" });
    const summary = summarizePcs(pcs);

    expect(result[0].aggiornata).toBe("28/10/2026");
    expect(summary.total).toBe(33);
    expect(summary.notebooks).toBe(pcs.filter((pc) => pc.tipologia === "Notebook").length);
    expect(summary.areas).toBe(new Set(pcs.map((pc) => pc.area).filter(Boolean)).size);
    expect(summary.windows11).toBe(pcs.filter((pc) => pc.sistema_operativo.includes("Windows 11")).length);
  });

  it("restituisce valori unici ordinati", () => {
    expect(uniqueValues(pcs, "area")).toEqual(
      [...new Set(pcs.map((pc) => pc.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it")),
    );
  });
});
