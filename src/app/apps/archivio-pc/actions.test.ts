import { beforeEach, expect, it, vi } from "vitest";
import { archivePcAsset, createPcAsset, updatePcAsset } from "./actions";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), profile: vi.fn(), write: vi.fn(),
  insert: vi.fn(), update: vi.fn(), filter: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("@/lib/supabase-server", () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock("@/lib/supabase-admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => table === "profiles"
      ? { select: () => ({ eq: () => ({ maybeSingle: mocks.profile }) }) }
      : { insert: mocks.insert, update: mocks.update },
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

const input = { assegnatario: "Flavia", tipologia: "Notebook", profilo: "Ufficio" };
const version = "2026-11-25T10:00:00.123456+00:00";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } } });
  mocks.profile.mockResolvedValue({ data: { is_admin: true, approval_status: "approved" } });
  mocks.write.mockResolvedValue({ data: { id: 51 } });
  mocks.filter.mockReturnValue({ eq: mocks.filter, select: () => ({ maybeSingle: mocks.write }) });
  mocks.update.mockReturnValue({ eq: mocks.filter });
  mocks.insert.mockReturnValue({ select: () => ({ maybeSingle: mocks.write }) });
});

it.each(["anonimo", "utente", "admin in attesa"])("blocca %s prima di scrivere", async (role) => {
  if (role === "anonimo") mocks.getUser.mockResolvedValue({ data: { user: null } });
  else mocks.profile.mockResolvedValue({
    data: { is_admin: role !== "utente", approval_status: role === "utente" ? "approved" : "pending" },
  });
  expect((await createPcAsset(input)).ok).toBe(false);
  expect((await updatePcAsset(51, version, input)).ok).toBe(false);
  expect((await archivePcAsset(51, version)).ok).toBe(false);
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
});

it("crea una scheda valida con le informazioni di audit del server", async () => {
  expect((await createPcAsset({ ...input, updated_by: "forged" })).ok).toBe(true);
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ ...input, updated_by: "admin-id" }));
  expect(mocks.revalidate).toHaveBeenCalledWith("/apps/archivio-pc");
});

it("aggiorna e archivia soltanto la versione corrente di una scheda attiva", async () => {
  expect((await updatePcAsset(51, version, input)).ok).toBe(true);
  expect((await archivePcAsset(51, version)).ok).toBe(true);
  expect(mocks.filter.mock.calls).toEqual([
    ["id", 51], ["updated_at", version], ["is_archived", false],
    ["id", 51], ["updated_at", version], ["is_archived", false],
  ]);
  expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ is_archived: true, updated_by: "admin-id" }));
});

it("segnala il conflitto senza confermare una scrittura inesistente", async () => {
  mocks.write.mockResolvedValue({ data: null });
  expect(await updatePcAsset(51, version, input)).toMatchObject({ ok: false, error: expect.stringContaining("cambiata") });
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
