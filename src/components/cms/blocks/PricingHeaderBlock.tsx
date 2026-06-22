import type { PricingHeaderData } from "@/lib/types/cms";

export default function PricingHeaderBlock({ data }: { data: PricingHeaderData }) {
  return (
    <div className="mb-10 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
        {data.title}
      </h1>
      {data.subtitle && (
        <p className="mt-3 text-sm text-slate-300 sm:text-base">{data.subtitle}</p>
      )}
    </div>
  );
}
