"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Staff = {
  id: string;
  name: string;
  postcode: string;
  availableStart: string;
  availableEnd: string;
  gender?: string;
  dateOfBirth?: string; // ISO date string from Supabase
  skills?: string[];
};

export default function StaffPage() {
  const supabase = createClient();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    postcode: "",
    availableStart: "08:00",
    availableEnd: "17:00",
    gender: "",
    dateOfBirth: "",
    skills: [] as string[],
  });

  useEffect(() => {
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStaff() {
    setLoading(true);
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error loading staff", error);
      setStaff([]);
    } else {
      setStaff((data as Staff[]) || []);
    }

    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({
      name: "",
      postcode: "",
      availableStart: "08:00",
      availableEnd: "17:00",
      gender: "",
      dateOfBirth: "",
      skills: [],
    });
    setModalOpen(true);
  }

  function openEdit(s: Staff) {
    setEditing(s.id);
    setForm({
      name: s.name,
      postcode: s.postcode,
      availableStart: s.availableStart,
      availableEnd: s.availableEnd,
      gender: s.gender ?? "",
      dateOfBirth: s.dateOfBirth ?? "",
      skills: s.skills ?? [],
    });
    setModalOpen(true);
  }

  async function saveStaff() {
    const payload = {
      name: form.name,
      postcode: form.postcode,
      availableStart: form.availableStart,
      availableEnd: form.availableEnd,
      gender: form.gender || null,
      dateOfBirth: form.dateOfBirth || null,
      skills: form.skills.length ? form.skills : null,
    };

    if (editing) {
      await supabase.from("staff").update(payload).eq("id", editing);
    } else {
      await supabase.from("staff").insert(payload);
    }

    setModalOpen(false);
    await loadStaff();
  }

  async function deleteStaff(id: string) {
    await supabase.from("staff").delete().eq("id", id);
    await loadStaff();
  }

  function getAge(dob?: string) {
    if (!dob) return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Staff</h1>

      <button
        onClick={openAdd}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Add Staff
      </button>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="w-full border mt-4 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Postcode</th>
              <th className="p-2 border">Availability</th>
              <th className="p-2 border">Profile</th>
              <th className="p-2 border">Skills</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id}>
                <td className="p-2 border">{s.name}</td>
                <td className="p-2 border">{s.postcode}</td>
                <td className="p-2 border">
                  {s.availableStart} – {s.availableEnd}
                </td>
                <td className="p-2 border">
                  <div className="text-xs text-gray-700">
                    {s.gender && <span>{s.gender}</span>}
                    {s.gender && getAge(s.dateOfBirth) && <span>, </span>}
                    {getAge(s.dateOfBirth) && (
                      <span>{getAge(s.dateOfBirth)} yrs</span>
                    )}
                  </div>
                  {s.dateOfBirth && (
                    <div className="text-[10px] text-gray-400">
                      DOB: {s.dateOfBirth}
                    </div>
                  )}
                </td>
                <td className="p-2 border">
                  {s.skills?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {s.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No skills set</span>
                  )}
                </td>
                <td className="p-2 border space-x-2">
                  <button
                    onClick={() => openEdit(s)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteStaff(s.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4">
            <h2 className="text-xl font-semibold">
              {editing ? "Edit Staff" : "Add Staff"}
            </h2>

            <input
              className="w-full border p-2 text-sm"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="w-full border p-2 text-sm"
              placeholder="Postcode"
              value={form.postcode}
              onChange={(e) =>
                setForm({ ...form, postcode: e.target.value.toUpperCase() })
              }
            />

            <div className="flex gap-2">
              <input
                type="time"
                className="border p-2 w-full text-sm"
                value={form.availableStart}
                onChange={(e) =>
                  setForm({ ...form, availableStart: e.target.value })
                }
              />
              <input
                type="time"
                className="border p-2 w-full text-sm"
                value={form.availableEnd}
                onChange={(e) =>
                  setForm({ ...form, availableEnd: e.target.value })
                }
              />
            </div>

            <select
              className="w-full border p-2 text-sm"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">Gender (optional)</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="nonbinary">Non‑binary</option>
              <option value="other">Other</option>
            </select>

            <input
              type="date"
              className="w-full border p-2 text-sm"
              value={form.dateOfBirth}
              onChange={(e) =>
                setForm({ ...form, dateOfBirth: e.target.value })
              }
            />

            <input
              className="w-full border p-2 text-sm"
              placeholder="Skills (comma separated: e.g. first aid, manual handling)"
              value={form.skills.join(", ")}
              onChange={(e) =>
                setForm({
                  ...form,
                  skills: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1 bg-gray-300 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveStaff}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
