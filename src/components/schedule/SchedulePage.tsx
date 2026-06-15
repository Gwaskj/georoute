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
import { useScheduleResultStore } from "@/store/scheduleResultStore";

// PERSISTENCE
import { loadFreeSchedulerData } from "@/lib/freeSession";
import { loadProScheduledVisits } from "@/lib/scheduler/persist";

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
  const { staff } = useStaffStore();
  const { settings, loadSettings } = useSettingsStore();
  const { visits, hasResult, setResult } = useScheduleResultStore();

  useEffect(() => {
    loadSettings(isFree);
  }, [isFree, loadSettings]);

  // On mount: if the store is empty (page refresh), reload the last persisted result.
  useEffect(() => {
    if (hasResult) return;
    if (isFree) {
      loadFreeSchedulerData().then((data) => {
        if ((data as any)?.visits?.length) {
          setResult((data as any).visits, [], []);
        }
      });
    } else {
      loadProScheduledVisits().then((loaded) => {
        if (loaded.length) setResult(loaded, [], []);
      });
    }
  }, [hasResult, isFree, setResult]);

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
          <MapVisualizer
            selectedStaffId={selectedStaffId}
            scheduledVisits={visits}
            staffList={staff}
          />
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
