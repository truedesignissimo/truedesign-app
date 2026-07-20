"use client";

import { useState, useTransition } from "react";
import { assignApp, unassignApp, toggleUserAdmin, setUserType } from "./actions";

type User = {
  id: string;
  email: string | undefined;
  full_name: string | null;
  is_admin: boolean;
  user_type: string;
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

  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>Utente</th>
            <th>Tipo</th>
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
                <select
                  className="input"
                  value={user.user_type}
                  disabled={isPending}
                  onChange={(e) =>
                    startTransition(() =>
                      setUserType(user.id, e.target.value as "interno" | "cliente")
                    )
                  }
                >
                  <option value="cliente">Cliente</option>
                  <option value="interno">Interno</option>
                </select>
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
      {apps.length === 0 && (
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          Nessuna app da assegnare singolarmente. Le app "Clienti"/"Interno" sono già visibili
          automaticamente in base al tipo utente — usa questa tabella solo per eccezioni.
        </p>
      )}
    </div>
  );
}
