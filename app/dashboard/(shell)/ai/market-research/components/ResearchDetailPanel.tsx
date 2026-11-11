"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock,
  Copy,
  MapPin,
  Scissors,
  Shirt,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Opportunity, EvidenceRecord } from "@/lib/ai/market-radar/types";

interface ResearchDetailPanelProps {
  opportunity: Opportunity | null;
  evidenceRegistry: Record<string, EvidenceRecord>;
  onClose: () => void;
}

type OpenPanelProps = Omit<ResearchDetailPanelProps, "opportunity"> & {
  opportunity: Opportunity;
};

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9779AD] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFCF6]";

const CONFIDENCE: Record<string, { label: string; dot: string; background: string }> = {
  HIGH: { label: "High", dot: "bg-[#64816D]", background: "bg-[#F1F5ED]" },
  MODERATE: { label: "Moderate", dot: "bg-[#8B719C]", background: "bg-[#F3EFF7]" },
  LIMITED: { label: "Limited", dot: "bg-[#9B9386]", background: "bg-[#F5F2EC]" },
  EVENT_HYPOTHESIS: { label: "Event-led hypothesis", dot: "bg-[#B18B52]", background: "bg-[#FAF3E5]" },
};

function isHex(value: string) {
  return /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value);
}

function indexValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : null;
}

function moneyValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value)
    : "Not available";
}

function safeExternalUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function friendlyType(value: string) {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function SectionHeading({
  id,
  title,
  note,
}: {
  id?: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
      <h3 id={id} className="font-serif text-[23px] font-normal leading-tight tracking-[-0.035em] text-[#403A32]">
        {title}
      </h3>
      {note && <p className="text-[11px] leading-relaxed text-[#776D60]">{note}</p>}
    </div>
  );
}

function StyleReference({ src, title }: { src?: string | null; title: string }) {
  const [failed, setFailed] = React.useState(false);
  return (
    <figure className="relative m-0 w-[96px] shrink-0 sm:w-[154px]">
      <div className="pointer-events-none absolute inset-x-0 top-1 bottom-6 rotate-[4deg] rounded-[16px] bg-[#E8DEEC]" aria-hidden="true" />
      <div className="relative rounded-[16px] border border-[#E6DDCF] bg-[#FFFFFF] p-1.5 shadow-[0_5px_16px_-12px_rgba(77,55,31,0.4)]">
        {src && !failed ? (
          <img
            src={src}
            alt={`Style reference for ${title}`}
            className="aspect-[3/4] w-full rounded-[11px] bg-[#F3EEE5] object-cover"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-[11px] bg-[#F3EEE5] text-[#8D785E]">
            <Shirt className="h-9 w-9 sm:h-12 sm:w-12" strokeWidth={1} aria-hidden="true" />
            <span className="px-1 text-center text-[10px] uppercase tracking-[0.13em]">Style study</span>
          </div>
        )}
      </div>
      <figcaption className="relative mt-2 text-center font-serif text-[12px] italic text-[#786D5D]">
        Visual reference
      </figcaption>
    </figure>
  );
}

function SeasonalityChart({ data }: { data: NonNullable<Opportunity["chartData"]> }) {
  const chartId = React.useId().replace(/:/g, "");
  const patternId = `estimate-${chartId}`;
  const width = Math.max(360, data.length * 48 + 48);
  const left = 32;
  const top = 24;
  const plotHeight = 130;
  const bottom = top + plotHeight;
  const step = (width - left - 16) / Math.max(data.length, 1);
  const values = data.map((point) => indexValue(point.value));
  const measured = values.filter((value): value is number => value !== null);
  const maximum = measured.length ? Math.max(...measured) : null;
  const hasEstimates = data.some((point) => point.isEstimated);

  return (
    <figure className="m-0 rounded-[18px] border border-[#E8E1EC] bg-[#FCFAFD] p-4 sm:p-5">
      <figcaption className="mb-5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#776B80]">
        <span>Relative interest · 0–100</span>
        {hasEstimates && (
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#AA93BB]" aria-hidden="true" />Observed</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm border border-[#AA93BB] bg-[#EFE7F4]" aria-hidden="true" />Estimated</span>
          </span>
        )}
      </figcaption>

      <div className={`overflow-x-auto rounded-md pb-1 ${FOCUS}`} tabIndex={0} role="region" aria-label="Seasonality chart; scroll horizontally to see all periods">
        <svg width={width} height={204} viewBox={`0 0 ${width} 204`} className="block min-w-full" role="img" aria-labelledby={`${chartId}-title ${chartId}-description`}>
          <title id={`${chartId}-title`}>Relative interest by period</title>
          <desc id={`${chartId}-description`}>Values range from zero to one hundred. Striped bars indicate estimates. Missing or invalid values appear as dashes. Exact values are available below.</desc>
          <defs>
            <pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <rect width="6" height="6" fill="#EEE6F3" />
              <rect width="2" height="6" fill="#BAA6CC" />
            </pattern>
          </defs>
          {[100, 50, 0].map((tick) => {
            const y = bottom - (tick / 100) * plotHeight;
            return (
              <g key={tick}>
                <line x1={left} x2={width - 8} y1={y} y2={y} stroke="#E7DFEC" strokeDasharray={tick === 0 ? undefined : "3 4"} />
                <text x={left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#776B80">{tick}</text>
              </g>
            );
          })}
          {data.map((point, index) => {
            const value = values[index];
            const x = left + step * index + step / 2;
            const height = value === null ? 0 : (value / 100) * plotHeight;
            const period = String(point.period);
            const label = period.length > 9 ? `${period.slice(0, 8)}…` : period;
            return (
              <g key={`${point.period}-${index}`}>
                <title>{point.period}: {value === null ? "No valid value" : value}{point.isEstimated ? " (estimated)" : ""}</title>
                {value !== null && (
                  <rect
                    x={x - 12}
                    y={bottom - height}
                    width={24}
                    height={height}
                    rx={3}
                    fill={point.isEstimated ? `url(#${patternId})` : value === maximum ? "#8B719C" : "#C8B9D5"}
                  />
                )}
                <text x={x} y={bottom - height - 7} textAnchor="middle" fontSize="11" fill="#6F5B7F">
                  {value === null ? "—" : Number(value.toFixed(2))}
                </text>
                <text x={x} y={bottom + 22} textAnchor="middle" fontSize="11" fill="#776B80">{label}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-[#776B80]">A relative index, not a count of sales or shoppers.</p>
      <details className="mt-3 border-t border-[#E8E1EC] pt-3">
        <summary className={`w-fit cursor-pointer rounded-md text-[11px] font-medium text-[#715A84] ${FOCUS}`}>View exact values</summary>
        <table className="mt-3 w-full table-fixed border-collapse text-left text-[11px] text-[#6D6176]">
          <caption className="sr-only">Seasonality values and whether each value is estimated</caption>
          <thead><tr className="border-b border-[#E8E1EC]"><th scope="col" className="w-1/2 pb-2 font-medium">Period</th><th scope="col" className="pb-2 font-medium">Index</th><th scope="col" className="pb-2 font-medium">Type</th></tr></thead>
          <tbody>{data.map((point, index) => <tr key={`${point.period}-${index}`} className="border-b border-[#EEE8F2] last:border-0"><th scope="row" className="break-words py-2 pr-2 font-normal [overflow-wrap:anywhere]">{point.period}</th><td className="py-2 tabular-nums">{values[index] ?? "Not available"}</td><td className="py-2">{values[index] === null ? "Unavailable" : point.isEstimated ? "Estimated" : "Observed"}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}

function EvidenceCard({ evidence, index }: { evidence: EvidenceRecord; index: number }) {
  const url = safeExternalUrl(evidence.url);
  return (
    <article className="rounded-[16px] border border-[#E7E3DB] bg-[#FFFFFF] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3EFE7] font-serif text-[13px] text-[#877253]" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-[#7D6C59]">{friendlyType(evidence.type)}</p>
          <h4 className="break-words text-[13px] font-semibold leading-relaxed text-[#474137] [overflow-wrap:anywhere]">{evidence.title}</h4>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-line break-words text-[12px] leading-[1.8] text-[#6E665B] [overflow-wrap:anywhere]">{evidence.observation}</p>
      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 border-t border-[#EFEBE4] pt-3 text-[11px] sm:grid-cols-2">
        {[["Source", evidence.source], ["Coverage", evidence.actualCoverage], ["Period", evidence.measurementPeriod]].map(([label, value]) => (
          <div key={label} className="min-w-0"><dt className="text-[#7A6D5B]">{label}</dt><dd className="mt-0.5 break-words text-[#5F574B] [overflow-wrap:anywhere]">{value || "Not specified"}</dd></div>
        ))}
        {typeof evidence.sampleSize === "number" && Number.isFinite(evidence.sampleSize) && evidence.sampleSize >= 0 && <div><dt className="text-[#7A6D5B]">Sample size</dt><dd className="mt-0.5 text-[#5F574B]">{evidence.sampleSize}</dd></div>}
      </dl>
      {evidence.limitations && <p className="mt-3 border-l-2 border-[#D8C3A1] pl-3 text-[11px] leading-relaxed text-[#806542]"><span className="font-medium">Keep in mind: </span>{evidence.limitations}</p>}
      {url && <a href={url} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-md text-[12px] font-medium text-[#795C8C] underline decoration-[#D7C9E1] underline-offset-4 hover:decoration-[#795C8C] ${FOCUS}`}>Read source<span className="sr-only">: {evidence.title} (opens a new tab)</span><ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></a>}
    </article>
  );
}

function OpenResearchDetailPanel({ opportunity, evidenceRegistry, onClose }: OpenPanelProps) {
  const [mounted, setMounted] = React.useState(false);
  const [copiedHex, setCopiedHex] = React.useState<string | null>(null);
  const [copyError, setCopyError] = React.useState<string | null>(null);
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const sourcesRef = React.useRef<HTMLElement>(null);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = React.useRef(false);
  const copyRequest = React.useRef(0);
  const instanceId = React.useId();

  React.useEffect(() => {
    active.current = true;
    setMounted(true);
    return () => {
      active.current = false;
      copyRequest.current += 1;
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  React.useEffect(() => {
    if (!mounted || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, [mounted]);

  const {
    title, category, thumbnailUrl, moodVibe, whyNow, timing, metrics,
    geographicScope, confidence, confidenceReason, merchandisingDirectives,
  } = opportunity;
  const colorPalette = opportunity.colorPalette ?? [];
  const chartData = opportunity.chartData ?? [];
  const evidenceIds = Array.from(new Set(opportunity.evidenceIds ?? []));
  const linkedEvidence = evidenceIds.map((id) => evidenceRegistry[id]).filter((record): record is EvidenceRecord => Boolean(record));
  const missingEvidenceCount = evidenceIds.length - linkedEvidence.length;
  const strength = CONFIDENCE[confidence] ?? { label: "Not assessed", dot: "bg-[#9B9386]", background: "bg-[#F5F2EC]" };
  const range = metrics?.observedPriceRange;
  const fabrics = merchandisingDirectives?.recommendedFabrics ?? [];
  const sizes = merchandisingDirectives?.targetSizes ?? [];
  const styling = merchandisingDirectives?.stylingTips;
  const testBatch = merchandisingDirectives?.smallTestBatchRecommendation;
  const hasDirectives = fabrics.length > 0 || sizes.length > 0 || Boolean(styling) || Boolean(testBatch);

  const handleCopyHex = async (hex: string, name: string) => {
    if (!isHex(hex)) return;
    const request = ++copyRequest.current;
    setCopyError(null);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(hex);
      if (!active.current || request !== copyRequest.current) return;
      if (copyTimer.current) clearTimeout(copyTimer.current);
      setCopiedHex(hex);
      toast.success(`Copied ${name} (${hex})`);
      copyTimer.current = setTimeout(() => setCopiedHex(null), 2000);
    } catch {
      if (active.current && request === copyRequest.current) {
        const message = "Couldn't copy this colour. You can copy the displayed HEX code manually.";
        setCopyError(message);
        toast.error(message);
      }
    }
  };

  const goToSources = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sourcesRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    sourcesRef.current?.focus({ preventScroll: true });
  };

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={`${instanceId}-title`}
      aria-modal="true"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="fixed inset-0 m-0 h-[100dvh] max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-[#403A32] backdrop:bg-[#2F2923]/30 backdrop:backdrop-blur-[3px]"
      style={{ colorScheme: "light" }}
    >
      <div className="flex h-full w-full justify-end sm:p-3" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <div className="flex h-full min-h-0 w-full max-w-[680px] flex-col overflow-hidden border-[#E8E1D4] bg-[#FFFCF6] shadow-[0_20px_80px_-24px_rgba(42,32,19,0.3)] sm:rounded-[24px] sm:border">
          {/* A permanent, accessible close control; the hero scrolls with the content. */}
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E9E2D6] px-5 pb-3 pt-[max(12px,env(safe-area-inset-top))] sm:px-7">
            <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7E6A51]"><span className="h-px w-5 bg-[#B69A77]" aria-hidden="true" />Market Radar <span className="text-[#A99579]" aria-hidden="true">/</span><span className="font-normal tracking-[0.08em]">Research notes</span></p>
            <button type="button" onClick={onClose} autoFocus aria-label="Close research details" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E7DECF] bg-[#FFFEFB] text-[#7C6D5B] transition-colors hover:bg-[#F1EADD] motion-reduce:transition-none ${FOCUS}`}><X className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" /></button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-6 sm:px-7 sm:pt-7">
            <div className="mb-7 flex items-start gap-5 sm:gap-7">
              <div className="min-w-0 flex-1">
                <p className="mb-2.5 break-words text-[10px] font-medium uppercase tracking-[0.18em] text-[#88704E]">{category}</p>
                <h2 id={`${instanceId}-title`} className="break-words font-serif text-[28px] font-normal leading-[1.13] tracking-[-0.045em] text-[#3E3830] [overflow-wrap:anywhere] sm:text-[36px]">{title}</h2>
                {moodVibe && <p className="mt-3 font-serif text-[15px] italic leading-relaxed text-[#8F6748]">{moodVibe}</p>}
                <div className="mt-4 space-y-2 text-[11px] leading-relaxed text-[#776D60]">
                  <p className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#937C5E]" aria-hidden="true" /><span className="break-words [overflow-wrap:anywhere]">{geographicScope.actual || "Coverage not specified"}</span></p>
                  {timing.demandWindow && <p className="flex items-start gap-1.5"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#937C5E]" aria-hidden="true" /><span className="break-words [overflow-wrap:anywhere]">{timing.demandWindow}</span></p>}
                </div>
              </div>
              <StyleReference key={thumbnailUrl || "no-image"} src={thumbnailUrl} title={title} />
            </div>

            <section className="border-t border-[#E8E1D5] pt-6">
              <SectionHeading title="Why this matters" />
              <p className="whitespace-pre-line break-words text-[14px] leading-[1.9] text-[#62594C] [overflow-wrap:anywhere]">{whyNow || "No explanation was provided for this opportunity."}</p>
              <div className={`mt-4 rounded-[14px] px-4 py-3.5 ${strength.background}`}>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-[#655D50]"><span className={`h-1.5 w-1.5 rounded-full ${strength.dot}`} aria-hidden="true" />Evidence assessment <span aria-hidden="true">·</span><span>{strength.label}</span></p>
                {confidenceReason && <p className="mt-1.5 text-[12px] leading-[1.75] text-[#6F6659]">{confidenceReason}</p>}
              </div>
            </section>

            {colorPalette.length > 0 && (
              <section className="mt-8">
                <SectionHeading title="A palette to explore" note="Select a swatch to copy its HEX" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {colorPalette.map((color, index) => {
                    const valid = isHex(color.hex);
                    const copied = copiedHex === color.hex;
                    return (
                      <button key={`${color.hex}-${index}`} type="button" disabled={!valid} onClick={() => void handleCopyHex(color.hex, color.name)} aria-label={`Copy ${color.name}, ${color.hex}`} className={`group min-w-0 rounded-[14px] border border-[#E6DFD3] bg-[#FFFFFF] p-2 text-left transition-colors hover:border-[#B7A1C8] disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none ${FOCUS}`}>
                        <span className="relative mb-2.5 block h-[76px] rounded-[9px] border border-black/5" style={{ backgroundColor: valid ? color.hex : "#EEEAE2" }}>
                          <span className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-[#65556F]" aria-hidden="true">{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}</span>
                        </span>
                        <span className="block break-words px-0.5 text-[12px] font-medium leading-snug text-[#544A3D]">{color.name}</span>
                        <span className="mt-1 block break-words px-0.5 text-[11px] leading-relaxed text-[#786F62]">{color.role}</span>
                        <span className="mt-2 block select-text px-0.5 pb-1 font-mono text-[10px] text-[#7B647D]">{valid ? color.hex.toUpperCase() : "Invalid HEX"}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="sr-only" role="status">{copiedHex ? `Copied ${copiedHex}` : ""}</p>
                {copyError && <p role="alert" className="mt-3 text-[11px] leading-relaxed text-[#806542]">{copyError}</p>}
              </section>
            )}

            {chartData.length > 0 && <section className="mt-8"><SectionHeading title="The seasonal picture" note={`${chartData.length} periods in this series`} /><SeasonalityChart data={chartData} /></section>}

            {range && (
              <section className="mt-8">
                <SectionHeading title="Asking-price snapshot" note="Advertised prices" />
                <div className="rounded-[18px] border border-[#E6E8DB] bg-[#F4F5EC] p-4 sm:p-5">
                  <dl className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-3 min-[400px]:gap-3">
                    {[["Lowest", range.min], ["Reference", range.sweetSpot], ["Highest", range.max]].map(([label, value]) => <div key={String(label)} className="min-w-0"><dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#6B6B55]">{label}</dt><dd className="mt-1.5 break-words font-serif text-[24px] tracking-[-0.03em] text-[#4D5640] [overflow-wrap:anywhere]"><span className="mr-1 font-sans text-[11px] tracking-normal text-[#656C54]">{typeof value === "number" && Number.isFinite(value) && value >= 0 ? range.currency : ""}</span>{moneyValue(value)}</dd></div>)}
                  </dl>
                  <p className="mt-4 border-t border-[#DFE3D1] pt-3 text-[11px] leading-relaxed text-[#6E725E]">{typeof range.sampleCount === "number" && Number.isFinite(range.sampleCount) && range.sampleCount >= 0 ? `${range.sampleCount} listings in this sample. ` : ""}These are asking prices, not completed sales. The reference price is indicative.</p>
                </div>
              </section>
            )}

            <section className="mt-8">
              <SectionHeading title="Bring the idea to life" />
              {hasDirectives ? (
                <div className="overflow-hidden rounded-[18px] border border-[#E8E1D5] bg-[#FFFDF9]">
                  {fabrics.length > 0 && <div className="flex gap-3.5 border-b border-[#EEE7DC] p-4 sm:p-5"><Scissors className="mt-0.5 h-4 w-4 shrink-0 text-[#9C815D]" strokeWidth={1.5} aria-hidden="true" /><div className="min-w-0"><h4 className="text-[12px] font-semibold text-[#5A4D3B]">Fabrics to consider</h4><div className="mt-2 flex flex-wrap gap-1.5">{fabrics.map((fabric, index) => <span key={`${fabric}-${index}`} className="rounded-md border border-[#E9E0D1] bg-[#F7F2E8] px-2 py-1 text-[11px] leading-relaxed text-[#7C674D]">{fabric}</span>)}</div></div></div>}
                  {sizes.length > 0 && <div className="border-b border-[#EEE7DC] p-4 sm:p-5"><h4 className="text-[12px] font-semibold text-[#5A4D3B]">Sizes to consider</h4><div className="mt-2 flex flex-wrap gap-1.5">{sizes.map((size, index) => <span key={`${size}-${index}`} className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md border border-[#E5DCCC] bg-white px-2 text-[11px] font-medium text-[#78654B]">{size}</span>)}</div></div>}
                  {styling && <div className="border-b border-[#EEE7DC] p-4 sm:p-5"><h4 className="text-[12px] font-semibold text-[#5A4D3B]">Shape & styling</h4><p className="mt-1.5 whitespace-pre-line text-[12px] leading-[1.8] text-[#776B5A]">{styling}</p></div>}
                  {testBatch && <div className="bg-[#F4EFF7] p-4 sm:p-5"><p className="mb-1 text-[10px] font-medium uppercase tracking-[0.13em] text-[#746080]">Start small</p><h4 className="font-serif text-[20px] tracking-[-0.025em] text-[#675073]">A first test.</h4><p className="mt-2 whitespace-pre-line text-[12px] leading-[1.8] text-[#76647F]">{testBatch}</p></div>}
                </div>
              ) : <p className="text-[12px] leading-relaxed text-[#776D60]">No merchandising guidance was provided for this opportunity.</p>}
            </section>

            <section ref={sourcesRef} tabIndex={-1} aria-labelledby={`${instanceId}-sources`} className={`mt-8 scroll-mt-6 rounded-md ${FOCUS}`}>
              <SectionHeading id={`${instanceId}-sources`} title="Sources & coverage" note={`${linkedEvidence.length} linked ${linkedEvidence.length === 1 ? "record" : "records"}`} />
              {linkedEvidence.length ? <div className="space-y-3">{linkedEvidence.map((evidence, index) => <EvidenceCard key={evidence.id} evidence={evidence} index={index} />)}</div> : <p className="rounded-[14px] border border-[#E8E1D5] bg-white p-4 text-[12px] leading-relaxed text-[#776D60]">No linked evidence records are available for this opportunity.</p>}
              {missingEvidenceCount > 0 && <p className="mt-3 text-[11px] leading-relaxed text-[#806542]">{missingEvidenceCount} linked {missingEvidenceCount === 1 ? "record is" : "records are"} missing from the available research.</p>}
            </section>
          </div>

          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#E8E1D5] bg-[#FFFDF9] px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-7">
            <button type="button" onClick={goToSources} className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg px-1 text-[12px] font-medium text-[#7B667F] ${FOCUS}`}><BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />View sources<ArrowDown className="h-3 w-3" aria-hidden="true" /></button>
            <button type="button" onClick={onClose} className={`min-h-[44px] rounded-xl bg-[#4C5943] px-6 py-2.5 text-[12px] font-medium text-[#FFFFFF] transition-colors hover:bg-[#3C4834] motion-reduce:transition-none ${FOCUS}`}>Done reading</button>
          </footer>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

export function ResearchDetailPanel(props: ResearchDetailPanelProps) {
  if (!props.opportunity) return null;
  return <OpenResearchDetailPanel key={props.opportunity.title} opportunity={props.opportunity} evidenceRegistry={props.evidenceRegistry} onClose={props.onClose} />;
}
