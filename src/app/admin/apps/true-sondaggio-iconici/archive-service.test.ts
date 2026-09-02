import { describe, expect, it, vi } from "vitest";
import {
  runArchiveAndReset,
  runDeleteArchive,
  runRestoreArchive,
  type SurveyArchiveGateway,
} from "./archive-service";

const ARCHIVE_ID = "6f01ba7e-f275-4c52-8ff0-4f685ab4b44f";

function createGateway(): SurveyArchiveGateway {
  return {
    archiveAndReset: vi.fn().mockResolvedValue({ archiveId: ARCHIVE_ID, count: 2 }),
    restore: vi.fn().mockResolvedValue({ restoredCount: 2, safetyArchiveId: null }),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe("survey archive service", () => {
  it("requires the exact AZZERA confirmation", async () => {
    const gateway = createGateway();

    await expect(runArchiveAndReset("azzera", "actor-1", gateway)).resolves.toEqual({
      ok: false,
      error: "Scrivi AZZERA per confermare.",
    });
    expect(gateway.archiveAndReset).not.toHaveBeenCalled();
  });

  it("archives and resets through a single gateway call", async () => {
    const gateway = createGateway();

    await expect(runArchiveAndReset("AZZERA", "actor-1", gateway)).resolves.toEqual({
      ok: true,
      archiveId: ARCHIVE_ID,
      count: 2,
    });
    expect(gateway.archiveAndReset).toHaveBeenCalledWith("actor-1");
  });

  it("validates restore confirmation and archive id", async () => {
    const gateway = createGateway();

    await expect(runRestoreArchive("not-an-id", "RIPRISTINA", "actor-1", gateway)).resolves.toMatchObject({ ok: false });
    await expect(runRestoreArchive(ARCHIVE_ID, "no", "actor-1", gateway)).resolves.toMatchObject({ ok: false });
    await expect(runRestoreArchive(ARCHIVE_ID, "RIPRISTINA", "actor-1", gateway)).resolves.toEqual({
      ok: true,
      restoredCount: 2,
      safetyArchiveId: null,
    });
  });

  it("requires ELIMINA before permanent deletion", async () => {
    const gateway = createGateway();

    await expect(runDeleteArchive(ARCHIVE_ID, "ELIMINA", gateway)).resolves.toEqual({ ok: true });
    expect(gateway.delete).toHaveBeenCalledWith(ARCHIVE_ID);
  });
});
