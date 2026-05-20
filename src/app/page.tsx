export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">

      {/* GLOW EFFECTS */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.35),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)]" />
      </div>

      {/* GRID OVERLAY */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04] bg-[url('/grid.svg')] bg-repeat" />

      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-6 pt-40 pb-32 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl drop-shadow-xl">
          Smarter Route Planning  
          <span className="block text-teal-400">For High‑Performing Teams</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          Plan schedules, assign staff, and generate optimized routes — all in one
          beautifully simple dashboard designed for speed and clarity.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <a
            href="/scheduler"
            className="rounded-xl bg-teal-500 px-10 py-4 font-semibold text-black shadow-xl shadow-teal-500/30 hover:bg-teal-400 hover:shadow-teal-400/40 transition-all"
          >
            Get Started Free
          </a>

          <a
            href="/pricing"
            className="rounded-xl border border-slate-600 px-10 py-4 font-semibold text-slate-200 hover:bg-slate-800/50 transition-all"
          >
            View Pricing
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-32">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-4xl font-bold">
            Powerful Tools, Beautifully Designed
          </h2>

          <p className="mt-4 text-center text-slate-400 max-w-2xl mx-auto">
            Everything your team needs to plan, schedule, and execute routes efficiently.
          </p>

          <div className="mt-20 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Drag‑and‑Drop Scheduling",
                desc: "Build and adjust your team’s day in seconds with a clean, intuitive timeline.",
                color: "from-teal-500/20 to-teal-400/10",
              },
              {
                title: "Optimized Route Planning",
                desc: "Generate the fastest route instantly — saving time, fuel, and stress.",
                color: "from-indigo-500/20 to-indigo-400/10",
              },
              {
                title: "Team‑Ready Dashboard",
                desc: "See every appointment, location, and route at a glance.",
                color: "from-purple-500/20 to-purple-400/10",
              },
              {
                title: "Real‑Time Updates",
                desc: "Make changes on the fly and instantly update your team.",
                color: "from-emerald-500/20 to-emerald-400/10",
              },
              {
                title: "Secure & Reliable",
                desc: "Built on Supabase + Next.js for speed, security, and stability.",
                color: "from-rose-500/20 to-rose-400/10",
              },
              {
                title: "Custom Branding",
                desc: "Upload your logo, banner, and colours to make GeoRoute yours.",
                color: "from-amber-500/20 to-amber-400/10",
              },
            ].map((f, i) => (
              <div
                key={i}
                className={`rounded-2xl bg-gradient-to-br ${f.color} p-6 shadow-xl shadow-black/30 backdrop-blur-sm border border-slate-800 hover:scale-[1.02] transition-transform`}
              >
                <h3 className="text-xl font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-slate-300">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 text-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-teal-600 to-indigo-600 opacity-90" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_70%)]" />

        <h2 className="text-4xl font-bold drop-shadow-lg">Start Planning Smarter Today</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-100">
          Join teams who save hours every week with automated scheduling and optimized routing.
        </p>

        <a
          href="/signup"
          className="mt-10 inline-block rounded-xl bg-white px-12 py-4 font-semibold text-teal-700 shadow-xl hover:bg-slate-100 transition-all"
        >
          Create Your Free Account
        </a>
      </section>
    </div>
  );
}
