"use client";

import React from "react";
import { X, Bookmark, Trash2, ChevronRight, Clock, MapPin, Tag } from "lucide-react";
import { Opportunity } from "@/lib/ai/market-radar/types";

interface SavedResearchModalProps {
  savedOpportunities: Opportunity[];
  onViewResearch: (opp: Opportunity) => void;
  onRemoveSaved: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function SavedResearchModal({
  savedOpportunities,
  onViewResearch,
  onRemoveSaved,
  onClearAll,
  onClose,
}: SavedResearchModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Bookmark className="w-4 h-4 fill-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Saved Research Shortlist</h3>
              <p className="text-[11px] text-muted-foreground">
                {savedOpportunities.length} saved product opportunities
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
          {savedOpportunities.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Bookmark className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground">No opportunities bookmarked yet.</p>
              <p className="text-[11px] text-muted-foreground/80">
                Click the bookmark icon on any opportunity card to save it for later review.
              </p>
            </div>
          ) : (
            savedOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="p-3 rounded-lg border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-[280px] sm:max-w-[340px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground text-sm">{opp.title}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                      {opp.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {opp.timing.label}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {opp.geographicScope.actual}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onViewResearch(opp);
                      onClose();
                    }}
                    className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    title="View research"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveSaved(opp.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        {savedOpportunities.length > 0 && (
          <div className="p-3 border-t border-border flex items-center justify-between bg-muted/20">
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear all saved
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

