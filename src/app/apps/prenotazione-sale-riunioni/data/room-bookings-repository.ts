import type { SupabaseClient } from "@supabase/supabase-js";

export interface RoomBooking {
  id: string;
  createdBy: string;
  roomId: number;
  name: string;
  date: string;
  timeStart: string;
  duration: number;
  description: string;
}

export type RoomBookingDraft = Omit<RoomBooking, "id" | "createdBy">;

type RoomBookingRow = {
  id: string;
  created_by: string;
  room_id: number;
  name: string;
  date: string;
  time_start: string;
  duration: number;
  description: string;
};

const columns = "id, created_by, room_id, name, date, time_start, duration, description";

const asRoomBooking = (row: RoomBookingRow): RoomBooking => ({
  id: row.id,
  createdBy: row.created_by,
  roomId: row.room_id,
  name: row.name,
  date: row.date,
  timeStart: row.time_start.slice(0, 5),
  duration: row.duration,
  description: row.description || "",
});

const asPayload = (draft: RoomBookingDraft) => ({
  room_id: draft.roomId,
  name: draft.name.trim(),
  date: draft.date,
  time_start: draft.timeStart,
  duration: draft.duration,
  description: draft.description.trim(),
});

const assertResult = <T>(result: { data: T; error: { code?: string; message: string } | null }, action: string): T => {
  if (!result.error) return result.data;
  if (result.error.code === "23P01") throw new Error("La sala è già prenotata in questa fascia oraria.");
  throw new Error(`${action}: ${result.error.message}`);
};

export function createRoomBookingsRepository(supabase: SupabaseClient) {
  return {
    async list(): Promise<RoomBooking[]> {
      const result = await supabase
        .from("room_bookings")
        .select(columns)
        .order("date", { ascending: true })
        .order("time_start", { ascending: true });
      return (assertResult(result as never, "Caricamento prenotazioni") as RoomBookingRow[]).map(asRoomBooking);
    },

    async create(draft: RoomBookingDraft): Promise<RoomBooking> {
      const result = await supabase
        .from("room_bookings")
        .insert(asPayload(draft))
        .select(columns)
        .single();
      return asRoomBooking(assertResult(result as never, "Salvataggio prenotazione") as RoomBookingRow);
    },

    async update(id: string, draft: RoomBookingDraft): Promise<RoomBooking> {
      const result = await supabase
        .from("room_bookings")
        .update({ ...asPayload(draft), updated_at: new Date().toISOString() })
        .eq("id", id)
        .select(columns)
        .single();
      return asRoomBooking(assertResult(result as never, "Aggiornamento prenotazione") as RoomBookingRow);
    },

    async remove(id: string): Promise<void> {
      const result = await supabase.from("room_bookings").delete().eq("id", id);
      assertResult(result as never, "Eliminazione prenotazione");
    },
  };
}
