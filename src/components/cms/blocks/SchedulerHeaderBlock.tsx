import type { SchedulerHeaderData } from "@/lib/types/cms";

export default function SchedulerHeaderBlock({
  data,
  isFree,
}: {
  data: SchedulerHeaderData;
  isFree?: boolean;
}) {
  const subtitle =
    isFree === false
      ? (data.proSubtitle ?? "Pro mode — data stored in your GeoRoute workspace.")
      : (data.freeSubtitle ?? "Free mode — data stored in this browser session only.");

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-100">{data.title}</h1>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}
