"use client";

import "@/styles/admin-users.css";

export default function AdminUsersPage() {
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
          <tr className="admin-users-row">
            <td>John Doe</td>
            <td>john@example.com</td>
            <td><span className="pro-badge">Pro</span></td>
            <td>2024-01-12</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
