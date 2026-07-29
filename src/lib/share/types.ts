/**
 * Snapshot of one staff member's round, as stored against a share link.
 *
 * This is a copy rather than a live query. Staff should see the schedule they
 * were sent; if the round is regenerated, a new link is issued rather than the
 * old one quietly changing under someone already driving it.
 */
export interface SharedStop {
  clientName: string;
  postcode: string;
  address?: string;
  /** ISO datetimes. */
  start: string;
  end: string;
}

export interface SharedBreak {
  start: string;
  end: string;
}

export interface SharedSchedulePayload {
  staffName: string;
  /** Where the day starts and ends, for the navigation links. */
  originLabel: string;
  originPostcode: string;
  destinationLabel: string;
  destinationPostcode: string;
  stops: SharedStop[];
  breaks: SharedBreak[];
  /** When the snapshot was taken, ISO. */
  generatedAt: string;
}

/** How long a link lasts unless the caller asks for something else. */
export const DEFAULT_SHARE_DAYS = 14;
export const MAX_SHARE_DAYS = 90;
