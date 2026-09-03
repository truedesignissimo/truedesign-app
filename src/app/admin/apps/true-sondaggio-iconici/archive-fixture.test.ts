import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const generator = fileURLToPath(new URL("./verify-archive-fixture.mjs", import.meta.url));

describe("safe isolated fixture generator", () => {
  it("exists and emits only isolated transactional SQL without executing it", () => {
    expect(existsSync(generator)).toBe(true);
    const sql = execFileSync(process.execPath, [generator], { encoding: "utf8" });
    expect(sql).toMatch(/^--[\s\S]*\nbegin;/);
    expect(sql.trim()).toMatch(/rollback;$/);
    expect(sql).not.toMatch(/\bcommit;/i);
    expect(sql).not.toMatch(/\bpublic\./i);
    expect(sql).not.toMatch(/\bauth\./i);
    expect(sql).not.toMatch(/drop schema/i);
    expect(sql).toContain("create schema survey_archive_test_");
    expect(sql).toContain("fixture_restore_rollback");
    expect(sql).toContain("fixture_reset_rollback");
    expect(sql).toContain("fixture_delete_scoped");
    expect(sql).toContain("has_function_privilege('service_role'");
    expect(sql).toContain("snapshot identity and values preserved");
  });
});
