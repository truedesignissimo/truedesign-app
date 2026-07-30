export type UserRole = "interno" | "cliente";

export type AssignableApp = {
  id: string;
  url: string | null;
};

const CLIENT_DEFAULT_APP_URL = "/apps/true-sondaggio-iconici";

export function defaultAppIdsForRole(
  role: UserRole,
  apps: AssignableApp[]
) {
  if (role === "interno") return apps.map((app) => app.id);
  return apps
    .filter((app) => app.url === CLIENT_DEFAULT_APP_URL)
    .map((app) => app.id);
}

export function assignmentDelta(currentIds: string[], desiredIds: string[]) {
  const current = new Set(currentIds);
  const desired = new Set(desiredIds);
  return {
    add: desiredIds.filter((id) => !current.has(id)),
    remove: currentIds.filter((id) => !desired.has(id)),
  };
}
