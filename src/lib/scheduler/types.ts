// src/lib/scheduler/types.ts

import { Staff } from "@/store/staffStore";
import { Appointment } from "@/store/appointmentStore";
import { CallPurpose } from "@/store/callPurposeStore";
import { CustomWindow } from "@/store/customWindowStore";

export interface ScheduledVisit {
  id: string;
  appointmentId: string;
  staffId: string;
  clientName: string;
  staffName: string;
  start: string;
  end: string;
  postcode: string;
}

export interface SchedulerContext {
  staff: Staff[];
  appointments: Appointment[];
  purposes: CallPurpose[];
  windows: CustomWindow[];
  officePostcode: string | null;
  dayStart: string;
  dayEnd: string;
}

export interface SchedulerResult {
  visits: ScheduledVisit[];
  warnings: string[];
}
