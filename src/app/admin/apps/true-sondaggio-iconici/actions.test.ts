import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  getUser: vi.fn(), profile: vi.fn(), deleted: vi.fn(), from: vi.fn(),
  deleteRows: vi.fn(), eq: vi.fn(), selectDeleted: vi.fn(), rpc: vi.fn(), revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({ createClient: async () => ({ auth: { getUser: db.getUser } }) }));
vi.mock("@/lib/supabase-admin", () => ({ createAdminClient: () => ({ from: db.from, rpc: db.rpc }) }));
vi.mock("next/cache", () => ({ revalidatePath: db.revalidatePath }));

import * as actions from "./actions";

const ID = "6f01ba7e-f275-4c52-8ff0-4f685ab4b44f";

beforeEach(() => {
  vi.clearAllMocks();
  db.getUser.mockResolvedValue({ data: { user: { id: ID } }, error: null });
  db.profile.mockResolvedValue({ data: { is_admin: true }, error: null });
  db.deleted.mockResolvedValue({ data: { id: ID }, error: null });
  db.selectDeleted.mockReturnValue({ maybeSingle: db.deleted });
  db.eq.mockReturnValue({ select: db.selectDeleted });
  db.deleteRows.mockReturnValue({ eq: db.eq });
  db.from.mockImplementation((table: string) => table === "profiles"
    ? { select: () => ({ eq: () => ({ single: db.profile }) }) }
    : { delete: db.deleteRows });
  db.rpc.mockResolvedValue({ data: [{ archive_id: ID, response_count: 2, restored_count: 2, safety_archive_id: null }], error: null });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("real server actions and authorization guard", () => {
  it("exports individual deletion", () => {
    expect(actions).toHaveProperty("deleteSurveyResponse", expect.any(Function));
  });

  const operations = [
    () => actions.archiveAndResetSurvey("AZZERA"),
    () => actions.restoreSurveyArchive(ID, "RIPRISTINA"),
    () => actions.deleteSurveyArchive(ID, "ELIMINA"),
    () => actions.deleteSurveyResponse(ID, "ELIMINA"),
  ];

  it.each(operations)("denies missing session before data access", async (operation) => {
    db.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await operation()).toEqual({ ok: false, error: "Operazione non riuscita. Riprova tra poco." });
    expect(db.from).not.toHaveBeenCalled();
    expect(db.rpc).not.toHaveBeenCalled();
    expect(db.revalidatePath).not.toHaveBeenCalled();
  });

  it.each(operations)("denies non-admin before mutation", async (operation) => {
    db.profile.mockResolvedValue({ data: { is_admin: false }, error: null });
    expect(await operation()).toMatchObject({ ok: false });
    expect(db.deleteRows).not.toHaveBeenCalled();
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it("deletes one current id and invalidates derived pages and export", async () => {
    expect(await actions.deleteSurveyResponse(ID, "ELIMINA")).toEqual({ ok: true });
    expect(db.from).toHaveBeenCalledWith("survey_iconic_responses");
    expect(db.from).not.toHaveBeenCalledWith("survey_iconic_archive_responses");
    expect(db.eq).toHaveBeenCalledExactlyOnceWith("id", ID);
    expect(db.selectDeleted).toHaveBeenCalledWith("id");
    expect(db.revalidatePath).toHaveBeenCalledWith("/admin/apps/true-sondaggio-iconici");
    expect(db.revalidatePath).toHaveBeenCalledWith("/admin/apps/true-sondaggio-iconici/export");
  });

  it("invalid input never issues a delete", async () => {
    expect(await actions.deleteSurveyResponse("bad-id", "ELIMINA")).toMatchObject({ ok: false });
    expect(await actions.deleteSurveyResponse(ID, "wrong")).toMatchObject({ ok: false });
    expect(db.deleteRows).not.toHaveBeenCalled();
  });

  it("missing response is not a successful deletion", async () => {
    db.deleted.mockResolvedValue({ data: null, error: null });
    expect(await actions.deleteSurveyResponse(ID, "ELIMINA")).toMatchObject({ ok: false });
    expect(db.revalidatePath).not.toHaveBeenCalled();
  });

  it("accepts uppercase UUID input when the database normalizes the returned id", async () => {
    expect(await actions.deleteSurveyResponse(ID.toUpperCase(), "ELIMINA")).toEqual({ ok: true });
  });

  it.each(operations)("denies unavailable admin profiles before mutation", async (operation) => {
    db.profile.mockResolvedValue({ data: null, error: { message: "unavailable" } });
    expect(await operation()).toMatchObject({ ok: false });
    expect(db.deleteRows).not.toHaveBeenCalled();
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it("does not claim a restore succeeded without a valid RPC result", async () => {
    db.rpc.mockResolvedValue({ data: null, error: null });
    expect(await actions.restoreSurveyArchive(ID, "RIPRISTINA")).toMatchObject({ ok: false });
    expect(db.revalidatePath).not.toHaveBeenCalled();
  });

  it("does not claim reset succeeded with a missing response count", async () => {
    db.rpc.mockResolvedValue({ data: [{ archive_id: ID }], error: null });
    expect(await actions.archiveAndResetSurvey("AZZERA")).toMatchObject({ ok: false });
    expect(db.revalidatePath).not.toHaveBeenCalled();
  });

  it.each([
    [() => actions.archiveAndResetSurvey("AZZERA"), "archive_and_reset_iconic_survey", { actor: ID }],
    [() => actions.restoreSurveyArchive(ID, "RIPRISTINA"), "restore_iconic_survey_archive", { target_archive: ID, actor: ID }],
    [() => actions.deleteSurveyArchive(ID, "ELIMINA"), "delete_iconic_survey_archive", { target_archive: ID }],
  ] as const)("authorized archive operation %s calls exactly one guarded RPC", async (operation, rpc, parameters) => {
    expect(await operation()).toMatchObject({ ok: true });
    expect(db.rpc).toHaveBeenCalledExactlyOnceWith(rpc, parameters);
    expect(db.revalidatePath).toHaveBeenCalledWith("/admin/apps/true-sondaggio-iconici");
  });

  it("database errors are redacted and do not invalidate pages", async () => {
    db.deleted.mockResolvedValue({ data: null, error: { message: "private table details" } });
    expect(await actions.deleteSurveyResponse(ID, "ELIMINA")).toEqual({ ok: false, error: "Operazione non riuscita. Riprova tra poco." });
    expect(db.revalidatePath).not.toHaveBeenCalled();
  });
});
