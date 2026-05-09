"use client";

import { useState } from "react";
import {
  useCallPurposeStore,
  CallPurpose,
} from "@/store/callPurposeStore";

interface CallPurposeManagerProps {
  isFree: boolean;
}

interface PurposeFormState {
  id?: string;
  name: string;
  start: string;
  end: string;
}

const emptyForm: PurposeFormState = {
  name: "",
  start: "08:00",
  end: "10:00",
};

export default function CallPurposeManager({ isFree }: CallPurposeManagerProps) {
  const { purposes, addPurpose, updatePurpose, deletePurpose } =
    useCallPurposeStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<PurposeFormState>(emptyForm);

  const openAddModal = () => {
    setIsEditing(false);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (p: CallPurpose) => {
    setIsEditing(true);
    setForm({
      id: p.id,
      name: p.name,
      start: p.start,
      end: p.end,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    if (isEditing && form.id) {
      updatePurpose(form.id, {
        name: form.name.trim(),
        start: form.start,
        end: form.end,
      });
    } else {
      addPurpose({
        name: form.name.trim(),
        start: form.start,
        end: form.end,
      });
    }

    setIsModalOpen(false);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-3 rounded border border-gray-200 p-3 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Call purposes</h3>
        <button
          type="button"
          onClick={openAddModal}
          className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
        >
          Add purpose
        </button>
      </div>

      {purposes.length === 0 && (
        <p className="text-xs text-gray-500">
          No purposes yet. Add Breakfast, Lunch, Tea, etc.
        </p>
      )}

      <ul className="space-y-1 text-xs">
        {purposes.map((p: CallPurpose) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded border border-gray-200 px-2 py-1"
          >
            <div className="flex flex-col">
              <span className="font-medium">{p.name}</span>
              <span className="text-gray-500">
                {p.start} – {p.end}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEditModal(p)}
                className="rounded border border-gray-300 px-2 py-0.5 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => deletePurpose(p.id)}
                className="rounded border border-red-300 px-2 py-0.5 text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded bg-white p-4 shadow-lg">
            <h4 className="mb-3 text-sm font-semibold">
              {isEditing ? "Edit purpose" : "Add purpose"}
            </h4>

            <div className="space-y-3 text-sm">
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

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block font-medium">Start</label>
                  <input
                    type="time"
                    value={form.start}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, start: e.target.value }))
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block font-medium">End</label>
                  <input
                    type="time"
                    value={form.end}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, end: e.target.value }))
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1"
                  />
                </div>
              </div>
            </div>

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
                className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
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
