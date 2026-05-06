"use client";

import "@/styles/admin-settings.css";

export default function AdminSettingsPage() {
  return (
    <div className="admin-settings-container">
      <h1 className="admin-settings-title">Settings</h1>

      <div className="admin-settings-section">
        <h2 className="admin-settings-section-title">Business Information</h2>

        <form className="admin-settings-form">
          <input className="input" placeholder="Business Name" />
          <input className="input" placeholder="Support Email" />
          <input className="input" placeholder="Phone Number" />

          <div className="admin-settings-actions">
            <button className="button button-primary">Save Changes</button>
          </div>
        </form>
      </div>

      <div className="admin-settings-section">
        <h2 className="admin-settings-section-title">Preferences</h2>

        <form className="admin-settings-form">
          <label>
            <input type="checkbox" /> Enable notifications
          </label>

          <div className="admin-settings-actions">
            <button className="button button-primary">Update Preferences</button>
          </div>
        </form>
      </div>
    </div>
  );
}
