"use client";

import { useMemo, useState, useTransition } from "react";
import {
  assignApp,
  deleteUser,
  sendPasswordReset,
  setUserApproval,
  setUserType,
  toggleUserAdmin,
  unassignApp,
  updateUserName,
} from "./actions";

type User = {
  id: string;
  email: string | undefined;
  full_name: string | null;
  is_admin: boolean;
  user_type: string;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
};

type App = { id: string; name: string };
type UserApp = { user_id: string; app_id: string };
type Notice = { type: "success" | "error"; message: string } | null;

function initials(name: string | null, email: string | undefined) {
  const source = name?.trim() || email || "U";
  return source
    .split(/[\s@._-]+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDate(value: string | null) {
  if (!value) return "Mai";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Rome",
  }).format(new Date(value));
}

function UserNameEditor({
  user,
  disabled,
  onSaved,
  onError,
}: {
  user: User;
  disabled: boolean;
  onSaved: (name: string) => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState(user.full_name ?? "");

  async function saveName() {
    const normalizedName = name.trim();
    if (!normalizedName || normalizedName === user.full_name) return;
    try {
      await updateUserName(user.id, normalizedName);
      onSaved(normalizedName);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Impossibile aggiornare il nome.");
    }
  }

  return (
    <div className="user-name-editor">
      <label className="muted" htmlFor={`name-${user.id}`}>Nome completo</label>
      <div className="user-name-editor-row">
        <input
          id={`name-${user.id}`}
          className="input"
          value={name}
          disabled={disabled}
          onChange={(event) => setName(event.target.value)}
        />
        <button className="btn btn-secondary" type="button" disabled={disabled} onClick={saveName}>
          Salva
        </button>
      </div>
    </div>
  );
}

export default function UserAppMatrix({
  users,
  apps,
  userApps,
  currentUserId,
}: {
  users: User[];
  apps: App[];
  userApps: UserApp[];
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [localUsers, setLocalUsers] = useState(users);
  const [localUserApps, setLocalUserApps] = useState(userApps);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"tutti" | "pending" | "cliente" | "interno" | "admin">("tutti");
  const [notice, setNotice] = useState<Notice>(null);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return localUsers.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        user.full_name?.toLowerCase().includes(normalizedQuery) ||
        user.email?.toLowerCase().includes(normalizedQuery);
      const matchesFilter =
        filter === "tutti" ||
        (filter === "admin"
          ? user.is_admin
          : filter === "pending"
            ? user.approval_status === "pending"
            : user.user_type === filter);
      return matchesQuery && matchesFilter;
    });
  }, [filter, localUsers, query]);

  function hasApp(userId: string, appId: string) {
    return localUserApps.some((userApp) => userApp.user_id === userId && userApp.app_id === appId);
  }

  function updateLocalUser(userId: string, patch: Partial<User>) {
    setLocalUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, ...patch } : user))
    );
  }

  function handleUserType(user: User, userType: "interno" | "cliente") {
    const previousType = user.user_type;
    updateLocalUser(user.id, { user_type: userType });
    setNotice(null);
    startTransition(async () => {
      try {
        await setUserType(user.id, userType);
        setNotice({ type: "success", message: `Ruolo di ${user.full_name ?? user.email} aggiornato.` });
      } catch (error) {
        updateLocalUser(user.id, { user_type: previousType });
        setNotice({ type: "error", message: error instanceof Error ? error.message : "Aggiornamento non riuscito." });
      }
    });
  }

  function handleToggleAdmin(user: User, checked: boolean) {
    updateLocalUser(user.id, { is_admin: checked });
    setNotice(null);
    startTransition(async () => {
      try {
        await toggleUserAdmin(user.id, checked);
        setNotice({ type: "success", message: "Permessi amministratore aggiornati." });
      } catch (error) {
        updateLocalUser(user.id, { is_admin: user.is_admin });
        setNotice({ type: "error", message: error instanceof Error ? error.message : "Aggiornamento non riuscito." });
      }
    });
  }

  function handleApproval(user: User, approved: boolean) {
    const previousStatus = user.approval_status;
    const nextStatus = approved ? "approved" : "rejected";
    updateLocalUser(user.id, { approval_status: nextStatus });
    setNotice(null);
    startTransition(async () => {
      try {
        await setUserApproval(user.id, approved);
        setNotice({
          type: "success",
          message: approved
            ? `${user.full_name ?? user.email} può ora accedere alle app assegnate.`
            : `Accesso di ${user.full_name ?? user.email} sospeso.`,
        });
      } catch (error) {
        updateLocalUser(user.id, { approval_status: previousStatus });
        setNotice({ type: "error", message: error instanceof Error ? error.message : "Aggiornamento non riuscito." });
      }
    });
  }

  function handleToggleApp(userId: string, appId: string, checked: boolean) {
    setLocalUserApps((current) =>
      checked
        ? [...current, { user_id: userId, app_id: appId }]
        : current.filter((item) => !(item.user_id === userId && item.app_id === appId))
    );
    setNotice(null);

    startTransition(async () => {
      try {
        if (checked) await assignApp(userId, appId);
        else await unassignApp(userId, appId);
        setNotice({ type: "success", message: "Assegnazioni applicazioni aggiornate." });
      } catch (error) {
        setLocalUserApps((current) =>
          checked
            ? current.filter((item) => !(item.user_id === userId && item.app_id === appId))
            : [...current, { user_id: userId, app_id: appId }]
        );
        setNotice({ type: "error", message: error instanceof Error ? error.message : "Assegnazione non riuscita." });
      }
    });
  }

  function handlePasswordReset(user: User) {
    if (!user.email) return;
    setNotice(null);
    startTransition(async () => {
      try {
        await sendPasswordReset(user.email!);
        setNotice({ type: "success", message: `Email di recupero inviata a ${user.email}.` });
      } catch (error) {
        setNotice({ type: "error", message: error instanceof Error ? error.message : "Invio non riuscito." });
      }
    });
  }

  function handleDelete(user: User) {
    const label = user.full_name || user.email || "questo utente";
    if (!confirm(`Eliminare definitivamente ${label}? L’utente non potrà più accedere al workspace.`)) return;

    setNotice(null);
    startTransition(async () => {
      try {
        await deleteUser(user.id);
        setLocalUsers((current) => current.filter((item) => item.id !== user.id));
        setLocalUserApps((current) => current.filter((item) => item.user_id !== user.id));
        setNotice({ type: "success", message: `${label} è stato eliminato.` });
      } catch (error) {
        setNotice({ type: "error", message: error instanceof Error ? error.message : "Eliminazione non riuscita." });
      }
    });
  }

  return (
    <div>
      <div className="user-toolbar">
        <div className="user-search">
          <label className="muted" htmlFor="user-search">Cerca utenti</label>
          <input
            id="user-search"
            className="input"
            type="search"
            placeholder="Nome o indirizzo email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="user-filter">
          <label className="muted" htmlFor="user-filter">Mostra</label>
          <select
            id="user-filter"
            className="input"
            value={filter}
            onChange={(event) => setFilter(event.target.value as typeof filter)}
          >
            <option value="tutti">Tutti gli utenti</option>
            <option value="pending">Da approvare</option>
            <option value="cliente">Solo clienti</option>
            <option value="interno">Solo team interno</option>
            <option value="admin">Solo amministratori</option>
          </select>
        </div>
        <span className="user-result-count">{filteredUsers.length} risultati</span>
      </div>

      {notice && <p className={notice.type === "success" ? "success user-notice" : "error user-notice"}>{notice.message}</p>}

      <div className="table-wrap user-table-wrap">
        <table className="user-table">
          <thead>
            <tr>
              <th>Utente</th>
              <th>Profilo</th>
              <th>Applicazioni extra</th>
              <th>Ultimo accesso</th>
              <th>Gestione</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const assignedCount = apps.filter((app) => hasApp(user.id, app.id)).length;
              const isCurrentUser = user.id === currentUserId;

              return (
                <tr key={user.id}>
                  <td>
                    <div className="user-identity">
                      <span className="user-avatar" aria-hidden="true">{initials(user.full_name, user.email)}</span>
                      <div>
                        <strong>{user.full_name ?? "Nome non impostato"}</strong>
                        <span className="muted">{user.email}</span>
                        <div className="user-badges">
                          <span className={`status-badge ${user.email_confirmed_at ? "status-active" : "status-pending"}`}>
                            {user.email_confirmed_at ? "Attivo" : "Invito in attesa"}
                          </span>
                          <span className={`status-badge ${user.approval_status === "approved" ? "status-active" : "status-pending"}`}>
                            {user.approval_status === "approved"
                              ? "Approvato"
                              : user.approval_status === "pending"
                                ? "Da approvare"
                                : "Sospeso"}
                          </span>
                          {isCurrentUser && <span className="status-badge">Tu</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className="input user-role-select"
                      value={user.user_type}
                      disabled={isPending}
                      aria-label={`Tipo di accesso di ${user.full_name ?? user.email}`}
                      onChange={(event) => handleUserType(user, event.target.value as "interno" | "cliente")}
                    >
                      <option value="cliente">Cliente</option>
                      <option value="interno">Team interno</option>
                    </select>
                    <label className="admin-toggle">
                      <input
                        type="checkbox"
                        checked={user.is_admin}
                        disabled={isPending || isCurrentUser}
                        onChange={(event) => handleToggleAdmin(user, event.target.checked)}
                      />
                      Amministratore
                    </label>
                  </td>
                  <td>
                    <details className="permissions-menu">
                      <summary>{assignedCount === 0 ? "Nessuna eccezione" : `${assignedCount} assegnate`}</summary>
                      <div className="permissions-list">
                        <p className="muted">App aggiuntive oltre a quelle previste dal profilo.</p>
                        {apps.map((app) => (
                          <label key={app.id}>
                            <input
                              type="checkbox"
                              checked={hasApp(user.id, app.id)}
                              disabled={isPending}
                              onChange={(event) => handleToggleApp(user.id, app.id, event.target.checked)}
                            />
                            {app.name}
                          </label>
                        ))}
                        {apps.length === 0 && <span className="muted">Nessuna app attiva.</span>}
                      </div>
                    </details>
                  </td>
                  <td>
                    <strong className="user-date">{formatDate(user.last_sign_in_at)}</strong>
                    <span className="muted">Creato il {formatDate(user.created_at)}</span>
                  </td>
                  <td>
                    <details className="user-actions-menu">
                      <summary>Gestisci</summary>
                      <div className="user-actions-panel">
                        <UserNameEditor
                          user={user}
                          disabled={isPending}
                          onSaved={(name) => {
                            updateLocalUser(user.id, { full_name: name });
                            setNotice({ type: "success", message: "Nome utente aggiornato." });
                          }}
                          onError={(message) => setNotice({ type: "error", message })}
                        />
                        <div className="user-actions-buttons">
                          {user.approval_status !== "approved" ? (
                            <button
                              className="btn"
                              type="button"
                              disabled={isPending}
                              onClick={() => handleApproval(user, true)}
                            >
                              Approva accesso
                            </button>
                          ) : !isCurrentUser ? (
                            <button
                              className="btn btn-secondary"
                              type="button"
                              disabled={isPending}
                              onClick={() => handleApproval(user, false)}
                            >
                              Sospendi accesso
                            </button>
                          ) : null}
                          <button
                            className="btn btn-secondary"
                            type="button"
                            disabled={isPending || !user.email}
                            onClick={() => handlePasswordReset(user)}
                          >
                            Recupera password
                          </button>
                          <button
                            className="btn btn-danger"
                            type="button"
                            disabled={isPending || isCurrentUser}
                            onClick={() => handleDelete(user)}
                          >
                            Elimina utente
                          </button>
                        </div>
                      </div>
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="empty-state user-empty-state">
          <h2>Nessun utente trovato</h2>
          <p className="muted">Prova a cambiare ricerca o filtro.</p>
        </div>
      )}
    </div>
  );
}
