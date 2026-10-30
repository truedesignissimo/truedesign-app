import Image, { type StaticImageData } from "next/image";
import appleLogo from "./assets/cpu/apple.png";
import i5Logo from "./assets/cpu/i5.png";
import i7Logo from "./assets/cpu/i7.png";
import i9Logo from "./assets/cpu/i9.png";
import xeonLogo from "./assets/cpu/xeon.png";
import styles from "./archive-pc.module.css";

export type CpuBrandKind =
  | "intel-i3"
  | "intel-i5"
  | "intel-i7"
  | "intel-i9"
  | "intel-ultra"
  | "intel-xeon"
  | "amd-ryzen"
  | "apple"
  | "generic";

export type CpuBrandTone = "cobalt" | "steel" | "ice" | "navy" | "graphite";

export type CpuBrandInfo = {
  kind: CpuBrandKind;
  label: string;
  family: string;
  tone: CpuBrandTone;
};

const IMAGE_LOGOS: Partial<Record<CpuBrandKind, StaticImageData>> = {
  "intel-i5": i5Logo,
  "intel-i7": i7Logo,
  "intel-i9": i9Logo,
  "intel-xeon": xeonLogo,
  apple: appleLogo,
};

export function classifyCpu(processor: string): CpuBrandInfo {
  if (/Core Ultra/i.test(processor)) {
    return { kind: "intel-ultra", label: "Intel Core Ultra", family: "Ultra", tone: "ice" };
  }
  if (/Xeon/i.test(processor)) {
    return { kind: "intel-xeon", label: "Intel Xeon", family: "Xeon", tone: "steel" };
  }
  if (/Ryzen/i.test(processor)) {
    return { kind: "amd-ryzen", label: "AMD Ryzen", family: "Ryzen", tone: "navy" };
  }

  const apple = processor.match(/Apple\s+(M\d+)/i);
  if (apple) {
    return { kind: "apple", label: `Apple ${apple[1].toUpperCase()}`, family: apple[1].toUpperCase(), tone: "graphite" };
  }

  const core = processor.match(/\b(i[3579])\b/i)?.[1].toLowerCase();
  if (core) {
    return {
      kind: `intel-${core}` as CpuBrandKind,
      label: `Intel Core ${core}`,
      family: core,
      tone: "cobalt",
    };
  }

  return { kind: "generic", label: "Processore", family: "CPU", tone: "graphite" };
}

export function CpuBrand({ processor }: { processor: string }) {
  const brand = classifyCpu(processor);
  const logo = IMAGE_LOGOS[brand.kind];

  return (
    <span
      className={`${styles.cpuBrand} ${styles[`cpuTone${brand.tone[0].toUpperCase()}${brand.tone.slice(1)}`]}`}
      role="img"
      aria-label={brand.label}
    >
      {logo ? (
        <Image src={logo} alt="" className={`${styles.cpuLogo} ${brand.kind === "intel-xeon" ? styles.cpuLogoWide : ""}`} />
      ) : brand.kind === "intel-ultra" ? (
        <span className={styles.cpuWordmark}><small>CORE</small><strong>ULTRA</strong></span>
      ) : brand.kind === "amd-ryzen" ? (
        <span className={styles.cpuWordmark}><small>AMD</small><strong>RYZEN</strong></span>
      ) : (
        <span className={styles.cpuWordmark}><strong>{brand.family.toUpperCase()}</strong></span>
      )}
      {brand.kind === "apple" && <strong className={styles.appleFamily}>{brand.family}</strong>}
    </span>
  );
}
