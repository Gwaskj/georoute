"use client";

import "@/styles/homepage.css";
import Link from "next/link";
import { AdBlock } from "@/components/AdBlock";

export default function HomePage() {
  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center">
          {/* LEFT */}
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-slate-900/60 px-3 py-1 text-xs text-teal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              Built for care teams, therapists & field workers
            </div>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Plan appointments & routes
              <span className="block text-teal-300">faster, smarter, easier.</span>
            </h1>

            <p className="max-w-xl text-sm text-slate-300 sm:text-base leading-relaxed">
              GeoRoute helps you schedule daily appointments, assign staff, and
              build efficient travel routes — all in one clean, visual dashboard.
              Designed for care providers, therapists, mobile teams, and anyone
              who needs to plan visits across multiple locations every day.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-teal-400 px-6 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-teal-500/30 hover:brightness-110 transition"
              >
                Start free – no card
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-teal-300 hover:text-teal-200 transition"
              >
                View pricing →
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-slate-400">
              <span>Max 2 staff on free tier</span>
              <span>Up to 10 routes/day</span>
              <span>No credit card required</span>
            </div>
          </div>

          {/* RIGHT — MOCKUP */}
          <div className="flex-1">
            <div className="relative rounded-2xl border border-teal-500/20 bg-slate-900/70 p-4 shadow-xl shadow-teal-500/20">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                <span>Today · Route overview</span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-teal-300">
                  Live schedule
                </span>
              </div>

              <div className="grid gap-3 text-xs sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="rounded-lg bg-slate-800/80 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-50">North Zone</span>
                      <span className="text-[10px] text-teal-300">5 stops</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Assigned to Alex · 09:00–12:00
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-800/80 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-50">City Centre</span>
                      <span className="text-[10px] text-teal-300">7 stops</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Assigned to Jamie · 10:00–14:00
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="rounded-lg bg-slate-800/80 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-50">South Route</span>
                      <span className="text-[10px] text-teal-300">4 stops</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Assigned to Taylor · 08:30–11:30
                    </p>
                  </div>

                  <div className="rounded-lg border border-dashed border-teal-500/40 bg-slate-900/60 p-3 text-[11px] text-slate-300">
                    Drag and drop to assign new routes, rebalance workloads, and
                    keep every staff member on time.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <AdBlock />
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT SECTION — SEO + ADSENSE APPROVAL */}
      <section className="mx-auto max-w-4xl px-4 py-16 space-y-6">
        <h2 className="text-2xl font-semibold text-teal-300">What is GeoRoute?</h2>
        <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
          GeoRoute is a modern scheduling and route‑planning tool built for
          professionals who travel between appointments. Whether you’re a care
          provider, therapist, mobile technician, cleaner, inspector, or anyone
          managing daily visits, GeoRoute helps you stay organised and efficient.
        </p>
        <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
          Instead of juggling spreadsheets, maps, and handwritten notes, GeoRoute
          gives you a single place to plan your day. Assign staff, schedule
          appointments, optimise travel routes, and keep everyone on time — all
          with a clean, visual interface designed for speed.
        </p>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold text-teal-300 mb-8">Why teams love GeoRoute</h2>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-slate-900/60 p-6 border border-slate-800">
            <h3 className="font-semibold text-slate-50 mb-2">Visual scheduling</h3>
            <p className="text-slate-400 text-sm">
              Drag and drop appointments, assign staff, and see your entire day at a glance.
            </p>
          </div>

          <div className="rounded-xl bg-slate-900/60 p-6 border border-slate-800">
            <h3 className="font-semibold text-slate-50 mb-2">Route optimisation</h3>
            <p className="text-slate-400 text-sm">
              Build efficient travel routes that reduce mileage and save time.
            </p>
          </div>

          <div className="rounded-xl bg-slate-900/60 p-6 border border-slate-800">
            <h3 className="font-semibold text-slate-50 mb-2">Built for care teams</h3>
            <p className="text-slate-400 text-sm">
              Perfect for therapists, carers, and support workers who visit multiple clients daily.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
