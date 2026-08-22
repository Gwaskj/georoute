"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSettingsStore } from "@/store/settingsStore";
import {
  COUNTRY_LIST,
  countryConfig,
  type CountryCode,
} from "@/lib/geo/countries";

/**
 * Where the working day starts, shown on the Setup tab.
 *
 * The office postcode used to live only on /settings, which made a required
 * value invisible from the page where a round is actually built. Without it a
 * staff member whose day starts at the office has no origin at all, so the
 * schedule is generated from nowhere and the Share button silently disappears
 * -- the failure gives no clue that a setting on another page is the cause.
 *
 * This reads and writes the same store /settings uses, so the two are the same
 * value rather than two copies that can drift. /settings keeps the fuller
 * page: skills, custom windows and the rest.
 */
export default function DayStartSetup() {
  const {
    settings,
    loaded,
    setOfficePostcode,
    setDayStart,
    setDayEnd,
    setCountry,
    loadSettings,
    saveSettings,
  } = useSettingsStore();

  const country = countryConfig(settings.country);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loaded) loadSettings();
  }, [loaded, loadSettings]);

  // Saved on blur rather than behind a button. This sits above the thing the
  // user came here to press, and a value typed but not saved would be the same
  // silent failure in a new place.
  const commit = async () => {
    await saveSettings();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const missingOffice = loaded && !settings.officePostcode.trim();

  const field =
    "w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 outline-none transition focus:border-teal-500";

  return (
    <div
      className={`rounded border p-4 transition-colors ${
        missingOffice
          ? "border-amber-600/60 bg-amber-950/20"
          : "border-slate-800 bg-slate-950"
      }`}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Where the day starts
        </h2>
        {saved && (
          <span className="text-[11px] text-emerald-300" role="status">
            Saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_2fr_1fr_1fr]">
        <div>
          <label
            htmlFor="setup-country"
            className="mb-1 block text-xs font-medium text-slate-400"
          >
            Country
          </label>
          <select
            id="setup-country"
            value={settings.country}
            onChange={(e) => {
              setCountry(e.target.value as CountryCode);
              // Committed immediately rather than on blur: a select has no
              // meaningful blur for a keyboard user, and every label on the
              // page changes as a result of this one.
              void commit();
            }}
            className={field}
          >
            {COUNTRY_LIST.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="setup-office-postcode"
            className="mb-1 block text-xs font-medium text-slate-400"
          >
            Office {country.postcodeLabel.toLowerCase()}
          </label>
          <input
            id="setup-office-postcode"
            type="text"
            value={settings.officePostcode}
            onChange={(e) => setOfficePostcode(e.target.value)}
            onBlur={commit}
            placeholder={`e.g. ${country.example}`}
            aria-describedby="setup-office-help"
            className={field}
          />
        </div>

        <div>
          <label
            htmlFor="setup-day-start"
            className="mb-1 block text-xs font-medium text-slate-400"
          >
            Day start
          </label>
          <input
            id="setup-day-start"
            type="time"
            value={settings.dayStart}
            onChange={(e) => setDayStart(e.target.value)}
            onBlur={commit}
            className={field}
          />
        </div>

        <div>
          <label
            htmlFor="setup-day-end"
            className="mb-1 block text-xs font-medium text-slate-400"
          >
            Day end
          </label>
          <input
            id="setup-day-end"
            type="time"
            value={settings.dayEnd}
            onChange={(e) => setDayEnd(e.target.value)}
            onBlur={commit}
            className={field}
          />
        </div>
      </div>

      <p id="setup-office-help" className="mt-2 text-xs text-slate-400">
        {missingOffice ? (
          <span className="text-amber-300">
            Set this before generating. Staff who start at the office have
            nowhere to travel from without it, so their round has no beginning.
          </span>
        ) : (
          <>
            Where staff start and finish, unless a staff member has their own
            postcode or starts from home. More in{" "}
            <Link
              href="/settings"
              className="text-teal-400 underline hover:text-teal-300"
            >
              settings
            </Link>
            .
          </>
        )}
      </p>
    </div>
  );
}
