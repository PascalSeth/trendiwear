"use client";

import * as React from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flame,
  Scissors,
  Shirt,
  Sparkles,
} from "lucide-react";
import type {
  RadarOccasion,
  ProviderOperationalStatus,
} from "@/lib/ai/market-radar/types";

interface MarketRadarRailProps {
  occasions: RadarOccasion[];
  providerStatus: Record<string, ProviderOperationalStatus>;
  onSelectPrompt: (prompt: string) => void;
}

const QUICK_PROMPTS = [
  {
    title: "The T-shirt edit",
    description: "See what's picking up.",
    prompt: "Are T-shirts gaining interest in my area?",
    icon: Shirt,
    iconClass: "bg-[#F8E8DE] text-[#A45D39]",
  },
  {
    title: "Wedding guests",
    description: "Explore the occasion.",
    prompt: "What are wedding guests buying this month?",
    icon: Sparkles,
    iconClass: "bg-[#EEE8F7] text-[#796097]",
  },
  {
    title: "Festival fabrics",
    description: "Get a little ahead.",
    prompt: "What fabrics should I stock for upcoming festivals?",
    icon: Scissors,
    iconClass: "bg-[#E7EFE9] text-[#56735F]",
  },
  {
    title: "Light & everyday",
    description: "Find the easy favourites.",
    prompt: "Which lightweight casual styles are in demand?",
    icon: Flame,
    iconClass: "bg-[#F7EDCF] text-[#8A6D2E]",
  },
] as const;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Keep calendar dates intact rather than shifting them through the browser's timezone.
function getCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  const leapYear =
    yearNumber % 4 === 0 && (yearNumber % 100 !== 0 || yearNumber % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (
    monthNumber < 1 || monthNumber > 12 ||
    dayNumber < 1 || dayNumber > daysInMonth[monthNumber - 1]
  ) return null;

  return {
    iso: `${year}-${month}-${day}`,
    day: String(dayNumber).padStart(2, "0"),
    month: MONTHS[monthNumber - 1],
    year,
    label: `${MONTHS[monthNumber - 1]} ${dayNumber}, ${year}`,
  };
}

function getTimingLabel(phase: string) {
  switch (phase) {
    case "happening_now": return "Happening now";
    case "preparation_window":
    case "prepare_now":
    case "preparing": return "Time to prepare";
    case "upcoming": return "Coming up";
    case "past":
    case "passed":
    case "ended": return "Recently ended";
    default: return "On the calendar";
  }
}

function getSourceStatus(state: string) {
  switch (state) {
    case "available":
      return { label: "Available", dot: "bg-[#64816D]", description: "This source is available for research." };
    case "insufficient_data":
      return { label: "Limited data", dot: "bg-[#B38A43]", description: "There isn't enough relevant data for a reliable finding." };
    case "no_results":
      return { label: "No matches", dot: "bg-[#A7A29A]", description: "No matching results were returned for this search." };
    case "not_configured":
      return { label: "Not connected", dot: "bg-[#A7A29A]", description: "This source isn't connected to your research yet." };
    case "stale":
      return { label: "Needs refresh", dot: "bg-[#B38A43]", description: "The available information needs to be refreshed." };
    case "failed":
    case "error":
      return { label: "Unavailable", dot: "bg-[#B38A43]", description: "This source couldn't be reached for this research." };
    default:
      return { label: "Not available", dot: "bg-[#A7A29A]", description: "Availability has not been confirmed." };
  }
}

function WardrobeIllustration() {
  return (
    <svg
      viewBox="0 0 120 108"
      fill="none"
      className="h-[98px] w-[108px]"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="82" cy="35" r="25" fill="#F6E8CB" />
      <path d="M17 88c20-5 52-6 79-1" stroke="#DCD4C4" strokeWidth="1.3" strokeLinecap="round" />
      <g transform="rotate(-11 56 56)">
        <path d="m39 24-20 12 10 20 11-6v36h38V50l11 6 10-20-20-12-12 6H51l-12-6Z" fill="#FFFEFA" stroke="#837667" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M49 28c2 10 19 11 22 0" stroke="#837667" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M42 78h33M31 37l7 12M87 37l-7 12" stroke="#DDD5C7" strokeWidth="1.3" strokeLinecap="round" />
        <path d="m51 51 6-3 6 3v9l-6 3-6-3v-9Z" fill="#E8EDDF" />
        <path d="m54 55 3 2 4-3" stroke="#6D8063" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="m99 64 2.5 6.5L108 73l-6.5 2.5L99 82l-2.5-6.5L90 73l6.5-2.5L99 64Z" fill="#C48359" />
      <path d="M17 18v9m-4.5-4.5h9" stroke="#B79E75" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="108" cy="47" r="2" fill="#B7C2AB" />
    </svg>
  );
}

function OccasionRow({ occasion }: { occasion: RadarOccasion }) {
  const date = getCalendarDate(occasion.startDate);
  const isHappening = occasion.timingPhase === "happening_now";
  const hasLeadTime =
    Number.isFinite(occasion.preparationDaysBefore) && occasion.preparationDaysBefore > 0;

  return (
    <li className="relative grid min-w-0 grid-cols-[52px_minmax(0,1fr)] gap-3 py-5 first:pt-1 last:pb-1 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-[#EAE5DB]">
      <div className="pt-0.5 text-center">
        {date ? (
          <time dateTime={date.iso} aria-label={date.label} className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8D6C51]">{date.month}</span>
            <span className="mt-0.5 block font-serif text-[35px] leading-none tracking-[-0.06em] text-[#38352F]">{date.day}</span>
            <span className="mt-1 block text-[11px] text-[#776D60]">{date.year}</span>
          </time>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-[#776D60]">
            <Calendar className="h-5 w-5" aria-hidden="true" />
            <span className="text-[11px]">Date TBC</span>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-medium ${isHappening ? "text-[#54755B]" : "text-[#8A6E50]"}`}>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isHappening ? "bg-[#64816D]" : "bg-[#C5A77F]"}`} aria-hidden="true" />
          {getTimingLabel(occasion.timingPhase)}
        </div>
        <h3 className="break-words text-[14px] font-semibold leading-snug tracking-[-0.015em] text-[#35332E]">
          {occasion.name}
        </h3>
        {occasion.clothingImplications && (
          <p className="mt-1.5 break-words text-[12px] leading-[1.7] text-[#766F65]">
            {occasion.clothingImplications}
          </p>
        )}
        {hasLeadTime && (
          <p className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-[#776C5F]">
            <Clock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            <span>Allow {occasion.preparationDaysBefore} {occasion.preparationDaysBefore === 1 ? "day" : "days"} to prepare</span>
          </p>
        )}
      </div>
    </li>
  );
}

export function MarketRadarRail({
  occasions,
  providerStatus,
  onSelectPrompt,
}: MarketRadarRailProps) {
  const instanceId = React.useId();
  const [showAllOccasions, setShowAllOccasions] = React.useState(false);
  const providers = Object.values(providerStatus);
  const availableCount = providers.filter((provider) => provider.state === "available").length;
  const visibleOccasions = showAllOccasions ? occasions : occasions.slice(0, 3);
  const hiddenOccasionCount = Math.max(0, occasions.length - 3);

  return (
    <aside
      aria-label="Market calendar and inspiration"
      className="w-full min-w-0 space-y-4 text-[#35332E] antialiased"
      style={{ colorScheme: "light" }}
    >
      {/* Warm paper, editorial dates, and an intentionally quiet fashion sketch. */}
      <section
        aria-labelledby={`${instanceId}-calendar-heading`}
        className="relative isolate overflow-hidden rounded-[22px] border border-[#E8E2D6] bg-[#FFFCF6] shadow-[0_3px_16px_-10px_rgba(71,53,32,0.18)]"
      >
        <div className="relative px-5 pb-5 pt-6">
          <div className="pointer-events-none absolute right-2 top-3 select-none">
            <WardrobeIllustration />
          </div>
          <div className="relative pr-[90px]">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7E6A51]">
              <span className="h-px w-4 shrink-0 bg-[#C5AD8F]" aria-hidden="true" />
              The calendar
            </p>
            <h2 id={`${instanceId}-calendar-heading`} className="mt-2.5 font-serif text-[29px] font-normal leading-[1.05] tracking-[-0.045em] text-[#3C3931]">
              On the <span className="italic text-[#9A6848]">horizon.</span>
            </h2>
          </div>
          <p className="relative mt-4 max-w-[27ch] text-[12px] leading-relaxed text-[#776D60]">
            A few moments worth planning for.
          </p>
        </div>

        <div className="mx-5 h-px bg-[#E8E2D6]" />

        <div className="px-5 pb-5 pt-5">
          {occasions.length === 0 ? (
            <div className="py-3">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#E6DECF] bg-[#F7F1E6] text-[#A18B6E]">
                <Calendar className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <p className="text-[14px] font-medium text-[#504A40]">Nothing on the calendar yet</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#776D60]">
                No occasions were found for this window. Try another period or location in Market Radar.
              </p>
            </div>
          ) : (
            <>
              <ul id={`${instanceId}-occasions`} className="m-0 list-none p-0">
                {visibleOccasions.map((occasion) => (
                  <OccasionRow key={occasion.id} occasion={occasion} />
                ))}
              </ul>
              {hiddenOccasionCount > 0 && (
                <button
                  type="button"
                  aria-expanded={showAllOccasions}
                  aria-controls={`${instanceId}-occasions`}
                  onClick={() => setShowAllOccasions((value) => !value)}
                  className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#E5DDD0] bg-[#FAF5EB] px-3 py-2 text-[12px] font-medium text-[#7C654D] transition-colors hover:bg-[#F2EADB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A7805B] focus-visible:ring-offset-2 motion-reduce:transition-none"
                >
                  {showAllOccasions ? "Show fewer occasions" : `View ${hiddenOccasionCount} more ${hiddenOccasionCount === 1 ? "occasion" : "occasions"}`}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform motion-reduce:transition-none ${showAllOccasions ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
              )}
            </>
          )}
        </div>

        <p className="border-t border-[#EBE4D7] bg-[#F8F3E9] px-5 py-3 text-[11px] leading-relaxed text-[#756752]">
          Occasions suggest opportunities. They don’t confirm demand.
        </p>
      </section>

      {/* A small collection of actionable questions, with room for the text. */}
      <section
        aria-labelledby={`${instanceId}-ideas-heading`}
        className="rounded-[22px] border border-[#E8E4EF] bg-[#F7F5FA] p-4"
      >
        <div className="mb-4 flex items-center justify-between gap-3 px-1 pt-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#786786]">A little inspiration</p>
            <h2 id={`${instanceId}-ideas-heading`} className="mt-1 font-serif text-[26px] font-normal tracking-[-0.04em] text-[#484050]">
              Find a fresh <span className="italic">angle.</span>
            </h2>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E5DEEC] bg-[#F0EBF5] text-[#927BA6]" aria-hidden="true">
            <Sparkles className="h-4 w-4" strokeWidth={1.5} />
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {QUICK_PROMPTS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.prompt}
                type="button"
                aria-label={`${item.title}: ${item.prompt}`}
                onClick={() => onSelectPrompt(item.prompt)}
                className="group flex min-h-[142px] min-w-0 flex-col items-start rounded-2xl border border-[#E9E5ED] bg-[#FFFEFF] p-3 text-left shadow-[0_2px_6px_-4px_rgba(63,44,82,0.12)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-[#CFC2DD] hover:bg-white hover:shadow-[0_6px_16px_-10px_rgba(80,52,104,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9779AD] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F5FA] motion-reduce:transition-none"
              >
                <span className="mb-4 flex w-full items-center justify-between gap-2">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ${item.iconClass}`}>
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#B3A6BF] transition-transform duration-200 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5 group-focus-visible:text-[#7E6395] motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true" />
                </span>
                <span className="break-words text-[13px] font-semibold leading-snug tracking-[-0.015em] text-[#51485B]">{item.title}</span>
                <span className="mt-1.5 break-words text-[11px] leading-relaxed text-[#786D81]">{item.description}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 flex items-center gap-1.5 px-1 text-[11px] text-[#796987]">
          <ArrowRight className="h-3 w-3 shrink-0" aria-hidden="true" />
          Pick a question to explore your market.
        </p>
      </section>

      {/* Source health stays accessible without dominating the merchant's view. */}
      <details className="group rounded-[18px] border border-[#E8E6E0] bg-[#FFFFFF]">
        <summary className="flex min-h-[76px] cursor-pointer list-none items-center gap-3 rounded-[18px] px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8B2A3] focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E5E9DF] bg-[#F2F5ED] text-[#75846A]" aria-hidden="true">
            <BookOpen className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold tracking-[-0.01em] text-[#514F49]">Behind the research</span>
            <span className="mt-0.5 block text-[11px] text-[#746F67]">
              {providers.length > 0 ? `${availableCount} of ${providers.length} sources available` : "No source status reported"}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[#97938B] transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
        </summary>

        <div className="px-4 pb-4">
          <div className="mb-1 h-px bg-[#EFEEE8]" />
          {providers.length === 0 ? (
            <p className="py-3 text-[12px] leading-relaxed text-[#817B71]">Source availability will appear when research returns a status.</p>
          ) : (
            <ul className="m-0 list-none divide-y divide-[#F0EEE9] p-0">
              {providers.map((provider) => {
                const status = getSourceStatus(provider.state);
                return (
                  <li key={provider.providerId} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="flex min-w-0 items-center gap-2 text-[12px] font-medium text-[#565149]">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${status.dot}`} aria-hidden="true" />
                        <span className="break-words [overflow-wrap:anywhere]">{provider.providerName}</span>
                      </p>
                      <span className="flex shrink-0 items-center gap-1 text-[11px] text-[#756E64]">
                        {provider.state === "available" && <CheckCircle2 className="h-3 w-3 text-[#6A846F]" aria-hidden="true" />}
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 pl-3.5 text-[11px] leading-relaxed text-[#766E63]">{status.description}</p>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-2 text-[11px] leading-relaxed text-[#766E63]">Source availability is separate from the strength of a finding.</p>
        </div>
      </details>
    </aside>
  );
}
