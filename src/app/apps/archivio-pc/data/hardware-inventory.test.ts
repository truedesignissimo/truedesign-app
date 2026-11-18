import { describe, expect, it } from "vitest";
import pcsData from "./pcs.json";
import type { PcRecord } from "../domain/archive";
import { enrichHardwareInventory } from "./hardware-inventory";

describe("Integrazione inventario hardware 3 novembre 2026", () => {
  const pcs = enrichHardwareInventory(pcsData as PcRecord[]);

  it("aggiunge core fisici e processori logici a tutti i PC senza importare server o VM", () => {
    expect(pcs).toHaveLength(51);
    expect(pcs.every((pc) => pc.core_processore && pc.processori_logici)).toBe(true);
    expect(pcs.some((pc) => pc.nome_dispositivo === "PcNavision")).toBe(false);
    expect(pcs.filter((pc) => pc.nome_dispositivo === "NbFlaviaM")).toHaveLength(1);
    expect(pcs.some((pc) => pc.tipologia === "Server")).toBe(false);
  });

  it.each([
    ["Dario Breggiè", "16", "16"],
    ["Francesco Maniero", "8", "8"],
    ["Stefano Baldin", "4", "4"],
    ["Ex Notebook Alberto", "10", "12"],
    ["Ex Notebook Gaia", "10", "12"],
    ["Nuovo Laptop Alessandra Benetti", "12", "12"],
    ["Nuovo Laptop Beatrice Barbieri", "20", "20"],
    ["Notebook Flavia", "8", "12"],
  ])("censisce la topologia CPU di %s", (assegnatario, cores, logical) => {
    expect(pcs.find((pc) => pc.assegnatario === assegnatario)).toMatchObject({
      core_processore: cores,
      processori_logici: logical,
    });
  });

  it("non conserva dati sullo spazio usato o libero", () => {
    expect(pcs.every((pc) => !/\b(usat[io]|liber[io])\b/i.test(pc.archiviazione))).toBe(true);
  });
});
