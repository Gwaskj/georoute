"use client";

import "@/styles/admin-settings.css";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const isAdmin = useIsAdmin();

  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [enableNotifications, setEnableNotifications] = useState(false);

  useEffect(() => {
    if (isAdmin !== true) return;

    async function load() {
      const { data } = await supabase
        .from("business_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (data) {
        setBusinessName(data.business_name || "");
        setSupportEmail(data.support_email || "");
        setPhoneNumber(data.phone_number || "");
        setEnableNotifications(data.enable_notifications || false);
      }

      setLoading(false);
    }

    load();
  }, [isAdmin]);

  if (isAdmin === null) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p>You do not have permission to access business settings.</p>
      </div>
    );
  }

  if (loading) return null;

  async function saveBusinessInfo() {
    setSavingBusiness(true);

    await supabase
      .from("business_settings")
      .update({
        business_name: businessName,
        support_email: supportEmail,
        phone_number: phoneNumber,
      })
      .eq("id", 1);

    setSavingBusiness(false);
    alert("Business information updated!");
  }

  async function savePreferences() {
    setSavingPrefs(true);

    await supabase
      .from("business_settings")
      .update({
        enable_notifications: enableNotifications,
      })
      .eq("id", 1);

    setSavingPrefs(false);
    alert("Preferences updated!");
  }

  return (
    <div className="admin-settings-container">
      <h1 className="admin-settings-title">Settings</h1>

      {/* Business Info */}
      <div className="admin-settings-section">
        <h2 className="admin-settings-section-title">Business Information</h2>

        <form
          className="admin-settings-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveBusinessInfo();
          }}
        >
          <input
            className="input"
            placeholder="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />

          <input
            className="input"
            placeholder="Support Email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
          />

          <input
            className="input"
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          <div className="admin-settings-actions">
            <button className="button button-primary" disabled={savingBusiness}>
              {savingBusiness ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Preferences */}
      <div className="admin-settings-section">
        <h2 className="admin-settings-section-title">Preferences</h2>

        <form
          className="admin-settings-form"
          onSubmit={(e) => {
            e.preventDefault();
            savePreferences();
          }}
        >
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enableNotifications}
              onChange={(e) => setEnableNotifications(e.target.checked)}
            />
            Enable notifications
          </label>

          <div className="admin-settings-actions">
            <button className="button button-primary" disabled={savingPrefs}>
              {savingPrefs ? "Updating..." : "Update Preferences"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
