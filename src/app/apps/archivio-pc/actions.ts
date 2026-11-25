"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase-admin";
import { getPcAdministrator } from "./data/pc-assets";
import { normalizePcInput, type EditorResult } from "./domain/editor";
import { pcImages } from "./image-map";

type Operation = "create" | "update" | "archive";

async function writePc(operation: Operation, input?: unknown, id?: number, version?: string): Promise<EditorResult> {
  try {
    const administrator = await getPcAdministrator();
    if (!administrator) return { ok: false, error: "Solo gli amministratori possono modificare l’archivio." };
    if (operation !== "create" && (!Number.isSafeInteger(id) || id! <= 0
        || typeof version !== "string" || version.length > 40 || !Number.isFinite(Date.parse(version)))) {
      return { ok: false, error: "Scheda non valida. Ricarica l’archivio." };
    }
    const normalized = operation === "archive" ? null : normalizePcInput(input);
    if (normalized && !normalized.ok) return normalized;
    const fields = normalized?.fields;
    if (fields?.foto && !Object.hasOwn(pcImages, fields.foto)) {
      return { ok: false, field: "foto", error: "Seleziona un’immagine dell’archivio." };
    }

    const now = new Date();
    const updatedAt = now.getTime() === Date.parse(version ?? "") ? new Date(now.getTime() + 1) : now;
    const date = new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome", day: "2-digit", month: "2-digit", year: "numeric",
    }).format(now).split("/").reverse().join("-");
    const payload = {
      ...fields,
      ...(operation === "archive" ? { is_archived: true } : {}),
      updated_at: updatedAt.toISOString(), updated_on: date, updated_by: administrator,
    };
    const table = createAdminClient().from("pc_assets");
    const query = operation === "create"
      ? table.insert(payload)
      : table.update(payload).eq("id", id).eq("updated_at", version).eq("is_archived", false);
    const { data, error } = await query.select("id").maybeSingle();
    if (error) throw error;
    if (!data) return { ok: false, error: "La scheda è cambiata o è stata archiviata. Ricarica l’archivio e riprova." };

    revalidatePath("/apps/archivio-pc");
    return { ok: true };
  } catch (error) {
    console.error("[archivio-pc]", operation, error);
    return { ok: false, error: "Operazione non riuscita. Riprova tra poco." };
  }
}

export async function createPcAsset(input: unknown) {
  return writePc("create", input);
}

export async function updatePcAsset(id: number, version: string, input: unknown) {
  return writePc("update", input, id, version);
}

export async function archivePcAsset(id: number, version: string) {
  return writePc("archive", undefined, id, version);
}
