import { strFromU8, strToU8, unzipSync } from "fflate";
import { describe, expect, it, vi } from "vitest";
import { DownloadAnnullato, creaZip, nomeVersioneLeggera, nomeZip, nomiUnici, scaricaConRiprova } from "./scarica";

const voce = (nome: string, testo: string) => ({ nome, carica: async () => strToU8(testo) });
const contenuto = async (blob: Blob) => unzipSync(new Uint8Array(await blob.arrayBuffer()));

describe("nomi dei file", () => {
  it("rende unici i nomi ripetuti senza toccare gli altri", () => {
    expect(nomiUnici(["a.jpg", "b.jpg", "A.jpg", "a.jpg", "senza"])).toEqual(["a.jpg", "b.jpg", "A (2).jpg", "a (3).jpg", "senza"]);
  });

  it("la versione leggera ha lo stesso nome, in JPEG", () => {
    expect(nomeVersioneLeggera("TRUE_Linate_020.tif")).toBe("TRUE_Linate_020.jpg");
    expect(nomeVersioneLeggera("True Design - 01.JPG")).toBe("True Design - 01.jpg");
    expect(nomeVersioneLeggera("senza-estensione")).toBe("senza-estensione.jpg");
  });

  it("lo ZIP porta tipo e giorno nel nome", () => {
    const giorno = new Date("2026-11-24T10:00:00+01:00");
    expect(nomeZip("originali", giorno)).toBe("true-design-foto-originali-2026-11-24.zip");
    expect(nomeZip("leggere", giorno)).toBe("true-design-foto-leggere-2026-11-24.zip");
  });
});

describe("creaZip", () => {
  it("mette tutte le foto nello ZIP e segnala l'avanzamento", async () => {
    const onProgresso = vi.fn();
    const esito = await creaZip([voce("uno.jpg", "primo"), voce("due.jpg", "secondo"), voce("uno.jpg", "terzo")], { onProgresso });
    const file = await contenuto(esito.blob);

    expect(esito.incluse).toBe(3);
    expect(esito.fallite).toEqual([]);
    expect(Object.keys(file).sort()).toEqual(["due.jpg", "uno (2).jpg", "uno.jpg"]);
    expect(strFromU8(file["uno.jpg"])).toBe("primo");
    expect(strFromU8(file["uno (2).jpg"])).toBe("terzo");
    expect(onProgresso).toHaveBeenLastCalledWith(3, 3);
  });

  it("una foto che non si scarica non blocca le altre", async () => {
    const esito = await creaZip([
      voce("buona.jpg", "ok"),
      { nome: "rotta.jpg", carica: async () => { throw new Error("404"); } },
    ]);
    expect(esito.incluse).toBe(1);
    expect(esito.fallite).toEqual(["rotta.jpg"]);
    expect(Object.keys(await contenuto(esito.blob))).toEqual(["buona.jpg"]);
  });

  it("se non si scarica nulla lo dice invece di dare uno ZIP vuoto", async () => {
    await expect(creaZip([{ nome: "rotta.jpg", carica: async () => { throw new Error("404"); } }])).rejects.toThrow(
      "nessuna delle foto"
    );
  });

  it("si ferma quando l'utente annulla", async () => {
    const controllo = new AbortController();
    const voci = [
      { nome: "uno.jpg", carica: async () => { controllo.abort(); return strToU8("primo"); } },
      voce("due.jpg", "secondo"),
    ];
    await expect(creaZip(voci, { segnale: controllo.signal, insieme: 1 })).rejects.toBeInstanceOf(DownloadAnnullato);
  });

  it("non scarica più file insieme del limite chiesto", async () => {
    let attivi = 0;
    let massimo = 0;
    const lenta = (nome: string) => ({
      nome,
      carica: async () => {
        attivi += 1;
        massimo = Math.max(massimo, attivi);
        await new Promise((risolvi) => setTimeout(risolvi, 5));
        attivi -= 1;
        return strToU8(nome);
      },
    });
    const esito = await creaZip(Array.from({ length: 7 }, (_, indice) => lenta(`f${indice}.jpg`)), { insieme: 2 });
    expect(esito.incluse).toBe(7);
    expect(massimo).toBe(2);
  });
});

describe("scaricaConRiprova", () => {
  it("riprova quando lo storage chiede di rallentare", async () => {
    const chiama = vi.fn()
      .mockResolvedValueOnce(new Response("piano", { status: 429 }))
      .mockResolvedValueOnce(new Response("foto", { status: 200 }));
    const blob = await scaricaConRiprova("https://esempio/foto", { fetch: chiama as unknown as typeof fetch, attesaMs: 1 });
    expect(await blob.text()).toBe("foto");
    expect(chiama).toHaveBeenCalledTimes(2);
  });

  it("non insiste su un errore definitivo", async () => {
    const chiama = vi.fn().mockResolvedValue(new Response("no", { status: 404 }));
    await expect(scaricaConRiprova("https://esempio/foto", { fetch: chiama as unknown as typeof fetch, attesaMs: 1 })).rejects.toThrow("HTTP 404");
    expect(chiama).toHaveBeenCalledTimes(1);
  });
});
