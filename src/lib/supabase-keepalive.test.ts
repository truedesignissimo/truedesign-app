import { describe, expect, it, vi } from "vitest";
import { executeSupabaseKeepAlive } from "./supabase-keepalive";

describe("executeSupabaseKeepAlive", () => {
  it("rifiuta richieste senza bearer token valido", async () => {
    const query = vi.fn();
    const result = await executeSupabaseKeepAlive({
      authorization: null,
      secret: "test-secret",
      query,
    });

    expect(result.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  it("esegue una sola query autorizzata", async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    const result = await executeSupabaseKeepAlive({
      authorization: "Bearer test-secret",
      secret: "test-secret",
      query,
    });

    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(query).toHaveBeenCalledOnce();
  });

  it("restituisce 503 senza esporre il dettaglio del database", async () => {
    const logger = vi.fn();
    const result = await executeSupabaseKeepAlive({
      authorization: "Bearer test-secret",
      secret: "test-secret",
      query: vi.fn().mockRejectedValue(new Error("database password")),
      logger,
    });

    expect(result).toEqual({ status: 503, body: { ok: false } });
    expect(JSON.stringify(result)).not.toContain("database password");
    expect(logger).toHaveBeenCalledOnce();
  });
});
