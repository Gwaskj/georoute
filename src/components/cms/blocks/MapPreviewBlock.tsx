import type { MapPreviewData } from "@/lib/types/cms";

export default function MapPreviewBlock({ data }: { data: MapPreviewData }) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6 text-center">
        {data.title && (
          <h2 className="text-3xl font-bold text-white mb-4">{data.title}</h2>
        )}
        {data.subtitle && (
          <p className="text-slate-400 max-w-2xl mx-auto mb-12">{data.subtitle}</p>
        )}

        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-slate-800 bg-slate-900/70">
          {data.imageUrl ? (
            <img
              src={data.imageUrl}
              alt={data.imageAlt ?? "Map preview"}
              className="w-full h-auto"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-600 text-sm">
              No image set
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
