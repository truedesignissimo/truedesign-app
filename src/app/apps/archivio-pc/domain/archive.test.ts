import { describe, expect, it } from "vitest";
import pcsData from "../data/pcs.json";
import { filterPcs, summarizePcs, uniqueValues, type PcRecord } from "./archive";
import { assessPerformance } from "./performance";

const pcs = pcsData as PcRecord[];

describe("Archivio PC", () => {
  it("filtra per profilo insieme agli altri filtri", () => {
    const result = filterPcs(pcs, { query: "", area: "Ufficio Tecnico", type: "", profile: "Render", sort: "assignee" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((pc) => pc.profilo === "Render" && pc.area === "Ufficio Tecnico")).toBe(true);
    expect(filterPcs(pcs, { query: "", area: "", type: "", profile: "Grafica", sort: "assignee" }).map((pc) => pc.id)).toEqual([3, 1]);
  });

  it("ordina dal voto prestazionale più basso con dati non valutabili in fondo", () => {
    const unscored = { ...pcs[0], id: 100, processore: "", ram: "", gpu: "", archiviazione: "" };
    const tied = { ...pcs[0], id: 101 };
    const input = [unscored, tied, ...pcs];
    const result = filterPcs(input, { query: "", area: "", type: "", profile: "", sort: "performance" });
    const scores = result.map((pc) => assessPerformance(pc).score ?? Infinity);
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
    expect(result.at(-1)?.id).toBe(100);
    expect(result.indexOf(pcs[0])).toBeLessThan(result.indexOf(tied));
    expect(input[0]).toBe(unscored);
  });
  it("contiene 35 record e non duplica il notebook del cantiere", () => {
    expect(pcs).toHaveLength(35);
    expect(pcs.filter((pc) => pc.processore.includes("i7-1255U"))).toHaveLength(1);
    expect(pcs.find((pc) => pc.id === 16)?.assegnatario).toBe("Notebook Cantiere");
    expect(pcs.find((pc) => pc.id === 33)).toMatchObject({
      assegnatario: "NbUfficioT2",
      modello: "ThinkPad P16s Gen 3",
      numero_serie: "21KS0004IX",
      area: "Ufficio Tecnico",
    });
  });

  it("censisce i due ex notebook senza inventare area, seriale o dati hardware", () => {
    expect(pcs.find((pc) => pc.id === 34)).toMatchObject({ assegnatario: "Ex Notebook Cristina", nome_dispositivo: "NbCristinaC", profilo: "Ufficio", area: "", numero_serie: "", processore: "AMD Ryzen 5 7530U", ram: "16 GB", archiviazione: "477 GB con 157 GB usati", data_installazione_os: "05/12/2025" });
    expect(pcs.find((pc) => pc.id === 35)).toMatchObject({ assegnatario: "Ex Notebook Gaia", nome_dispositivo: "NbGaiaB", profilo: "Ufficio", area: "", numero_serie: "5CD337LZ66", processore: "Intel Core i5-1335U", ram: "8 GB", archiviazione: "238 GB con 220 GB usati", data_installazione_os: "18/02/2025" });
    expect(pcs.every((pc) => ["Ufficio", "Tecnico", "Grafica", "Render"].includes(pc.profilo))).toBe(true);
    expect(pcs.every((pc) => typeof pc.nome_dispositivo === "string")).toBe(true);
    expect(pcs.filter((pc) => pc.profilo === "Grafica").map((pc) => pc.id)).toEqual([1, 3]);
    expect(pcs.filter((pc) => pc.profilo === "Render").map((pc) => pc.id)).toEqual([4, 6, 7, 11, 14, 32]);
    expect(pcs.find((pc) => pc.id === 16)?.profilo).toBe("Ufficio");
    expect(pcs.find((pc) => pc.id === 33)?.profilo).toBe("Tecnico");
  });

  it("cerca anche il nome dispositivo confermato", () => {
    expect(filterPcs(pcs, { query: "nbgaiab", area: "", type: "", profile: "", sort: "assignee" }).map((pc) => pc.id)).toEqual([35]);
  });

  it("cerca senza distinguere maiuscole e accenti in tutti i campi principali", () => {
    const result = filterPcs(pcs, {
      query: "Uffício Técnico 21ks0004ix",
      profile: "",
      area: "",
      type: "",
      sort: "assignee",
    });

    expect(result.map((pc) => pc.id)).toEqual([33]);
  });

  it("combina i filtri e ordina per assegnatario", () => {
    const result = filterPcs(pcs, {
      query: "",
      profile: "",
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
    const result = filterPcs(pcs, { query: "", area: "", type: "", profile: "", sort: "updated" });
    const summary = summarizePcs(pcs);

    expect(result[0].aggiornata).toBe("29/10/2026");
    expect(summary.total).toBe(35);
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
