"use client";

import "@/styles/admin-logs.css";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface LogEntry {
  id: number;
  created_at: string;
  message: string;
}

export default function AdminLogsPage() {
  const isAdmin = useIsAdmin();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin !== true) return;

    async function load() {
      const { data } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false });

      setLogs(data || []);
      setLoading(false);
    }

    load();
  }, [isAdmin]);

  if (isAdmin === null) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p>You do not have permission to view system logs.</p>
      </div>
    );
  }

  if (loading) return null;

  return (
    <div>
      <div className="admin-logs-header">
        <h1 className="admin-logs-title">System Logs</h1>
      </div>

      <div className="admin-logs-list">
        {logs.length === 0 ? (
          <div className="admin-log-entry">
            <div className="admin-log-message">No logs found.</div>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="admin-log-entry">
              <div className="admin-log-meta">
                {new Date(log.created_at).toLocaleString()}
              </div>
              <div className="admin-log-message">{log.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
