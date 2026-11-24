import { describe, expect, it } from "vitest";
import {
  FILTRI_VUOTI,
  aggiornaConteggi,
  appartieneAllaVista,
  contaFiltriAttivi,
  filtriDaQuery,
  filtriInQuery,
  paroleDiRicerca,
  radiciDiRicerca,
} from "./filtri";

describe("paroleDiRicerca", () => {
  it("separa le parole e le mette in minuscolo", () => {
    expect(paroleDiRicerca("  Poltrona   ROSSA outdoor ")).toEqual(["poltrona", "rossa", "outdoor"]);
  });

  it("toglie i segni che romperebbero il filtro del database", () => {
    expect(paroleDiRicerca("tod),nome_file.ilike.* (x) a,b* 50%")).toEqual(["todnomefileilike", "ab", "50"]);
  });

  it("tiene lettere accentate e trattini interni, scarta le parole di una lettera", () => {
    expect(paroleDiRicerca("caffè still-life -a- è")).toEqual(["caffè", "still-life"]);
  });

  it("non ripete le parole e si ferma a sei", () => {
    expect(paroleDiRicerca("uno uno due tre quattro cinque sei sette otto")).toEqual([
      "uno", "due", "tre", "quattro", "cinque", "sei",
    ]);
  });
});

describe("radiciDiRicerca", () => {
  it("toglie la vocale finale alle parole lunghe, così il genere e il plurale non contano", () => {
    expect(radiciDiRicerca("Poltrona rossa")).toEqual(["poltron", "ross"]);
    expect(radiciDiRicerca("poltrone rosse tavoli")).toEqual(["poltron", "ross", "tavol"]);
  });

  it("lascia stare le parole corte e quelle che finiscono per consonante", () => {
    expect(radiciDiRicerca("blu tod wing not")).toEqual(["blu", "tod", "wing", "not"]);
  });

  it("non ripete la stessa radice", () => {
    expect(radiciDiRicerca("rosso rossa rossi")).toEqual(["ross"]);
  });
});

describe("filtri e indirizzo", () => {
  it("senza parametri restituisce i filtri vuoti", () => {
    expect(filtriDaQuery("")).toEqual(FILTRI_VUOTI);
    expect(filtriInQuery(FILTRI_VUOTI)).toBe("");
  });

  it("scrive e rilegge gli stessi filtri", () => {
    const filtri = {
      testo: "tavolo rovere",
      collezione: "Blade Cabinet",
      tipologia: "tavolo",
      colore: "marrone",
      contesto: "Indoor",
      shooting: "Milano 26 / giorno 2",
      vista: "da-rivedere" as const,
    };
    expect(filtriDaQuery(`?${filtriInQuery(filtri)}`)).toEqual(filtri);
  });

  it("ignora una vista sconosciuta", () => {
    expect(filtriDaQuery("?vista=tutto&q=wing").vista).toBe("visibili");
    expect(filtriDaQuery("?vista=nascoste").vista).toBe("nascoste");
  });

  it("conta i filtri accesi senza la vista", () => {
    expect(contaFiltriAttivi(FILTRI_VUOTI)).toBe(0);
    expect(contaFiltriAttivi({ ...FILTRI_VUOTI, testo: "  ", vista: "tutte" })).toBe(0);
    expect(contaFiltriAttivi({ ...FILTRI_VUOTI, testo: "wing", colore: "blu" })).toBe(2);
  });
});

describe("viste", () => {
  const automaticaSopra = { stato: "auto" as const, sopraSoglia: true, visibile: true };
  const automaticaSotto = { stato: "auto" as const, sopraSoglia: false, visibile: false };
  const approvata = { stato: "approvata" as const, sopraSoglia: false, visibile: true };
  const nascosta = { stato: "nascosta" as const, sopraSoglia: true, visibile: false };

  it("assegna ogni foto alle viste giuste", () => {
    expect(appartieneAllaVista(automaticaSopra, "visibili")).toBe(true);
    expect(appartieneAllaVista(automaticaSotto, "visibili")).toBe(false);
    expect(appartieneAllaVista(automaticaSotto, "da-rivedere")).toBe(true);
    expect(appartieneAllaVista(approvata, "da-rivedere")).toBe(false);
    expect(appartieneAllaVista(nascosta, "nascoste")).toBe(true);
    expect(appartieneAllaVista(nascosta, "da-rivedere")).toBe(false);
    expect(appartieneAllaVista(nascosta, "tutte")).toBe(true);
  });

  it("aggiorna i numeri quando una foto da rivedere viene approvata", () => {
    const conteggi = { visibili: 402, daRivedere: 84, nascoste: 0, tutte: 486 };
    expect(aggiornaConteggi(conteggi, automaticaSotto, approvata)).toEqual({
      visibili: 403, daRivedere: 83, nascoste: 0, tutte: 486,
    });
  });

  it("aggiorna i numeri quando una foto visibile viene nascosta e poi rimessa", () => {
    const conteggi = { visibili: 402, daRivedere: 84, nascoste: 0, tutte: 486 };
    const dopo = aggiornaConteggi(conteggi, automaticaSopra, nascosta);
    expect(dopo).toEqual({ visibili: 401, daRivedere: 84, nascoste: 1, tutte: 486 });
    expect(aggiornaConteggi(dopo, nascosta, automaticaSopra)).toEqual(conteggi);
  });

  it("non scende mai sotto zero", () => {
    const conteggi = { visibili: 0, daRivedere: 0, nascoste: 0, tutte: 1 };
    expect(aggiornaConteggi(conteggi, automaticaSopra, nascosta).visibili).toBe(0);
  });
});
