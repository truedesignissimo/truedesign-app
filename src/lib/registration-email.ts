export type MailMessage = { to: string[]; subject: string; html: string };
export type ResendConfig = { apiKey: string; from: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]!);
}

export function buildAdminApprovalEmail(input: {
  recipient: string;
  fullName: string;
  email: string;
  approvalUrl: string;
}): MailMessage {
  const name = escapeHtml(input.fullName);
  const email = escapeHtml(input.email);
  const url = escapeHtml(input.approvalUrl);
  return {
    to: [input.recipient],
    subject: `Nuova richiesta di accesso: ${input.fullName}`,
    html: `<p><strong>${name}</strong> (${email}) ha richiesto l'accesso al workspace.</p>
      <p><a href="${url}">Approva utente</a></p>
      <p>Il link è valido per 72 ore.</p>`,
  };
}

export function buildAccountActiveEmail(input: {
  recipient: string;
  firstName: string;
  appCount: number;
  activationUrl: string;
}): MailMessage {
  const firstName = escapeHtml(input.firstName);
  const activationUrl = escapeHtml(input.activationUrl);
  const appLabel = input.appCount === 0
    ? "app"
    : input.appCount === 1 ? "1 app" : `${input.appCount} app`;
  return {
    to: [input.recipient],
    subject: "Il tuo spazio True è pronto",
    html: `<!doctype html>
<html lang="it"><body style="margin:0;background:#f8f4ed;color:#1d1d1f;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f4ed;padding:32px 16px">
<tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fcfcfb;border:1px solid #dedcd6;border-radius:24px;overflow:hidden">
<tr><td style="padding:34px 38px 10px"><img src="https://www.truedesign.app/Assets/Logo%20True.png" width="96" alt="True Design" style="display:block;max-width:96px;height:auto"></td></tr>
<tr><td style="padding:28px 38px 42px">
<p style="margin:0 0 20px;color:#795529;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">Extraordinary. Everyday.</p>
<h1 style="margin:0 0 22px;font-size:42px;line-height:1.02;letter-spacing:-1.8px">Il tuo spazio è pronto</h1>
<p style="margin:0 0 14px;color:#1d1d1f;font-size:18px;line-height:1.55">Ciao ${firstName}, la tua richiesta True Design è stata approvata.</p>
<p style="margin:0 0 30px;color:#6e6e73;font-size:16px;line-height:1.6">Scegli la password per verificare il tuo indirizzo e accedere alle ${appLabel} assegnate.</p>
<a href="${activationUrl}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#1d1d1f;color:#fff;font-size:15px;font-weight:bold;text-decoration:none">Scegli la password</a>
<p style="margin:30px 0 0;color:#6e6e73;font-size:12px;line-height:1.5">Se il pulsante non funziona, premi su <a href="${activationUrl}" style="color:#795529;text-decoration:underline">questo link</a>.</p>
</td></tr></table></td></tr></table></body></html>`,
  };
}

export async function sendResendEmail(
  message: MailMessage,
  config: ResendConfig,
  fetcher: typeof fetch = fetch
) {
  if (!config.apiKey || !config.from) throw new Error("Configurazione email mancante.");
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: config.from, ...message }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Invio email non riuscito (HTTP ${response.status}).`);
  }
  const payload = await response.json() as { id?: unknown };
  if (typeof payload.id !== "string" || !payload.id) {
    throw new Error("Invio email non confermato dal provider.");
  }
  return payload.id;
}
