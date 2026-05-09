"use client";

import { useState, useMemo } from "react";
import { useStaffStore, Staff, Gender } from "@/store/staffStore";
import { useSkillsStore, Skill } from "@/store/skillsStore";
import { useOfficePostcodeStore } from "@/store/officePostcodeStore";

interface AddStaffProps {
  isFree: boolean;
}

interface StaffFormState {
  id?: string;
  name: string;
  homePostcode: string;
  officePostcode: string;
  dateOfBirth: string;
  gender: Gender | "";
  skillIds: string[];
}

const emptyForm: StaffFormState = {
  name: "",
  homePostcode: "",
  officePostcode: "",
  dateOfBirth: "",
  gender: "",
  skillIds: [],
};

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

export default function AddStaff({ isFree }: AddStaffProps) {
  const {
    staff,
    addStaff,
    updateStaff,
    duplicateStaff,
    deleteStaff,
    archiveStaff,
  } = useStaffStore();

  const { skills, addSkill } = useSkillsStore();
  const { officePostcode, setOfficePostcode } = useOfficePostcodeStore();

  const isPro = !isFree;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<StaffFormState>({
    ...emptyForm,
    officePostcode,
  });
  const [isEditing, setIsEditing] = useState(false);

  const canAddMore = useMemo(() => {
    if (!isFree) return true;
    return staff.filter((s: Staff) => !s.archived).length < 2;
  }, [isFree, staff]);

  const openAddModal = () => {
    setIsEditing(false);
    setForm({ ...emptyForm, officePostcode });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Staff) => {
    setIsEditing(true);
    setForm({
      id: s.id,
      name: s.name,
      homePostcode: s.homePostcode,
      officePostcode: s.officePostcode,
      dateOfBirth: s.dateOfBirth,
      gender: s.gender,
      skillIds: s.skillIds,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    // office postcode persistence
    setOfficePostcode(form.officePostcode);

    if (isEditing && form.id) {
      updateStaff(form.id, {
        name: form.name.trim(),
        homePostcode: form.homePostcode.trim(),
        officePostcode: form.officePostcode.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        skillIds: form.skillIds,
      });
    } else {
      if (!canAddMore) return;
      addStaff({
        name: form.name.trim(),
        homePostcode: form.homePostcode.trim(),
        officePostcode: form.officePostcode.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        skillIds: form.skillIds,
      });
    }

    setIsModalOpen(false);
    setForm({ ...emptyForm, officePostcode: form.officePostcode });
  };

  const handleToggleSkill = (skillId: string) => {
    setForm((prev) => {
      const exists = prev.skillIds.includes(skillId);
      return {
        ...prev,
        skillIds: exists
          ? prev.skillIds.filter((id) => id !== skillId)
          : [...prev.skillIds, skillId],
      };
    });
  };

  const handleAddSkillFromInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const skill = addSkill(trimmed);
    setForm((prev) => ({
      ...prev,
      skillIds: prev.skillIds.includes(skill.id)
        ? prev.skillIds
        : [...prev.skillIds, skill.id],
    }));
  };

  const activeStaff = staff.filter((s: Staff) => !s.archived);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Staff</h2>
        <button
          type="button"
          onClick={openAddModal}
          disabled={!canAddMore}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {canAddMore ? "Add staff" : "Max staff reached (Free: 2)"}
        </button>
      </div>

      {activeStaff.length === 0 && (
        <p className="text-sm text-gray-500">No staff added yet.</p>
      )}

      <ul className="space-y-2">
        {activeStaff.map((s: Staff) => {
          const age = calculateAge(s.dateOfBirth);
          return (
            <li
              key={s.id}
              className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-sm"
            >
              <span className="font-medium">{s.name}</span>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {age !== null && <span>{age} yrs</span>}
                {s.gender && <span>{s.gender}</span>}

                <button
                  type="button"
                  onClick={() => openEditModal(s)}
                  className="rounded border border-gray-300 px-2 py-0.5 text-xs hover:bg-gray-50"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => duplicateStaff(s.id)}
                  className="rounded border border-gray-300 px-2 py-0.5 text-xs hover:bg-gray-50"
                >
                  Duplicate
                </button>

                <button
                  type="button"
                  onClick={() => deleteStaff(s.id)}
                  className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>

                {!isFree && (
                  <button
                    type="button"
                    onClick={() => archiveStaff(s.id)}
                    className="rounded border border-yellow-300 px-2 py-0.5 text-xs text-yellow-700 hover:bg-yellow-50"
                  >
                    Archive
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded bg-white p-4 shadow-lg">
            <h3 className="mb-3 text-base font-semibold">
              {isEditing ? "Edit staff" : "Add staff"}
            </h3>

            <div className="space-y-3 text-sm">
              {/* NAME */}
              <div>
                <label className="mb-1 block font-medium">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </div>

              {/* HOME POSTCODE */}
              <div>
                <label className="mb-1 block font-medium">Home postcode</label>
                <input
                  type="text"
                  value={form.homePostcode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, homePostcode: e.target.value }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </div>

              {/* OFFICE POSTCODE */}
              <div>
                <label className="mb-1 block font-medium">Office postcode</label>
                <input
                  type="text"
                  value={form.officePostcode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, officePostcode: e.target.value }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </div>

              {/* DOB */}
              <div>
                <label className="mb-1 block font-medium">Date of birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dateOfBirth: e.target.value }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </div>

              {/* GENDER */}
              <div>
                <label className="mb-1 block font-medium">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      gender: e.target.value as Gender | "",
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* SKILLS */}
              <div>
                <label className="mb-1 block font-medium">Skills</label>

                <div className="mb-2 flex flex-wrap gap-2">
                  {skills.map((skill: Skill) => {
                    const active = form.skillIds.includes(skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => handleToggleSkill(skill.id)}
                        className={`rounded border px-2 py-0.5 text-xs ${
                          active
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {skill.name}
                      </button>
                    );
                  })}

                  {skills.length === 0 && (
                    <span className="text-xs text-gray-400">
                      No skills yet. Add one below.
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Type a skill and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const target = e.target as HTMLInputElement;
                      handleAddSkillFromInput(target.value);
                      target.value = "";
                    }
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
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
  );
}

