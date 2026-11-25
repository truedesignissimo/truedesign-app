import { describe, expect, it } from "vitest";
import pcsData from "../data/pcs.json";
import { filterPcs, groupPcsByArea, summarizePcs, uniqueValues, type PcRecord } from "./archive";
import { assessPerformance } from "./performance";

const pcs = pcsData as PcRecord[];

describe("Archivio PC", () => {
  it("raggruppa nell’ordine dei reparti con i PC da assegnare in fondo", () => {
    const input = Object.freeze([...pcs]);
    const groups = groupPcsByArea(input);
    expect(groups.map((group) => group.area)).toEqual([
      "Ufficio Tecnico", "Commerciale", "Marketing", "Logistica", "Amministrazione", "Produzione", "Da assegnare",
    ]);
    expect(groups.at(-1)?.pcs.map((pc) => pc.assegnatario)).toEqual([
      "Ex Laptop Alessandra Benetti",
      "Ex Notebook Alberto",
      "Ex Notebook Gaia",
    ]);
    expect(groups.flatMap((group) => group.pcs)).toHaveLength(pcs.length);
    expect(input).toEqual(pcs);
  });

  it("omette i gruppi vuoti e ordina alfabeticamente i PC nel reparto", () => {
    const filtered = [pcs[6], pcs[3], { ...pcs[0], area: "  " }];
    const groups = groupPcsByArea(filtered);
    expect(groups.map((group) => group.area)).toEqual(["Ufficio Tecnico", "Da assegnare"]);
    expect(groups[0].pcs.map((pc) => pc.assegnatario)).toEqual(
      [...groups[0].pcs.map((pc) => pc.assegnatario)].sort((a, b) =>
        a.localeCompare(b, "it", { sensitivity: "base" }),
      ),
    );
    expect(groupPcsByArea([])).toEqual([]);
  });

  it("filtra per profilo insieme agli altri filtri", () => {
    const result = filterPcs(pcs, { query: "", area: "Ufficio Tecnico", type: "", profile: "3D avanzato", sort: "assignee" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((pc) => pc.profilo === "3D avanzato" && pc.area === "Ufficio Tecnico")).toBe(true);
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
  it("contiene 51 record e non duplica il notebook del cantiere", () => {
    expect(pcs).toHaveLength(51);
    expect(pcs.filter((pc) => pc.processore.includes("i7-1255U"))).toHaveLength(1);
    expect(pcs.find((pc) => pc.id === 16)?.assegnatario).toBe("Notebook Cantiere");
    expect(pcs.find((pc) => pc.id === 33)).toMatchObject({
      assegnatario: "Notebook Ufficio Tecnico",
      modello: "ThinkPad P16s Gen 3",
      numero_serie: "PF5D4R3F",
      area: "Ufficio Tecnico",
    });
  });

  it("assegna Marta Chiapperin all’Ufficio Tecnico con profilo Ufficio", () => {
    expect(pcs.find((pc) => pc.assegnatario === "Marta Chiapperin")).toMatchObject({
      area: "Ufficio Tecnico",
      profilo: "Ufficio",
    });
  });

  it("aggiorna il notebook assegnato a Sofia e conserva l’ex notebook Gaia", () => {
    expect(pcs.find((pc) => pc.id === 34)).toMatchObject({ assegnatario: "Sofia Sturaro", nome_dispositivo: "NbSofiaS", profilo: "Ufficio", area: "Ufficio Tecnico", numero_serie: "5CD5134675", processore: "AMD Ryzen 5 7530U", ram: "16 GB", archiviazione: "477 GB", data_installazione_os: "05/12/2025", note: "" });
    expect(pcs.find((pc) => pc.id === 35)).toMatchObject({ assegnatario: "Ex Notebook Gaia", nome_dispositivo: "NbGaiaB", profilo: "Ufficio", area: "", numero_serie: "5CD337LZ66", processore: "Intel Core i5-1335U", ram: "8 GB", archiviazione: "238 GB", data_installazione_os: "18/02/2025" });
    expect(pcs.every((pc) => ["Ufficio", "Tecnico", "Grafica", "3D avanzato"].includes(pc.profilo))).toBe(true);
    expect(pcs.every((pc) => typeof pc.nome_dispositivo === "string")).toBe(true);
    expect(pcs.filter((pc) => pc.profilo === "Grafica").map((pc) => pc.id)).toEqual([1, 3]);
    expect(pcs.filter((pc) => pc.profilo === "3D avanzato").map((pc) => pc.id)).toEqual([11, 32, 50]);
    expect(pcs.find((pc) => pc.id === 16)?.profilo).toBe("Tecnico");
    expect(pcs.find((pc) => pc.id === 33)?.profilo).toBe("Tecnico");
    expect(pcs.find((pc) => pc.id === 10)?.profilo).toBe("Ufficio");
    expect(pcs.find((pc) => pc.id === 48)).toMatchObject({ assegnatario: "Anna Masola", area: "Logistica", profilo: "Ufficio" });
    expect(pcs.filter((pc) => pc.area === "Commerciale").every((pc) => pc.profilo === "Ufficio")).toBe(true);
    expect(pcs.filter((pc) => pc.area === "Amministrazione").every((pc) => pc.profilo === "Ufficio")).toBe(true);
    expect(pcs.filter((pc) => pc.area === "Produzione").every((pc) => pc.profilo === "Ufficio")).toBe(true);
    expect(pcs.find((pc) => pc.id === 2)?.profilo).toBe("Ufficio");
    expect(pcs.find((pc) => pc.id === 13)?.profilo).toBe("Tecnico");
    expect(pcs.find((pc) => pc.id === 11)?.profilo).toBe("3D avanzato");
    expect(pcs.find((pc) => pc.id === 32)).toMatchObject({
      assegnatario: "Beatrice Barbieri",
      profilo: "3D avanzato",
      gpu: "NVIDIA GeForce RTX 5070, 12 GB",
      aggiornata: "25/11/2026",
    });
    expect(pcs.find((pc) => pc.id === 13)).toMatchObject({
      assegnatario: "Ex Laptop Alessandra Benetti",
      area: "",
    });
    expect(pcs.find((pc) => pc.id === 49)).toMatchObject({
      assegnatario: "Nuovo Laptop Alessandra Benetti",
      profilo: "Tecnico",
      area: "Ufficio Tecnico",
      tipologia: "Workstation portatile",
      modello: "HP ZBook 8 G2i 16 inch Mobile Workstation",
      processore: "Intel Core Ultra 5 336H, fino a 4,60 GHz",
      ram: "24 GB (5600 MT/s)",
      gpu: "NVIDIA RTX PRO 500 Blackwell Laptop GPU, 6 GB GDDR7 + Intel Graphics",
      schermo: "16\" WUXGA IPS antiriflesso",
      archiviazione: "SSD NVMe 512 GB",
    });
    expect(pcs.find((pc) => pc.id === 50)).toMatchObject({
      assegnatario: "Nuovo Laptop Beatrice Barbieri",
      profilo: "3D avanzato",
      area: "Ufficio Tecnico",
      tipologia: "Workstation portatile",
      modello: "HP ZBook Fury G1i 16 inch Mobile Workstation",
      processore: "Intel Core Ultra 7 255HX, fino a 5,20 GHz",
      ram: "32 GB (5600 MT/s)",
      gpu: "NVIDIA RTX PRO 2000 Blackwell Laptop GPU, 8 GB",
      schermo: "16\" WUXGA UWVA antiriflesso, 400 nit",
      archiviazione: "SSD NVMe 1 TB",
    });
    expect(pcs.find((pc) => pc.id === 28)).toMatchObject({ assegnatario: "Ex Notebook Alberto", area: "", profilo: "Ufficio" });
    expect(pcs.find((pc) => pc.id === 36)).toMatchObject({ assegnatario: "Valentina Marchioro", area: "Logistica", profilo: "Ufficio" });
    expect(pcs.find((pc) => pc.id === 46)).toMatchObject({ assegnatario: "Carloalberto Gasparello", area: "Commerciale", profilo: "Ufficio" });
    expect(pcs.find((pc) => pc.id === 47)).toMatchObject({ assegnatario: "Lorenzo Maniero", area: "Commerciale", profilo: "Ufficio" });
    expect(pcs.find((pc) => pc.id === 51)).toMatchObject({
      assegnatario: "Notebook Flavia",
      nome_dispositivo: "NbFlaviaM",
      area: "Amministrazione",
      profilo: "Ufficio",
      modello: "Lenovo V14 G4 IRU",
      numero_serie: "PF5JBF1L",
      processore: "Intel Core i5-13420H",
      ram: "16 GB",
      archiviazione: "477 GB",
      sistema_operativo: "Windows 11 Pro",
      versione_os: "25H2",
    });
    expect(pcs.filter((pc) => pc.area === "Ufficio Tecnico" && ![10, 11, 32, 34, 50].includes(pc.id)).every((pc) => pc.profilo === "Tecnico")).toBe(true);
  });

  it("cerca anche il nome dispositivo confermato", () => {
    expect(filterPcs(pcs, { query: "nbgaiab", area: "", type: "", profile: "", sort: "assignee" }).map((pc) => pc.id)).toEqual([35]);
  });

  it("cerca senza distinguere maiuscole e accenti in tutti i campi principali", () => {
    const result = filterPcs(pcs, {
      query: "Uffício Técnico pf5d4r3f",
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

    expect(result[0].aggiornata).toBe("25/11/2026");
    expect(summary.total).toBe(51);
    expect(summary.notebooks).toBe(pcs.filter((pc) => pc.tipologia === "Notebook").length);
    expect(summary.areas).toBe(new Set(pcs.map((pc) => pc.area).filter(Boolean)).size);
    expect(summary.windows11).toBe(pcs.filter((pc) => pc.sistema_operativo.includes("Windows 11")).length);
  });

  it("restituisce valori unici ordinati", () => {
    expect(uniqueValues(pcs, "area")).toEqual(
      [...new Set(pcs.map((pc) => pc.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it")),
    );
  });

  it("registra prezzo, data e venditore sui computer riconosciuti", () => {
    expect(pcs.find((pc) => pc.id === 50)).toMatchObject({ prezzo_acquisto: "2.950,00 €", data_acquisto: "18/11/2026", venditore: "Informatica2008" });
    expect(pcs.find((pc) => pc.id === 49)).toMatchObject({ prezzo_acquisto: "2.061,97 €", data_acquisto: "11/2026", venditore: "HP" });
    expect(pcs.find((pc) => pc.id === 32)).toMatchObject({ prezzo_acquisto: "2.633,39 € + circa 800 € scheda grafica", data_acquisto: "02/09/2026" });
    expect(pcs.find((pc) => pc.id === 23)).toMatchObject({ prezzo_acquisto: "726,00 €", data_acquisto: "27/06/2024", venditore: "HP.com" });
    expect(pcs.find((pc) => pc.id === 42)).toMatchObject({ prezzo_acquisto: "234,86 €", data_acquisto: "26/06/2025", venditore: "PSK Megastore" });
    expect(pcs.find((pc) => pc.id === 12)).toMatchObject({ prezzo_acquisto: "944,29 €", data_acquisto: "13/01/2026", venditore: "BPM Power" });
    expect(pcs.find((pc) => pc.id === 8)).not.toHaveProperty("prezzo_acquisto");
    expect(pcs.find((pc) => pc.id === 39)).toMatchObject({ prezzo_acquisto: "1.604,06 €", data_acquisto: "05/08/2025", venditore: "BPM Power" });
    expect(pcs.find((pc) => pc.id === 39)?.venditore).toBe("BPM Power");
    expect(pcs.find((pc) => pc.id === 39)?.note).not.toContain("RS Trade Srls");
    expect(pcs.find((pc) => pc.id === 39)?.note).toContain("1.617,51 €");
    expect(pcs.find((pc) => pc.id === 43)).toMatchObject({ prezzo_acquisto: "635,38 €", data_acquisto: "15/09/2025", venditore: "A&D Gaming" });
    expect(pcs.find((pc) => pc.id === 14)).toMatchObject({
      prezzo_acquisto: "1.779,09 €",
      data_acquisto: "02/04/2024",
      articolo_acquisto: "HP Z2 Tower G9 Workstation, 86C72EA#ABZ",
    });
    expect(pcs.find((pc) => pc.id === 13)).toMatchObject({
      prezzo_acquisto: "1.519,96 €",
      data_acquisto: "22/02/2024",
      venditore: "PSK Megastore",
    });
    for (const id of [10, 35, 37]) {
      expect(pcs.find((pc) => pc.id === id)).toMatchObject({
        prezzo_acquisto: "743,18 €",
        data_acquisto: "18/01/2024",
        venditore: "PSK Megastore",
        articolo_acquisto: "HP EliteBook 630 13.3 inch G10 Notebook PC Wolf Pro Security Edition",
      });
    }
  });
});
