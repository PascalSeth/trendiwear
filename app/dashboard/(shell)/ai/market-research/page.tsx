"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  MarketRadarResponse,
  Opportunity,
  RadarLocation,
  RadarViewMode,
  CustomerSegment,
  PriceBand,
} from "@/lib/ai/market-radar/types";
import { MarketRadarHeader } from "./components/MarketRadarHeader";
import { MarketRadarFilters } from "./components/MarketRadarFilters";
import { MarketRadarBrief } from "./components/MarketRadarBrief";
import { OpportunityCard } from "./components/OpportunityCard";
import { MarketRadarRail } from "./components/MarketRadarRail";
import { ResearchDetailPanel } from "./components/ResearchDetailPanel";
import { LocationSetupModal } from "./components/LocationSetupModal";
import { SavedResearchModal } from "./components/SavedResearchModal";
import { FollowUpComposer } from "./components/FollowUpComposer";
import { AlertCircle, RefreshCw, Layers } from "lucide-react";

const SAVED_STORAGE_KEY = "trendizip_market_radar_saved";

function MarketRadarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state resolution
  const initialViewMode = (searchParams.get("view") as RadarViewMode) || "sell-now";
  const initialCategory = searchParams.get("category") || "all";
  const initialCity = searchParams.get("city") || "Accra";
  const initialMonth = searchParams.get("month") ? Number(searchParams.get("month")) : new Date().getMonth() + 1;
  const initialYear = searchParams.get("year") ? Number(searchParams.get("year")) : new Date().getFullYear();

  // Primary state
  const [location, setLocation] = useState<RadarLocation>({
    city: initialCity,
    region: initialCity.toLowerCase() === "accra" ? "Greater Accra" : "",
    country: "Ghana",
    countryCode: "GH",
    timezone: "Africa/Accra",
    currency: "GH₵",
  });

  const [category, setCategory] = useState<string>(initialCategory);
  const [viewMode, setViewMode] = useState<RadarViewMode>(initialViewMode);
  const [month, setMonth] = useState<number>(initialMonth);
  const [year, setYear] = useState<number>(initialYear);
  const [customerSegment, setCustomerSegment] = useState<CustomerSegment>("all");
  const [priceBand, setPriceBand] = useState<PriceBand>("all");
  const [customQuestion, setCustomQuestion] = useState<string>("");

  // Data fetching state
  const [data, setData] = useState<MarketRadarResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modals & Panels
  const [detailOpportunity, setDetailOpportunity] = useState<Opportunity | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [savedOpportunities, setSavedOpportunities] = useState<Opportunity[]>([]);

  // Load saved research from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_STORAGE_KEY);
      if (stored) {
        setSavedOpportunities(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Sync saved to localStorage
  const handleToggleSave = (opp: Opportunity) => {
    setSavedOpportunities((prev) => {
      const exists = prev.some((o) => o.id === opp.id);
      let updated: Opportunity[];
      if (exists) {
        updated = prev.filter((o) => o.id !== opp.id);
        toast.info(`Removed "${opp.title}" from saved research`);
      } else {
        updated = [opp, ...prev];
        toast.success(`Saved "${opp.title}" to research shortlist`);
      }
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleRemoveSaved = (id: string) => {
    setSavedOpportunities((prev) => {
      const updated = prev.filter((o) => o.id !== id);
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearAllSaved = () => {
    setSavedOpportunities([]);
    try {
      localStorage.removeItem(SAVED_STORAGE_KEY);
      toast.info("Cleared saved research");
    } catch {}
  };

  // Synchronize URL search params
  const updateUrlParams = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      Object.entries(newParams).forEach(([k, v]) => {
        if (v === undefined || v === "" || v === "all") {
          current.delete(k);
        } else {
          current.set(k, String(v));
        }
      });
      const query = current.toString();
      router.replace(`?${query}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Fetch telemetry from Market Radar API
  const fetchRadar = useCallback(
    async (bypassCache: boolean = false, overrideQuestion?: string) => {
      setIsLoading(true);
      setFetchError(null);

      const q = overrideQuestion !== undefined ? overrideQuestion : customQuestion;

      try {
        const res = await fetch("/api/ai/market-radar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: location.city,
            region: location.region,
            country: location.country,
            category,
            viewMode,
            month,
            year,
            customerSegment,
            priceBand,
            customQuestion: q,
            bypassCache,
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || `Request failed with status ${res.status}`);
        }

        const json: MarketRadarResponse = await res.json();
        setData(json);

        // Keep detail panel in sync if already open
        if (detailOpportunity) {
          const fresh = json.opportunities.find((o) => o.id === detailOpportunity.id);
          if (fresh) setDetailOpportunity(fresh);
        }
      } catch (err: any) {
        console.error("[Market Radar UI Fetch Error]:", err);
        setFetchError(err?.message || "Failed to load market intelligence. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [
      location,
      category,
      viewMode,
      month,
      year,
      customerSegment,
      priceBand,
      customQuestion,
      detailOpportunity,
    ]
  );

  // Automatic load on context changes
  useEffect(() => {
    fetchRadar();
    updateUrlParams({
      city: location.city,
      category,
      view: viewMode,
      month: viewMode === "explore-month" ? month : undefined,
      year: viewMode === "explore-month" ? year : undefined,
    });
  }, [location.city, location.country, category, viewMode, month, year, customerSegment, priceBand]);

  // Handlers
  const handleSelectViewMode = (mode: RadarViewMode) => {
    setViewMode(mode);
    setCustomQuestion("");
  };

  const handleSelectCategory = (cat: string) => {
    setCategory(cat);
  };

  const handleChangeMonthYear = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
  };

  const handleSaveLocation = (newLoc: RadarLocation) => {
    setLocation(newLoc);
  };

  const handleInvestigationSubmit = (q: string) => {
    setCustomQuestion(q);
    fetchRadar(true, q);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      {/* 1. Header Toolbar */}
      <MarketRadarHeader
        context={data?.context}
        isLoading={isLoading}
        onRefresh={() => fetchRadar(true)}
        onOpenSaved={() => setIsSavedModalOpen(true)}
        savedCount={savedOpportunities.length}
      />

      {/* 2. Interactive Discovery Filters */}
      <MarketRadarFilters
        location={location}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        category={category}
        onSelectCategory={handleSelectCategory}
        viewMode={viewMode}
        onSelectViewMode={handleSelectViewMode}
        month={month}
        year={year}
        onChangeMonthYear={handleChangeMonthYear}
        customerSegment={customerSegment}
        onChangeSegment={setCustomerSegment}
        priceBand={priceBand}
        onChangePriceBand={setPriceBand}
        isLoading={isLoading}
      />

      {/* 3. Executive Evidence Brief */}
      {data?.marketBrief && (
        <MarketRadarBrief
          brief={data.marketBrief}
          context={data.context}
          occasions={data.occasions}
        />
      )}

      {/* 4. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 Cols): Opportunities Grid & Investigation Input */}
        <div className="lg:col-span-8 space-y-5">
          {/* Section Heading & Opportunities Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Ranked Merchandising Opportunities
              </h2>
              {data?.opportunities && (
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">
                  {data.opportunities.length}
                </span>
              )}
            </div>

            {data?.context?.isHistorical && (
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                Historical View
              </span>
            )}
          </div>

          {/* Loading Skeletons */}
          {isLoading && !data && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs animate-pulse"
                >
                  <div className="h-44 bg-muted w-full" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-muted rounded w-28" />
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-8 bg-muted/60 rounded" />
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="h-12 bg-muted/40 rounded-xl" />
                      <div className="h-12 bg-muted/40 rounded-xl" />
                    </div>
                    <div className="h-8 bg-muted rounded-xl w-full pt-2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Alert */}
          {fetchError && !isLoading && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold">Unable to refresh radar intelligence</div>
                <p>{fetchError}</p>
                <button
                  type="button"
                  onClick={() => fetchRadar(true)}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded bg-destructive/10 hover:bg-destructive/20 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            </div>
          )}

          {/* Opportunities Cards Grid */}
          {data?.opportunities && data.opportunities.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.opportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onViewResearch={(selected) => setDetailOpportunity(selected)}
                  isSaved={savedOpportunities.some((o) => o.id === opp.id)}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {data?.opportunities && data.opportunities.length === 0 && !isLoading && (
            <div className="rounded-xl border border-border/80 bg-card p-8 text-center space-y-2">
              <Layers className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <h3 className="text-sm font-bold text-foreground">No matching garment opportunities</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No high-confidence seasonal recommendations found for the selected category in this period.
                Try switching to "All Clothing" or adjusting your target month.
              </p>
            </div>
          )}

          {/* Follow-Up / Specific Investigation Query Box */}
          <div className="pt-2">
            <FollowUpComposer
              onSubmitQuestion={handleInvestigationSubmit}
              isLoading={isLoading}
              initialQuestion={customQuestion}
              onClearQuestion={() => {
                setCustomQuestion("");
                fetchRadar(true, "");
              }}
            />
          </div>
        </div>

        {/* Right Column (4 Cols): Occasions & Coverage Side Rail */}
        <div className="lg:col-span-4">
          <MarketRadarRail
            occasions={data?.occasions || []}
            providerStatus={data?.providerStatus || {}}
            onSelectPrompt={(prompt) => {
              setCustomQuestion(prompt);
              handleInvestigationSubmit(prompt);
            }}
          />
        </div>
      </div>

      {/* 5. Slide-Over Research Detail Panel */}
      {detailOpportunity && (
        <ResearchDetailPanel
          opportunity={detailOpportunity}
          evidenceRegistry={data?.evidenceRegistry || {}}
          onClose={() => setDetailOpportunity(null)}
        />
      )}

      {/* 6. Target Location Setup Modal */}
      {isLocationModalOpen && (
        <LocationSetupModal
          currentLocation={location}
          onSave={handleSaveLocation}
          onClose={() => setIsLocationModalOpen(false)}
        />
      )}

      {/* 7. Saved Research Shortlist Modal */}
      {isSavedModalOpen && (
        <SavedResearchModal
          savedOpportunities={savedOpportunities}
          onViewResearch={(opp) => setDetailOpportunity(opp)}
          onRemoveSaved={handleRemoveSaved}
          onClearAll={handleClearAllSaved}
          onClose={() => setIsSavedModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function MarketResearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-6 space-y-4">
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="h-10 bg-muted rounded w-full animate-pulse" />
          <div className="h-64 bg-muted rounded w-full animate-pulse" />
        </div>
      }
    >
      <MarketRadarContent />
    </Suspense>
  );
}
