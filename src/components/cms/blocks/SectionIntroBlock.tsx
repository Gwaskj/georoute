import type { SectionIntroData } from "@/lib/types/cms";

export default function SectionIntroBlock({ data }: { data: SectionIntroData }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-100">{data.title}</h2>
      {data.description && (
        <p className="text-xs text-slate-400 mt-1">{data.description}</p>
      )}
    </div>
  );
}
