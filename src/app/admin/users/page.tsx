"use client";

import "@/styles/admin-users.css";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface AdminUserRow {
  user_id: string;
  email: string;
  full_name: string | null;
  is_pro: boolean | null;
  created_at: string;
  is_admin: boolean | null;
  plan: string | null;
  subscription_renewal: string | null; // from profiles
}

const PAGE_SIZE = 20;

function isCurrentlyPro(user: AdminUserRow): boolean {
  if (user.subscription_renewal) {
    const renewal = new Date(user.subscription_renewal);
    return renewal.getTime() > Date.now();
  }
  return !!user.is_pro;
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function daysUntil(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = d.getTime() - Date.now();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${diffDays} days (expired)`;
  if (diffDays === 0) return "expires today";
  return `${diffDays} day${diffDays === 1 ? "" : "s"}`;
}

export default function AdminUsersPage() {
  const isAdmin = useIsAdmin();

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");

  const [manageProUser, setManageProUser] = useState<AdminUserRow | null>(null);
  const [proDaysToAdd, setProDaysToAdd] = useState("");
  const [customExpiry, setCustomExpiry] = useState("");

  async function loadUsers(pageIndex: number, searchTerm: string) {
    setLoading(true);

    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("admin_user_list")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (searchTerm.trim()) {
      const q = searchTerm.trim();
      query = query.or(
        `email.ilike.%${q}%,full_name.ilike.%${q}%,plan.ilike.%${q}%`
      );
    }

    const { data, error } = await query;

    if (!error) {
      setUsers(data || []);
      setHasMore((data || []).length === PAGE_SIZE);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin === true) {
      loadUsers(0, "");
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin === true) {
      setPage(0);
      loadUsers(0, search);
    }
  }, [search, isAdmin]);

  // ---------------------------
  // ACTIONS
  // ---------------------------

  async function deleteUser(user: AdminUserRow) {
    if (!confirm(`Delete user ${user.email}? This cannot be undone.`)) return;

    setBusyId(user.user_id);

    await supabase.from("profiles").delete().eq("user_id", user.user_id);

    // Requires service-role on server in real life; here it's the intent:
    await supabase.auth.admin.deleteUser(user.user_id);

    await loadUsers(page, search);
    setBusyId(null);
  }

  async function resetPassword(user: AdminUserRow) {
    setBusyId(user.user_id);

    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${location.origin}/auth/callback`,
    });

    setBusyId(null);
    alert("Password reset email sent.");
  }

  async function handleAddUser(e: any) {
    e.preventDefault();
    if (!newUserEmail.trim()) {
      alert("Email is required.");
      return;
    }

    setBusyId("new-user");

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(
      newUserEmail.trim(),
      {
        data: newUserName.trim()
          ? { full_name: newUserName.trim() }
          : undefined,
        redirectTo: `${location.origin}/auth/callback`,
      }
    );

    if (error) {
      console.error(error);
      alert(error.message || "Failed to add user.");
      setBusyId(null);
      return;
    }

    if (data?.user) {
      await supabase.from("profiles").upsert({
        user_id: data.user.id,
        email: data.user.email,
        full_name: newUserName.trim() || null,
        is_pro: false,
        is_admin: false,
      });
    }

    setNewUserEmail("");
    setNewUserName("");
    setShowAddUser(false);
    await loadUsers(page, search);
    setBusyId(null);
    alert("User invited.");
  }

  function handleNextPage() {
    if (!hasMore) return;
    const next = page + 1;
    setPage(next);
    loadUsers(next, search);
  }

  function handlePrevPage() {
    if (page === 0) return;
    const prev = page - 1;
    setPage(prev);
    loadUsers(prev, search);
  }

  // ---------------------------
  // MANAGE PRO
  // ---------------------------

  function openManagePro(user: AdminUserRow) {
    setManageProUser(user);
    setProDaysToAdd("");
    setCustomExpiry(
      user.subscription_renewal
        ? new Date(user.subscription_renewal).toISOString().slice(0, 16)
        : ""
    );
  }

  async function applyProDays() {
    if (!manageProUser) return;
    const days = parseInt(proDaysToAdd, 10);
    if (Number.isNaN(days) || days === 0) {
      alert("Enter a non-zero number of days.");
      return;
    }

    setBusyId(manageProUser.user_id);

    const now = new Date();
    const current =
      manageProUser.subscription_renewal &&
      !Number.isNaN(new Date(manageProUser.subscription_renewal).getTime())
        ? new Date(manageProUser.subscription_renewal)
        : null;

    const base =
      current && current.getTime() > now.getTime() ? current : now;

    const newExpiry = new Date(
      base.getTime() + days * 24 * 60 * 60 * 1000
    ).toISOString();

    await supabase
      .from("profiles")
      .update({
        subscription_renewal: newExpiry,
        is_pro: true,
      })
      .eq("user_id", manageProUser.user_id);

    await loadUsers(page, search);
    setBusyId(null);
    setManageProUser(null);
  }

  async function applyCustomExpiry() {
    if (!manageProUser) return;
    if (!customExpiry) {
      alert("Select a date/time.");
      return;
    }

    const dt = new Date(customExpiry);
    if (Number.isNaN(dt.getTime())) {
      alert("Invalid date/time.");
      return;
    }

    setBusyId(manageProUser.user_id);

    const iso = dt.toISOString();

    await supabase
      .from("profiles")
      .update({
        subscription_renewal: iso,
        is_pro: dt.getTime() > Date.now(),
      })
      .eq("user_id", manageProUser.user_id);

    await loadUsers(page, search);
    setBusyId(null);
    setManageProUser(null);
  }

  async function removePro() {
    if (!manageProUser) return;

    if (
      !confirm(
        `Remove Pro for ${manageProUser.email}? They will lose Pro access immediately.`
      )
    ) {
      return;
    }

    setBusyId(manageProUser.user_id);

    const nowIso = new Date().toISOString();

    await supabase
      .from("profiles")
      .update({
        subscription_renewal: nowIso,
        is_pro: false,
      })
      .eq("user_id", manageProUser.user_id);

    await loadUsers(page, search);
    setBusyId(null);
    setManageProUser(null);
  }

  // ---------------------------
  // PERMISSION STATES
  // ---------------------------

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p>Checking permissions…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p>You do not have permission to view users.</p>
      </div>
    );
  }

  // ---------------------------
  // MAIN UI
  // ---------------------------

  return (
    <div className="p-8 text-slate-100 admin-users-layout">
      <div className="admin-users-header">
        <div className="admin-users-header-left">
          <h1 className="admin-users-title">Users</h1>
          <p className="admin-users-subtitle">
            Manage Free / Pro access, durations, invites, and account actions.
          </p>
        </div>

        <div className="admin-users-header-right">
          <button
            className="button button-primary"
            onClick={() => setShowAddUser((v) => !v)}
          >
            {showAddUser ? "Cancel" : "Add user"}
          </button>

          <div className="admin-users-actions">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchInput);
              }}
              className="admin-users-search-form"
            >
              <input
                type="text"
                placeholder="Search by email, name, plan…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="admin-users-search-input"
              />
              <button className="button button-secondary" type="submit">
                Search
              </button>
            </form>

            <button
              className="button button-secondary"
              onClick={() => {
                setSearch("");
                setSearchInput("");
                loadUsers(0, "");
                setPage(0);
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {showAddUser && (
        <div className="admin-users-add-panel">
          <form className="admin-users-add-form" onSubmit={handleAddUser}>
            <div className="admin-users-add-fields">
              <div className="admin-users-add-field">
                <label>Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="admin-users-add-field">
                <label>Name (optional)</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
            </div>
            <div className="admin-users-add-actions">
              <button
                type="submit"
                className="button button-primary button-small"
                disabled={busyId === "new-user"}
              >
                Invite user
              </button>
              <button
                type="button"
                className="button button-secondary button-small"
                onClick={() => {
                  setShowAddUser(false);
                  setNewUserEmail("");
                  setNewUserName("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="admin-users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Plan</th>
            <th>Pro</th>
            <th>Admin</th>
            <th>Joined</th>
            <th style={{ width: 320 }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="admin-users-empty">
                Loading…
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={7} className="admin-users-empty">
                No users found.
              </td>
            </tr>
          ) : (
            users.map((u) => {
              const pro = isCurrentlyPro(u);
              return (
                <tr
                  key={u.user_id}
                  className="admin-users-row"
                  onClick={() => setSelectedUser(u)}
                >
                  <td>{u.full_name || "—"}</td>
                  <td>{u.email}</td>
                  <td>{u.plan || "—"}</td>

                  <td>
                    {pro ? (
                      <span className="pro-badge">Pro</span>
                    ) : (
                      <span className="free-badge">Free</span>
                    )}
                  </td>

                  <td>
                    {u.is_admin ? (
                      <span className="admin-badge">Admin</span>
                    ) : (
                      <span className="user-badge">User</span>
                    )}
                  </td>

                  <td>{formatDate(u.created_at)}</td>

                  <td>
                    <div
                      className="admin-users-row-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="button button-small"
                        disabled={busyId === u.user_id}
                        onClick={() => openManagePro(u)}
                      >
                        Manage Pro
                      </button>

                      <button
                        className="button button-small"
                        disabled={busyId === u.user_id}
                        onClick={() => resetPassword(u)}
                      >
                        Reset PW
                      </button>

                      <button
                        className="button button-danger button-small"
                        disabled={busyId === u.user_id}
                        onClick={() => deleteUser(u)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="admin-users-footer">
        <div className="admin-users-pagination">
          <button
            className="button button-secondary button-small"
            disabled={page === 0 || loading}
            onClick={handlePrevPage}
          >
            Previous
          </button>
          <span className="admin-users-page-indicator">
            Page {page + 1}
          </span>
          <button
            className="button button-secondary button-small"
            disabled={!hasMore || loading}
            onClick={handleNextPage}
          >
            Next
          </button>
        </div>
      </div>

      {selectedUser && (
        <div
          className="admin-users-drawer-backdrop"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="admin-users-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-users-drawer-header">
              <h2>User details</h2>
              <button
                className="button button-small"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>

            <div className="admin-users-drawer-body">
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>Name:</strong> {selectedUser.full_name || "—"}
              </p>
              <p>
                <strong>Plan:</strong> {selectedUser.plan || "—"}
              </p>
              <p>
                <strong>Pro:</strong>{" "}
                {isCurrentlyPro(selectedUser) ? "Yes" : "No"}
              </p>
              <p>
                <strong>Admin:</strong>{" "}
                {selectedUser.is_admin ? "Yes" : "No"}
              </p>
              <p>
                <strong>Joined:</strong>{" "}
                {formatDateTime(selectedUser.created_at)}
              </p>
              <p>
                <strong>Subscription renewal:</strong>{" "}
                {formatDateTime(selectedUser.subscription_renewal)}
              </p>
              <p>
                <strong>Pro remaining:</strong>{" "}
                {daysUntil(selectedUser.subscription_renewal)}
              </p>
              <p>
                <strong>User ID:</strong> {selectedUser.user_id}
              </p>
            </div>
          </div>
        </div>
      )}

      {manageProUser && (
        <div
          className="admin-users-drawer-backdrop"
          onClick={() => setManageProUser(null)}
        >
          <div
            className="admin-users-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-users-drawer-header">
              <h2>Manage Pro</h2>
              <button
                className="button button-small"
                onClick={() => setManageProUser(null)}
              >
                Close
              </button>
            </div>

            <div className="admin-users-drawer-body admin-users-pro-drawer-body">
              <p>
                <strong>User:</strong> {manageProUser.email}
              </p>
              <p>
                <strong>Current Pro status:</strong>{" "}
                {isCurrentlyPro(manageProUser) ? "Pro" : "Free"}
              </p>
              <p>
                <strong>Current renewal:</strong>{" "}
                {formatDateTime(manageProUser.subscription_renewal)}
              </p>
              <p>
                <strong>Pro remaining:</strong>{" "}
                {daysUntil(manageProUser.subscription_renewal)}
              </p>

              <div className="admin-users-pro-section">
                <h3>Add custom days</h3>
                <div className="admin-users-pro-inline">
                  <input
                    type="number"
                    className="admin-users-pro-number-input"
                    value={proDaysToAdd}
                    onChange={(e) => setProDaysToAdd(e.target.value)}
                    placeholder="e.g. 7"
                  />
                  <button
                    className="button button-primary button-small"
                    disabled={busyId === manageProUser.user_id}
                    onClick={applyProDays}
                  >
                    Apply
                  </button>
                </div>
                <p className="admin-users-pro-hint">
                  Adds days on top of the current renewal if still active,
                  otherwise from now.
                </p>
              </div>

              <div className="admin-users-pro-section">
                <h3>Set custom expiry</h3>
                <div className="admin-users-pro-inline">
                  <input
                    type="datetime-local"
                    className="admin-users-pro-datetime-input"
                    value={customExpiry}
                    onChange={(e) => setCustomExpiry(e.target.value)}
                  />
                  <button
                    className="button button-secondary button-small"
                    disabled={busyId === manageProUser.user_id}
                    onClick={applyCustomExpiry}
                  >
                    Set expiry
                  </button>
                </div>
                <p className="admin-users-pro-hint">
                  Setting a past date will immediately remove Pro.
                </p>
              </div>

              <div className="admin-users-pro-section">
                <h3>Remove Pro</h3>
                <button
                  className="button button-danger button-small"
                  disabled={busyId === manageProUser.user_id}
                  onClick={removePro}
                >
                  Remove Pro now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
