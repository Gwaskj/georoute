import type { CtaData } from "@/lib/types/cms";

export default function CtaBlock({ data }: { data: CtaData }) {
  return (
    <section className="relative py-24 text-center overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-700 via-purple-600 to-teal-500 opacity-95" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_70%)]" />

      <div className="relative mx-auto max-w-4xl px-6">
        <h2 className="text-4xl font-bold text-white drop-shadow-[0_0_25px_rgba(0,0,0,0.6)]">
          {data.title}
        </h2>
        {data.subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-100 leading-relaxed">
            {data.subtitle}
          </p>
        )}

        {(data.primaryBtnText || data.secondaryBtnText) && (
          <div className="mt-10 flex justify-center gap-4 flex-wrap">
            {data.primaryBtnText && data.primaryBtnUrl && (
              <a
                href={data.primaryBtnUrl}
                className="rounded-xl bg-gradient-to-r from-teal-400 to-cyan-300 px-8 py-3 font-semibold text-slate-900 shadow-xl shadow-teal-400/40 hover:brightness-110 transition-all"
              >
                {data.primaryBtnText}
              </a>
            )}
            {data.secondaryBtnText && data.secondaryBtnUrl && (
              <a
                href={data.secondaryBtnUrl}
                className="rounded-xl border border-slate-200/40 px-8 py-3 font-semibold text-slate-100 bg-white/10 hover:bg-white/20 transition-all"
              >
                {data.secondaryBtnText}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
