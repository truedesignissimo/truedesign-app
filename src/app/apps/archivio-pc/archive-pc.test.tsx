import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import pcsData from "./data/pcs.json";
import type { PcRecord } from "./domain/archive";
import { assessPerformance } from "./domain/performance";
import { PerformanceDetail, PerformanceSummary } from "./archive-pc";

const gaia = pcsData.find((pc) => pc.id === 35) as PcRecord;

describe("Valutazione prestazionale nell'interfaccia", () => {
  it("mostra profilo, voto, fascia e attendibilità nelle card", () => {
    const assessment = assessPerformance(gaia);
    const html = renderToStaticMarkup(<PerformanceSummary assessment={assessment} />);
    for (const value of ["Ufficio", `${assessment.score}`, assessment.band, "Attendibilità", assessment.confidence.toLowerCase(), "provvisorio"]) {
      expect(html).toContain(value);
    }
  });

  it("mostra componenti, quattro profili, raccomandazione, warning e dati mancanti", () => {
    const assessment = assessPerformance(gaia);
    const html = renderToStaticMarkup(<PerformanceDetail assessment={assessment} />);
    for (const value of ["CPU single-core", "CPU multi-core", "GPU", "RAM", "Archiviazione", "Memoria grafica", "Ufficio", "Tecnico", "Grafica", "Render", assessment.recommendation, assessment.storageWarning!, ...assessment.missingData]) {
      expect(html).toContain(value);
    }
    expect(html).toContain("Non disponibile");
    expect(html).toContain("Supportato");
  });

  it("distingue un voto non valutabile da un voto zero", () => {
    const assessment = assessPerformance({ ...gaia, processore: "", gpu: "", ram: "", archiviazione: "" });
    const html = renderToStaticMarkup(<PerformanceSummary assessment={assessment} />);
    expect(html).toContain("Non valutabile");
    expect(html).not.toContain(">0<");
  });
});
