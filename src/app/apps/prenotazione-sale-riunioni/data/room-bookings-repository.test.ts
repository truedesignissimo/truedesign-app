import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

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

describe("room bookings repository", () => {
  it("loads shared booking rows from room_bookings", async () => {
    const module = await import("./room-bookings-repository").catch(() => null);
    expect(module).not.toBeNull();
    if (!module) return;

    const result = {
      data: [{
        id: "booking-1",
        created_by: "user-1",
        room_id: 2,
        name: "Giulia Bianchi",
        date: "2026-09-15",
        time_start: "10:00:00",
        duration: 60,
        description: "Punto progetto",
      }],
      error: null,
    };
    const query = {
      order: vi.fn(),
      then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    };
    query.order.mockReturnValue(query);
    const select = vi.fn(() => query);
    const from = vi.fn(() => ({ select }));
    const repository = module.createRoomBookingsRepository({ from } as never);

    await expect(repository.list()).resolves.toEqual([{
      id: "booking-1",
      createdBy: "user-1",
      roomId: 2,
      name: "Giulia Bianchi",
      date: "2026-09-15",
      timeStart: "10:00",
      duration: 60,
      description: "Punto progetto",
    }]);
    expect(from).toHaveBeenCalledWith("room_bookings");
  });

  it("saves and removes a booking through the shared table", async () => {
    const module = await import("./room-bookings-repository").catch(() => null);
    expect(module).not.toBeNull();
    if (!module) return;

    const row = {
      id: "booking-2", created_by: "user-2", room_id: 1, name: "Luca Verdi",
      date: "2026-09-16", time_start: "09:30:00", duration: 90, description: "Riunione commerciale",
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq: vi.fn(() => ({ select })) }));
    const remove = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
    const from = vi.fn(() => ({ insert, update, delete: remove }));
    const repository = module.createRoomBookingsRepository({ from } as never);
    const draft = {
      roomId: 1, name: "Luca Verdi", date: "2026-09-16", timeStart: "09:30", duration: 90, description: "Riunione commerciale",
    };

    await expect(repository.create(draft)).resolves.toMatchObject({ id: "booking-2", createdBy: "user-2" });
    await expect(repository.update("booking-2", draft)).resolves.toMatchObject({ id: "booking-2", duration: 90 });
    await expect(repository.remove("booking-2")).resolves.toBeUndefined();
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ room_id: 1, time_start: "09:30" }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ updated_at: expect.any(String) }));
  });
});
