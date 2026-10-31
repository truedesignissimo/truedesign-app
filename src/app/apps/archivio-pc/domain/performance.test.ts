import { describe, expect, it } from "vitest";
import pcsData from "../data/pcs.json";
import type { PcRecord } from "./archive";
import { assessPerformance, missingPerformanceData, PROFILE_WEIGHTS, rankReplacementPriority } from "./performance";

const pcs = pcsData as PcRecord[];
const pc = (overrides: Partial<PcRecord> = {}): PcRecord => ({
  ...pcs[0], profilo: "Ufficio", nome_dispositivo: "", processore: "", gpu: "", ram: "",
  archiviazione: "", sistema_operativo: "Windows 11 Pro", versione_os: "25H2", note: "", ...overrides,
});

describe("Performance PC", () => {
  it("seleziona i sei PC meno adatti al profilo, esclude i non valutabili e ordina le parità per assegnatario", () => {
    const candidates = [
      pc({ id: 101, assegnatario: "Quarantotto", ram: "48 GB" }),
      pc({ id: 102, assegnatario: "Zeno", ram: "8 GB" }),
      pc({ id: 103, assegnatario: "Bassa", ram: "4 GB" }),
      pc({ id: 104, assegnatario: "Invalido", ram: "" }),
      pc({ id: 105, assegnatario: "Trentadue", ram: "32 GB" }),
      pc({ id: 106, assegnatario: "Alberto", ram: "8 GB" }),
      pc({ id: 107, assegnatario: "Sedici", ram: "16 GB" }),
      pc({ id: 108, assegnatario: "Dodici", ram: "12 GB" }),
    ];

    expect(rankReplacementPriority(candidates).map((item) => item.assegnatario)).toEqual([
      "Bassa", "Alberto", "Zeno", "Dodici", "Sedici", "Trentadue",
    ]);
  });

  it("usa esattamente i pesi concordati e la media geometrica rinormalizzata", () => {
    expect(PROFILE_WEIGHTS).toEqual({
      Ufficio: { singleCore: .4, multiCore: .15, gpu: .05, ram: .25, storage: .15, graphicsMemory: 0 },
      Tecnico: { singleCore: .35, multiCore: .25, gpu: .15, ram: .2, storage: .05, graphicsMemory: 0 },
      Grafica: { singleCore: .2, multiCore: .15, gpu: .25, ram: .25, storage: .05, graphicsMemory: .1 },
      Render: { singleCore: .1, multiCore: .3, gpu: .3, ram: .15, storage: .05, graphicsMemory: .1 },
    });
    const result = assessPerformance(pc({ processore: "AMD Ryzen 5 7530U", ram: "16 GB" }));
    const expected = Math.pow(((2966 - 1500) / 3500) * 100, .4 / .8)
      * Math.pow(((14847 - 5000) / 45000) * 100, .15 / .8) * Math.pow(60, .25 / .8);
    expect(result.score).toBe(Math.round(expected));
    expect(result.knownWeight).toBeCloseTo(.8);
    expect(result.confidence).toBe("Media");
    expect(result.provisional).toBe(true);
  });

  it.each([
    ["4 GB", 10, "Insufficiente"], ["12 GB", 48, "Limitato"], ["16 GB", 60, "Adeguato"],
    ["32 GB", 80, "Forte"], ["48 GB", 90, "Eccellente"], ["128 GB", 100, "Eccellente"],
  ])("interpola RAM %s e classifica la fascia", (ram, score, band) => {
    expect(assessPerformance(pc({ ram }))).toMatchObject({ score, band });
  });

  it("non tratta un dato mancante come zero e non restituisce NaN senza dati", () => {
    expect(assessPerformance(pc({ ram: "32 GB" }))).toMatchObject({ score: 80, confidence: "Bassa", knownWeight: .25 });
    expect(assessPerformance(pc())).toMatchObject({ score: null, band: "Non valutabile", confidence: "Bassa" });
    expect(assessPerformance(pc({ ram: "0 GB" })).components.ram).toBeNull();
  });

  it("distingue attendibilità Alta, Media e Bassa secondo il peso noto", () => {
    const hardware = { processore: "Intel Core i9-13900K", ram: "64 GB", gpu: "NVIDIA GeForce RTX 4060 Ti, 8 GB", archiviazione: "SSD 1000 GB, 100 GB usati" };
    expect(assessPerformance(pc(hardware))).toMatchObject({ confidence: "Alta", provisional: false });
    expect(assessPerformance(pc({ ...hardware, gpu: "", archiviazione: "" }))).toMatchObject({ confidence: "Media", provisional: true });
    expect(assessPerformance(pc({ processore: hardware.processore }))).toMatchObject({ confidence: "Bassa", provisional: true, recommendationProvisional: true });
    expect(assessPerformance(pc({ ...hardware, profilo: "Render", gpu: "NVIDIA GeForce RTX 4060 Ti" }))).toMatchObject({ confidence: "Alta", knownWeight: .9 });
  });

  it("propone la ricollocazione quando il PC è adeguato solo per Ufficio", () => {
    const result = assessPerformance(pc({ profilo: "Render", processore: "Intel Core i7-13700H", ram: "32 GB", gpu: "NVIDIA T400, 2 GB", archiviazione: "SSD 1000 GB, 100 GB usati" }));
    expect(result.score).toBeLessThan(55);
    expect(result.scoresByProfile.Ufficio).toBeGreaterThanOrEqual(55);
    expect(result.recommendation).toBe("Ricolloca in Ufficio");
  });

  it("separa lo stato OS dal voto e dà precedenza al sistema esplicitamente fuori supporto", () => {
    const current = pc({ processore: "Intel Core i9-13900K", ram: "64 GB", gpu: "NVIDIA GeForce RTX 4060 Ti, 8 GB", archiviazione: "SSD 1000 GB, 100 GB usati" });
    const retired = { ...current, sistema_operativo: "Windows 10 Pro", versione_os: "22H2", note: "Fuori supporto standard; ESU da verificare" };
    expect(assessPerformance(retired).score).toBe(assessPerformance(current).score);
    expect(assessPerformance(retired)).toMatchObject({ osSupport: "Fuori supporto", recommendation: "Pensiona prima" });
    expect(assessPerformance(current)).toMatchObject({ osSupport: "Supportato", recommendation: "Mantieni" });
    expect(assessPerformance({ ...current, versione_os: "23H2" }).osSupport).toBe("Fuori supporto");
    expect(assessPerformance({ ...current, sistema_operativo: "", versione_os: "" }).recommendation).toBe("Verifica sistema operativo");
  });

  it("usa la memoria unificata Apple e non inventa un G3D Mark da benchmark incompatibili", () => {
    const result = assessPerformance(pc({ profilo: "Grafica", processore: "Apple M4 Max", ram: "48 GB", gpu: "Integrata" }));
    expect(result.components.graphicsMemory).toBe(90);
    expect(result.components.gpu).toBeNull();
    expect(result.missingData).toContain("Benchmark GPU comparabile per Apple M4 Max");
  });

  it("riconosce la GPU dal modello e mai dai soli GB, interpolando la VRAM", () => {
    const result = assessPerformance(pc({ profilo: "Render", gpu: "GPU dedicata 6 GB (modello da verificare)" }));
    expect(result.components.gpu).toBeNull();
    expect(result.components.graphicsMemory).toBe(65);
    expect(result.missingData).toContain("Modello GPU e relativo benchmark");
    expect(assessPerformance(pc({ gpu: "NVIDIA GeForce RTX 4060 Ti, 8 GB" })).components.gpu).toBeGreaterThan(80);
  });

  it("penalizza soltanto le soglie note di spazio libero e conserva la tecnologia sconosciuta", () => {
    expect(assessPerformance(pc({ archiviazione: "SSD 100 GB, 80 GB usati" })).components.storage).toBe(75);
    expect(assessPerformance(pc({ archiviazione: "SSD 100 GB, 81 GB usati" })).components.storage).toBe(50);
    expect(assessPerformance(pc({ archiviazione: "SSD 100 GB, 90 GB usati" })).components.storage).toBe(50);
    expect(assessPerformance(pc({ archiviazione: "SSD 238 GB, 220 GB usati" })).components.storage).toBe(25);
    expect(assessPerformance(pc({ archiviazione: "NVMe 100 GB, 10 GB usati" })).components.storage).toBe(90);
    expect(assessPerformance(pc({ archiviazione: "HDD 100 GB, 95 GB usati" })).components.storage).toBe(0);
    expect(assessPerformance(pc({ archiviazione: "238 GB con 220 GB usati" })).components.storage).toBeNull();
    expect(assessPerformance(pc({ archiviazione: "SSD 238 GB" })).components.storage).toBe(75);
    expect(missingPerformanceData(pc({ archiviazione: "SSD 238 GB" }))).toContain("Spazio libero di archiviazione");
  });

  it("censisce i dati mancanti pertinenti al profilo e la criticità confermata di Gaia", () => {
    const gaia = pcs.find((item) => item.id === 35)!;
    expect(assessPerformance(gaia).storageWarning).toContain("meno del 10%");
    expect(missingPerformanceData(pc())).toContain("Modello CPU e relativi benchmark");
    expect(missingPerformanceData(pc())).toContain("Capacità RAM");
    expect(missingPerformanceData(pc())).toContain("Tecnologia di archiviazione (HDD, SSD o NVMe)");
    expect(missingPerformanceData(pc())).not.toContain("Capacità memoria grafica");
    expect(missingPerformanceData(pc({ profilo: "Render" }))).toContain("Capacità memoria grafica");
  });

  it("è puro, deterministico e limita tutti i punteggi tra zero e cento", () => {
    const input = Object.freeze(pc({ processore: "Intel Core i9-13900K", ram: "128 GB" }));
    expect(assessPerformance(input)).toEqual(assessPerformance(input));
    for (const item of pcs) {
      const result = assessPerformance(item);
      for (const score of [...Object.values(result.components), ...Object.values(result.scoresByProfile)]) {
        if (score !== null) expect(score).toBeGreaterThanOrEqual(0);
        if (score !== null) expect(score).toBeLessThanOrEqual(100);
      }
    }
  });
});
