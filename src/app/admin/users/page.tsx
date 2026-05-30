"use client";

import "@/styles/admin-users.css";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface UserRow {
  user_id: string;
  email: string;
  full_name: string | null;
  is_pro: boolean | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const isAdmin = useIsAdmin();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin !== true) return;

    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, email, full_name, is_pro, created_at")
        .order("created_at", { ascending: false });

      setUsers(data || []);
      setLoading(false);
    }

    load();
  }, [isAdmin]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p>Loading users…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-users-header">
        <h1 className="admin-users-title">Users</h1>

        <div className="admin-users-actions">
          <button className="button button-primary">Add User</button>
        </div>
      </div>

      <table className="admin-users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Plan</th>
            <th>Joined</th>
          </tr>
        </thead>

        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={4} className="admin-users-empty">
                No users found.
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.user_id} className="admin-users-row">
                <td>{u.full_name || "—"}</td>
                <td>{u.email}</td>

                <td>
                  {u.is_pro ? (
                    <span className="pro-badge">Pro</span>
                  ) : (
                    <span className="free-badge">Free</span>
                  )}
                </td>

                <td>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
