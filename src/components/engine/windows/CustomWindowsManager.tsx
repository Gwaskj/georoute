"use client";

import { useState } from "react";
import {
  useCustomWindowStore,
  CustomWindow,
} from "@/store/customWindowStore";

interface CustomWindowsManagerProps {
  isFree: boolean;
}

interface WindowFormState {
  id?: string;
  name: string;
  start: string;
  end: string;
  minGapToNext: string;
}

const emptyForm: WindowFormState = {
  name: "",
  start: "08:00",
  end: "10:00",
  minGapToNext: "0",
};

export default function CustomWindowsManager({ isFree }: CustomWindowsManagerProps) {
  const { windows, addWindow, updateWindow, deleteWindow } =
    useCustomWindowStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<WindowFormState>(emptyForm);

  const openAddModal = () => {
    setIsEditing(false);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (w: CustomWindow) => {
    setIsEditing(true);
    setForm({
      id: w.id,
      name: w.name,
      start: w.start,
      end: w.end,
      minGapToNext: String(w.minGapToNext),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    const minGap = Math.max(0, parseInt(form.minGapToNext || "0", 10));

    const payload = {
      name: form.name.trim(),
      start: form.start,
      end: form.end,
      minGapToNext: minGap,
    };

    if (isEditing && form.id) {
      updateWindow(form.id, payload);
    } else {
      addWindow(payload);
    }

    setIsModalOpen(false);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-3 rounded border border-slate-800 bg-slate-950 p-3 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Custom Time Windows</h3>
        <button
          type="button"
          onClick={openAddModal}
          className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
        >
          Add window
        </button>
      </div>

      {windows.length === 0 && (
        <p className="text-xs text-slate-400">No windows yet. Add Breakfast, Lunch, etc.</p>
      )}

      <ul className="space-y-1 text-xs">
        {windows.map((w: CustomWindow) => (
          <li
            key={w.id}
            className="flex items-center justify-between rounded border border-slate-800 px-2 py-1"
          >
            <div className="flex flex-col">
              <span className="font-medium text-slate-200">{w.name}</span>
              <span className="text-slate-400">
                {w.start} – {w.end}
              </span>
              {w.minGapToNext > 0 && (
                <span className="text-slate-500">
                  Min gap to next: {w.minGapToNext} mins
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEditModal(w)}
                className="rounded border border-slate-700 px-2 py-0.5 hover:bg-slate-800"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => deleteWindow(w.id)}
                className="rounded border border-red-700 px-2 py-0.5 text-red-400 hover:bg-red-900/20"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded bg-slate-900 p-4 shadow-lg border border-slate-700">
            <h4 className="mb-3 text-sm font-semibold text-slate-100">
              {isEditing ? "Edit window" : "Add window"}
            </h4>

            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block font-medium text-slate-300">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block font-medium text-slate-300">Start</label>
                  <input
                    type="time"
                    value={form.start}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, start: e.target.value }))
                    }
                    className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block font-medium text-slate-300">End</label>
                  <input
                    type="time"
                    value={form.end}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, end: e.target.value }))
                    }
                    className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-300">
                  Min gap to next (minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.minGapToNext}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minGapToNext: e.target.value }))
                  }
                  className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
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
