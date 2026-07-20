import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const fields = new URLSearchParams(body);
  const name = fields.get("nome")?.trim() ?? "";
  const choices = fields.get("scelte")?.trim() ?? "";
  const links = fields.get("link")?.trim() ?? "";
  const selectedChoices = choices.split("\n").filter(Boolean);
  const selectedLinks = links.split("\n").filter(Boolean);

  if (!name || name.length > 120 || selectedChoices.length !== 5 || selectedLinks.length !== 5) {
    return NextResponse.json({ ok: false, error: "Dati del sondaggio non validi" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("survey_iconic_responses").insert({
    participant_name: name,
    choices: selectedChoices.map((choice, index) => ({
      name: choice.replace(/^\d+\.\s*/, ""),
      url: selectedLinks[index],
    })),
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "Non è stato possibile registrare la risposta" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
