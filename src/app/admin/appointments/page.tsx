export default function AppointmentsPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Appointments</h1>
      <p style={{ color: "#6b7280" }}>
        Appointments are managed through the Scheduler. Visit{" "}
        <a href="/admin/schedule" style={{ color: "#2563eb", textDecoration: "underline" }}>
          Admin Schedule
        </a>{" "}
        to view and manage appointments.
      </p>
    </div>
  );
}
