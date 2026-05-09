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
  start: string; // ISO datetime
  end: string;   // ISO datetime
  postcode: string;
}

export interface SchedulerContext {
  staff: Staff[];
  appointments: Appointment[];
  purposes: CallPurpose[];
  windows: CustomWindow[];
  officePostcode: string | null;
  dayStart: string; // "08:00"
  dayEnd: string;   // "20:00"
}

export interface SchedulerResult {
  visits: ScheduledVisit[];
  warnings: string[];
}
