"use client";

import "@/styles/admin-dashboard.css";

export default function AdminDashboardPage() {
  return (
    <div>
      {/* HEADER */}
      <div className="admin-header">
        <h1 className="admin-header-title">Dashboard</h1>
        <div className="admin-header-actions">
          <button className="button button-primary">Refresh</button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-title">Total Users</div>
          <div className="admin-stat-value">128</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-title">Active Staff</div>
          <div className="admin-stat-value">12</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-title">Appointments Today</div>
          <div className="admin-stat-value">34</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-title">System Logs (24h)</div>
          <div className="admin-stat-value">87</div>
        </div>
      </div>

      {/* QUICK LINKS */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-title">Manage Users</div>
          <button className="button button-primary" onClick={() => window.location.href = "/admin/users"}>
            Open Users
          </button>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-title">Manage Staff</div>
          <button className="button button-primary" onClick={() => window.location.href = "/admin/staff"}>
            Open Staff
          </button>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-title">View Appointments</div>
          <button className="button button-primary" onClick={() => window.location.href = "/admin/appointments"}>
            Open Appointments
          </button>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-title">System Logs</div>
          <button className="button button-primary" onClick={() => window.location.href = "/admin/logs"}>
            Open Logs
          </button>
        </div>
      </div>
    </div>
  );
}
