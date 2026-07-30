import { describe, expect, it, vi } from "vitest";
import {
  buildAccountActiveEmail,
  buildAdminApprovalEmail,
  sendResendEmail,
} from "./registration-email";

describe("registration emails", () => {
  it("crea la notifica amministrativa con link di approvazione", () => {
    const message = buildAdminApprovalEmail({
      recipient: "dario.breggie@truedesign.it",
      fullName: "Mario Rossi",
      email: "mario@example.com",
      approvalUrl: "https://www.truedesign.app/approva-utente?token=abc",
    });
    expect(message.to).toEqual(["dario.breggie@truedesign.it"]);
    expect(message.subject).toContain("Mario Rossi");
    expect(message.html).toContain("Approva utente");
    expect(message.html).toContain("token=abc");
  });

  it("crea la mail grafica italiana per l'utente", () => {
    const message = buildAccountActiveEmail({
      recipient: "mario@example.com",
      firstName: "Mario",
      appCount: 4,
      activationUrl: "https://supabase.test/recovery",
    });
    expect(message.subject).toBe("Il tuo spazio True è pronto");
    expect(message.html).toContain("Extraordinary. Everyday.");
    expect(message.html).toContain("Il tuo spazio è pronto");
    expect(message.html).toContain("4 app");
    expect(message.html).toContain("Scegli la password");
    expect(message.html).toContain("https://supabase.test/recovery");
    expect(message.html).toContain("Se il pulsante non funziona, premi su");
    expect(message.html).toContain(">questo link</a>");
    expect(message.html).not.toContain(">https://supabase.test/recovery</a>");
  });

  it("invia tramite Resend e restituisce l'id del messaggio", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "email-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const result = await sendResendEmail(
      { to: ["mario@example.com"], subject: "Oggetto", html: "<p>Test</p>" },
      { apiKey: "resend-secret", from: "True Design <accesso@truedesign.app>" },
      fetcher as typeof fetch
    );
    expect(result).toBe("email-1");
    expect(fetcher).toHaveBeenCalledOnce();
    expect(JSON.stringify(fetcher.mock.calls[0][1]?.body)).not.toContain("resend-secret");
  });

  it("segnala lo stato HTTP senza esporre la chiave Resend", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response("forbidden", { status: 403 })
    );

    await expect(sendResendEmail(
      { to: ["mario@example.com"], subject: "Oggetto", html: "<p>Test</p>" },
      { apiKey: "resend-secret", from: "True Design <accesso@truedesign.app>" },
      fetcher as typeof fetch
    )).rejects.toThrow("HTTP 403");
  });

  it("ritenta gli errori temporanei usando la stessa chiave idempotente", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "email-after-retry" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await sendResendEmail(
      { to: ["mario@example.com"], subject: "Oggetto", html: "<p>Test</p>" },
      { apiKey: "resend-secret", from: "True Design <accesso@truedesign.app>" },
      fetcher as typeof fetch,
      { idempotencyKey: "activation-user-1", sleep }
    );

    expect(result).toBe("email-after-retry");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][1]?.headers).toMatchObject({
      "Idempotency-Key": "activation-user-1",
      "User-Agent": "truedesign.app/registration",
    });
    expect(fetcher.mock.calls[1][1]?.headers).toMatchObject({
      "Idempotency-Key": "activation-user-1",
    });
    expect(sleep).toHaveBeenCalledOnce();
  });
});
