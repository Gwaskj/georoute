export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">

      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.35),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.25),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),transparent_70%)]" />
      </div>

      {/* Soft grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04] bg-[url('/grid.svg')] bg-repeat" />

      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-6 pt-24 pb-16 text-center">
        <h1 className="text-6xl font-extrabold tracking-tight drop-shadow-[0_0_25px_rgba(0,0,0,0.6)]">
          Smarter Route Planning
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-400 leading-[1.15] pb-1">
            For High‑Performing Teams
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 leading-relaxed">
          Plan schedules, assign staff, and generate optimized routes — all in one
          beautifully simple dashboard designed for speed and clarity.
        </p>
      </section>

      {/* SECTION DIVIDER */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />

      {/* FEATURES */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-4xl font-bold">
            Powerful Tools, Beautifully Designed
          </h2>

          <p className="mt-3 text-center text-slate-400 max-w-2xl mx-auto">
            Everything your team needs to plan, schedule, and execute routes efficiently.
          </p>

          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Drag‑and‑Drop Scheduling",
                desc: "Build and adjust your team’s day in seconds with a clean, intuitive timeline.",
                gradient: "from-teal-500/30 to-teal-400/10",
                glow: "shadow-teal-500/40",
              },
              {
                title: "Optimized Route Planning",
                desc: "Generate the fastest route instantly — saving time, fuel, and stress.",
                gradient: "from-indigo-500/30 to-indigo-400/10",
                glow: "shadow-indigo-500/40",
              },
              {
                title: "Team‑Ready Dashboard",
                desc: "See every appointment, location, and route at a glance.",
                gradient: "from-purple-500/30 to-purple-400/10",
                glow: "shadow-purple-500/40",
              },
              {
                title: "Real‑Time Updates",
                desc: "Make changes on the fly and instantly update your team.",
                gradient: "from-emerald-500/30 to-emerald-400/10",
                glow: "shadow-emerald-500/40",
              },
            ].map((f, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-6 bg-gradient-to-br ${f.gradient} border border-slate-800 backdrop-blur-sm shadow-xl ${f.glow} hover:scale-[1.03] hover:shadow-2xl transition-all`}
              >
                <div className="absolute inset-0 opacity-[0.08] bg-[url('/grid.svg')] bg-cover" />
                <h3 className="relative text-xl font-semibold text-white">{f.title}</h3>
                <p className="relative mt-2 text-slate-300">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION DIVIDER */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />

      {/* MAP PREVIEW */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">See Your Day at a Glance</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-12">
            A clean visual overview of your team’s routes — pins, paths, and all.
          </p>

          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-slate-800 bg-slate-900/70">
            <img
              src="/fake-map.png"
              alt="Fictional route map preview"
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 text-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-700 via-purple-600 to-teal-500 opacity-95" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_70%)]" />

        <h2 className="text-4xl font-bold drop-shadow-[0_0_25px_rgba(0,0,0,0.6)]">
          Start Planning Smarter Today
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-100">
          Join teams who save hours every week with automated scheduling and optimized routing.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <a
            href="/scheduler"
            className="rounded-xl bg-gradient-to-r from-teal-400 to-cyan-300 px-8 py-3 font-semibold text-slate-900 shadow-xl shadow-teal-400/40 hover:brightness-110 transition-all"
          >
            Get Started Free
          </a>

          <a
            href="/pricing"
            className="rounded-xl border border-slate-200/40 px-8 py-3 font-semibold text-slate-100 bg-white/5 hover:bg-white/10 transition-all"
          >
            View Pricing
          </a>
        </div>
      </section>
    </div>
  );
}
