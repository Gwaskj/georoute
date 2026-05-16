"use client";

import { useState, useMemo } from "react";
import { useStaffStore, Staff, Gender } from "@/store/staffStore";
import { useSkillsStore, Skill } from "@/store/skillsStore";
import { useOfficePostcodeStore } from "@/store/officePostcodeStore";

interface AddStaffProps {
  isFree: boolean;
  triggerOnly?: boolean;
}

interface StaffFormState {
  id?: string;
  name: string;
  homePostcode: string;
  officePostcode: string;
  dateOfBirth: string;
  gender: Gender | "";
  skills: string[];
}

const emptyForm: StaffFormState = {
  name: "",
  homePostcode: "",
  officePostcode: "",
  dateOfBirth: "",
  gender: "",
  skills: [],
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

export default function AddStaff({ isFree, triggerOnly }: AddStaffProps) {
  const {
    staff,
    addStaff,
    updateStaff,
    duplicateStaff,
    deleteStaff,
    archiveStaff,
    selectedStaffIds,
  } = useStaffStore();

  const { skills, addSkill } = useSkillsStore();
  const { officePostcode: globalOfficePostcode, setOfficePostcode } =
    useOfficePostcodeStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<StaffFormState>({
    ...emptyForm,
    officePostcode: globalOfficePostcode, // ⭐ NEW: default to global
  });
  const [isEditing, setIsEditing] = useState(false);

  const canAddMore = useMemo(() => {
    if (!isFree) return true;
    return staff.filter((s: Staff) => !s.archived).length < 2;
  }, [isFree, staff]);

  const openAddModal = () => {
    setIsEditing(false);
    setForm({ ...emptyForm, officePostcode: globalOfficePostcode }); // ⭐ NEW
    setIsModalOpen(true);
  };

  const openEditModal = (s: Staff) => {
    setIsEditing(true);
    setForm({
      id: s.id,
      name: s.name,
      homePostcode: s.homePostcode,
      officePostcode: s.officePostcode || "", // ⭐ NEW: allow blank to inherit
      dateOfBirth: s.dateOfBirth,
      gender: s.gender,
      skills: s.skills,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    // ⭐ NEW: Save global office postcode if user typed into the field
    setOfficePostcode(form.officePostcode.trim());

    const finalOfficePostcode =
      form.officePostcode.trim() || globalOfficePostcode || ""; // ⭐ NEW inheritance

    if (isEditing && form.id) {
      updateStaff(form.id, {
        name: form.name.trim(),
        homePostcode: form.homePostcode.trim(),
        officePostcode: finalOfficePostcode,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        skills: form.skills,
      });
    } else {
      if (!canAddMore) return;
      addStaff({
        name: form.name.trim(),
        homePostcode: form.homePostcode.trim(),
        officePostcode: finalOfficePostcode,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        skills: form.skills,
      });
    }

    setIsModalOpen(false);
    setForm({ ...emptyForm, officePostcode: globalOfficePostcode }); // ⭐ NEW
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

  const handleAddSkillFromInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const skill = addSkill(trimmed);
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill.id)
        ? prev.skills
        : [...prev.skills, skill.id],
    }));
  };

  const activeStaff = staff.filter((s: Staff) => !s.archived);

  // -------------------------
  // TRIGGER-ONLY MODE
  // -------------------------
  if (triggerOnly) {
    return (
      <>
        <button
          type="button"
          onClick={openAddModal}
          disabled={!canAddMore}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:bg-gray-500"
        >
          {canAddMore ? "Add staff" : "Max staff reached"}
        </button>

        {isModalOpen && (
          <StaffModalUI
            isEditing={isEditing}
            form={form}
            setForm={setForm}
            skills={skills}
            handleToggleSkill={handleToggleSkill}
            handleAddSkillFromInput={handleAddSkillFromInput}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmit}
            globalOfficePostcode={globalOfficePostcode} // ⭐ NEW
          />
        )}
      </>
    );
  }

  // -------------------------
  // FULL STAFF LIST MODE
  // -------------------------
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-200">
          Staff <span className="text-slate-500">(Selected: {selectedStaffIds.length})</span>
        </h2>

        <button
          type="button"
          onClick={openAddModal}
          disabled={!canAddMore}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:bg-gray-500"
        >
          {canAddMore ? "Add staff" : "Max staff reached"}
        </button>
      </div>

      {activeStaff.length === 0 && (
        <p className="text-sm text-slate-400">No staff added yet.</p>
      )}

      <ul className="space-y-2">
        {activeStaff.map((s: Staff) => {
          const age = calculateAge(s.dateOfBirth);
          return (
            <li
              key={s.id}
              className="flex items-center justify-between rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <span className="font-medium text-slate-100">{s.name}</span>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {age !== null && <span>{age} yrs</span>}
                {s.gender && <span>{s.gender}</span>}

                <button
                  type="button"
                  onClick={() => openEditModal(s)}
                  className="rounded border border-slate-600 px-2 py-0.5 hover:bg-slate-800"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => duplicateStaff(s.id)}
                  className="rounded border border-slate-600 px-2 py-0.5 hover:bg-slate-800"
                >
                  Duplicate
                </button>

                <button
                  type="button"
                  onClick={() => deleteStaff(s.id)}
                  className="rounded border border-red-600 px-2 py-0.5 text-red-400 hover:bg-red-950"
                >
                  Delete
                </button>

                {!isFree && (
                  <button
                    type="button"
                    onClick={() => archiveStaff(s.id)}
                    className="rounded border border-yellow-600 px-2 py-0.5 text-yellow-400 hover:bg-yellow-950"
                  >
                    Archive
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {isModalOpen && (
        <StaffModalUI
          isEditing={isEditing}
          form={form}
          setForm={setForm}
          skills={skills}
          handleToggleSkill={handleToggleSkill}
          handleAddSkillFromInput={handleAddSkillFromInput}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          globalOfficePostcode={globalOfficePostcode} // ⭐ NEW
        />
      )}
    </div>
  );
}

// ------------------------------------------------------
// ⭐ Extracted modal UI with global postcode hint support
// ------------------------------------------------------
function StaffModalUI({
  isEditing,
  form,
  setForm,
  skills,
  handleToggleSkill,
  handleAddSkillFromInput,
  onClose,
  onSubmit,
  globalOfficePostcode,
}: any) {
  const effectiveOfficePostcode =
    form.officePostcode.trim() || globalOfficePostcode || "";

  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-md">
        <div className="modal-header flex justify-between items-center p-4 border-b border-slate-700">
          <h3 className="text-base font-semibold text-slate-100">
            {isEditing ? "Edit staff" : "Add staff"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="modal-body p-4 space-y-4 text-sm overflow-y-auto max-h-[70vh]">
          <StaffForm
            form={form}
            setForm={setForm}
            skills={skills}
            handleToggleSkill={handleToggleSkill}
            handleAddSkillFromInput={handleAddSkillFromInput}
          />

          {/* ⭐ NEW: Global office postcode inheritance hint */}
          {globalOfficePostcode && !form.officePostcode.trim() && (
            <p className="text-xs text-blue-300">
              This staff member will use the global office postcode:{" "}
              <strong>{globalOfficePostcode}</strong>
            </p>
          )}

          {/* ⭐ NEW: Effective postcode preview */}
          <div>
            <label className="mb-1 block font-medium text-slate-200">
              Effective office postcode
            </label>
            <input
              type="text"
              disabled
              value={effectiveOfficePostcode}
              className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-300"
            />
          </div>
        </div>

        <div className="modal-footer flex justify-end gap-2 p-4 border-t border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {isEditing ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------
// StaffForm (unchanged except for inheritance support above)
// ------------------------------------------------------
function StaffForm({
  form,
  setForm,
  skills,
  handleToggleSkill,
  handleAddSkillFromInput,
}: {
  form: StaffFormState;
  setForm: any;
  skills: Skill[];
  handleToggleSkill: (id: string) => void;
  handleAddSkillFromInput: (value: string) => void;
}) {
  return (
    <>
      <div>
        <label className="mb-1 block font-medium text-slate-200">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
        />
      </div>

      <div>
        <label className="mb-1 block font-medium text-slate-200">Home postcode</label>
        <input
          type="text"
          value={form.homePostcode}
          onChange={(e) =>
            setForm((f: any) => ({ ...f, homePostcode: e.target.value }))
          }
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
        />
      </div>

      <div>
        <label className="mb-1 block font-medium text-slate-200">Office postcode</label>
        <input
          type="text"
          value={form.officePostcode}
          onChange={(e) =>
            setForm((f: any) => ({ ...f, officePostcode: e.target.value }))
          }
          placeholder="Leave blank to use global office postcode"
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
        />
      </div>

      <div>
        <label className="mb-1 block font-medium text-slate-200">Date of birth</label>
        <input
          type="date"
          value={form.dateOfBirth}
          onChange={(e) =>
            setForm((f: any) => ({ ...f, dateOfBirth: e.target.value }))
          }
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
        />
      </div>

      <div>
        <label className="mb-1 block font-medium text-slate-200">Gender</label>
        <select
          value={form.gender}
          onChange={(e) =>
            setForm((f: any) => ({
              ...f,
              gender: e.target.value as Gender | "",
            }))
          }
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
        >
          <option value="">Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block font-medium text-slate-200">Skills</label>

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

          {skills.length === 0 && (
            <span className="text-xs text-slate-500">
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
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
        />
      </div>
    </>
  );
}
