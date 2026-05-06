"use client";

import "@/styles/admin-staff.css";
import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Staff {
  id: number;
  name: string;
  email: string;
  color: string | null;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("staff")
        .select("id, name, email, color")
        .order("id", { ascending: true });
      setStaff(data || []);
    }
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data } = await supabase
      .from("staff")
      .insert({ name, email, color })
      .select("id, name, email, color")
      .single();
    if (data) setStaff((prev) => [...prev, data]);
    setName("");
    setEmail("");
    setSaving(false);
  }

  async function handleDelete(id: number) {
    await supabase.from("staff").delete().eq("id", id);
    setStaff((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
        Staff
      </h1>

      <form
        onSubmit={handleCreate}
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 6,
            padding: "8px 10px",
          }}
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 6,
            padding: "8px 10px",
          }}
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ width: 44, height: 36, padding: 0, borderRadius: 6 }}
        />
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: "none",
            background: "#111827",
            color: "white",
            fontWeight: 500,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          {saving ? "Adding..." : "Add Staff"}
        </button>
      </form>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
        }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Name</th>
            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Email</th>
            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Color</th>
            <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id}>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{s.name}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{s.email}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 16,
                    height: 16,
                    borderRadius: "999px",
                    background: s.color || "#9ca3af",
                    marginRight: 6,
                    verticalAlign: "middle",
                  }}
                />
                <span>{s.color}</span>
              </td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                <button
                  onClick={() => handleDelete(s.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid #ef4444",
                    background: "white",
                    color: "#b91c1c",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {staff.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: 12, textAlign: "center", color: "#6b7280" }}>
                No staff yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
