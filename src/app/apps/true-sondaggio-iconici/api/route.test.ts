import { beforeEach, describe, expect, it, vi } from "vitest";

const gateway = vi.hoisted(() => ({ insert: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/supabase-admin", () => ({ createAdminClient: () => ({ from: gateway.from }) }));
import { POST } from "./route";

const origin = "https://www.truedesign.app";
function request(fields?: URLSearchParams, headers?: Record<string, string>) {
  return new Request(`${origin}/apps/true-sondaggio-iconici/api`, {
    method: "POST", headers: { origin, "content-type": "application/x-www-form-urlencoded", ...headers },
    body: (fields ?? new URLSearchParams()).toString(),
  });
}
function validFields() {
  return new URLSearchParams({ nome: "Test Person", lang: "fr", scelte: Array.from({ length: 10 }, (_, i) => `${i + 1}. Product ${i}`).join("\n"), link: Array.from({ length: 10 }, (_, i) => `https://www.truedesign.it/it/prodotti/product-${i}/`).join("\n") });
}

beforeEach(() => {
  vi.clearAllMocks();
  gateway.from.mockReturnValue({ insert: gateway.insert });
  gateway.insert.mockResolvedValue({ error: null });
});

describe("survey submission API", () => {
  it.each([
    [{ origin: "https://other.example" }, 403, "origin_not_allowed"],
    [{ "content-type": "application/json" }, 415, "unsupported_format"],
    [{ "content-length": "20000" }, 413, "request_too_large"],
  ] as const)("rejects bad request metadata before accessing storage", async (headers, status, code) => {
    const response = await POST(request(undefined, headers));
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ ok: false, code });
    expect(gateway.from).not.toHaveBeenCalled();
  });
  it("enforces ten choices on the server and returns a stable error code", async () => {
    const response = await POST(request(new URLSearchParams({ nome: "Ada", scelte: "One" })));
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code: "invalid_submission" });
    expect(gateway.insert).not.toHaveBeenCalled();
  });
  it("stores ten choices, regardless of UI language", async () => {
    const response = await POST(request(validFields()));
    expect(response.status).toBe(200);
    expect(gateway.from).toHaveBeenCalledWith("survey_iconic_responses");
    expect(gateway.insert.mock.calls[0][0].choices).toHaveLength(10);
    expect(gateway.insert.mock.calls[0][0].participant_name).toBe("Test Person");
    expect(await response.json()).toEqual({ ok: true });
  });
  it("rejects oversized bodies even without content-length", async () => {
    const response = await POST(request(new URLSearchParams({ nome: "x".repeat(18000) })));
    expect(response.status).toBe(413);
    expect(gateway.insert).not.toHaveBeenCalled();
  });
  it.each(["returned", "thrown"])("handles %s storage failures without exposing details", async (kind) => {
    const error = new Error("secret SQL details");
    if (kind === "returned") gateway.insert.mockResolvedValue({ error });
    else gateway.insert.mockRejectedValue(error);
    const response = await POST(request(validFields()));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, code: "save_failed" });
  });
  it("does not store honeypot submissions", async () => {
    const fields = validFields(); fields.set("website", "bot.example");
    expect((await POST(request(fields))).status).toBe(200);
    expect(gateway.insert).not.toHaveBeenCalled();
  });
});
