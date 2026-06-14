"use client";

import { useState, useEffect } from "react";
import type { AnyBlock, SchedulerHeaderData, SectionIntroData } from "@/lib/types/cms";

// SETUP COMPONENTS
import StaffSelectorSetup from "@/components/engine/staff/StaffSelector";
import AddAppointment from "@/components/engine/appointments/AddAppointment";
import GenerateSchedule from "@/components/engine/GenerateSchedule";

// RESULTS COMPONENTS
import StaffResultsList from "@/components/engine/results/StaffResultsList";
import StaffSummaryBar from "@/components/engine/results/StaffSummaryBar";
import MapVisualizer from "@/components/engine/MapVisualizer.client";

// STORES
import { useStaffStore } from "@/store/staffStore";
import { useSettingsStore } from "@/store/settingsStore";

// PERSISTENCE
import { loadFreeSchedulerData } from "@/lib/freeSession";
import { supabase } from "@/lib/supabase/client";

type SchedulePageProps = {
  isFree: boolean;
  cmsBlocks?: AnyBlock[];
};

type Tab = "setup" | "results";

export default function SchedulePage({ isFree, cmsBlocks = [] }: SchedulePageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("setup");

  const headerBlock = cmsBlocks.find((b) => b.type === "scheduler_header");
  const headerData = (headerBlock?.data ?? {}) as Partial<SchedulerHeaderData>;
  const pageTitle = headerData.title ?? "GeoRoute Scheduler";
  const pageSubtitle = isFree
    ? (headerData.freeSubtitle ?? "Free mode — data stored in this browser session only.")
    : (headerData.proSubtitle ?? "Pro mode — data stored in your GeoRoute workspace.");

  const sectionIntros = cmsBlocks.filter((b) => b.type === "section_intro");

  return (
    <div className="flex h-full flex-col gap-4">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">{pageTitle}</h1>
          <p className="text-xs text-slate-400">{pageSubtitle}</p>
        </div>

        {/* TABS */}
        <div className="inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-950 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("setup")}
            className={`rounded px-3 py-1 font-medium ${
              activeTab === "setup"
                ? "bg-slate-800 text-slate-50"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            }`}
          >
            Setup
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("results")}
            className={`rounded px-3 py-1 font-medium ${
              activeTab === "results"
                ? "bg-slate-800 text-slate-50"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            }`}
          >
            Results
          </button>
        </div>
      </div>

      {/* BODY */}
      {activeTab === "setup" ? (
        <SetupView isFree={isFree} sectionIntros={sectionIntros} />
      ) : (
        <ResultsView isFree={isFree} />
      )}
    </div>
  );
}

//
// ────────────────────────────────────────────────────────────────
//   SETUP VIEW
// ────────────────────────────────────────────────────────────────
//

function SetupView({ isFree, sectionIntros }: { isFree: boolean; sectionIntros: AnyBlock[] }) {
  const generateIntro = sectionIntros[0]?.data as SectionIntroData | undefined;
  const generateTitle = generateIntro?.title ?? "Generate schedule";
  const generateDesc = generateIntro?.description ?? "Use your current staff, appointments, call purposes and custom windows to generate an optimised schedule.";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StaffSelectorSetup isFree={isFree} />
        <AddAppointment isFree={isFree} />
      </div>

      <div className="rounded border border-slate-800 bg-slate-950 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-100">{generateTitle}</h2>
        <p className="mb-3 text-xs text-slate-400">{generateDesc}</p>
        <GenerateSchedule algorithm="default" isFree={isFree} />
      </div>
    </div>
  );
}

//
// ────────────────────────────────────────────────────────────────
//   RESULTS VIEW
// ────────────────────────────────────────────────────────────────
//

function ResultsView({ isFree }: { isFree: boolean }) {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const { staff } = useStaffStore();
  const { settings, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings(isFree);
  }, [isFree, loadSettings]);

  useEffect(() => {
    async function load() {
      if (isFree) {
        const data = await loadFreeSchedulerData();
        setVisits(data?.visits ?? []);
        return;
      }

      // PRO MODE — load routes and convert to visits for UI
      const { data: routesData } = await supabase.from("routes").select("*");
      const loadedRoutes = routesData ?? [];

      const reconstructedVisits = loadedRoutes.flatMap((r: any) =>
        (r.stops ?? []).map((stop: any, idx: number) => ({
          id: `${r.id}-${idx}`,
          appointmentId: stop.appointment_id,
          staffId: r.staff_id,
          clientName: stop.client_name,
          staffName: r.staff_name,
          start: stop.start,
          end: stop.end,
          postcode: stop.postcode,
        }))
      );

      setVisits(reconstructedVisits);
    }

    load();
  }, [isFree]);

  const selectedStaff =
    selectedStaffId ? staff.find((s) => s.id === selectedStaffId) || null : null;

  const selectedStaffVisits = selectedStaffId
    ? visits.filter((v) => v.staffId === selectedStaffId)
    : [];

  return (
    <div className="grid h-full grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] gap-4">
      {/* LEFT SIDE — MAP + SUMMARY */}
      <div className="flex flex-col">
        {/* MAP */}
        <div className="flex-1 min-h-[320px] rounded border border-slate-800 bg-slate-950 overflow-hidden">
          <MapVisualizer selectedStaffId={selectedStaffId} />
        </div>

        {/* SUMMARY BAR */}
        <StaffSummaryBar
          staff={selectedStaff}
          visits={selectedStaffVisits}
          dayStart={settings.dayStart}
          dayEnd={settings.dayEnd}
        />
      </div>

      {/* RIGHT SIDE — STAFF RESULTS LIST */}
      <StaffResultsList
        staff={staff}
        visits={visits}
        dayStart={settings.dayStart}
        dayEnd={settings.dayEnd}
        selectedStaffId={selectedStaffId}
        onSelectStaff={setSelectedStaffId}
      />
    </div>
  );
}
