"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSettingsStore } from "@/store/settingsStore";
import { useSkillsStore } from "@/store/skillsStore";
import { useCustomWindowStore, CustomWindow } from "@/store/customWindowStore";

// ─── Input / label primitives ────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 placeholder-slate-500";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-6">
      <h2 className="text-base font-semibold text-slate-100 mb-1">{title}</h2>
      {description && (
        <p className="text-xs text-slate-500 mb-4">{description}</p>
      )}
      {children}
    </div>
  );
}

// ─── Window modal ─────────────────────────────────────────────

interface WindowFormState {
  id?: string;
  name: string;
  start: string;
  end: string;
  minGapToNext: string;
}

const emptyWindowForm: WindowFormState = {
  name: "",
  start: "08:00",
  end: "10:00",
  minGapToNext: "0",
};

function WindowModal({
  form,
  setForm,
  onClose,
  onSubmit,
  isEditing,
}: {
  form: WindowFormState;
  setForm: (f: WindowFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  isEditing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/60">
        <h3 className="mb-4 text-sm font-semibold text-slate-100">
          {isEditing ? "Edit time window" : "Add time window"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Breakfast, Lunch…"
              className={inputCls}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Start
              </label>
              <input
                type="time"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                End
              </label>
              <input
                type="time"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Min gap to next appointment (minutes)
            </label>
            <input
              type="number"
              min={0}
              value={form.minGapToNext}
              onChange={(e) =>
                setForm({ ...form, minGapToNext: e.target.value })
              }
              className={inputCls}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!form.name.trim()}
            className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:brightness-110 transition-all disabled:opacity-40"
          >
            {isEditing ? "Save changes" : "Add window"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main settings page ───────────────────────────────────────

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
  const { windows, addWindow, updateWindow, deleteWindow } =
    useCustomWindowStore();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isFree, setIsFree] = useState(true);

  // Skills
  const [newSkillName, setNewSkillName] = useState("");
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingSkillName, setEditingSkillName] = useState("");

  // Time windows modal
  const [windowModal, setWindowModal] = useState(false);
  const [windowEditing, setWindowEditing] = useState(false);
  const [windowForm, setWindowForm] = useState<WindowFormState>(emptyWindowForm);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
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

  useEffect(() => {
    if (!authChecking && !loaded) {
      loadSettings(isFree);
    }
  }, [isFree, authChecking, loaded, loadSettings]);

  async function handleSave() {
    setSaving(true);
    await saveSettings(isFree);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  // Window modal helpers
  function openAddWindow() {
    setWindowEditing(false);
    setWindowForm(emptyWindowForm);
    setWindowModal(true);
  }

  function openEditWindow(w: CustomWindow) {
    setWindowEditing(true);
    setWindowForm({
      id: w.id,
      name: w.name,
      start: w.start,
      end: w.end,
      minGapToNext: String(w.minGapToNext),
    });
    setWindowModal(true);
  }

  function submitWindow() {
    if (!windowForm.name.trim()) return;
    const gap = Math.max(0, parseInt(windowForm.minGapToNext || "0", 10));
    const payload = {
      name: windowForm.name.trim(),
      start: windowForm.start,
      end: windowForm.end,
      minGapToNext: gap,
    };
    if (windowEditing && windowForm.id) {
      updateWindow(windowForm.id, payload);
    } else {
      addWindow(payload);
    }
    setWindowModal(false);
  }

  if (authChecking) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.06),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Your personal configuration — office location, working hours, time
            windows, and staff skills.
            {isFree && (
              <span className="ml-2 text-amber-400 font-medium">
                Saving in browser only — log in to persist across devices.
              </span>
            )}
          </p>
        </div>

        {!loaded ? (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-teal-400" />
            Loading your settings…
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── Office Postcode ── */}
            <SectionCard
              title="Office Postcode"
              description="Used as the starting and ending point for all staff routes when no per-staff postcode is set."
            >
              <input
                type="text"
                value={settings.officePostcode}
                onChange={(e) => setOfficePostcode(e.target.value)}
                placeholder="e.g. SW1A 1AA"
                className={inputCls}
              />
            </SectionCard>

            {/* ── Working Hours ── */}
            <SectionCard
              title="Default Working Hours"
              description="Appointments are only scheduled within this window unless a custom time window overrides it."
            >
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Day start
                  </label>
                  <input
                    type="time"
                    value={settings.dayStart}
                    onChange={(e) => setDayStart(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Day end
                  </label>
                  <input
                    type="time"
                    value={settings.dayEnd}
                    onChange={(e) => setDayEnd(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Save for office + hours */}
            <div className="flex items-center justify-end gap-3">
              {saved && (
                <span className="text-xs text-teal-400 font-medium">
                  Settings saved
                </span>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-400 px-6 py-2.5 text-sm font-semibold text-slate-900 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save settings"}
              </button>
            </div>

            {/* ── Custom Time Windows ── */}
            <SectionCard
              title="Custom Time Windows"
              description="Define named delivery/visit windows like Breakfast or Evening. Staff routes are constrained to fit within these."
            >
              {windows.length === 0 ? (
                <p className="text-xs text-slate-500 mb-4">
                  No windows yet. Add Breakfast, Lunch, Tea, Bedtime…
                </p>
              ) : (
                <ul className="space-y-2 mb-4">
                  {windows.map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          {w.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {w.start} – {w.end}
                          {w.minGapToNext > 0 && (
                            <span className="ml-2 text-slate-600">
                              · {w.minGapToNext} min gap
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditWindow(w)}
                          className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteWindow(w.id)}
                          className="rounded-lg border border-red-900/60 px-3 py-1 text-xs text-red-400 hover:bg-red-900/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={openAddWindow}
                className="w-full rounded-xl border border-dashed border-slate-700 py-2.5 text-xs font-medium text-slate-400 hover:border-teal-500/50 hover:text-teal-400 transition-colors"
              >
                + Add time window
              </button>
            </SectionCard>

            {/* ── Staff Skills ── */}
            <SectionCard
              title="Staff Skills"
              description="Skills that can be assigned to staff members and required by appointments."
            >
              {skills.length > 0 && (
                <ul className="space-y-1.5 mb-4">
                  {skills.map((skill) => (
                    <li key={skill.id}>
                      {editingSkillId === skill.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingSkillName}
                            onChange={(e) =>
                              setEditingSkillName(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                if (editingSkillName.trim())
                                  renameSkill(
                                    skill.id,
                                    editingSkillName.trim()
                                  );
                                setEditingSkillId(null);
                              }
                              if (e.key === "Escape") setEditingSkillId(null);
                            }}
                            autoFocus
                            className={`${inputCls} flex-1`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (editingSkillName.trim())
                                renameSkill(skill.id, editingSkillName.trim());
                              setEditingSkillId(null);
                            }}
                            className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-medium text-white hover:bg-teal-500 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSkillId(null)}
                            className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 px-4 py-2.5">
                          <span className="text-sm text-slate-200">
                            {skill.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSkillId(skill.id);
                                setEditingSkillName(skill.name);
                              }}
                              className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSkill(skill.id)}
                              className="rounded-lg border border-red-900/60 px-3 py-1 text-xs text-red-400 hover:bg-red-900/20 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

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
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="submit"
                  disabled={!newSkillName.trim()}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors disabled:opacity-40"
                >
                  Add
                </button>
              </form>
            </SectionCard>

          </div>
        )}
      </div>

      {/* Window modal */}
      {windowModal && (
        <WindowModal
          form={windowForm}
          setForm={setWindowForm}
          onClose={() => setWindowModal(false)}
          onSubmit={submitWindow}
          isEditing={windowEditing}
        />
      )}
    </div>
  );
}
