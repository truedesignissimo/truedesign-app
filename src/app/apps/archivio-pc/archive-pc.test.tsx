import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ImageProps } from "next/image";
import pcsData from "./data/pcs.json";
import type { PcRecord } from "./domain/archive";
import { assessPerformance } from "./domain/performance";
import { pcImages } from "./image-map";
import { ArchiveModeToggle, ArchivioPc, isUnverified, PcDetail, PerformanceDetail, PerformanceSummary, RamValue, splitRam } from "./archive-pc";

const gaia = pcsData.find((pc) => pc.id === 35) as PcRecord;

// Vite imports bitmap/SVG assets as URLs, without Next's static image dimensions.
vi.mock("next/image", () => ({
  default: ({ src, alt, className }: ImageProps) => <img src={typeof src === "string" ? src : "src" in src ? src.src : src.default.src} alt={alt} className={className} />,
}));

describe("Valutazione prestazionale nell'interfaccia", () => {
  it("mostra solo Potenza e voto, con fascia, attendibilità e provvisorietà nel tooltip accessibile", () => {
    const assessment = assessPerformance(gaia);
    const html = renderToStaticMarkup(<PerformanceSummary assessment={assessment} />);
    expect(html).toContain(`Potenza <strong>${assessment.score}</strong>`);
    expect(html).toContain("tabindex=\"0\"");
    expect(html).toContain("title=\"");
    expect(html).toContain("aria-label=\"");
    const text = html.replace(/<[^>]*>/g, "");
    expect(text).toBe(`Potenza ${assessment.score}`);
    for (const value of [assessment.band, "Attendibilità", assessment.confidence.toLowerCase(), "voto provvisorio"]) expect(html).toContain(value);
    expect(text).not.toMatch(/Profilo|Ufficio|Attendibilità|provvisorio/);
  });

  it("mostra soltanto il profilo assegnato, raccomandazione, warning e dati mancanti senza ripetere l'attendibilità", () => {
    const assessment = assessPerformance(gaia);
    const html = renderToStaticMarkup(<PerformanceDetail assessment={assessment} />);
    for (const value of [assessment.profile, assessment.recommendation, assessment.storageWarning!, ...assessment.missingData]) {
      expect(html).toContain(value);
    }
    for (const profile of ["Ufficio", "Tecnico", "Grafica", "Render"].filter((profile) => profile !== assessment.profile)) {
      expect(html).not.toContain(`>${profile}<`);
    }
    expect(html).not.toContain("Idoneità nei quattro profili");
    expect(html).not.toContain("CPU single-core");
    expect(html).not.toContain("Attendibilità");
    expect(html).not.toContain("voto provvisorio");
    expect(html).toContain("Supportato");
  });

  it("colloca tutti i punteggi dei componenti in fondo alla scheda", () => {
    const html = renderToStaticMarkup(<PcDetail pc={gaia} assessment={assessPerformance(gaia)} onClose={() => undefined} />);
    const detailStart = html.indexOf("Valutazione prestazionale");
    const inventoryStart = html.indexOf("Nome dispositivo", detailStart);
    const scoresStart = html.indexOf("Punteggi dei componenti", detailStart);

    expect(detailStart).toBeGreaterThan(-1);
    expect(inventoryStart).toBeGreaterThan(detailStart);
    expect(scoresStart).toBeGreaterThan(inventoryStart);
    for (const label of ["CPU single-core", "CPU multi-core", "GPU", "RAM", "Archiviazione", "Memoria grafica / unificata"]) {
      expect(html.slice(scoresStart)).toContain(label);
    }
  });

  it("offre nella scheda singola un download PDF accessibile tramite sola icona", () => {
    const html = renderToStaticMarkup(<PcDetail pc={gaia} assessment={assessPerformance(gaia)} onClose={() => undefined} />);
    expect(html).toContain('aria-label="Scarica scheda PDF"');
    expect(html).toContain('title="Scarica scheda PDF"');
    expect(html).not.toContain(">Scarica scheda PDF<");
  });

  it("distingue un voto non valutabile da un voto zero", () => {
    const assessment = assessPerformance({ ...gaia, processore: "", gpu: "", ram: "", archiviazione: "" });
    const html = renderToStaticMarkup(<PerformanceSummary assessment={assessment} />);
    expect(html.replace(/<[^>]*>/g, "")).toBe("Potenza —");
    expect(html).toContain("Non valutabile");
    expect(html).not.toContain(">0<");
  });
});

describe("Card per reparto", () => {
  it("mantiene un inventario univoco con le assegnazioni confermate", () => {
    expect(new Set(pcsData.map((pc) => pc.id)).size).toBe(pcsData.length);
    expect(pcsData).toHaveLength(48);

    const expected = [
      ["NbValentinaM", "Valentina Marchioro", "Commerciale", "Ufficio"],
      ["NbNicole", "Nicole Salnitri", "Commerciale", "Ufficio"],
      ["NbSolange", "Solange Pandolfini", "Commerciale", "Ufficio"],
      ["NbLucaC", "Luca Cambi", "Commerciale", "Ufficio"],
      ["NbMarcoB", "Marco Beltramini", "Commerciale", "Ufficio"],
      ["NbPozzonovo", "Notebook Pozzonovo", "Produzione", "Ufficio"],
      ["PcProduzione", "PC Produzione", "Produzione", "Ufficio"],
      ["PcFalegnameria", "PC Falegnameria", "Produzione", "Ufficio"],
      ["PcTommasoV", "Tommaso Vanin", "Produzione", "Render"],
      ["PcStefanoB", "Stefano Bissacco", "Produzione", "Render"],
    ];
    for (const [device, assignee, area, profile] of expected) {
      expect(pcsData).toContainEqual(expect.objectContaining({ nome_dispositivo: device, assegnatario: assignee, area, profilo: profile }));
    }
  });

  it("applica le corrispondenze nominate senza duplicare i computer", () => {
    expect(pcsData).toContainEqual(expect.objectContaining({ nome_dispositivo: "PcQualita", assegnatario: "Hillary Bellin", numero_serie: "8CC4120D22" }));
    expect(pcsData).toContainEqual(expect.objectContaining({ nome_dispositivo: "PcMelaniaT", assegnatario: "Marco Russo", numero_serie: "SID3002177" }));
    expect(pcsData).toContainEqual(expect.objectContaining({ nome_dispositivo: "MacBook-Air-2", assegnatario: "Mac Alessandro Maniero" }));
    expect(pcsData).toContainEqual(expect.objectContaining({ nome_dispositivo: "NbUfficioT2", assegnatario: "Notebook Ufficio Tecnico", numero_serie: "PF5D4R3F" }));
    expect(pcsData).toContainEqual(expect.objectContaining({ nome_dispositivo: "NbSofiaS", assegnatario: "Sofia S.", profilo: "Ufficio" }));
  });

  it("assegna a ogni PC una foto presente nel catalogo immagini", () => {
    expect(pcsData.filter((pc) => !pc.foto).map((pc) => pc.assegnatario)).toEqual([]);
    expect(pcsData.filter((pc) => pc.foto && !pcImages[pc.foto]).map((pc) => pc.foto)).toEqual([]);
  });

  it("segnala soltanto le specifiche esplicitamente da verificare", () => {
    expect(isUnverified("GPU dedicata 16 GB (modello da verificare)")).toBe(true);
    expect(isUnverified("DATI DA VERIFICARE")).toBe(true);
    expect(isUnverified("NVIDIA RTX A500 Laptop, 4 GB")).toBe(false);

    const uncertain = renderToStaticMarkup(<ArchivioPc pcs={[{ ...gaia, gpu: "GPU dedicata 16 GB (modello da verificare)" }]} />);
    const confirmed = renderToStaticMarkup(<ArchivioPc pcs={[{ ...gaia, gpu: "NVIDIA RTX A500 Laptop, 4 GB" }]} />);
    expect(uncertain).toContain('title="Informazione da verificare"');
    expect(uncertain).toContain('aria-label="Informazione da verificare"');
    expect(confirmed).not.toContain("Informazione da verificare");
  });

  it("mette il logo CPU nella colonna etichetta e allinea la descrizione alle altre specifiche", () => {
    const html = renderToStaticMarkup(<ArchivioPc pcs={[gaia]} />);
    const cpuRow = html.match(/<div class="[^"]*cpuSpec[^"]*">[\s\S]*?<\/div>/)?.[0] ?? "";

    expect(cpuRow).toMatch(/<dt>[\s\S]*cpuBrand[\s\S]*<\/dt><dd><span>Intel Core i5-1335U<\/span><\/dd>/);
    expect(cpuRow).not.toContain("hardwareIcon");
  });

  it("sostituisce i filtri iniziali con il solo comando di priorità", () => {
    const html = renderToStaticMarkup(<ArchivioPc pcs={[gaia, pcsData[0], pcsData[3]] as PcRecord[]} />);

    expect(html).toContain("Da sostituire prima");
    expect(html).not.toContain('type="search"');
    expect(html).not.toContain("<select");
    expect(html).not.toContain("Cerca nell’archivio");
    expect(renderToStaticMarkup(<ArchiveModeToggle priorityOnly onToggle={() => undefined} />)).toContain("Mostra tutti");
  });

  it("mostra solo la capacità RAM nella card e mantiene la velocità nel dettaglio", () => {
    const compact = renderToStaticMarkup(<RamValue value="32 GB (2667 MT/s)" compact />);
    const detailed = renderToStaticMarkup(<RamValue value="32 GB (2667 MT/s)" />);

    expect(compact).toContain("32 GB");
    expect(compact).not.toContain("2667 MT/s");
    expect(detailed).toContain("32 GB");
    expect(detailed).toContain("2667 MT/s");
    expect(detailed).toContain("ramSpeed");
  });

  it("renderizza sezioni ordinate con conteggio dei soli PC ricevuti", () => {
    const html = renderToStaticMarkup(<ArchivioPc pcs={[gaia, pcsData[0], pcsData[3]] as PcRecord[]} />);
    const headings = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map((match) => match[1]);
    expect(headings).toEqual(["Ufficio Tecnico", "Marketing", "Da assegnare"]);
    expect(html).toMatch(/>01<[\s\S]*Ufficio Tecnico[\s\S]*>02<[\s\S]*Marketing[\s\S]*>03<[\s\S]*Da assegnare/);
    expect(html).toContain("1 PC");
    expect(html).not.toContain(">Commerciale</h2>");
  });

  it.each([
    ["Intel Core i5-1335U", "i5"], ["Intel Core i7-14700", "i7"],
    ["Intel Core i9-13900K", "i9"], ["Apple M4 Max", "M4"],
    ["Intel Xeon W-2102", "Xeon"], ["AMD Ryzen 5 7530U", "Ryzen"],
    ["Intel Core Ultra 7 155H", "Ultra"], ["Processore sconosciuto", "CPU"],
  ])("evidenzia il marchio CPU %s come %s mantenendo le specifiche complete", (processore, family) => {
    const pc = { ...pcsData[32], processore } as PcRecord;
    const html = renderToStaticMarkup(<ArchivioPc pcs={[pc]} />);
    const card = html.match(/<article[\s\S]*?<\/article>/)?.[0] ?? "";
    expect(card).toContain("cpuBrand");
    expect(card).toContain(`aria-label="${family === "CPU" ? "Processore" : family === "M4" ? "Apple M4" : family === "Ultra" ? "Intel Core Ultra" : family === "Xeon" ? "Intel Xeon" : family === "Ryzen" ? "AMD Ryzen" : `Intel Core ${family}`}"`);
    expect(card).toContain(processore);
    expect(card).toContain(">RAM</dt>");
    expect(card).toContain(splitRam(pc.ram).capacity);
    expect(card).not.toContain(splitRam(pc.ram).details);
    expect(card).toContain(">GPU</dt>");
    expect(card).toContain(pc.gpu);
    expect(card).toContain(">Schermo</dt>");
    expect(card).toContain(pc.schermo.replaceAll('"', "&quot;"));
    expect(card.replace(/<[^>]*>/g, "")).not.toMatch(/Profilo|Attendibilità|provvisorio/);
  });

  it("non aggiunge schermo o specifiche hardware mancanti", () => {
    const html = renderToStaticMarkup(<ArchivioPc pcs={[{ ...gaia, processore: "", ram: "", gpu: "", schermo: "" }]} />);
    const card = html.match(/<article[\s\S]*?<\/article>/)?.[0] ?? "";
    expect(card).not.toMatch(/>CPU<|>RAM<|>GPU<|>Schermo</);
  });
});
