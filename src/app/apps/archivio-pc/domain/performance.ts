import type { PcRecord } from "./archive";

export type PerformanceProfile = "Ufficio" | "Tecnico" | "Grafica" | "Render";
export type PerformanceComponents = Record<"singleCore" | "multiCore" | "gpu" | "ram" | "storage" | "graphicsMemory", number | null>;
export type PerformanceAssessment = {
  profile: PerformanceProfile;
  score: number | null;
  band: string;
  confidence: "Alta" | "Media" | "Bassa";
  provisional: boolean;
  knownWeight: number;
  components: PerformanceComponents;
  scoresByProfile: Record<PerformanceProfile, number | null>;
  recommendation: string;
  recommendationProvisional: boolean;
  osSupport: "Supportato" | "Fuori supporto" | "Da verificare";
  missingData: string[];
  storageWarning: string | null;
};

export const PROFILE_WEIGHTS = {
  Ufficio: { singleCore: .4, multiCore: .15, gpu: .05, ram: .25, storage: .15, graphicsMemory: 0 },
  Tecnico: { singleCore: .35, multiCore: .25, gpu: .15, ram: .2, storage: .05, graphicsMemory: 0 },
  Grafica: { singleCore: .2, multiCore: .15, gpu: .25, ram: .25, storage: .05, graphicsMemory: .1 },
  Render: { singleCore: .1, multiCore: .3, gpu: .3, ram: .15, storage: .05, graphicsMemory: .1 },
} as const satisfies Record<PerformanceProfile, Record<keyof PerformanceComponents, number>>;

/**
 * Snapshot v1, rilevato il 29/10/2026. Riferimenti CPU PassMark PerformanceTest V10:
 * https://www.cpubenchmark.net/cpu-list/ (CPU Mark)
 * https://www.cpubenchmark.net/singleThread.html (Single Thread Rating).
 * Sono riferimenti di modello, non misure effettuate su questi PC. I valori sono
 * congelati per rendere il censimento riproducibile; nessuna richiesta di rete a runtime.
 * La chiave include l'intero suffisso (K, KS, H, U...), mai un modello "simile".
 * Xeon: https://www.cpubenchmark.net/cpu.php?id=3276 (dato ST disponibile 05/03/2026).
 * Ryzen: https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+5+7530U&id=5126.
 * M1 Pro e M4 Max hanno varianti con numero di core non censito: nessuna scelta implicita.
 */
const CPU_BENCHMARKS: Record<string, readonly [number, number]> = {
  "w-2102": [1667, 5120], "i7-12700f": [3842, 30126], "i9-11900": [3372, 22346],
  "i9-12900k": [4128, 41096], "i7-14700": [4233, 40186], "i9-12900ks": [4322, 43377],
  "i7-11700k": [3385, 24305], "i5-1335u": [3238, 13737], "i9-13900k": [4594, 58037],
  "ultra 5 225": [4414, 30340], "i7-13700h": [3549, 25780], "i9-13900": [4276, 44489],
  "i5-11400": [2980, 16609], "i7-1255u": [3142, 12916], "i7-10750h": [2604, 11417],
  "i5-13500": [3848, 30659], "ultra 7 155h": [3400, 24418], "ultra 7 155u": [3296, 16117],
  "ultra 5 125u": [3226, 16669], "i5-1235u": [3040, 12393], "i5-13420h": [3344, 16732],
  "i5-12400": [3466, 18829], "i5-1135g7": [2592, 9285], "i7-1355u": [3360, 13817],
  "ultra 9 285": [4910, 57908], "ryzen 5 7530u": [2966, 14847],
  "apple m2": [3880, 15644], "apple m4": [4491, 23567],
};

/** G3D Mark, stessa data/versione del censimento, fonte primaria:
 * https://www.videocardbenchmark.net/gpu_list.php.
 * Solo modelli identificati. GPU generiche Intel/Radeon e Apple non hanno un
 * riferimento univoco comparabile: non si convertono Metal/Geekbench in G3D.
 */
const GPU_BENCHMARKS: readonly (readonly [RegExp, number])[] = [
  [/\brtx 5060\b(?!\s*(ti|laptop))/i, 20594], [/\brtx 4060 ti\b/i, 22594],
  [/\bt1000\s*,?\s*8\s*gb\b/i, 7684], [/\bt1000\b/i, 7633],
  [/\bt400\s*,?\s*4\s*gb\b/i, 3812], [/\bt400\b/i, 3602],
  [/\brtx a500 laptop\b/i, 6555], [/\brtx 500 ada generation laptop\b/i, 11196],
  [/\barc a750\b/i, 12638], [/\buhd graphics 730\b/i, 1544],
  [/\buhd graphics 750\b/i, 1682], [/\buhd graphics 770\b/i, 1908],
];

const RAM_CURVE = [[0, 0], [4, 10], [8, 35], [16, 60], [32, 80], [48, 90], [64, 100]] as const;
const VRAM_CURVE = [[0, 0], [2, 20], [4, 50], [8, 80], [12, 90], [16, 100]] as const;
const clamp = (value: number) => Math.min(100, Math.max(0, value));
const capacity = (value: string) => {
  const match = value.match(/(\d+(?:[.,]\d+)?)\s*GB\b/i);
  const gb = match ? Number(match[1].replace(",", ".")) : 0;
  return gb > 0 ? gb : null;
};
const interpolate = (gb: number | null, curve: readonly (readonly [number, number])[]): number | null => {
  if (gb === null) return null;
  for (let i = 1; i < curve.length; i++) {
    const [rightGb, rightScore] = curve[i];
    const [leftGb, leftScore] = curve[i - 1];
    if (gb <= rightGb) return clamp(leftScore + (gb - leftGb) / (rightGb - leftGb) * (rightScore - leftScore));
  }
  return 100;
};

function readHardware(pc: PcRecord) {
  const cpuKey = pc.processore.toLowerCase().match(/\b(i[3579]-\d+[a-z0-9]*|w-\d+|ultra [579] \d+[a-z]*|ryzen [3579] \d+[a-z]*|apple m\d+(?: pro| max| ultra)?)\b/)?.[1];
  const cpu = cpuKey ? CPU_BENCHMARKS[cpuKey] : undefined;
  const apple = /\bapple m\d+/i.test(pc.processore);
  const gpu = GPU_BENCHMARKS.find(([model]) => model.test(pc.gpu))?.[1];
  const ram = interpolate(capacity(pc.ram), RAM_CURVE);
  const baseStorage = /\bnvme\b/i.test(pc.archiviazione) ? 90 : /\bssd\b/i.test(pc.archiviazione) ? 75 : /\bhdd\b/i.test(pc.archiviazione) ? 25 : null;
  const total = capacity(pc.archiviazione);
  const used = pc.archiviazione.match(/(\d+(?:[.,]\d+)?)\s*GB\s*usat[io]/i);
  const free = pc.archiviazione.match(/(\d+(?:[.,]\d+)?)\s*GB\s*liber[io]/i);
  const available = free ? Number(free[1].replace(",", ".")) : used && total ? total - Number(used[1].replace(",", ".")) : null;
  const freeRatio = total && available !== null && available >= 0 && available <= total ? available / total : null;
  const storagePenalty = freeRatio !== null && freeRatio < .1 ? 50 : freeRatio !== null && freeRatio < .2 ? 25 : 0;
  const components: PerformanceComponents = {
    singleCore: cpu ? clamp((cpu[0] - 1500) / 3500 * 100) : null,
    multiCore: cpu ? clamp((cpu[1] - 5000) / 45000 * 100) : null,
    gpu: gpu === undefined ? null : clamp(Math.log(gpu / 500) / Math.log(25000 / 500) * 100),
    ram, storage: baseStorage === null ? null : clamp(baseStorage - storagePenalty),
    graphicsMemory: apple ? ram : interpolate(capacity(pc.gpu), VRAM_CURVE),
  };
  return { components, apple, freeRatio, baseStorage };
}

function missingData(pc: PcRecord, hardware: ReturnType<typeof readHardware>) {
  const missing: string[] = [];
  if (hardware.components.singleCore === null || hardware.components.multiCore === null) missing.push("Modello CPU e relativi benchmark");
  if (hardware.components.gpu === null) missing.push(hardware.apple ? `Benchmark GPU comparabile per ${pc.processore}` : "Modello GPU e relativo benchmark");
  if (hardware.components.ram === null) missing.push("Capacità RAM");
  if (hardware.baseStorage === null) missing.push("Tecnologia di archiviazione (HDD, SSD o NVMe)");
  if (hardware.freeRatio === null) missing.push("Spazio libero di archiviazione");
  if (PROFILE_WEIGHTS[pc.profilo].graphicsMemory > 0 && hardware.components.graphicsMemory === null) missing.push(hardware.apple ? "Capacità memoria unificata" : "Capacità memoria grafica");
  if (!pc.sistema_operativo || !pc.versione_os) missing.push("Sistema operativo e versione");
  return missing;
}

export function missingPerformanceData(pc: PcRecord): string[] {
  return missingData(pc, readHardware(pc));
}

function scoreProfile(components: PerformanceComponents, profile: PerformanceProfile) {
  const weights = PROFILE_WEIGHTS[profile];
  const known = (Object.keys(weights) as (keyof PerformanceComponents)[]).filter((key) => weights[key] > 0 && components[key] !== null);
  const knownWeight = Math.round(known.reduce((total, key) => total + weights[key], 0) * 100) / 100;
  // Zero is a measured bottleneck; null is missing and must not lower the score.
  const score = knownWeight === 0 ? null : known.some((key) => components[key] === 0) ? 0 : Math.round(Math.exp(known.reduce((sum, key) => sum + Math.log(components[key]!) * weights[key] / knownWeight, 0)) + 1e-9);
  return { score, knownWeight };
}

function operatingSystemSupport(pc: PcRecord): PerformanceAssessment["osSupport"] {
  // Static lifecycle snapshot at 29/10/2026; no Date.now() dependency.
  // https://learn.microsoft.com/lifecycle/products/windows-11-home-and-pro
  if (/fuori supporto/i.test(pc.note)) return "Fuori supporto";
  if (/windows 10/i.test(pc.sistema_operativo) && !/ltsc|enterprise|education/i.test(pc.sistema_operativo)) return "Fuori supporto";
  if (/windows 11/i.test(pc.sistema_operativo) && /\bpro\b|\bhome\b/i.test(pc.sistema_operativo)) {
    if (/\b(21h2|22h2|23h2|24h2)\b/i.test(pc.versione_os)) return "Fuori supporto";
    if (/\b(25h2|26h1|26h2)\b/i.test(pc.versione_os)) return "Supportato";
  }
  return "Da verificare";
}

export function assessPerformance(pc: PcRecord): PerformanceAssessment {
  const hardware = readHardware(pc);
  const { score, knownWeight } = scoreProfile(hardware.components, pc.profilo);
  const scoresByProfile = Object.fromEntries((Object.keys(PROFILE_WEIGHTS) as PerformanceProfile[]).map((profile) => [profile, scoreProfile(hardware.components, profile).score])) as PerformanceAssessment["scoresByProfile"];
  const confidence = knownWeight >= .9 ? "Alta" : knownWeight >= .7 ? "Media" : "Bassa";
  const band = score === null ? "Non valutabile" : score >= 85 ? "Eccellente" : score >= 70 ? "Forte" : score >= 55 ? "Adeguato" : score >= 40 ? "Limitato" : "Insufficiente";
  const osSupport = operatingSystemSupport(pc);
  const recommendation = osSupport === "Fuori supporto" ? "Pensiona prima"
    : score === null ? "Completa censimento"
    : score < 55 && pc.profilo !== "Ufficio" && (scoresByProfile.Ufficio ?? 0) >= 55 ? "Ricolloca in Ufficio"
    : score < 40 ? "Pensiona prima" : score < 55 ? "Programma sostituzione"
    : osSupport === "Supportato" ? "Mantieni" : "Verifica sistema operativo";
  const storageWarning = hardware.freeRatio !== null && hardware.freeRatio < .1 ? "Archiviazione quasi esaurita: meno del 10% libero"
    : hardware.freeRatio !== null && hardware.freeRatio < .2 ? "Archiviazione: meno del 20% libero" : null;
  return { profile: pc.profilo, score, band, confidence, provisional: confidence !== "Alta", knownWeight,
    components: hardware.components, scoresByProfile, recommendation, recommendationProvisional: confidence === "Bassa",
    osSupport, missingData: missingData(pc, hardware), storageWarning };
}

export function rankReplacementPriority(pcs: PcRecord[], limit = 6): PcRecord[] {
  return pcs
    .map((pc) => ({ pc, score: assessPerformance(pc).score }))
    .filter((item): item is { pc: PcRecord; score: number } => item.score !== null)
    .sort((left, right) => left.score - right.score
      || left.pc.assegnatario.localeCompare(right.pc.assegnatario, "it", { sensitivity: "base" }))
    .slice(0, limit)
    .map(({ pc }) => pc);
}
