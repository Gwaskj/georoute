"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Appointment = {
  id: string;
  name: string;
  postcode: string;
  earliestStart: string;
  latestEnd: string;
  duration: number;
  requiredStaff: number;
};

export default function AppointmentsPage() {
  const supabase = createClient();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    postcode: "",
    earliestStart: "09:00",
    latestEnd: "17:00",
    duration: 30,
    requiredStaff: 1,
  });

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .order("earliestStart");
    setAppointments((data as Appointment[]) || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({
      name: "",
      postcode: "",
      earliestStart: "09:00",
      latestEnd: "17:00",
      duration: 30,
      requiredStaff: 1,
    });
    setModalOpen(true);
  }

  function openEdit(a: Appointment) {
    setEditing(a.id);
    setForm({
      name: a.name,
      postcode: a.postcode,
      earliestStart: a.earliestStart,
      latestEnd: a.latestEnd,
      duration: a.duration,
      requiredStaff: a.requiredStaff,
    });
    setModalOpen(true);
  }

  async function saveAppointment() {
    if (editing) {
      await supabase.from("appointments").update(form).eq("id", editing);
    } else {
      await supabase.from("appointments").insert(form);
    }
    setModalOpen(false);
    loadAppointments();
  }

  async function deleteAppointment(id: string) {
    await supabase.from("appointments").delete().eq("id", id);
    loadAppointments();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Appointments</h1>

      <button
        onClick={openAdd}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Add Appointment
      </button>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="w-full border mt-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Postcode</th>
              <th className="p-2 border">Window</th>
              <th className="p-2 border">Duration</th>
              <th className="p-2 border">Staff Needed</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td className="p-2 border">{a.name}</td>
                <td className="p-2 border">{a.postcode}</td>
                <td className="p-2 border">
                  {a.earliestStart} – {a.latestEnd}
                </td>
                <td className="p-2 border">{a.duration} min</td>
                <td className="p-2 border">{a.requiredStaff}</td>
                <td className="p-2 border space-x-2">
                  <button
                    onClick={() => openEdit(a)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAppointment(a.id)}
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
          <div className="bg-white p-6 rounded shadow-lg w-96 space-y-4">
            <h2 className="text-xl font-semibold">
              {editing ? "Edit Appointment" : "Add Appointment"}
            </h2>

            <input
              className="w-full border p-2"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="w-full border p-2"
              placeholder="Postcode"
              value={form.postcode}
              onChange={(e) => setForm({ ...form, postcode: e.target.value })}
            />

            <div className="flex gap-2">
              <input
                type="time"
                className="border p-2 w-full"
                value={form.earliestStart}
                onChange={(e) =>
                  setForm({ ...form, earliestStart: e.target.value })
                }
              />
              <input
                type="time"
                className="border p-2 w-full"
                value={form.latestEnd}
                onChange={(e) =>
                  setForm({ ...form, latestEnd: e.target.value })
                }
              />
            </div>

            <input
              type="number"
              className="w-full border p-2"
              placeholder="Duration (min)"
              value={form.duration}
              onChange={(e) =>
                setForm({ ...form, duration: Number(e.target.value) })
              }
            />

            <input
              type="number"
              className="w-full border p-2"
              placeholder="Required Staff"
              value={form.requiredStaff}
              onChange={(e) =>
                setForm({ ...form, requiredStaff: Number(e.target.value) })
              }
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveAppointment}
                className="px-3 py-1 bg-blue-600 text-white rounded"
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
