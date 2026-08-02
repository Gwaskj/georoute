import { ReactNode } from "react";
import AdminNav from "@/components/admin/AdminNav";

interface AdminLayoutProps {
  children: ReactNode;
}

// admin-dashboard.css used to be imported here. Of its 231 lines only
// .admin-layout was referenced anywhere, and that rule set display:flex --
// which laid the nav and the page out side by side -- plus background and
// colour from variables that resolved to a washed-out light theme. The rest
// described a sidebar layout no page has used for some time.
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminNav />
      {children}
    </div>
  );
}
