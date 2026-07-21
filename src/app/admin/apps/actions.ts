"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

export type AppInput = {
  name: string;
  description: string | null;
  url: string | null;
  visibility: string;
  is_featured?: boolean;
  display_order?: number;
};

export type AppActionResult =
  | { ok: true }
  | { ok: false; error: string };

const VALID_VISIBILITIES = new Set(["interno", "cliente", "pubblica"]);

class SafeActionError extends Error {}

async function assertIsAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new SafeActionError("La sessione è scaduta. Accedi di nuovo.");

  // Il controllo del ruolo avviene lato server con la service role. In questo
  // modo l'azione non dipende dalle policy RLS applicate alla lettura del
  // profilo dell'utente autenticato.
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error) throw new SafeActionError("Non è stato possibile verificare il profilo amministratore.");
  if (!profile?.is_admin) throw new SafeActionError("Non hai i permessi per modificare le applicazioni.");
}

function normalizeApp(input: AppInput) {
  const name = input.name.trim();
  if (!name) throw new SafeActionError("Il nome dell’app è obbligatorio.");
  if (name.length > 120) throw new SafeActionError("Il nome non può superare 120 caratteri.");

  const description = input.description?.trim() || null;
  if (description && description.length > 1000) {
    throw new SafeActionError("La descrizione non può superare 1.000 caratteri.");
  }

  const url = input.url?.trim() || null;
  if (url && (!url.startsWith("/") || url.startsWith("//") || url.includes("\\"))) {
    throw new SafeActionError("L’indirizzo deve essere un percorso interno, per esempio /apps/nome-app.");
  }

  if (!VALID_VISIBILITIES.has(input.visibility)) {
    throw new SafeActionError("Seleziona una visibilità valida.");
  }

  return {
    name,
    description,
    url,
    visibility: input.visibility,
    ...(typeof input.is_featured === "boolean" ? { is_featured: input.is_featured } : {}),
    ...(typeof input.display_order === "number"
      ? { display_order: Math.max(0, input.display_order) }
      : {}),
  };
}

function actionError(error: unknown, operation: string): AppActionResult {
  console.error(`[admin/apps] ${operation}`, error instanceof Error ? error.message : error);
  return {
    ok: false,
    error: error instanceof SafeActionError
      ? error.message
      : "Si è verificato un errore interno. Riprova tra poco.",
  };
}

function databaseError(error: { code?: string; message: string }, operation: string): AppActionResult {
  console.error(`[admin/apps] ${operation}`, { code: error.code, message: error.message });

  if (error.code === "23505") {
    return { ok: false, error: "Esiste già un’applicazione con questi dati." };
  }
  if (error.code === "23514" || error.code === "22P02") {
    return { ok: false, error: "Uno dei valori inseriti non è valido." };
  }
  if (error.code === "42501") {
    return { ok: false, error: "Il database ha rifiutato l’operazione per mancanza di permessi." };
  }
  if (error.code === "PGRST204") {
    return { ok: false, error: "Il catalogo non è aggiornato all’ultima versione del database." };
  }

  return { ok: false, error: `Operazione non riuscita (${error.code ?? "database"}).` };
}

function revalidateCatalog() {
  revalidatePath("/admin");
  revalidatePath("/admin/apps");
  revalidatePath("/dashboard");
  revalidatePath("/pubblico");
}

export async function createAppRecord(input: AppInput): Promise<AppActionResult> {
  try {
    await assertIsAdmin();
    const admin = createAdminClient();
    const { error } = await admin.from("apps").insert(normalizeApp(input));
    if (error) return databaseError(error, "create");
    revalidateCatalog();
    return { ok: true };
  } catch (error) {
    return actionError(error, "create");
  }
}

export async function updateAppRecord(appId: string, input: AppInput): Promise<AppActionResult> {
  try {
    await assertIsAdmin();
    const admin = createAdminClient();
    const { error } = await admin.from("apps").update(normalizeApp(input)).eq("id", appId);
    if (error) return databaseError(error, "update");
    revalidateCatalog();
    return { ok: true };
  } catch (error) {
    return actionError(error, "update");
  }
}

export async function setAppActive(appId: string, isActive: boolean): Promise<AppActionResult> {
  try {
    await assertIsAdmin();
    const admin = createAdminClient();
    const { error } = await admin.from("apps").update({ is_active: isActive }).eq("id", appId);
    if (error) return databaseError(error, "set-active");
    revalidateCatalog();
    return { ok: true };
  } catch (error) {
    return actionError(error, "set-active");
  }
}

export async function deleteAppRecord(appId: string): Promise<AppActionResult> {
  try {
    await assertIsAdmin();
    const admin = createAdminClient();
    const { error } = await admin.from("apps").delete().eq("id", appId);
    if (error) return databaseError(error, "delete");
    revalidateCatalog();
    return { ok: true };
  } catch (error) {
    return actionError(error, "delete");
  }
}
