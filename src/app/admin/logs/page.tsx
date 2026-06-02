"use client";

import "@/styles/admin-logs.css";
import { supabase } from "@/lib/supabase/client";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { useEffect, useState } from "react";

interface AdminLogRow {
  id: string;
  action: string;
  details: any;
  created_at: string;
  actor_id: string | null;
  target_user_id: string | null;
  actor_email: string | null;
  actor_is_admin: boolean | null;
  target_email: string | null;
  target_is_pro: boolean | null;
  target_plan: string | null;
}

const PAGE_SIZE = 50;

const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All actions" },
  { value: "subscription_created", label: "Subscription created" },
  { value: "subscription_renewed", label: "Subscription renewed" },
  { value: "subscription_canceled", label: "Subscription canceled" },
  { value: "subscription_expired", label: "Subscription expired" },
  { value: "staff_added", label: "Staff added" },
  { value: "staff_removed", label: "Staff removed" },
  { value: "staff_updated", label: "Staff updated" },
  { value: "appointment_created", label: "Appointment created" },
  { value: "appointment_updated", label: "Appointment updated" },
  { value: "appointment_deleted", label: "Appointment deleted" },
  { value: "route_generated_cached", label: "Route (cached)" },
  { value: "route_generated_ors", label: "Route (ORS)" },
  { value: "unauthorized_data_access_attempt", label: "Unauthorized access" },
  { value: "admin_reset_password", label: "Admin reset password" },
  { value: "admin_delete_user", label: "Admin delete user" },
  { value: "admin_extend_pro", label: "Admin extend Pro" },
  { value: "admin_set_expiry", label: "Admin set expiry" },
  { value: "admin_remove_pro", label: "Admin remove Pro" },
  { value: "admin_invite_user", label: "Admin invite user" },
];

type ViewMode = "table" | "timeline";
type UserFilter = "all" | "pro" | "free";

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatRelative(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

function detailsPreview(details: any): string {
  if (!details) return "";
  try {
    const s = JSON.stringify(details);
    if (s.length <= 120) return s;
    return s.slice(0, 117) + "...";
  } catch {
    return "";
  }
}

export default function AdminLogsPage() {
  const isAdmin = useIsAdmin();

  const [logs, setLogs] = useState<AdminLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const [selectedLog, setSelectedLog] = useState<AdminLogRow | null>(null);

  async function loadLogs(pageIndex: number) {
    setLoading(true);

    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("admin_activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    // Date range (within 30 days)
    if (fromDate) {
      query = query.gte("created_at", new Date(fromDate).toISOString());
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }

    // Action filter
    if (actionFilter) {
      query = query.eq("action", actionFilter);
    }

    // User filter (Pro / Free)
    if (userFilter === "pro") {
      query = query.eq("target_is_pro", true);
    } else if (userFilter === "free") {
      query = query.eq("target_is_pro", false);
    }

    // Search (actor/target email or action)
    if (search.trim()) {
      const q = search.trim();
      query = query.or(
        `actor_email.ilike.%${q}%,target_email.ilike.%${q}%,action.ilike.%${q}%`
      );
    }

    const { data, error } = await query;

    if (!error) {
      setLogs(data || []);
      setHasMore((data || []).length === PAGE_SIZE);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin === true) {
      setPage(0);
      loadLogs(0);
    }
  }, [isAdmin, actionFilter, userFilter, fromDate, toDate, search]);

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
        <p>You do not have permission to view logs.</p>
      </div>
    );
  }

  function handleNextPage() {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    loadLogs(next);
  }

  function handlePrevPage() {
    if (page === 0 || loading) return;
    const prev = page - 1;
    setPage(prev);
    loadLogs(prev);
  }

  return (
    <div className="p-8 text-slate-100 admin-logs-layout">
      <div className="admin-logs-header">
        <div className="admin-logs-header-left">
          <h1 className="admin-logs-title">Activity logs</h1>
          <p className="admin-logs-subtitle">
            Subscription changes, staff/appointments, routing usage, and security events (last 30 days).
          </p>
        </div>

        <div className="admin-logs-header-right">
          <div className="admin-logs-view-toggle">
            <button
              className={`button button-small ${
                viewMode === "table" ? "button-primary" : "button-secondary"
              }`}
              onClick={() => setViewMode("table")}
            >
              Table
            </button>
            <button
              className={`button button-small ${
                viewMode === "timeline" ? "button-primary" : "button-secondary"
              }`}
              onClick={() => setViewMode("timeline")}
            >
              Timeline
            </button>
          </div>
        </div>
      </div>

      <div className="admin-logs-filters">
        <form
          className="admin-logs-search-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
          }}
        >
          <input
            type="text"
            placeholder="Search by email or action…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="admin-logs-search-input"
          />
          <button className="button button-secondary" type="submit">
            Search
          </button>
        </form>

        <div className="admin-logs-filter-row">
          <div className="admin-logs-filter-group">
            <label>Action</label>
            <select
              className="admin-logs-select"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-logs-filter-group">
            <label>User type</label>
            <select
              className="admin-logs-select"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value as UserFilter)}
            >
              <option value="all">All</option>
              <option value="pro">Pro only</option>
              <option value="free">Free only</option>
            </select>
          </div>

          <div className="admin-logs-filter-group">
            <label>From</label>
            <input
              type="date"
              className="admin-logs-date-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="admin-logs-filter-group">
            <label>To</label>
            <input
              type="date"
              className="admin-logs-date-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <button
            className="button button-secondary button-small"
            type="button"
            onClick={() => {
              const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
              const now = new Date();
              setFromDate(d30.toISOString().slice(0, 10));
              setToDate(now.toISOString().slice(0, 10));
              setActionFilter("");
              setUserFilter("all");
              setSearch("");
              setSearchInput("");
              setPage(0);
              loadLogs(0);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <table className="admin-logs-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Target</th>
              <th>Plan</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="admin-logs-empty">
                  Loading…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-logs-empty">
                  No logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="admin-logs-row"
                  onClick={() => setSelectedLog(log)}
                >
                  <td>
                    <div className="admin-logs-time-cell">
                      <span>{formatDateTime(log.created_at)}</span>
                      <span className="admin-logs-time-relative">
                        {formatRelative(log.created_at)}
                      </span>
                    </div>
                  </td>
                  <td>{log.action}</td>
                  <td>{log.actor_email || "—"}</td>
                  <td>{log.target_email || "—"}</td>
                  <td>
                    {log.target_is_pro === null
                      ? "—"
                      : log.target_is_pro
                      ? "Pro"
                      : "Free"}
                  </td>
                  <td className="admin-logs-details-preview">
                    {detailsPreview(log.details)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      ) : (
        <div className="admin-logs-timeline">
          {loading ? (
            <div className="admin-logs-empty">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="admin-logs-empty">No logs found.</div>
          ) : (
            <ul className="admin-logs-timeline-list">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="admin-logs-timeline-item"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="admin-logs-timeline-marker" />
                  <div className="admin-logs-timeline-card">
                    <div className="admin-logs-timeline-header">
                      <span className="admin-logs-timeline-action">
                        {log.action}
                      </span>
                      <span className="admin-logs-timeline-time">
                        {formatDateTime(log.created_at)} ·{" "}
                        {formatRelative(log.created_at)}
                      </span>
                    </div>
                    <div className="admin-logs-timeline-meta">
                      <span>
                        <strong>Actor:</strong>{" "}
                        {log.actor_email || "—"}
                      </span>
                      <span>
                        <strong>Target:</strong>{" "}
                        {log.target_email || "—"}
                      </span>
                      <span>
                        <strong>Plan:</strong>{" "}
                        {log.target_is_pro === null
                          ? "—"
                          : log.target_is_pro
                          ? "Pro"
                          : "Free"}
                      </span>
                    </div>
                    {detailsPreview(log.details) && (
                      <div className="admin-logs-timeline-details">
                        <span className="admin-logs-timeline-details-label">
                          Details:
                        </span>
                        <span className="admin-logs-timeline-details-text">
                          {detailsPreview(log.details)}
                        </span>
                      </div>
                    )}
                    <button
                      className="button button-small button-secondary admin-logs-timeline-view-button"
                      type="button"
                    >
                      View full details
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="admin-logs-footer">
        <div className="admin-logs-pagination">
          <button
            className="button button-secondary button-small"
            disabled={page === 0 || loading}
            onClick={handlePrevPage}
          >
            Previous
          </button>
          <span className="admin-logs-page-indicator">
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

      {selectedLog && (
        <div
          className="admin-logs-drawer-backdrop"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="admin-logs-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-logs-drawer-header">
              <h2>Log details</h2>
              <button
                className="button button-small"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </button>
            </div>
            <div className="admin-logs-drawer-body">
              <p>
                <strong>ID:</strong> {selectedLog.id}
              </p>
              <p>
                <strong>Action:</strong> {selectedLog.action}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {formatDateTime(selectedLog.created_at)} (
                {formatRelative(selectedLog.created_at)})
              </p>
              <p>
                <strong>Actor:</strong>{" "}
                {selectedLog.actor_email || "—"} (
                {selectedLog.actor_id || "no id"})
              </p>
              <p>
                <strong>Target:</strong>{" "}
                {selectedLog.target_email || "—"} (
                {selectedLog.target_user_id || "no id"})
              </p>
              <p>
                <strong>Target plan:</strong>{" "}
                {selectedLog.target_is_pro === null
                  ? "—"
                  : selectedLog.target_is_pro
                  ? "Pro"
                  : "Free"}{" "}
                {selectedLog.target_plan
                  ? `(${selectedLog.target_plan})`
                  : ""}
              </p>
              <div className="admin-logs-drawer-details-block">
                <strong>Details JSON:</strong>
                <pre>
                  {JSON.stringify(selectedLog.details ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
