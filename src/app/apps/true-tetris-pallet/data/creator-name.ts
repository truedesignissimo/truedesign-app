export const creatorFirstName = (fullName: string | null | undefined): string => {
  const normalized = String(fullName || "").trim();
  return normalized ? normalized.split(/\s+/)[0] : "";
};
