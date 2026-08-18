"use client";

import { useState, useMemo, useEffect } from "react";
import { useStaffStore, Staff, Gender, StartLocation, StaffBreak } from "@/store/staffStore";
import { useSkillsStore, Skill } from "@/store/skillsStore";
import { useSettingsStore } from "@/store/settingsStore";
import PostcodeHint from "@/components/common/PostcodeHint";
import { normalisePostcode } from "@/lib/postcode/validate";

// Shared with the postcode checker so what gets saved is the same string that
// was looked up -- "ls14dy" and "LS1 4DY" must not become two cache entries or
// two different values in the store.
function cleanPostcode(p: string) {
  return normalisePostcode(p);
}

interface AddStaffProps {
  isFree: boolean;
  triggerOnly?: boolean;
}

/** Break row while being edited. Times and length stay as strings so the
 *  inputs can be cleared without collapsing to 0. */
interface BreakFormRow {
  id: string;
  minutes: string;
  windowStart: string;
  windowEnd: string;
}

interface StaffFormState {
  id?: string;
  name: string;
  homePostcode: string;
  officePostcode: string;
  startLocation: StartLocation;
  gender: Gender | "";
  skills: string[];
  workStart: string;
  workEnd: string;
  breaks: BreakFormRow[];
}

/**
 * What the two form components below need.
 *
 * Both took `any`, which meant the form fields -- the largest surface in this
 * component and the one most likely to be edited -- were unchecked: a typo in
 * a field name compiled fine and simply stopped saving that value.
 */
interface StaffFormProps {
  form: StaffFormState;
  setForm: React.Dispatch<React.SetStateAction<StaffFormState>>;
  skills: Skill[];
  handleToggleSkill: (skillId: string) => void;
  handleAddSkillFromInput: (value: string) => void;
  errors: { home?: string; office?: string };
}

interface StaffModalProps extends StaffFormProps {
  isEditing: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const emptyForm: StaffFormState = {
  name: "",
  homePostcode: "",
  officePostcode: "",
  startLocation: "office",
  gender: "",
  skills: [],
  workStart: "",
  workEnd: "",
  breaks: [],
};

function toBreakRow(b: StaffBreak): BreakFormRow {
  return {
    id: b.id,
    minutes: String(b.minutes),
    windowStart: b.windowStart ?? "",
    windowEnd: b.windowEnd ?? "",
  };
}

export default function AddStaff({ isFree, triggerOnly }: AddStaffProps) {
  const {
    staff,
    addStaff,
    updateStaff,
    deleteStaff,
    selectedStaffIds,
  } = useStaffStore();

  const { skills, addSkill } = useSkillsStore();

  const globalOfficePostcode = useSettingsStore((s) => s.settings.officePostcode);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<StaffFormState>({
    ...emptyForm,
    officePostcode: globalOfficePostcode,
  });
  const [isEditing, setIsEditing] = useState(false);

  const [errors, setErrors] = useState<{ home?: string; office?: string }>({});

  // Edit mode listener
  useEffect(() => {
    // Dispatched by the staff list to open this modal in edit mode. A
    // CustomEvent rather than a prop because the list and this component have
    // no common parent to hold the state.
    const handler = (e: Event) => {
      const { id } = (e as CustomEvent<{ id: string }>).detail;
      const s = staff.find((x) => x.id === id);
      if (!s) return;

      setIsEditing(true);
      setForm({
        id: s.id,
        name: s.name,
        homePostcode: s.homePostcode,
        officePostcode: s.officePostcode,
        startLocation: s.startLocation ?? "office",
        gender: s.gender,
        skills: [...s.skills],
        workStart: s.workStart ?? "",
        workEnd: s.workEnd ?? "",
        breaks: (s.breaks ?? []).map(toBreakRow),
      });
      setErrors({});
      setIsModalOpen(true);
    };

    document.addEventListener("georoute-edit-staff", handler);
    return () => document.removeEventListener("georoute-edit-staff", handler);
  }, [staff]);

  const canAddMore = useMemo(() => {
    if (!isFree) return true;
    return staff.length < 2;
  }, [isFree, staff]);

  const openAddModal = () => {
    setIsEditing(false);
    setForm({ ...emptyForm, officePostcode: globalOfficePostcode });
    setErrors({});
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
      gender: s.gender,
      skills: [...s.skills],
      workStart: s.workStart ?? "",
      workEnd: s.workEnd ?? "",
      breaks: (s.breaks ?? []).map(toBreakRow),
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    const normalisedHome = cleanPostcode(form.homePostcode);
    const normalisedOffice = form.officePostcode.trim()
      ? cleanPostcode(form.officePostcode)
      : globalOfficePostcode;

    // Rows with no usable length are dropped rather than stored as zero-minute
    // breaks the scheduler would silently ignore.
    const breaksValue: StaffBreak[] = form.breaks
      .map((row) => ({
        id: row.id,
        minutes: parseInt(row.minutes, 10),
        windowStart: row.windowStart || undefined,
        windowEnd: row.windowEnd || undefined,
      }))
      .filter((b) => Number.isFinite(b.minutes) && b.minutes > 0);

    if (isEditing && form.id) {
      updateStaff(form.id, {
        name: form.name.trim(),
        homePostcode: normalisedHome,
        officePostcode: normalisedOffice,
        startLocation: form.startLocation,
        gender: form.gender,
        skills: form.skills,
        workStart: form.workStart || undefined,
        workEnd: form.workEnd || undefined,
        breaks: breaksValue,
      });
    } else {
      if (!canAddMore) return;
      addStaff({
        name: form.name.trim(),
        homePostcode: normalisedHome,
        officePostcode: normalisedOffice,
        startLocation: form.startLocation,
        gender: form.gender,
        skills: form.skills,
        workStart: form.workStart || undefined,
        workEnd: form.workEnd || undefined,
        breaks: breaksValue,
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

  const activeStaff = staff;

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
            errors={errors}
          />
        )}
      </>
    );
  }

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
          return (
            <li
              key={s.id}
              className="flex items-center justify-between rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <span className="font-medium text-slate-100">{s.name}</span>
              <div className="flex items-center gap-2 text-xs text-slate-400">
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
                  onClick={() => deleteStaff(s.id)}
                  className="rounded border border-red-600 px-2 py-0.5 text-red-400 hover:bg-red-950"
                >
                  Delete
                </button>
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
          errors={errors}
        />
      )}
    </div>
  );
}

function StaffModalUI({
  isEditing,
  form,
  setForm,
  skills,
  handleToggleSkill,
  handleAddSkillFromInput,
  onClose,
  onSubmit,
  errors,
}: StaffModalProps) {
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
            errors={errors}
          />
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

function StaffForm({
  form,
  setForm,
  skills,
  handleToggleSkill,
  handleAddSkillFromInput,
  errors,
}: StaffFormProps) {
  return (
    <>
      <div>
        <label className="mb-1 block font-medium text-slate-200">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
        />
      </div>

      <div>
        <label className="mb-1 block font-medium text-slate-200">Home postcode</label>
        <input
          type="text"
          value={form.homePostcode}
          onChange={(e) =>
            setForm((f) => ({ ...f, homePostcode: e.target.value }))
          }
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
        />
        {errors.home ? (
          <p className="text-xs text-red-400 mt-1">{errors.home}</p>
        ) : (
          // Suppressed while a hard validation error is showing -- two lines of
          // feedback under one field contradict each other more often than they
          // help.
          <PostcodeHint value={form.homePostcode} />
        )}
      </div>

      <div>
        <label className="mb-1 block font-medium text-slate-200">Office postcode</label>
        <input
          type="text"
          value={form.officePostcode}
          onChange={(e) =>
            setForm((f) => ({ ...f, officePostcode: e.target.value }))
          }
          placeholder="Leave blank to use global office postcode"
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
        />
        {errors.office ? (
          <p className="text-xs text-red-400 mt-1">{errors.office}</p>
        ) : (
          <PostcodeHint value={form.officePostcode} />
        )}
      </div>

      <div>
        <label className="mb-1 block font-medium text-slate-200">Starts day from</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-slate-300">
            <input
              type="radio"
              name="startLocation"
              checked={form.startLocation === "home"}
              onChange={() => setForm((f) => ({ ...f, startLocation: "home" }))}
            />
            Home
          </label>
          <label className="flex items-center gap-1.5 text-slate-300">
            <input
              type="radio"
              name="startLocation"
              checked={form.startLocation !== "home"}
              onChange={() => setForm((f) => ({ ...f, startLocation: "office" }))}
            />
            Office
          </label>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Used to work out their first/last travel leg of the day.
        </p>
      </div>


      <div>
        <label className="mb-1 block font-medium text-slate-200">Gender</label>
        <select
          value={form.gender}
          onChange={(e) =>
            setForm((f) => ({
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
        <label className="mb-1 block font-medium text-slate-200">Working hours</label>
        <p className="mb-2 text-xs text-slate-400">Leave blank to use the global day start/end from settings.</p>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={form.workStart}
            onChange={(e) => setForm((f) => ({ ...f, workStart: e.target.value }))}
            className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          />
          <span className="text-slate-400">to</span>
          <input
            type="time"
            value={form.workEnd}
            onChange={(e) => setForm((f) => ({ ...f, workEnd: e.target.value }))}
            className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-medium text-slate-200">Breaks</label>
        <p className="mb-2 text-xs text-slate-400">
          Unpaid breaks such as lunch. Nothing is scheduled during them. Leave
          the window blank to let a break fall anywhere in the working day.
        </p>

        <div className="space-y-2">
          {form.breaks.map((row: BreakFormRow, i: number) => {
            const update = (patch: Partial<BreakFormRow>) =>
              setForm((f) => ({
                ...f,
                breaks: f.breaks.map((r: BreakFormRow) =>
                  r.id === row.id ? { ...r, ...patch } : r
                ),
              }));

            return (
              <div
                key={row.id}
                className="rounded border border-slate-700 bg-slate-900/60 px-2 py-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    step={5}
                    aria-label={`Break ${i + 1} length in minutes`}
                    placeholder="30"
                    value={row.minutes}
                    onChange={(e) => update({ minutes: e.target.value })}
                    className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
                  />
                  <span className="text-xs text-slate-400">min, between</span>
                  <input
                    type="time"
                    aria-label={`Break ${i + 1} earliest start`}
                    value={row.windowStart}
                    onChange={(e) => update({ windowStart: e.target.value })}
                    className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
                  />
                  <span className="text-xs text-slate-400">and</span>
                  <input
                    type="time"
                    aria-label={`Break ${i + 1} latest end`}
                    value={row.windowEnd}
                    onChange={(e) => update({ windowEnd: e.target.value })}
                    className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
                  />
                  <button
                    type="button"
                    aria-label={`Remove break ${i + 1}`}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        breaks: f.breaks.filter((r: BreakFormRow) => r.id !== row.id),
                      }))
                    }
                    className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:border-red-500/60 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() =>
            setForm((f) => ({
              ...f,
              breaks: [
                ...f.breaks,
                { id: crypto.randomUUID(), minutes: "30", windowStart: "", windowEnd: "" },
              ],
            }))
          }
          className="mt-2 rounded border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
        >
          + Add break
        </button>
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
