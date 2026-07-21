import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { isValidSurveySubmission } from "./validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ ok: false, error: "Origine non consentita" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("application/x-www-form-urlencoded")) {
    return NextResponse.json({ ok: false, error: "Formato non supportato" }, { status: 415 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) {
    return NextResponse.json({ ok: false, error: "Richiesta troppo grande" }, { status: 413 });
  }

  const body = await request.text();
  if (body.length > 16_384) {
    return NextResponse.json({ ok: false, error: "Richiesta troppo grande" }, { status: 413 });
  }

  const fields = new URLSearchParams(body);
  const name = fields.get("nome")?.trim() ?? "";
  const choices = fields.get("scelte")?.trim() ?? "";
  const links = fields.get("link")?.trim() ?? "";
  const honeypot = fields.get("website")?.trim() ?? "";

  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  const selectedChoices = choices.split("\n").filter(Boolean);
  const selectedLinks = links.split("\n").filter(Boolean);

  if (!isValidSurveySubmission(name, selectedChoices, selectedLinks)) {
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
