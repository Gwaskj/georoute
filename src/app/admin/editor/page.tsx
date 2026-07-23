"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import type {
  AnyBlock,
  BlockType,
  CtaData,
  FeatureItem,
  FeaturesData,
  HeroData,
  MapPreviewData,
  PricingHeaderData,
  SchedulerHeaderData,
  SectionIntroData,
} from "@/lib/types/cms";
import HeroBlock from "@/components/cms/blocks/HeroBlock";
import FeaturesBlock from "@/components/cms/blocks/FeaturesBlock";
import MapPreviewBlock from "@/components/cms/blocks/MapPreviewBlock";
import CtaBlock from "@/components/cms/blocks/CtaBlock";
import PricingHeaderBlock from "@/components/cms/blocks/PricingHeaderBlock";
import SchedulerHeaderBlock from "@/components/cms/blocks/SchedulerHeaderBlock";
import SectionIntroBlock from "@/components/cms/blocks/SectionIntroBlock";

type PageId = "home" | "pricing" | "scheduler";

// ─── UI helpers ───────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 placeholder-slate-500";

function Field({
  label,
  value,
  onChange,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-slate-400 mb-1">
        {label}
      </label>
      {textarea ? (
        <textarea
          className={`${inputCls} resize-none`}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

// ─── Block labels ─────────────────────────────────────────────

const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero",
  features: "Features",
  map_preview: "Map Preview",
  cta: "Call to Action",
  pricing_header: "Pricing Header",
  scheduler_header: "Page Header",
  section_intro: "Section Text",
};

// One-line explanation of what each block renders, used both as a button
// tooltip and as a helper line above the block's edit form.
const BLOCK_DESCRIPTIONS: Record<BlockType, string> = {
  hero: "Large banner at the top of the page: title, subtitle, badge, and one or two buttons.",
  features: "A 2-column grid of feature cards below an optional title/subtitle. Add one item per card — the gradient is just a visual accent and has no functional effect.",
  map_preview: "A title/subtitle with a single preview image underneath (e.g. a screenshot of the map).",
  cta: "A call-to-action banner with a title, subtitle, and one or two buttons — typically used near the bottom of a page.",
  pricing_header: "The title/subtitle shown above the plan cards on the Pricing page. Plan prices, features, and Stripe sync are edited separately in Admin → Pricing, not here.",
  scheduler_header: "The title and subtitle at the top of the Scheduler page. Free and Pro users can see different subtitle text.",
  section_intro: "A simple title + description used as a section header (e.g. above 'Generate schedule' on the Scheduler page).",
};

// ─── Create new blocks ────────────────────────────────────────

function createBlock(type: BlockType): AnyBlock {
  const id = crypto.randomUUID();
  switch (type) {
    case "hero":
      return {
        id,
        type,
        visible: true,
        data: {
          title: "New Hero",
          titleAccent: "",
          subtitle: "",
          badge: "",
          primaryCtaText: "Get Started",
          primaryCtaUrl: "/",
          secondaryCtaText: "",
          secondaryCtaUrl: "/",
        },
      };
    case "features":
      return {
        id,
        type,
        visible: true,
        data: {
          title: "Features",
          subtitle: "",
          items: [
            {
              id: crypto.randomUUID(),
              title: "Feature 1",
              description: "",
              gradient: "teal",
            },
          ],
        },
      };
    case "map_preview":
      return {
        id,
        type,
        visible: true,
        data: { title: "Map Preview", subtitle: "", imageUrl: "", imageAlt: "" },
      };
    case "cta":
      return {
        id,
        type,
        visible: true,
        data: {
          title: "Get Started",
          subtitle: "",
          primaryBtnText: "Go",
          primaryBtnUrl: "/",
          secondaryBtnText: "",
          secondaryBtnUrl: "/",
        },
      };
    case "pricing_header":
      return {
        id,
        type,
        visible: true,
        data: { title: "Pricing", subtitle: "" },
      };
    case "scheduler_header":
      return {
        id,
        type,
        visible: true,
        data: {
          title: "GeoRoutes Scheduler",
          freeSubtitle: "Free mode — data stored in this browser session only.",
          proSubtitle: "Pro mode — data stored in your GeoRoutes workspace.",
        },
      };
    case "section_intro":
      return {
        id,
        type,
        visible: true,
        data: { title: "Section Title", description: "" },
      };
  }
}

// ─── Edit forms ───────────────────────────────────────────────

function HeroEditForm({
  data,
  onChange,
}: {
  data: HeroData;
  onChange: (d: Partial<HeroData>) => void;
}) {
  return (
    <>
      <Field
        label="Badge"
        value={data.badge ?? ""}
        onChange={(v) => onChange({ badge: v })}
      />
      <Field
        label="Title"
        value={data.title ?? ""}
        onChange={(v) => onChange({ title: v })}
      />
      <Field
        label="Title Accent (gradient)"
        value={data.titleAccent ?? ""}
        onChange={(v) => onChange({ titleAccent: v })}
      />
      <Field
        label="Subtitle"
        value={data.subtitle ?? ""}
        onChange={(v) => onChange({ subtitle: v })}
        textarea
      />
      <Field
        label="Primary Button Text"
        value={data.primaryCtaText ?? ""}
        onChange={(v) => onChange({ primaryCtaText: v })}
      />
      <Field
        label="Primary Button URL"
        value={data.primaryCtaUrl ?? ""}
        onChange={(v) => onChange({ primaryCtaUrl: v })}
      />
      <Field
        label="Secondary Button Text"
        value={data.secondaryCtaText ?? ""}
        onChange={(v) => onChange({ secondaryCtaText: v })}
      />
      <Field
        label="Secondary Button URL"
        value={data.secondaryCtaUrl ?? ""}
        onChange={(v) => onChange({ secondaryCtaUrl: v })}
      />
    </>
  );
}

function FeaturesEditForm({
  data,
  onChange,
}: {
  data: FeaturesData;
  onChange: (d: Partial<FeaturesData>) => void;
}) {
  const updateItem = (idx: number, partial: Partial<FeatureItem>) => {
    onChange({
      items: data.items.map((it, i) =>
        i === idx ? { ...it, ...partial } : it
      ),
    });
  };

  return (
    <>
      <Field
        label="Section Title"
        value={data.title ?? ""}
        onChange={(v) => onChange({ title: v })}
      />
      <Field
        label="Subtitle"
        value={data.subtitle ?? ""}
        onChange={(v) => onChange({ subtitle: v })}
        textarea
      />

      <p className="text-xs font-medium text-slate-400 mb-2 mt-1">
        Feature Items
      </p>
      <div className="space-y-3">
        {data.items.map((item, idx) => (
          <div
            key={item.id}
            className="rounded-lg border border-slate-700 p-3 bg-slate-800/40"
          >
            <input
              className={`${inputCls} mb-2`}
              placeholder="Title"
              value={item.title}
              onChange={(e) => updateItem(idx, { title: e.target.value })}
            />
            <textarea
              className={`${inputCls} resize-none mb-2`}
              placeholder="Description"
              rows={2}
              value={item.description}
              onChange={(e) =>
                updateItem(idx, { description: e.target.value })
              }
            />
            <div className="flex items-center gap-2">
              <select
                className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-2 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                value={item.gradient}
                title="Card background color accent — visual only, no functional effect"
                onChange={(e) =>
                  updateItem(idx, {
                    gradient: e.target.value as FeatureItem["gradient"],
                  })
                }
              >
                <option value="teal">Card color: Teal</option>
                <option value="indigo">Card color: Indigo</option>
                <option value="purple">Card color: Purple</option>
                <option value="emerald">Card color: Emerald</option>
              </select>
              <button
                onClick={() =>
                  onChange({ items: data.items.filter((_, i) => i !== idx) })
                }
                className="text-xs text-red-400 hover:text-red-300 px-2 py-2 rounded-lg border border-red-500/30 hover:border-red-500/60 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() =>
          onChange({
            items: [
              ...data.items,
              {
                id: crypto.randomUUID(),
                title: "New Feature",
                description: "",
                gradient: "teal",
              },
            ],
          })
        }
        className="mt-2 w-full text-xs text-teal-400 hover:text-teal-300 border border-teal-500/30 hover:border-teal-500/60 rounded-lg py-2 transition-colors"
      >
        + Add Item
      </button>
    </>
  );
}

function MapPreviewEditForm({
  data,
  onChange,
}: {
  data: MapPreviewData;
  onChange: (d: Partial<MapPreviewData>) => void;
}) {
  return (
    <>
      <Field
        label="Title"
        value={data.title ?? ""}
        onChange={(v) => onChange({ title: v })}
      />
      <Field
        label="Subtitle"
        value={data.subtitle ?? ""}
        onChange={(v) => onChange({ subtitle: v })}
        textarea
      />
      <Field
        label="Image URL"
        value={data.imageUrl ?? ""}
        onChange={(v) => onChange({ imageUrl: v })}
      />
      <Field
        label="Image Alt Text"
        value={data.imageAlt ?? ""}
        onChange={(v) => onChange({ imageAlt: v })}
      />
    </>
  );
}

function CtaEditForm({
  data,
  onChange,
}: {
  data: CtaData;
  onChange: (d: Partial<CtaData>) => void;
}) {
  return (
    <>
      <Field
        label="Title"
        value={data.title ?? ""}
        onChange={(v) => onChange({ title: v })}
      />
      <Field
        label="Subtitle"
        value={data.subtitle ?? ""}
        onChange={(v) => onChange({ subtitle: v })}
        textarea
      />
      <Field
        label="Primary Button Text"
        value={data.primaryBtnText ?? ""}
        onChange={(v) => onChange({ primaryBtnText: v })}
      />
      <Field
        label="Primary Button URL"
        value={data.primaryBtnUrl ?? ""}
        onChange={(v) => onChange({ primaryBtnUrl: v })}
      />
      <Field
        label="Secondary Button Text"
        value={data.secondaryBtnText ?? ""}
        onChange={(v) => onChange({ secondaryBtnText: v })}
      />
      <Field
        label="Secondary Button URL"
        value={data.secondaryBtnUrl ?? ""}
        onChange={(v) => onChange({ secondaryBtnUrl: v })}
      />
    </>
  );
}

function PricingHeaderEditForm({
  data,
  onChange,
}: {
  data: PricingHeaderData;
  onChange: (d: Partial<PricingHeaderData>) => void;
}) {
  return (
    <>
      <Field
        label="Title"
        value={data.title ?? ""}
        onChange={(v) => onChange({ title: v })}
      />
      <Field
        label="Subtitle"
        value={data.subtitle ?? ""}
        onChange={(v) => onChange({ subtitle: v })}
        textarea
      />
    </>
  );
}

function SchedulerHeaderEditForm({
  data,
  onChange,
}: {
  data: SchedulerHeaderData;
  onChange: (d: Partial<SchedulerHeaderData>) => void;
}) {
  return (
    <>
      <Field
        label="Page Title"
        value={data.title ?? ""}
        onChange={(v) => onChange({ title: v })}
      />
      <Field
        label="Free-tier subtitle"
        value={data.freeSubtitle ?? ""}
        onChange={(v) => onChange({ freeSubtitle: v })}
      />
      <Field
        label="Pro-tier subtitle"
        value={data.proSubtitle ?? ""}
        onChange={(v) => onChange({ proSubtitle: v })}
      />
    </>
  );
}

function SectionIntroEditForm({
  data,
  onChange,
}: {
  data: SectionIntroData;
  onChange: (d: Partial<SectionIntroData>) => void;
}) {
  return (
    <>
      <Field
        label="Section Title"
        value={data.title ?? ""}
        onChange={(v) => onChange({ title: v })}
      />
      <Field
        label="Description"
        value={data.description ?? ""}
        onChange={(v) => onChange({ description: v })}
        textarea
      />
    </>
  );
}

// ─── Editor preview with resize handles ───────────────────────

function renderBlock(block: AnyBlock) {
  switch (block.type) {
    case "hero":       return <HeroBlock data={block.data as HeroData} />;
    case "features":   return <FeaturesBlock data={block.data as FeaturesData} />;
    case "map_preview":return <MapPreviewBlock data={block.data as MapPreviewData} />;
    case "cta":        return <CtaBlock data={block.data as CtaData} />;
    case "pricing_header": return <PricingHeaderBlock data={block.data as PricingHeaderData} />;
    case "scheduler_header": return <SchedulerHeaderBlock data={block.data as SchedulerHeaderData} />;
    case "section_intro": return <SectionIntroBlock data={block.data as SectionIntroData} />;
    default: return null;
  }
}

function BlockResizeHandle({
  blockId,
  py,
  onResize,
}: {
  blockId: string;
  py: number;
  onResize: (id: string, py: number) => void;
}) {
  const startY = useRef<number | null>(null);
  const startPy = useRef(0);

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    startY.current = e.clientY;
    startPy.current = py;

    function onMove(e: MouseEvent) {
      if (startY.current === null) return;
      const delta = e.clientY - startY.current;
      onResize(blockId, Math.max(0, Math.min(160, Math.round((startPy.current + delta) / 4) * 4)));
    }
    function onUp() {
      startY.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div
      className="h-5 flex items-center justify-center cursor-ns-resize opacity-0 hover:opacity-100 transition-opacity bg-teal-500/10 border-t border-dashed border-teal-500/40"
      onMouseDown={handleMouseDown}
      title={`Drag to adjust spacing (${py}px)`}
    >
      <span className="text-[9px] text-teal-400/70 select-none font-mono">
        ↕ {py}px
      </span>
    </div>
  );
}

function EditorPreview({
  blocks,
  onResize,
}: {
  blocks: AnyBlock[];
  onResize: (id: string, py: number) => void;
}) {
  const visible = blocks.filter((b) => b.visible);
  return (
    <>
      {visible.map((block, i) => (
        <div key={block.id}>
          {i > 0 && block.type !== "cta" && (
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />
          )}
          <div
            style={
              block.style?.py
                ? { paddingTop: block.style.py, paddingBottom: block.style.py }
                : undefined
            }
          >
            {renderBlock(block)}
          </div>
          <BlockResizeHandle blockId={block.id} py={block.style?.py ?? 0} onResize={onResize} />
        </div>
      ))}
    </>
  );
}

// ─── Main editor ──────────────────────────────────────────────

export default function EditorPage() {
  const isAdmin = useIsAdmin();
  const [pageId, setPageId] = useState<PageId>("home");
  const [blocks, setBlocks] = useState<AnyBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Prevent the page behind the fixed overlay from scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    setLoading(true);
    setSelectedId(null);
    supabase
      .from("page_content")
      .select("blocks")
      .eq("page_id", pageId)
      .maybeSingle()
      .then(({ data }) => {
        setBlocks((data?.blocks as AnyBlock[]) ?? []);
        setLoading(false);
      });
  }, [pageId]);

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  const updateBlockData = useCallback(
    (id: string, partial: Record<string, unknown>) => {
      setBlocks((bs) =>
        bs.map((b) =>
          b.id === id
            ? ({ ...b, data: { ...(b.data as Record<string, unknown>), ...partial } } as AnyBlock)
            : b
        )
      );
    },
    []
  );

  const toggleVisibility = (id: string) => {
    setBlocks((bs) =>
      bs.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b))
    );
  };

  const deleteBlock = (id: string) => {
    if (selectedId === id) setSelectedId(null);
    setBlocks((bs) => bs.filter((b) => b.id !== id));
  };

  const reorderBlocks = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setBlocks((bs) => {
      const from = bs.findIndex((b) => b.id === fromId);
      const to = bs.findIndex((b) => b.id === toId);
      if (from === -1 || to === -1) return bs;
      const next = [...bs];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const addBlock = (type: BlockType) => {
    const block = createBlock(type);
    setBlocks((bs) => [...bs, block]);
    setSelectedId(block.id);
  };

  const updateBlockStyle = useCallback((id: string, py: number) => {
    setBlocks((bs) =>
      bs.map((b) => (b.id === id ? { ...b, style: { py } } : b))
    );
  }, []);

  const save = async () => {
    setSaving(true);
    setSaveMsg(null);
    const { error } = await supabase.from("page_content").upsert({
      page_id: pageId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      blocks: blocks as any,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      setSaveMsg(`Error: ${error.message}`);
    } else {
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  if (isAdmin === null) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-16 z-10 flex bg-slate-950 text-slate-50 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-80 flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800">
        {/* Fixed top: page selector + save — never scrolls away */}
        <div className="p-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-sm font-semibold text-slate-100">
              Page Editor
            </h1>
            <button
              onClick={save}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-400 text-slate-900 font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>

          {saveMsg && (
            <p
              className={`text-xs mb-2 ${
                saveMsg.startsWith("Error") ? "text-red-400" : "text-teal-400"
              }`}
            >
              {saveMsg}
            </p>
          )}

          <div className="flex gap-2">
            {(["home", "pricing", "scheduler"] as PageId[]).map((p) => (
              <button
                key={p}
                onClick={() => setPageId(p)}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors capitalize ${
                  pageId === p
                    ? "border-teal-500 bg-teal-500/15 text-teal-400"
                    : "border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                {p === "home" ? "Home" : p === "pricing" ? "Pricing" : "Scheduler"}
              </button>
            ))}
          </div>

          {pageId === "pricing" && (
            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              <p className="text-[11px] text-amber-200">
                This only edits the header text/hero/CTA copy on the pricing
                page. To change plan prices, features, or sync with Stripe,
                use the dedicated pricing editor.
              </p>
              <Link
                href="/admin/pricing"
                className="mt-1.5 inline-block text-xs font-medium text-teal-400 hover:text-teal-300 underline"
              >
                Open plan &amp; Stripe editor →
              </Link>
            </div>
          )}
        </div>

        {/* Single scrollable body — blocks + add buttons + edit form */}
        <div className="flex-1 overflow-y-auto">
          {/* Block list */}
          <div className="p-3 border-b border-slate-800">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Blocks
            </p>

            {loading ? (
              <p className="text-xs text-slate-500 py-2">Loading…</p>
            ) : blocks.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                No blocks yet. Add one below.
              </p>
            ) : (
              <div className="space-y-1">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => setDraggedId(block.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedId) {
                        reorderBlocks(draggedId, block.id);
                        setDraggedId(null);
                      }
                    }}
                    onClick={() => setSelectedId(block.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors select-none ${
                      selectedId === block.id
                        ? "bg-teal-500/15 border border-teal-500/40 text-teal-300"
                        : "bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span
                      className="text-slate-600 cursor-grab text-base leading-none"
                      title="Drag to reorder"
                    >
                      &#8801;
                    </span>
                    <span className="flex-1 text-xs font-medium truncate">
                      {BLOCK_LABELS[block.type]}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(block.id);
                      }}
                      className={`text-xs transition-colors leading-none ${
                        block.visible
                          ? "text-slate-400 hover:text-slate-200"
                          : "text-slate-600 hover:text-slate-400"
                      }`}
                      title={block.visible ? "Hide block" : "Show block"}
                    >
                      {block.visible ? "●" : "○"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBlock(block.id);
                      }}
                      className="text-xs text-slate-600 hover:text-red-400 transition-colors leading-none"
                      title="Delete block"
                    >
                      &#10005;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add block */}
            <div className="mt-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Add Block
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  pageId === "scheduler"
                    ? (["scheduler_header", "section_intro"] as BlockType[])
                    : pageId === "pricing"
                    ? (["pricing_header", "hero", "cta"] as BlockType[])
                    : (["hero", "features", "map_preview", "cta"] as BlockType[])
                ).map((type) => (
                  <button
                    key={type}
                    onClick={() => addBlock(type)}
                    title={BLOCK_DESCRIPTIONS[type]}
                    className="text-xs px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
                  >
                    + {BLOCK_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className="p-4">
          {!selectedBlock ? (
            <p className="text-xs text-slate-500 text-center mt-6">
              Select a block above to edit it.
            </p>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-200 mb-1">
                {BLOCK_LABELS[selectedBlock.type]}
              </p>
              <p className="text-xs text-slate-500 mb-4">
                {BLOCK_DESCRIPTIONS[selectedBlock.type]}
              </p>

              {selectedBlock.type === "hero" && (
                <HeroEditForm
                  data={selectedBlock.data as HeroData}
                  onChange={(d) =>
                    updateBlockData(
                      selectedBlock.id,
                      d as Record<string, unknown>
                    )
                  }
                />
              )}
              {selectedBlock.type === "features" && (
                <FeaturesEditForm
                  data={selectedBlock.data as FeaturesData}
                  onChange={(d) =>
                    updateBlockData(
                      selectedBlock.id,
                      d as Record<string, unknown>
                    )
                  }
                />
              )}
              {selectedBlock.type === "map_preview" && (
                <MapPreviewEditForm
                  data={selectedBlock.data as MapPreviewData}
                  onChange={(d) =>
                    updateBlockData(
                      selectedBlock.id,
                      d as Record<string, unknown>
                    )
                  }
                />
              )}
              {selectedBlock.type === "cta" && (
                <CtaEditForm
                  data={selectedBlock.data as CtaData}
                  onChange={(d) =>
                    updateBlockData(
                      selectedBlock.id,
                      d as Record<string, unknown>
                    )
                  }
                />
              )}
              {selectedBlock.type === "pricing_header" && (
                <PricingHeaderEditForm
                  data={selectedBlock.data as PricingHeaderData}
                  onChange={(d) =>
                    updateBlockData(
                      selectedBlock.id,
                      d as Record<string, unknown>
                    )
                  }
                />
              )}
              {selectedBlock.type === "scheduler_header" && (
                <SchedulerHeaderEditForm
                  data={selectedBlock.data as SchedulerHeaderData}
                  onChange={(d) =>
                    updateBlockData(
                      selectedBlock.id,
                      d as Record<string, unknown>
                    )
                  }
                />
              )}
              {selectedBlock.type === "section_intro" && (
                <SectionIntroEditForm
                  data={selectedBlock.data as SectionIntroData}
                  onChange={(d) =>
                    updateBlockData(
                      selectedBlock.id,
                      d as Record<string, unknown>
                    )
                  }
                />
              )}
            </>
          )}
        </div>
        {/* end scrollable body */}
        </div>
      </aside>

      {/* ── Live Preview ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="relative min-h-full w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.20),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.15),transparent_70%)]" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-600 text-sm">
              Loading preview…
            </div>
          ) : (
            <EditorPreview blocks={blocks} onResize={updateBlockStyle} />
          )}
        </div>
      </main>
    </div>
  );
}
