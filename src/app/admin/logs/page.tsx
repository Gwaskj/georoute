"use client";

import "@/styles/admin-logs.css";

export default function AdminLogsPage() {
  return (
    <div>
      <div className="admin-logs-header">
        <h1 className="admin-logs-title">System Logs</h1>
      </div>

      <div className="admin-logs-list">
        <div className="admin-log-entry">
          <div className="admin-log-meta">2024-01-12 14:22</div>
          <div className="admin-log-message">User John Doe created a new appointment.</div>
        </div>

        <div className="admin-log-entry">
          <div className="admin-log-meta">2024-01-12 13:10</div>
          <div className="admin-log-message">System performed nightly cleanup.</div>
        </div>
      </div>
    </div>
  );
}
