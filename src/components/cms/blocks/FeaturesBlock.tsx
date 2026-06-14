import type { FeaturesData } from "@/lib/types/cms";

const GRADIENTS: Record<string, string> = {
  teal: "from-teal-500/30 to-teal-400/10",
  indigo: "from-indigo-500/30 to-indigo-400/10",
  purple: "from-purple-500/30 to-purple-400/10",
  emerald: "from-emerald-500/30 to-emerald-400/10",
};

const SHADOWS: Record<string, string> = {
  teal: "shadow-teal-500/40",
  indigo: "shadow-indigo-500/40",
  purple: "shadow-purple-500/40",
  emerald: "shadow-emerald-500/40",
};

export default function FeaturesBlock({ data }: { data: FeaturesData }) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        {data.title && (
          <h2 className="text-center text-4xl font-bold text-white">{data.title}</h2>
        )}
        {data.subtitle && (
          <p className="mt-3 text-center text-slate-400 max-w-2xl mx-auto">
            {data.subtitle}
          </p>
        )}

        {data.items.length > 0 && (
          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {data.items.map((item) => {
              const gradient = GRADIENTS[item.gradient] ?? GRADIENTS.teal;
              const shadow = SHADOWS[item.gradient] ?? SHADOWS.teal;
              return (
                <div
                  key={item.id}
                  className={`relative rounded-2xl p-6 bg-gradient-to-br ${gradient} border border-slate-800 backdrop-blur-sm shadow-xl ${shadow} hover:scale-[1.02] hover:shadow-2xl transition-all duration-200`}
                >
                  <div className="absolute inset-0 opacity-[0.06] bg-[url('/grid.svg')] bg-cover rounded-2xl" />
                  <h3 className="relative text-xl font-semibold text-white">{item.title}</h3>
                  <p className="relative mt-2 text-slate-300 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
