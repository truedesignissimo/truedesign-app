import type { SupabaseClient } from "@supabase/supabase-js";
import type { Offer } from "../domain/types";

interface OfferRow { payload: Offer }

const assertResult = <T>(result: { data: T; error: { message: string } | null }, operation: string): T => {
  if (result.error) throw new Error(`${operation}: ${result.error.message}`);
  return result.data;
};

export function createOffersRepository(supabase: SupabaseClient) {
  return {
    async listOffers(userId: string): Promise<Offer[]> {
      const result = await supabase
        .from("commercial_offers")
        .select("payload")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      return (assertResult(result as { data: OfferRow[]; error: { message: string } | null }, "Elenco offerte") ?? [])
        .map((row) => row.payload);
    },

    async loadOffer(id: string, userId: string): Promise<Offer> {
      const result = await supabase
        .from("commercial_offers")
        .select("payload")
        .eq("id", id)
        .eq("user_id", userId)
        .single();
      return assertResult(result as unknown as { data: OfferRow; error: { message: string } | null }, "Apertura offerta").payload;
    },

    async saveOffer(offer: Offer): Promise<Offer> {
      const now = new Date().toISOString();
      const payload = { ...offer, updatedAt: now };
      const result = await supabase
        .from("commercial_offers")
        .upsert({
          id: offer.id,
          user_id: offer.userId,
          offer_number: offer.number,
          customer_name: offer.customer.name ?? null,
          project_reference: offer.project.reference ?? null,
          payload,
          updated_at: now,
        })
        .select("payload")
        .single();
      return assertResult(result as unknown as { data: OfferRow; error: { message: string } | null }, "Salvataggio offerta").payload;
    },

    async deleteOffer(id: string, userId: string): Promise<void> {
      const result = await supabase
        .from("commercial_offers")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      assertResult(result as unknown as { data: null; error: { message: string } | null }, "Eliminazione offerta");
    },
  };
}
