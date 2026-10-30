import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ImageProps } from "next/image";
import { classifyCpu, CpuBrand } from "./cpu-brand";

vi.mock("next/image", () => ({
  default: ({ src, alt, className }: ImageProps) => (
    <img
      src={typeof src === "string" ? src : "src" in src ? src.src : src.default.src}
      alt={alt}
      className={className}
    />
  ),
}));

describe("Marchi dei processori", () => {
  it.each([
    ["Intel Core i5-1335U", "intel-i5", "Intel Core i5"],
    ["Intel Core i7-13700H", "intel-i7", "Intel Core i7"],
    ["Intel Core i9-13900K", "intel-i9", "Intel Core i9"],
    ["Intel Core Ultra 7 155H", "intel-ultra", "Intel Core Ultra"],
    ["Intel Xeon W-2102", "intel-xeon", "Intel Xeon"],
    ["AMD Ryzen 5 7530U", "amd-ryzen", "AMD Ryzen"],
    ["Apple M4 Max", "apple", "Apple M4"],
    ["Processore sconosciuto", "generic", "Processore"],
  ])("classifica %s come %s", (processor, kind, label) => {
    expect(classifyCpu(processor)).toMatchObject({ kind, label });
  });

  it("renderizza il logo Intel accessibile come immagine", () => {
    const html = renderToStaticMarkup(<CpuBrand processor="Intel Core i7-13700H" />);
    expect(html).toContain('aria-label="Intel Core i7"');
    expect(html).toContain('role="img"');
    expect(html).toContain("cpuLogo");
  });

  it("affianca al marchio Apple la famiglia del chip", () => {
    const html = renderToStaticMarkup(<CpuBrand processor="Apple M4 Max" />);
    expect(html).toContain('aria-label="Apple M4"');
    expect(html).toContain(">M4<");
  });

  it("usa un marchio neutro per una CPU non riconosciuta", () => {
    const html = renderToStaticMarkup(<CpuBrand processor="Processore sconosciuto" />);
    expect(html).toContain('aria-label="Processore"');
    expect(html).toContain(">CPU<");
  });
});
