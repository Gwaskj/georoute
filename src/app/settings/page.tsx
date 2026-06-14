"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSettingsStore } from "@/store/settingsStore";
import { useSkillsStore } from "@/store/skillsStore";

export default function SettingsPage() {
  const {
    settings,
    loaded,
    setOfficePostcode,
    setDayStart,
    setDayEnd,
    loadSettings,
    saveSettings,
  } = useSettingsStore();

  const { skills, addSkill, deleteSkill, renameSkill } = useSkillsStore();

  const [saving, setSaving] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isFree, setIsFree] = useState(true);
  const [newSkillName, setNewSkillName] = useState("");
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingSkillName, setEditingSkillName] = useState("");

  // Determine auth and tier
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in — allow access as free user
        setIsFree(true);
        setAuthChecking(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("user_id", user.id)
        .maybeSingle();

      setIsFree(!data?.is_pro);
      setAuthChecking(false);
    }

    checkAuth();
  }, []);

  // Load settings once we know the tier
  useEffect(() => {
    if (!authChecking && !loaded) {
      loadSettings(isFree);
    }
  }, [isFree, authChecking, loaded, loadSettings]);

  async function handleSave() {
    setSaving(true);
    await saveSettings(isFree);
    setSaving(false);
  }

  if (authChecking) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-sm text-slate-400 mb-8">
          Configure global defaults for scheduling and route planning.
          {isFree && (
            <span className="ml-2 text-amber-400">
              (Saved in this browser — log in to save permanently)
            </span>
          )}
        </p>

        {!loaded ? (
          <p className="text-sm text-slate-400">Loading settings…</p>
        ) : (
          <div className="space-y-6">
            {/* Office Postcode */}
            <div className="rounded border border-slate-800 bg-slate-900 p-4">
              <label className="mb-1 block text-sm font-medium text-slate-200">
                Default office postcode
              </label>
              <p className="mb-2 text-xs text-slate-500">
                Used as the starting/ending point for all staff routes when
                no per-staff office postcode is set.
              </p>
              <input
                type="text"
                value={settings.officePostcode}
                onChange={(e) => setOfficePostcode(e.target.value)}
                placeholder="e.g. SW1A 1AA"
                className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-teal-400"
              />
            </div>

            {/* Working Hours */}
            <div className="rounded border border-slate-800 bg-slate-900 p-4">
              <h2 className="mb-1 text-sm font-medium text-slate-200">
                Default working hours
              </h2>
              <p className="mb-3 text-xs text-slate-500">
                Appointments can only be scheduled within this window unless a
                custom time window overrides it.
              </p>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-slate-400">
                    Day start
                  </label>
                  <input
                    type="time"
                    value={settings.dayStart}
                    onChange={(e) => setDayStart(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-teal-400"
                  />
                </div>

                <div className="flex-1">
                  <label className="mb-1 block text-xs text-slate-400">
                    Day end
                  </label>
                  <input
                    type="time"
                    value={settings.dayEnd}
                    onChange={(e) => setDayEnd(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-teal-400"
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="rounded border border-slate-800 bg-slate-900 p-4">
              <h2 className="mb-1 text-sm font-medium text-slate-200">Skills</h2>
              <p className="mb-3 text-xs text-slate-500">
                Define the skills staff members can have. These appear in the staff
                form and can be required by appointments.
              </p>

              <div className="space-y-2 mb-3">
                {skills.length === 0 && (
                  <p className="text-xs text-slate-500">No skills added yet.</p>
                )}
                {skills.map((skill) => (
                  <div key={skill.id} className="flex items-center gap-2">
                    {editingSkillId === skill.id ? (
                      <>
                        <input
                          type="text"
                          value={editingSkillName}
                          onChange={(e) => setEditingSkillName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (editingSkillName.trim()) renameSkill(skill.id, editingSkillName.trim());
                              setEditingSkillId(null);
                            }
                            if (e.key === "Escape") setEditingSkillId(null);
                          }}
                          autoFocus
                          className="flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-50 outline-none focus:border-teal-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editingSkillName.trim()) renameSkill(skill.id, editingSkillName.trim());
                            setEditingSkillId(null);
                          }}
                          className="rounded bg-teal-600 px-2 py-1 text-xs text-white hover:bg-teal-700"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSkillId(null)}
                          className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-slate-200">{skill.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSkillId(skill.id);
                            setEditingSkillName(skill.name);
                          }}
                          className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSkill(skill.id)}
                          className="rounded border border-red-800 px-2 py-1 text-xs text-red-400 hover:bg-red-900/30"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = newSkillName.trim();
                  if (name) {
                    addSkill(name);
                    setNewSkillName("");
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="New skill name…"
                  className="flex-1 rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-teal-400"
                />
                <button
                  type="submit"
                  className="rounded bg-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-600"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded bg-teal-500 px-6 py-2 text-sm font-medium text-slate-900 hover:brightness-110 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save settings"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}