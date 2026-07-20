import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "commercial-offer-images";
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 10 * 1024 * 1024;

const safeSegment = (value: string): string => {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error("Identificativo immagine non valido");
  return value;
};

export function createImageStorage(supabase: SupabaseClient) {
  return {
    async uploadLineImage(args: { userId: string; offerId: string; lineId: string; file: File }): Promise<string> {
      const extension = ALLOWED_TYPES[args.file.type];
      if (!extension) throw new Error("Sono supportate soltanto immagini JPEG, PNG o WebP");
      if (args.file.size > MAX_BYTES) throw new Error("L'immagine non può superare 10 MB");
      const path = [
        safeSegment(args.userId), safeSegment(args.offerId), safeSegment(args.lineId),
        `${crypto.randomUUID()}.${extension}`,
      ].join("/");
      const { data, error } = await supabase.storage.from(BUCKET).upload(path, args.file, {
        contentType: args.file.type,
        upsert: false,
      });
      if (error) throw new Error(`Caricamento immagine: ${error.message}`);
      return data.path;
    },

    async getSignedImageUrl(path: string, expiresIn = 3600): Promise<string> {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
      if (error) throw new Error(`Apertura immagine: ${error.message}`);
      return data.signedUrl;
    },

    async deleteLineImage(path: string): Promise<void> {
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) throw new Error(`Eliminazione immagine: ${error.message}`);
    },
  };
}
