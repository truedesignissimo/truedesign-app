import type { PcRecord } from "../domain/archive";

type CpuTopology = readonly [core: string, logicalProcessors: string];

/** Snapshot dell'inventario hardware del 03/11/2026, esclusi server e VM. */
const CPU_TOPOLOGY_BY_DEVICE: Record<string, CpuTopology> = {
  NbFlaviaM: ["8", "12"],
  NbValentinaM: ["10", "12"], NbMarta: ["10", "12"], NbAliceB: ["6", "12"],
  NbAlessandroM: ["10", "12"], NbNicole: ["10", "12"], NbSolange: ["10", "12"],
  NbAlessandraB: ["14", "20"], NbAlessandoMi: ["4", "8"], NbPozzonovo: ["4", "8"],
  NbMaraRu: ["12", "14"], NbUfficioT2: ["16", "22"], NbLucaC: ["8", "8"],
  NbCantiereTRUE: ["10", "12"], NbSimone: ["8", "12"], PcStefanoCal: ["10", "10"],
  NbMarcoB: ["8", "8"], PcBeatriceB: ["24", "24"], NbGaia: ["12", "14"],
  NbCristinaCr: ["16", "22"], NbFrancescaM: ["10", "12"], NbSofiaS: ["6", "12"],
  PcAlessandroC: ["16", "24"], PcMelaniaT: ["6", "12"], PcLucaB: ["12", "20"],
  PcMartinaC: ["24", "32"], PcLorenzoZ: ["8", "16"], PcAnna: ["6", "12"],
  PcMaddalena: ["6", "12"], PcLucaF: ["16", "24"], PcMarcoZe: ["8", "16"],
  PcAntonioB: ["6", "12"], PcQualita: ["10", "12"], PcAlessandraMe: ["24", "32"],
  PcWalterM: ["20", "28"], PcProduzione: ["10", "12"], PcJessicaS: ["14", "20"],
  PcFalegnameria: ["14", "20"], PcTommasoV: ["20", "20"], PcStefanoB: ["16", "24"],
  "Macbook-Air-GAS": ["10", "10"], "MacBook-Air-di-Giulia": ["8", "8"],
  "MacBook-Pro-di-Francesco-2": ["8", "8"], "MacBook-Air-4": ["10", "10"],
  "MacBook-Air-2": ["10", "10"], "Darios-MacBook-Pro": ["16", "16"],
};

const CPU_TOPOLOGY_FALLBACKS: Array<[RegExp, CpuTopology]> = [
  [/\bXeon W-2102\b/i, ["4", "4"]],
  [/\bCore i7-1355U\b/i, ["10", "12"]],
  [/\bCore i5-1335U\b/i, ["10", "12"]],
  [/\bCore Ultra 5 336H\b/i, ["12", "12"]],
  [/\bCore Ultra 7 255HX\b/i, ["20", "20"]],
];

const withoutUsageData = (storage: string) =>
  storage.replace(/\s*(?:,|con)\s*\d+(?:[.,]\d+)?\s*GB\s*usat[io].*$/i, "").trim();

export function enrichHardwareInventory(pcs: readonly PcRecord[]): PcRecord[] {
  return pcs.map((pc) => {
    const topology = CPU_TOPOLOGY_BY_DEVICE[pc.nome_dispositivo]
      ?? CPU_TOPOLOGY_FALLBACKS.find(([processor]) => processor.test(pc.processore))?.[1];

    return {
      ...pc,
      core_processore: topology?.[0] ?? "",
      processori_logici: topology?.[1] ?? "",
      archiviazione: withoutUsageData(pc.archiviazione),
    };
  });
}
