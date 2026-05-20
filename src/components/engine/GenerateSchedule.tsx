// C:\Users\matth\georoute\src\components\engine\GenerateSchedule.tsx
"use client";

import { useState } from "react";
import { useStaffStore } from "@/store/staffStore";
import { useAppointmentStore } from "@/store/appointmentStore";
import { useCallPurposeStore } from "@/store/callPurposeStore";
import { useCustomWindowStore } from "@/store/customWindowStore";
import { useOfficePostcodeStore } from "@/store/officePostcodeStore";

import { runScheduler } from "@/lib/scheduler/engine";
import { saveSchedulerResult } from "@/lib/scheduler/persist";
import { SchedulerContext, ScheduledVisit } from "@/lib/scheduler/types";

interface GenerateScheduleProps {
  algorithm: "default";
  isFree: boolean;
}

export default function GenerateSchedule({
  algorithm,
  isFree,
}: GenerateScheduleProps) {
  const { staff } = useStaffStore();
  const { appointments } = useAppointmentStore();
  const { purposes } = useCallPurposeStore();
  const { windows } = useCustomWindowStore();
  const { officePostcode } = useOfficePostcodeStore();

  const [isRunning, setIsRunning] = useState(false);
  const [visits, setVisits] = useState<ScheduledVisit[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleRun = async () => {
    if (algorithm !== "default") return;

    setIsRunning(true);

    const ctx: SchedulerContext = {
      staff,
      appointments,
      purposes,
      windows,
      officePostcode,
      dayStart: "06:00",
      dayEnd: "22:00",
    };

    const result = runScheduler(ctx);

    setVisits(result.visits);
    setWarnings(result.warnings);

    await saveSchedulerResult({
      isFree,
      ctx,
      result,
    });

    setIsRunning(false);
  };

  return (
    <div className="space-y-3 text-xs text-slate-200">
      <button
        type="button"
        onClick={handleRun}
        disabled={isRunning}
        className="w-full rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-700"
      >
        {isRunning ? "Generating..." : "Generate schedule"}
      </button>

      {warnings.length > 0 && (
        <div className="rounded border border-yellow-700 bg-yellow-950/40 p-2 text-[11px] text-yellow-200">
          <div className="mb-1 font-semibold">Warnings</div>
          <ul className="list-disc pl-4">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {visits.length > 0 && (
        <div className="max-h-64 overflow-auto rounded border border-slate-800 bg-slate-950 p-2">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Generated visits
          </div>
          <ul className="space-y-1">
            {visits.map((v) => {
              const start = new Date(v.start);
              const end = new Date(v.end);
              const timeStr = `${start.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })} – ${end.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`;

              return (
                <li
                  key={v.id}
                  className="rounded border border-slate-800 bg-slate-900 px-2 py-1"
                >
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-100">
                      {v.clientName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {timeStr}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{v.staffName}</span>
                    <span>{v.postcode}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {visits.length === 0 && !isRunning && (
        <p className="text-[11px] text-slate-400">
          No schedule generated yet. Configure staff, appointments, purposes, and
          windows, then click Generate.
        </p>
      )}
    </div>
  );
}
