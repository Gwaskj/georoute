"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type StaffSelectorProps = {
  title: string;
};

type Staff = {
  id: number;
  name: string;
  role: string;
};

export default function StaffSelector({ title }: StaffSelectorProps) {
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    supabase
      .from("staff") // ✅ FIXED: remove generics — your client is already typed
      .select("*")
      .then(({ data }) => {
        setStaff((data as Staff[]) ?? []);
      });
  }, []);

  return (
    <div className="w-full rounded border bg-white p-4">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      {staff.length === 0 && (
        <p className="text-sm text-gray-500">No staff found.</p>
      )}

      <ul className="space-y-2">
        {staff.map((s) => (
          <li
            key={s.id}
            className="rounded border p-2 text-sm bg-gray-50 flex justify-between"
          >
            <span>{s.name}</span>
            <span className="text-gray-400">{s.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
