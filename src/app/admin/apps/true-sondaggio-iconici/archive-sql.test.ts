import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationUrl = new URL("../../../../../supabase/migrations/20260903110000_survey_archive_concurrency.sql", import.meta.url);
const legacyUrl = new URL("../../../../../supabase/migrations/20260902_survey_iconic_archives.sql", import.meta.url);
const sql = readFileSync(existsSync(migrationUrl) ? migrationUrl : legacyUrl, "utf8").toLowerCase();
const names = ["archive_and_reset_iconic_survey", "restore_iconic_survey_archive", "delete_iconic_survey_archive"];
const lock = "lock table public.survey_iconic_responses, public.survey_iconic_archives, public.survey_iconic_archive_responses in share row exclusive mode;";
const body = (name: string) => sql.split(`create or replace function public.${name}`)[1]?.split("$$;")[0] ?? "";

describe("archive migration safety contract (structural checks; fixtures exercise SQL)", () => {
  it("is a new standalone atomic migration with idempotent archive setup", () => {
    expect(existsSync(migrationUrl)).toBe(true);
    expect(sql).toMatch(/\bbegin;/);
    expect(sql.trim()).toMatch(/commit;$/);
    expect(sql).toContain("create table if not exists public.survey_iconic_archives");
    expect(sql).toContain("create table if not exists public.survey_iconic_archive_responses");
    expect(sql).toContain("create unique index if not exists survey_iconic_archive_responses_source_idx");
  });

  it.each(names)("locks all datasets in a consistent order before reads in %s", (name) => {
    const source = body(name).replace(/--[^\n]*/g, "").replace(/\s+/g, " ");
    expect(source).toContain(lock);
    expect(source).toMatch(new RegExp(`begin ${lock.replaceAll(".", "\\.")}`));
    expect(source).not.toMatch(/\b(commit|rollback)\b/);
    expect(source).not.toContain("exception when");
  });

  it.each(names)("limits %s execution to service_role", (name) => {
    const signature = name === "restore_iconic_survey_archive" ? "uuid, uuid" : "uuid";
    expect(sql).toContain(`revoke all on function public.${name}(${signature}) from public, anon, authenticated`);
    expect(sql).toContain(`grant execute on function public.${name}(${signature}) to service_role`);
    expect(body(name)).toContain("set search_path = pg_catalog, public");
  });

  it("checks copied and deleted counts, raising before any loss can commit", () => {
    expect(body(names[0])).toContain("get diagnostics copied_count = row_count");
    expect(body(names[0])).toContain("if copied_count <> current_response_count then");
    expect(body(names[0])).toContain("get diagnostics deleted_count = row_count");
    expect(body(names[0])).toContain("if deleted_count <> current_response_count then");
  });

  it("preserves source ids without duplicate insertion and archives current data before restoring", () => {
    const restore = body(names[1]);
    expect(restore).toContain("archive_and_reset_iconic_survey(actor)");
    expect(restore.indexOf("archive_and_reset_iconic_survey(actor)")).toBeLessThan(restore.indexOf("insert into public.survey_iconic_responses"));
    expect(restore).toMatch(/select source_response_id, participant_name, choices, submitted_at/);
    expect(restore).toContain("if inserted_count <> source_count then");
    expect(restore).toContain("if source_count <> expected_count then");
  });

  it("deletes only the requested archive and fails on a missing archive", () => {
    expect(body(names[2])).toContain("delete from public.survey_iconic_archives where id = target_archive");
    expect(body(names[2])).toContain("if not found then");
    expect(body(names[2])).not.toContain("delete from public.survey_iconic_responses");
    expect(sql).toContain("on delete cascade");
  });
});
