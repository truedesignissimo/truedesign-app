type AccessLog = {
  id: string;
  user_id: string;
  source: string;
  accessed_at: string;
};

type UsageLog = {
  id: string;
  user_id: string;
  used_at: string;
  apps: { id: string; name: string } | null;
};

type AuthUser = {
  id: string;
  email?: string;
};

type Profile = {
  id: string;
  full_name: string | null;
};

export type UserUsageCount = {
  userId: string;
  label: string;
  email?: string;
  value: number;
};

export function buildUsageReport(input: {
  accessLogs: AccessLog[];
  usageLogs: UsageLog[];
  users: AuthUser[];
  profiles: Profile[];
}) {
  const emailById = new Map(input.users.map((user) => [user.id, user.email]));
  const nameById = new Map(
    input.profiles.map((profile) => [profile.id, profile.full_name])
  );
  const labelFor = (userId: string) =>
    nameById.get(userId) || emailById.get(userId) || "Utente";

  const countUsers = (userIds: string[]): UserUsageCount[] => {
    const counts = new Map<string, number>();
    userIds.forEach((userId) => {
      counts.set(userId, (counts.get(userId) ?? 0) + 1);
    });
    return Array.from(counts, ([userId, value]) => ({
      userId,
      label: labelFor(userId),
      email: emailById.get(userId),
      value,
    })).sort(
      (first, second) =>
        second.value - first.value ||
        first.label.localeCompare(second.label, "it")
    );
  };

  const appCounts = new Map<string, number>();
  input.usageLogs.forEach((log) => {
    const appName = log.apps?.name || "Applicazione non disponibile";
    appCounts.set(appName, (appCounts.get(appName) ?? 0) + 1);
  });

  return {
    totalLogins: input.accessLogs.length,
    totalAppOpens: input.usageLogs.length,
    loginUsers: countUsers(input.accessLogs.map((log) => log.user_id)),
    appUsers: countUsers(input.usageLogs.map((log) => log.user_id)),
    byApp: Array.from(appCounts, ([label, value]) => ({ label, value })).sort(
      (first, second) =>
        second.value - first.value ||
        first.label.localeCompare(second.label, "it")
    ),
    recentLogins: input.accessLogs.map((log) => ({
      ...log,
      label: labelFor(log.user_id),
      email: emailById.get(log.user_id),
    })),
    recentAppOpens: input.usageLogs.map((log) => ({
      ...log,
      label: labelFor(log.user_id),
      email: emailById.get(log.user_id),
      appName: log.apps?.name || "Applicazione non disponibile",
    })),
  };
}
