type PasswordSetupAuth = {
  admin: {
    generateLink(input: {
      type: "recovery";
      email: string;
    }): Promise<{
      data: {
        properties: {
          hashed_token?: string;
        } | null;
      };
      error: { message: string } | null;
    }>;
  };
};

export function buildPasswordSetupUrl(siteUrl: string, tokenHash: string) {
  const url = new URL("/imposta-password", `${siteUrl}/`);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", "recovery");
  return url.toString();
}

export async function generatePasswordSetupUrl(
  auth: PasswordSetupAuth,
  email: string,
  siteUrl: string
) {
  const { data, error } = await auth.admin.generateLink({
    type: "recovery",
    email,
  });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    throw new Error("Impossibile generare il link per scegliere la password.");
  }
  return buildPasswordSetupUrl(siteUrl, tokenHash);
}
