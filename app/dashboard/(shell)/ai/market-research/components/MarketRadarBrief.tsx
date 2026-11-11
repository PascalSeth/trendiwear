"use client";

import * as React from "react";
import { Calendar, Compass } from "lucide-react";
import type {
  MarketRadarContext,
  RadarOccasion,
} from "@/lib/ai/market-radar/types";

interface MarketRadarBriefProps {
  brief: string;
  context?: MarketRadarContext;
  occasions?: RadarOccasion[];
}

/** Decorative fabric samples; this artwork does not represent research data. */
function FabricStudy() {
  return (
    <svg
      viewBox="0 0 112 126"
      fill="none"
      className="h-[116px] w-[104px]"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="69" cy="50" r="37" fill="#F3E8D2" />
      <path
        d="M14 109c23-5 52-5 83-1"
        stroke="#DDD5C6"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <g transform="rotate(13 65 68)">
        <path d="M42 30h47v68H42V30Z" fill="#E8E1F0" stroke="#B5A6C2" strokeWidth="1.3" />
        <path d="M48 39h35v51H48V39Z" stroke="#C6B9D0" strokeDasharray="2 3" />
        <path d="m50 82 25-34m-20 41 25-34" stroke="#DDD2E7" strokeWidth="3" />
      </g>
      <g transform="rotate(-9 44 66)">
        <path d="M18 28h49v72H18V28Z" fill="#FDFBF6" stroke="#A79A85" strokeWidth="1.3" />
        <path d="M24 36h37v56H24V36Z" stroke="#D8CEBC" strokeDasharray="2 3" />
        <path d="M31 51c11-8 24 1 17 12-6 10-18 11-17 22" stroke="#9CA88A" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M36 48c1 12 8 17 18 21M33 77c9-2 16 0 22 5" stroke="#CBD2BC" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="29" cy="39" r="2.1" fill="#FDFBF6" stroke="#A79A85" />
      </g>
      <path d="M23 35c-8-9-3-19 7-15 7 3 6 11 0 15" stroke="#AD8B65" strokeWidth="1.5" strokeLinecap="round" />
      <path d="m96 15 2.5 6.5L105 24l-6.5 2.5L96 33l-2.5-6.5L87 24l6.5-2.5L96 15Z" fill="#BC865E" />
      <circle cx="8" cy="76" r="2" fill="#B8C1A9" />
    </svg>
  );
}

export function MarketRadarBrief({
  brief,
  context,
  occasions = [],
}: MarketRadarBriefProps) {
  const headingId = React.useId();
  const summary = brief.trim();

  if (!summary) return null;

  const location = [context?.location?.city, context?.location?.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  const topOccasion = occasions[0];
  const isHappening = topOccasion?.timingPhase === "happening_now";

  return (
    <section
      aria-labelledby={headingId}
      className="relative isolate min-w-0 overflow-hidden rounded-[22px] border border-[#E8E2D6] bg-[#FFFCF6] text-[#38352F] shadow-[0_4px_20px_-14px_rgba(71,53,32,0.22)]"
      style={{ colorScheme: "light" }}
    >
      <div className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
        {/* Quiet masthead: genuine context, without a stack of badges. */}
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-[#EAE4D9] pb-4">
          <p className="flex shrink-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7E6A51]">
            <span className="h-px w-5 bg-[#B99B78]" aria-hidden="true" />
            Market brief
          </p>

          <div className="flex min-w-0 flex-wrap items-start gap-x-4 gap-y-2 text-[11px] leading-relaxed text-[#776D60]">
            <p className="flex min-w-0 items-start gap-1.5">
              <Compass className="mt-0.5 h-3 w-3 shrink-0 text-[#927757]" strokeWidth={1.6} aria-hidden="true" />
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">{location || "Your market"}</span>
            </p>
            {context?.targetPeriod && (
              <p className="flex min-w-0 items-start gap-1.5">
                <Calendar className="mt-0.5 h-3 w-3 shrink-0 text-[#927757]" strokeWidth={1.6} aria-hidden="true" />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{context.targetPeriod}</span>
              </p>
            )}
          </div>
        </div>

        {/* The supplied brief remains the focus. No invented source assurances. */}
        <div className="flex min-w-0 items-start gap-4 pt-5 sm:gap-5">
          <div className="min-w-0 flex-1">
            <h2 id={headingId} className="font-serif text-[26px] font-normal leading-tight tracking-[-0.035em] text-[#3E3931] sm:text-[29px]">
              The local <span className="italic text-[#956747]">edit.</span>
            </h2>
            <p className="mt-3 max-w-[76ch] whitespace-pre-line break-words text-[13px] font-normal leading-[1.85] text-[#655E53] [overflow-wrap:anywhere] sm:text-[14px]">
              {summary}
            </p>
          </div>

          <div className="pointer-events-none hidden w-[92px] shrink-0 select-none justify-center pt-1 sm:flex">
            <FabricStudy />
          </div>
        </div>
      </div>

      {/* An occasion is context, not evidence of purchasing demand. */}
      {topOccasion && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-[#E8E2ED] bg-[#F4F0F7] px-5 py-3.5 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[#E4DCEB] bg-[#FDFBFE] text-[#8B719C]" aria-hidden="true">
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#786786]">Calendar context</p>
              <p className="mt-0.5 break-words text-[12px] font-medium leading-relaxed text-[#5E4F6A] [overflow-wrap:anywhere]">{topOccasion.name}</p>
            </div>
          </div>

          {isHappening && (
            <p className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-[#54735A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#64816D]" aria-hidden="true" />
              Happening now
            </p>
          )}
        </div>
      )}
    </section>
  );
}
