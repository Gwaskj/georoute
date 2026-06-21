"use client";

import { useEffect, useState, useMemo } from "react";
import { useStaffStore, Staff, Gender, StartLocation } from "@/store/staffStore";
import { useSkillsStore, Skill } from "@/store/skillsStore";
import { useSettingsStore } from "@/store/settingsStore";
import { supabase } from "@/lib/supabase/client";

function cleanPostcode(p: string) {
  return p.trim().toUpperCase();
}

function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

interface StaffFormState {
  id?: string;
  name: string;
  homePostcode: string;
  officePostcode: string;
  startLocation: StartLocation;
  dateOfBirth: string;
  gender: Gender | "";
  skills: string[];
}

const emptyForm: StaffFormState = {
  name: "",
  homePostcode: "",
  officePostcode: "",
  startLocation: "office",
  dateOfBirth: "",
  gender: "",
  skills: [],
};

export default function StaffPage() {
  const {
    staff,
    addStaff,
    updateStaff,
    deleteStaff,
    selectedStaffIds,
    setSelectedStaffIds,
    loadFromSupabase,
  } = useStaffStore();

  const { skills, addSkill } = useSkillsStore();
  const globalOfficePostcode = useSettingsStore((s) => s.settings.officePostcode);
  const loadGlobalSettings = useSettingsStore((s) => s.loadSettings);

  const [isFree, setIsFree] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<StaffFormState>({ ...emptyForm });
  const [skillInput, setSkillInput] = useState("");

  // Auth check
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
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
      loadGlobalSettings(!data?.is_pro);

      // If pro, load from Supabase
      if (data?.is_pro) {
        loadFromSupabase();
      }
    }
    check();
  }, [loadFromSupabase, loadGlobalSettings]);

  const canAddMore = useMemo(() => {
    if (!isFree) return true;
    return staff.length < 2;
  }, [isFree, staff]);

  const openAddModal = () => {
    setIsEditing(false);
    setForm({ ...emptyForm, officePostcode: globalOfficePostcode });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Staff) => {
    setIsEditing(true);
    setForm({
      id: s.id,
      name: s.name,
      homePostcode: s.homePostcode,
      officePostcode: s.officePostcode,
      startLocation: s.startLocation ?? "office",
      dateOfBirth: s.dateOfBirth,
      gender: s.gender,
      skills: [...s.skills],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    const normalisedHome = cleanPostcode(form.homePostcode);
    const normalisedOffice = form.officePostcode.trim()
      ? cleanPostcode(form.officePostcode)
      : globalOfficePostcode;

    if (isEditing && form.id) {
      updateStaff(form.id, {
        name: form.name.trim(),
        homePostcode: normalisedHome,
        officePostcode: normalisedOffice,
        startLocation: form.startLocation,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        skills: form.skills,
      });
    } else {
      if (!canAddMore) return;
      addStaff({
        name: form.name.trim(),
        homePostcode: normalisedHome,
        officePostcode: normalisedOffice,
        startLocation: form.startLocation,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        skills: form.skills,
      });
    }

    setIsModalOpen(false);
  };

  const handleToggleSkill = (skillId: string) => {
    setForm((prev) => {
      const exists = prev.skills.includes(skillId);
      return {
        ...prev,
        skills: exists
          ? prev.skills.filter((id) => id !== skillId)
          : [...prev.skills, skillId],
      };
    });
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    addSkill(trimmed);
    setSkillInput("");
  };

  if (authChecking) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Staff</h1>
            <p className="text-sm text-slate-400 mt-1">
              {isFree
                ? `${staff.length}/2 staff members used (free tier)`
                : `${staff.length} staff members`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isFree && (
              <span className="rounded-full border border-amber-500/40 bg-amber-950/30 px-3 py-1 text-xs text-amber-300">
                Free tier · Max 2
              </span>
            )}

            <button
              type="button"
              onClick={openAddModal}
              disabled={!canAddMore}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              {canAddMore ? "Add staff" : "Max staff reached"}
            </button>
          </div>
        </div>

        {/* Skills management */}
        <div className="mb-6 rounded border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-200">Skills</h2>
          <div className="mb-2 flex flex-wrap gap-2">
            {skills.length === 0 && (
              <span className="text-xs text-slate-500">No skills yet.</span>
            )}
            {skills.map((skill: Skill) => (
              <span
                key={skill.id}
                className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
              >
                {skill.name}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Add a skill…"
              className="flex-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100 outline-none focus:border-teal-400"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="rounded bg-teal-600 px-3 py-1 text-xs font-medium text-white hover:bg-teal-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* Staff list */}
        {staff.length === 0 ? (
          <div className="rounded border border-slate-800 bg-slate-900 p-8 text-center">
            <p className="text-slate-400">No staff added yet.</p>
            <p className="mt-1 text-xs text-slate-500">
              {isFree
                ? "Free tier allows up to 2 staff members saved in your browser."
                : 'Click "Add staff" to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {staff.map((s: Staff) => {
              const age = calculateAge(s.dateOfBirth);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded border border-slate-800 bg-slate-900 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block h-4 w-4 rounded-full"
                      style={{ backgroundColor: s.colour }}
                    />
                    <div>
                      <span className="font-medium text-slate-100">
                        {s.name}
                      </span>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
                        {s.gender && <span>{s.gender}</span>}
                        {age !== null && <span>{age} yrs</span>}
                        {s.homePostcode && <span>Home: {s.homePostcode}</span>}
                        {s.officePostcode && (
                          <span>Office: {s.officePostcode}</span>
                        )}
                        <span>
                          Starts from: {s.startLocation === "home" ? "Home" : "Office"}
                        </span>
                        {s.skills.length > 0 && (
                          <span>Skills: {s.skills.length}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(s)}
                      className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStaff(s.id)}
                      className="rounded border border-red-700 px-2 py-1 text-xs text-red-400 hover:bg-red-950"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
                <h3 className="text-base font-semibold text-slate-100">
                  {isEditing ? "Edit staff" : "Add staff"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-xl text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 px-4 py-4 text-sm">
                <div>
                  <label className="mb-1 block font-medium text-slate-200">
                    Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f: any) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-slate-200">
                    Home postcode{" "}
                    <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.homePostcode}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        homePostcode: e.target.value,
                      }))
                    }
                    placeholder="e.g. SW1A 1AA"
                    className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-slate-200">
                    Office postcode{" "}
                    <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.officePostcode}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        officePostcode: e.target.value,
                      }))
                    }
                    placeholder="Leave blank to use global office postcode"
                    className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-slate-200">
                    Starts day from
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-slate-300">
                      <input
                        type="radio"
                        name="startLocation"
                        checked={form.startLocation === "home"}
                        onChange={() =>
                          setForm((f: any) => ({ ...f, startLocation: "home" }))
                        }
                      />
                      Home
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-300">
                      <input
                        type="radio"
                        name="startLocation"
                        checked={form.startLocation !== "home"}
                        onChange={() =>
                          setForm((f: any) => ({ ...f, startLocation: "office" }))
                        }
                      />
                      Office
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-medium text-slate-200">
                    Date of birth{" "}
                    <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        dateOfBirth: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-slate-200">
                    Gender{" "}
                    <span className="text-slate-500">(optional)</span>
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        gender: e.target.value as Gender | "",
                      }))
                    }
                    className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-medium text-slate-200">
                    Skills
                  </label>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {skills.map((skill: Skill) => {
                      const active = form.skills.includes(skill.id);
                      return (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => handleToggleSkill(skill.id)}
                          className={`rounded border px-2 py-0.5 text-xs ${
                            active
                              ? "border-blue-500 bg-blue-900 text-blue-300"
                              : "border-slate-600 text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          {skill.name}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder="Type a skill and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const target = e.target as HTMLInputElement;
                        const trimmed = target.value.trim();
                        if (trimmed) {
                          addSkill(trimmed);
                          const skill = skills.find(
                            (s) =>
                              s.name.toLowerCase() === trimmed.toLowerCase()
                          ) ?? { id: crypto.randomUUID(), name: trimmed };
                          if (!form.skills.includes(skill.id)) {
                            setForm((f: any) => ({
                              ...f,
                              skills: [...f.skills, skill.id],
                            }));
                          }
                          target.value = "";
                        }
                      }
                    }}
                    className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-700 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {isEditing ? "Save" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}