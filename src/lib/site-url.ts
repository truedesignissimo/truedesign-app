const PRODUCTION_SITE_URL = "https://www.truedesign.app";

function normalizeUrl(value: string) {
  const withProtocol = value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const isProduction = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

  if (configured && !(isProduction && /localhost|127\.0\.0\.1/i.test(configured))) {
    return normalizeUrl(configured);
  }

  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL;

  if (vercelUrl && !isProduction) return normalizeUrl(vercelUrl);
  if (isProduction) return PRODUCTION_SITE_URL;
  return configured ? normalizeUrl(configured) : "http://localhost:3000";
}

export function getAuthRedirect(nextPath: string) {
  const callback = new URL("/auth/callback", `${getSiteUrl()}/`);
  callback.searchParams.set("next", nextPath);
  return callback.toString();
}
