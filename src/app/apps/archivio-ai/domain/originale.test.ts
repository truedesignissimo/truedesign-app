import { describe, expect, it, vi } from "vitest";
import { rispondiOriginale } from "./originale";
import { nomeFileSicuro, percentuale, peso, riconoscimentoTop } from "./formato";

const ID = "19e_v_JXnxATgg27ilXSsiiEU_iSkDmSA";
const foto = { idDrive: ID, nomeFile: "TRUE_Città_020.jpg" };

describe("rispondiOriginale", () => {
  it("rifiuta un identificativo non valido senza cercare nulla", async () => {
    const trovaImmagine = vi.fn();
    const risposta = await rispondiOriginale("../etc/passwd", { trovaImmagine });
    expect(risposta.status).toBe(400);
    expect(trovaImmagine).not.toHaveBeenCalled();
  });

  it("risponde 404 se la foto non è visibile a chi la chiede", async () => {
    const chiamata = vi.fn();
    const risposta = await rispondiOriginale(ID, {
      trovaImmagine: async () => null,
      servizioUrl: "https://n8n.example/webhook/originale",
      segreto: "segreto",
      fetch: chiamata,
    });
    expect(risposta.status).toBe(404);
    expect(chiamata).not.toHaveBeenCalled();
  });

  it("senza servizio configurato rimanda alla pagina del file su Drive", async () => {
    const risposta = await rispondiOriginale(ID, { trovaImmagine: async () => foto });
    expect(risposta.status).toBe(302);
    expect(risposta.headers.get("location")).toBe(`https://drive.google.com/file/d/${ID}/view`);
  });

  it("con il servizio configurato passa il file con il suo nome", async () => {
    const chiamata = vi.fn(async () =>
      new Response("contenuto", { status: 200, headers: { "Content-Type": "image/jpeg", "Content-Length": "9" } })
    );
    const risposta = await rispondiOriginale(ID, {
      trovaImmagine: async () => foto,
      servizioUrl: " https://n8n.example/webhook/originale ",
      segreto: "segreto",
      fetch: chiamata as unknown as typeof fetch,
    });

    expect(risposta.status).toBe(200);
    expect(await risposta.text()).toBe("contenuto");
    expect(risposta.headers.get("content-type")).toBe("image/jpeg");
    expect(risposta.headers.get("content-length")).toBe("9");
    expect(risposta.headers.get("cache-control")).toBe("private, no-store");
    expect(risposta.headers.get("content-disposition")).toBe(
      `attachment; filename="TRUE_Citt__020.jpg"; filename*=UTF-8''TRUE_Citt%C3%A0_020.jpg`
    );

    const [indirizzo, opzioni] = chiamata.mock.calls[0] as unknown as [string, RequestInit];
    expect(indirizzo).toBe("https://n8n.example/webhook/originale");
    expect(opzioni.method).toBe("POST");
    expect((opzioni.headers as Record<string, string>)["x-archivio-ai-secret"]).toBe("segreto");
    expect(JSON.parse(String(opzioni.body))).toEqual({ id_drive: ID });
  });

  it("non mostra i dettagli quando il servizio fallisce", async () => {
    const logger = vi.fn();
    const errore = await rispondiOriginale(ID, {
      trovaImmagine: async () => foto,
      servizioUrl: "https://n8n.example/webhook/originale",
      segreto: "segreto",
      fetch: (async () => new Response("token scaduto", { status: 500 })) as unknown as typeof fetch,
      logger,
    });
    expect(errore.status).toBe(502);
    expect(await errore.text()).not.toContain("token scaduto");

    const irraggiungibile = await rispondiOriginale(ID, {
      trovaImmagine: async () => foto,
      servizioUrl: "https://n8n.example/webhook/originale",
      segreto: "segreto",
      fetch: (async () => { throw new Error("rete assente"); }) as unknown as typeof fetch,
      logger,
    });
    expect(irraggiungibile.status).toBe(502);
    expect(logger).toHaveBeenCalledTimes(2);
  });

  it("tratta come errore una risposta JSON al posto del file", async () => {
    const risposta = await rispondiOriginale(ID, {
      trovaImmagine: async () => foto,
      servizioUrl: "https://n8n.example/webhook/originale",
      segreto: "segreto",
      fetch: (async () => new Response('{"message":"Workflow was started"}', {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as unknown as typeof fetch,
      logger: vi.fn(),
    });
    expect(risposta.status).toBe(502);
  });
});

describe("formato", () => {
  it("mostra percentuali e pesi leggibili", () => {
    expect(percentuale(0.8649)).toBe("86%");
    expect(percentuale(1)).toBe("100%");
    expect(percentuale(null)).toBe("—");
    expect(peso(null)).toBe("");
    expect(peso(350_000)).toBe("342 KB");
    expect(peso(8_600_000)).toBe("8,2 MB");
  });

  it("sceglie il riconoscimento con l'accuratezza più alta", () => {
    const principale = { prodotto: "Wing", collezione: "Wing", accuratezza: 0.62 };
    const secondario = { prodotto: "Tod-Sgabello", collezione: "Tod", accuratezza: 0.91 };
    expect(riconoscimentoTop({ principale, secondario })).toBe(secondario);
    expect(riconoscimentoTop({ principale, secondario: { ...secondario, accuratezza: null } })).toBe(principale);
  });

  it("pulisce i nomi dei file", () => {
    expect(nomeFileSicuro('a/b\\c:"d".jpg')).toBe("a_b_c_d_.jpg");
    expect(nomeFileSicuro("  ")).toBe("immagine");
  });
});

describe("nomi per gli utenti", () => {
  it("toglie la collezione davanti al nome del prodotto", async () => {
    const { nomeProdotto, dettaglioCarta } = await import("./formato");
    expect(nomeProdotto({ prodotto: "Abisko-Divano", collezione: "Abisko", accuratezza: null })).toBe("Divano");
    expect(nomeProdotto({ prodotto: "Not-Not Small e mini 40-50", collezione: "Not", accuratezza: null })).toBe("Not Small e mini 40-50");
    expect(nomeProdotto({ prodotto: "Wing", collezione: "Wing", accuratezza: null })).toBe("Wing");

    const vuoto = { prodotto: null, collezione: null, accuratezza: null };
    expect(dettaglioCarta({ principale: { prodotto: "Abisko-Divano", collezione: "Abisko", accuratezza: null }, secondario: vuoto, tipologie: ["divano"], nomeShooting: "Linate" })).toBe("Divano");
    expect(dettaglioCarta({ principale: { prodotto: "Wing", collezione: "Wing", accuratezza: null }, secondario: vuoto, tipologie: ["tavolo", "sedia"], nomeShooting: "Linate" })).toBe("tavolo, sedia");
    expect(dettaglioCarta({ principale: vuoto, secondario: vuoto, tipologie: [], nomeShooting: "Linate" })).toBe("Linate");
  });
});
