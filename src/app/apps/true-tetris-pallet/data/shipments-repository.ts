import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TetrisShipment,
  TetrisShipmentInput,
  TetrisShipmentListItem,
  TetrisSourceFile,
} from "./types";

export const TETRIS_BUCKET = "true-tetris-pallet-orders";
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

const assertResult = <T>(result: { data: T; error: { message: string } | null }, operation: string): T => {
  if (result.error) throw new Error(`${operation}: ${result.error.message}`);
  return result.data;
};

const extensionFor = (file: File): "xlsx" | "csv" => {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx")) return "xlsx";
  if (name.endsWith(".csv")) return "csv";
  throw new Error("Sono supportati soltanto file XLSX o CSV");
};

const sourceFromRow = (row: Record<string, unknown>): TetrisSourceFile | null => {
  const path = typeof row.source_file_path === "string" ? row.source_file_path : "";
  if (!path) return null;
  return {
    path,
    name: String(row.source_file_name || "ordine"),
    type: String(row.source_file_type || ""),
    size: Number(row.source_file_size || 0),
  };
};

const shipmentFromRow = (row: Record<string, unknown>): TetrisShipment => {
  const payload = (row.payload || {}) as Partial<TetrisShipment>;
  return {
    id: String(row.id),
    title: String(row.title),
    metadata: payload.metadata || {
      orderNumber: String(row.order_number || ""),
      orderSeries: String(row.order_series || ""),
      customer: String(row.customer || ""),
      orderDate: String(row.order_date || ""),
      destination: String(row.destination || ""),
    },
    settings: payload.settings || {},
    plan: payload.plan || {},
    summary: payload.summary || {},
    sourceFile: sourceFromRow(row),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
    createdBy: String(row.created_by || ""),
  };
};

export function createTetrisShipmentsRepository(supabase: SupabaseClient) {
  return {
    async list(): Promise<TetrisShipmentListItem[]> {
      const result = await supabase
        .from("tetris_pallet_shipments")
        .select("id, title, order_number, order_series, customer, order_date, destination, source_file_name, source_file_path, source_file_type, source_file_size, payload, created_at, updated_at, created_by")
        .order("updated_at", { ascending: false });
      const rows = assertResult(result as never, "Elenco piani") as Record<string, unknown>[];
      return rows.map((row) => {
        const shipment = shipmentFromRow(row);
        return {
          id: shipment.id,
          title: shipment.title,
          metadata: shipment.metadata,
          summary: shipment.summary,
          sourceFile: shipment.sourceFile,
          createdAt: shipment.createdAt || "",
          updatedAt: shipment.updatedAt || "",
          createdBy: shipment.createdBy || "",
        };
      });
    },

    async load(id: string): Promise<TetrisShipment> {
      const result = await supabase
        .from("tetris_pallet_shipments")
        .select("*")
        .eq("id", id)
        .single();
      return shipmentFromRow(assertResult(result as never, "Apertura piano") as Record<string, unknown>);
    },

    async save(input: TetrisShipmentInput): Promise<TetrisShipment> {
      const source = input.sourceFile || null;
      const result = await supabase
        .from("tetris_pallet_shipments")
        .upsert({
          id: input.id,
          title: input.title,
          order_number: input.metadata.orderNumber || null,
          order_series: input.metadata.orderSeries || null,
          customer: input.metadata.customer || null,
          order_date: input.metadata.orderDate || null,
          destination: input.metadata.destination || null,
          source_file_name: source?.name || null,
          source_file_path: source?.path || null,
          source_file_type: source?.type || null,
          source_file_size: source?.size || null,
          payload: input,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      return shipmentFromRow(assertResult(result as never, "Salvataggio piano") as Record<string, unknown>);
    },

    async uploadSourceFile(shipmentId: string, file: File): Promise<TetrisSourceFile> {
      const extension = extensionFor(file);
      if (file.size > MAX_SOURCE_BYTES) throw new Error("Il file XLSX o CSV non può superare 20 MB");
      const path = `${shipmentId}/source.${extension}`;
      const { data, error } = await supabase.storage.from(TETRIS_BUCKET).upload(path, file, {
        contentType: file.type || (extension === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv"),
        upsert: true,
      });
      if (error) throw new Error(`Caricamento file sorgente: ${error.message}`);
      return { name: file.name, path: data.path, type: file.type, size: file.size };
    },

    async getSourceDownloadUrl(path: string): Promise<string> {
      const { data, error } = await supabase.storage.from(TETRIS_BUCKET).createSignedUrl(path, 60);
      if (error) throw new Error(`Download file sorgente: ${error.message}`);
      return data.signedUrl;
    },

    async delete(id: string): Promise<void> {
      const shipment = await this.load(id);
      if (shipment.sourceFile?.path) {
        const { error: fileError } = await supabase.storage.from(TETRIS_BUCKET).remove([shipment.sourceFile.path]);
        if (fileError) throw new Error(`Eliminazione file sorgente: ${fileError.message}`);
      }
      const result = await supabase.from("tetris_pallet_shipments").delete().eq("id", id);
      assertResult(result as never, "Eliminazione piano");
    },
  };
}
