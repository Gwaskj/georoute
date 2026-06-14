import type { HeroData } from "@/lib/types/cms";

export default function HeroBlock({ data }: { data: HeroData }) {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pt-28 pb-20 text-center">
      {data.badge && (
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-medium text-teal-400 mb-8 backdrop-blur-sm">
          {data.badge}
        </div>
      )}

      <h1 className="text-6xl font-extrabold tracking-tight drop-shadow-[0_0_25px_rgba(0,0,0,0.6)]">
        {data.title}
        {data.titleAccent && (
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-400 leading-[1.15] pb-1">
            {data.titleAccent}
          </span>
        )}
      </h1>

      {data.subtitle && (
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 leading-relaxed">
          {data.subtitle}
        </p>
      )}

      {(data.primaryCtaText || data.secondaryCtaText) && (
        <div className="mt-10 flex justify-center gap-4 flex-wrap">
          {data.primaryCtaText && data.primaryCtaUrl && (
            <a
              href={data.primaryCtaUrl}
              className="rounded-xl bg-gradient-to-r from-teal-400 to-cyan-300 px-8 py-3 font-semibold text-slate-900 shadow-xl shadow-teal-400/40 hover:brightness-110 transition-all"
            >
              {data.primaryCtaText}
            </a>
          )}
          {data.secondaryCtaText && data.secondaryCtaUrl && (
            <a
              href={data.secondaryCtaUrl}
              className="rounded-xl border border-slate-200/40 px-8 py-3 font-semibold text-slate-100 bg-white/5 hover:bg-white/10 transition-all"
            >
              {data.secondaryCtaText}
            </a>
          )}
        </div>
      )}
    </section>
  );
}
