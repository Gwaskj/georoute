import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient(); // FIXED: await the async client

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="w-64 fixed left-0 top-0 bottom-0 bg-white border-r p-6">
        <h2 className="text-xl font-semibold mb-6">Admin</h2>
        <nav className="space-y-4">
          <a href="/admin" className="block">Dashboard</a>
          <a href="/admin/schedule" className="block">Schedule</a>
          <a href="/admin/staff" className="block">Staff</a>
          <a href="/admin/appointments" className="block">Appointments</a>
          <a href="/admin/routes" className="block">Routes</a>
        </nav>
      </aside>

      <main className="ml-64 p-10">
        {children}
      </main>
    </div>
  );
}
