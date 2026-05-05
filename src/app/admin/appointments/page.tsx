"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface Staff {
  id: number;
  name: string;
}

interface Appointment {
  id: number;
  staff_id: number;
  staff: Staff[] | null;
  customer_name: string;
  address: string;
  start_time: string;
  end_time: string;
}

export default function AppointmentsPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [staffId, setStaffId] = useState<number | "">("");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: staffData } = await supabase
        .from("staff")
        .select("id, name")
        .order("name", { ascending: true });

      const { data: apptData } = await supabase
        .from("appointments")
        .select(
          `
          id,
          staff_id,
          customer_name,
          address,
          start_time,
          end_time,
          staff:staff_id ( id, name )
        `
        )
        .order("start_time", { ascending: true });

      setStaff(staffData || []);

      const normalized =
        apptData?.map((a: any) => ({
          id: a.id,
          staff_id: a.staff_id,
          staff: Array.isArray(a.staff)
            ? a.staff
            : a.staff
            ? [a.staff]
            : [],
          customer_name: a.customer_name,
          address: a.address,
          start_time: a.start_time,
          end_time: a.end_time,
        })) ?? [];

      setAppointments(normalized);
    }

    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!staffId) return;

    setSaving(true);

    const { data } = await supabase
      .from("appointments")
      .insert({
        staff_id: staffId,
        customer_name: customerName,
        address,
        start_time: startTime,
        end_time: endTime,
      })
      .select(
        `
        id,
        staff_id,
        customer_name,
        address,
        start_time,
        end_time,
        staff:staff_id ( id, name )
      `
      )
      .single();

    if (data) {
      const normalized = {
        id: data.id,
        staff_id: data.staff_id,
        staff: Array.isArray(data.staff)
          ? data.staff
          : data.staff
          ? [data.staff]
          : [],
        customer_name: data.customer_name,
        address: data.address,
        start_time: data.start_time,
        end_time: data.end_time,
      };

      setAppointments((prev) => [...prev, normalized]);
    }

    setCustomerName("");
    setAddress("");
    setStartTime("");
    setEndTime("");
    setStaffId("");

    setSaving(false);
  }

  async function handleDelete(id: number) {
    await supabase.from("appointments").delete().eq("id", id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
        Appointments
      </h1>

      <form
        onSubmit={handleCreate}
        style={{
          display: "grid",
          gap: 8,
          marginBottom: 24,
          maxWidth: 700,
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select
            value={staffId}
            onChange={(e) =>
              setStaffId(e.target.value ? Number(e.target.value) : "")
            }
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 6,
              padding: "8px 10px",
              minWidth: 160,
            }}
          >
            <option value="">Select staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 6,
              padding: "8px 10px",
              flex: 1,
            }}
          />
        </div>

        <input
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 6,
            padding: "8px 10px",
          }}
        />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 6,
              padding: "8px 10px",
            }}
          />

          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 6,
              padding: "8px 10px",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            marginTop: 4,
            padding: "8px 14px",
            borderRadius: 6,
            border: "none",
            background: "#111827",
            color: "white",
            fontWeight: 500,
            cursor: "pointer",
            fontSize: 14,
            alignSelf: "flex-start",
          }}
        >
          {saving ? "Creating..." : "Create Appointment"}
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
            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>
              Staff
            </th>
            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>
              Customer
            </th>
            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>
              Address
            </th>
            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>
              Start
            </th>
            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>
              End
            </th>
            <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {appointments.map((a) => (
            <tr key={a.id}>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                {a.staff && a.staff.length > 0
                  ? a.staff.map((s) => s.name).join(", ")
                  : "—"}
              </td>

              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                {a.customer_name}
              </td>

              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                {a.address}
              </td>

              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                {a.start_time}
              </td>

              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                {a.end_time}
              </td>

              <td
                style={{
                  padding: 8,
                  borderBottom: "1px solid #f3f4f6",
                  textAlign: "right",
                }}
              >
                <button
                  onClick={() => handleDelete(a.id)}
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

          {appointments.length === 0 && (
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: 12,
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                No appointments yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
