"use client";

import { useState, useTransition } from "react";
import { assignApp, unassignApp, toggleUserAdmin } from "./actions";

type User = {
  id: string;
  email: string | undefined;
  full_name: string | null;
  is_admin: boolean;
};

type App = { id: string; name: string };
type UserApp = { user_id: string; app_id: string };

export default function UserAppMatrix({
  users,
  apps,
  userApps,
}: {
  users: User[];
  apps: App[];
  userApps: UserApp[];
}) {
  const [isPending, startTransition] = useTransition();
  const [localUserApps, setLocalUserApps] = useState(userApps);

  function hasApp(userId: string, appId: string) {
    return localUserApps.some((ua) => ua.user_id === userId && ua.app_id === appId);
  }

  function handleToggleApp(userId: string, appId: string, checked: boolean) {
    // aggiornamento ottimistico
    setLocalUserApps((prev) =>
      checked
        ? [...prev, { user_id: userId, app_id: appId }]
        : prev.filter((ua) => !(ua.user_id === userId && ua.app_id === appId))
    );

    startTransition(async () => {
      if (checked) {
        await assignApp(userId, appId);
      } else {
        await unassignApp(userId, appId);
      }
    });
  }

  if (apps.length === 0) {
    return <p className="muted">Crea prima almeno un'app nella sezione "App".</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>Utente</th>
            <th>Admin</th>
            {apps.map((app) => (
              <th key={app.id}>{app.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                {user.full_name ?? "—"}
                <div className="muted">{user.email}</div>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={user.is_admin}
                  disabled={isPending}
                  onChange={(e) =>
                    startTransition(() => toggleUserAdmin(user.id, e.target.checked))
                  }
                />
              </td>
              {apps.map((app) => (
                <td key={app.id}>
                  <input
                    type="checkbox"
                    checked={hasApp(user.id, app.id)}
                    disabled={isPending}
                    onChange={(e) => handleToggleApp(user.id, app.id, e.target.checked)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
