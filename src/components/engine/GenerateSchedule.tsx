"use client";

import { useEffect, useState } from "react";
import { useStaffStore } from "@/store/staffStore";
import { useAppointmentStore } from "@/store/appointmentStore";
import { useCallPurposeStore } from "@/store/callPurposeStore";
import { useCustomWindowStore } from "@/store/customWindowStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useScheduleResultStore } from "@/store/scheduleResultStore";

import { runScheduler } from "@/lib/scheduler/engine";
import { saveSchedulerResult } from "@/lib/scheduler/persist";
import { SchedulerContext } from "@/lib/scheduler/types";
import { getRouteBatched, clearLocalCache, getRouteErrors } from "@/lib/routing";
import { logActivity } from "@/lib/logsClient";
import AdBanner from "@/components/AdBanner";

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
  const { settings, loaded: settingsLoaded, loadSettings } = useSettingsStore();
  const officePostcode = settings.officePostcode;

  const { visits, warnings, hints, setResult } = useScheduleResultStore();
  const [isRunning, setIsRunning] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [showAdGate, setShowAdGate] = useState(false);

  // Load settings on mount
  useEffect(() => {
    if (!settingsLoaded) {
      loadSettings(isFree);
    }
  }, [isFree, settingsLoaded, loadSettings]);

  const handleRun = async () => {
    if (algorithm !== "default") return;

    setIsRunning(true);
    setRouteError(null);
    clearLocalCache();
    const startedAt = Date.now();

    // Pre-fetch all relevant postcode pairs to build a travel-time lookup
    const uniquePostcodes = new Set<string>();

    if (officePostcode) uniquePostcodes.add(officePostcode);
    for (const s of staff) {
      if (s.homePostcode) uniquePostcodes.add(s.homePostcode);
      if (s.officePostcode) uniquePostcodes.add(s.officePostcode);
    }
    const effectiveOffice = officePostcode || "";
    for (const a of appointments) {
      if (a.postcode) uniquePostcodes.add(a.postcode);
    }

    const postcodes = Array.from(uniquePostcodes).filter(Boolean);

    const travelLookup = new Map<string, number>();
    const failedPairs: string[] = [];

    const fetchPromises: Promise<void>[] = [];
    for (const from of postcodes) {
      for (const to of postcodes) {
        if (from === to) {
          travelLookup.set(`${from}→${to}`, 0);
          continue;
        }
        fetchPromises.push(
          getRouteBatched(from, to).then((route) => {
            if (route === null) {
              failedPairs.push(`${from} → ${to}`);
            } else {
              // Round to a whole minute at the source — the scheduler builds
              // every visit's start/end time by adding these travel minutes
              // together, so a raw fractional ORS duration (e.g. 30.63...)
              // would otherwise leave sub-minute drift in every appointment
              // time downstream.
              travelLookup.set(`${from}→${to}`, Math.round(route.duration_minutes));
            }
          })
        );
      }
    }

    if (fetchPromises.length > 0) {
      await Promise.all(fetchPromises);
    }

    if (failedPairs.length > 0) {
      const errors = getRouteErrors();
      const details = failedPairs
        .map((pair) => {
          const [from, to] = pair.split(" → ");
          const reason = errors.get(
            `${from.trim().toUpperCase()} → ${to.trim().toUpperCase()}`
          );
          return reason ? `${pair} (${reason})` : pair;
        })
        .join("; ");
      setRouteError(
        `Could not get travel times for: ${details}. Double-check these postcodes are valid — if they look correct, the routing service may be temporarily unavailable.`
      );
      logActivity("routing_error", null, {
        isFree,
        failedPairs: failedPairs.length,
        details,
      });
      setIsRunning(false);
      return;
    }

    function getTravelMinutes(from: string, to: string): number {
      const key = `${from}→${to}`;
      const cached = travelLookup.get(key);
      if (cached !== undefined) return cached;

      const origin = from || effectiveOffice;
      const dest = to || effectiveOffice;
      if (origin === dest) return 0;

      return 0;
    }

    const ctx: SchedulerContext = {
      staff,
      appointments,
      purposes,
      windows,
      officePostcode,
      dayStart: settings.dayStart,
      dayEnd: settings.dayEnd,
      getTravelMinutes,
    };

    try {
      const result = runScheduler(ctx);

      setResult(result.visits, result.warnings, result.hints);

      await saveSchedulerResult({
        isFree,
        ctx,
        result,
      });

      logActivity("schedule_generated", null, {
        isFree,
        staffCount: staff.length,
        appointmentCount: appointments.length,
        visitCount: result.visits.length,
        warningCount: result.warnings.length,
        hintCount: result.hints.length,
        durationMs: Date.now() - startedAt,
      });
    } catch (err) {
      logActivity("schedule_generation_failed", null, {
        isFree,
        staffCount: staff.length,
        appointmentCount: appointments.length,
        message: err instanceof Error ? err.message : String(err),
      });
      setRouteError(
        "Schedule generation failed unexpectedly. This has been logged for investigation."
      );
    }

    setIsRunning(false);
  };

  function handleGenerateClick() {
    if (isFree) {
      setShowAdGate(true);
      return;
    }
    handleRun();
  }

  function handleAdGateContinue() {
    setShowAdGate(false);
    handleRun();
  }

  return (
    <div className="space-y-3 text-xs text-slate-200">
      <button
        type="button"
        onClick={handleGenerateClick}
        disabled={isRunning}
        className="w-full rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-700"
      >
        {isRunning ? "Generating..." : "Generate schedule"}
      </button>

      {showAdGate && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">
                Generating your schedule…
              </h3>
              <button
                onClick={() => setShowAdGate(false)}
                className="text-slate-400 hover:text-white text-xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <AdBanner />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={handleAdGateContinue}
                className="rounded bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {routeError && (
        <div className="rounded border border-red-700 bg-red-950/40 p-2 text-[11px] text-red-300">
          <div className="mb-1 font-semibold">Routing error</div>
          {routeError}
        </div>
      )}

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

      {hints.length > 0 && (
        <div className="rounded border border-blue-700 bg-blue-950/40 p-2 text-[11px] text-blue-200">
          <div className="mb-1 font-semibold">Capacity hints</div>
          <ul className="list-disc pl-4">
            {hints.map((h, idx) => (
              <li key={idx}>{h}</li>
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