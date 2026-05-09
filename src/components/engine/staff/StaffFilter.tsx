"use client";

import { useMemo, useState } from "react";
import { useSkillsStore, Skill } from "@/store/skillsStore";
import { useStaffStore, Staff } from "@/store/staffStore";

interface StaffFilterProps {
  onFilteredIdsChange: (ids: string[]) => void;
}

export default function StaffFilter({ onFilteredIdsChange }: StaffFilterProps) {
  const { skills } = useSkillsStore();
  const { staff } = useStaffStore();

  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [gender, setGender] = useState<string>("");
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");

  const filteredIds = useMemo(() => {
    const now = new Date();

    const calcAge = (dob: string): number | null => {
      if (!dob) return null;
      const birth = new Date(dob);
      if (Number.isNaN(birth.getTime())) return null;
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    return staff
      .filter((s: Staff) => !s.archived)
      .filter((s: Staff) => {
        if (selectedSkillIds.length > 0) {
          const hasAll = selectedSkillIds.every((id) => s.skillIds.includes(id));
          if (!hasAll) return false;
        }

        if (gender && s.gender !== gender) return false;

        const age = calcAge(s.dateOfBirth);
        const min = minAge ? parseInt(minAge, 10) : undefined;
        const max = maxAge ? parseInt(maxAge, 10) : undefined;

        if (min !== undefined && (age === null || age < min)) return false;
        if (max !== undefined && (age === null || age > max)) return false;

        return true;
      })
      .map((s: Staff) => s.id);
  }, [staff, selectedSkillIds, gender, minAge, maxAge]);

  useMemo(() => {
    onFilteredIdsChange(filteredIds);
  }, [filteredIds, onFilteredIdsChange]);

  const toggleSkill = (id: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-3 rounded border border-gray-200 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">Filter staff</span>
        <button
          type="button"
          onClick={() => {
            setSelectedSkillIds([]);
            setGender("");
            setMinAge("");
            setMaxAge("");
          }}
          className="text-xs text-blue-600 hover:underline"
        >
          Clear
        </button>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-gray-700">Skills</div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill: Skill) => {
            const active = selectedSkillIds.includes(skill.id);
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleSkill(skill.id)}
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
              No skills yet. Add some in the staff form.
            </span>
          )}
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-gray-700">Gender</div>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="">Any</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <div className="mb-1 text-xs font-medium text-gray-700">Min age</div>
          <input
            type="number"
            value={minAge}
            onChange={(e) => setMinAge(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex-1">
          <div className="mb-1 text-xs font-medium text-gray-700">Max age</div>
          <input
            type="number"
            value={maxAge}
            onChange={(e) => setMaxAge(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
