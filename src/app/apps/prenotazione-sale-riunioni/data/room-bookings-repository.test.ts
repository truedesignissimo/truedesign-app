import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationsDirectory = new URL("../../../../../supabase/migrations/", import.meta.url);

describe("shared room bookings storage", () => {
  it("defines a protected, conflict-safe shared bookings table", () => {
    const migrations = readdirSync(migrationsDirectory);
    expect(migrations).toContain("20260914_create_room_bookings.sql");

    const sql = readFileSync(new URL("../../../../../supabase/migrations/20260914_create_room_bookings.sql", import.meta.url), "utf8");
    expect(sql).toContain("create table if not exists public.room_bookings");
    expect(sql).toContain("apps.url = '/apps/prenotazione-sale-riunioni'");
    expect(sql).toContain("exclude using gist");
  });
});
