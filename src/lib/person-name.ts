export function firstName(input: {
  profileName?: string | null;
  metadataFirstName?: string | null;
  metadataFullName?: string | null;
  email?: string | null;
}) {
  const identityName =
    input.profileName?.trim() ||
    input.metadataFirstName?.trim() ||
    input.metadataFullName?.trim();
  if (identityName) return identityName.split(/\s+/)[0];

  return input.email?.split("@")[0]?.split(/[._-]+/)[0]?.trim() || "Utente";
}
