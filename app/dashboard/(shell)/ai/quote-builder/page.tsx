"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Calculator, ArrowLeft, Copy, Check, Sparkles, 
  DollarSign, Clock, ShieldCheck, UserCheck, Scissors 
} from "lucide-react";
import { toast } from "sonner";
import type { PricingResult } from "@/lib/ai/types";

export default function QuoteBuilderPage() {
  const [customerName, setCustomerName] = useState("Sarah Mensah");
  const [garmentTitle, setGarmentTitle] = useState("3-Piece Custom Kente & Velvet Agbada");
  const [fabricDetails, setFabricDetails] = useState("Handwoven Bonwire Kente with Black Silk Velvet Trims");
  const [estimatedDays, setEstimatedDays] = useState(10);

  // Cost Stack Inputs
  const [fabricCost, setFabricCost] = useState(350);
  const [laborHours, setLaborHours] = useState(12);
  const [hourlyRate, setHourlyRate] = useState(35);
  const [notionsCost, setNotionsCost] = useState(60);
  const [overheadCost, setOverheadCost] = useState(40);
  const [targetMargin, setTargetMargin] = useState(35);
  const [rushFee, setRushFee] = useState(0);

  const [loading, setLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState<{
    pricing: PricingResult;
    formattedProposalMessage: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/ai/quote-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          garmentTitle,
          fabricDetails,
          estimatedDays,
          fabricCost,
          laborHours,
          hourlyRate,
          notionsAndTrimsCost: notionsCost,
          overheadCost,
          targetMarginPercent: targetMargin,
          rushFee,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setQuoteResult(json.quote);
        toast.success("Quote generated successfully");
      } else {
        toast.error("Failed to generate quote");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while generating quote");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!quoteResult?.formattedProposalMessage) return;
    navigator.clipboard.writeText(quoteResult.formattedProposalMessage);
    setCopied(true);
    toast.success("Proposal copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 p-3 sm:p-5 font-sans">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <Link 
            href="/dashboard/ai-studio" 
            className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <ArrowLeft size={13} /> AI Copilot
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Operations
          </span>
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Custom Order Quote Builder</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Calculate cost stacks with precision and generate transparent, high-converting client proposals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left Form: Cost Stack & Specifications */}
        <form onSubmit={handleGenerateQuote} className="lg:col-span-6 space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Scissors size={15} className="text-amber-600" />
            Garment &amp; Client Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Turnaround (Days)</label>
              <input
                type="number"
                min={1}
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(Number(e.target.value))}
                className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Garment Title</label>
            <input
              type="text"
              value={garmentTitle}
              onChange={(e) => setGarmentTitle(e.target.value)}
              className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Fabric &amp; Trim Specification</label>
            <textarea
              rows={2}
              value={fabricDetails}
              onChange={(e) => setFabricDetails(e.target.value)}
              className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900 resize-none"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2.5">
              Direct Cost Breakdown (GH₵)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Fabric Cost</label>
                <input
                  type="number"
                  min={0}
                  value={fabricCost}
                  onChange={(e) => setFabricCost(Number(e.target.value))}
                  className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Labor Hours</label>
                <input
                  type="number"
                  min={1}
                  value={laborHours}
                  onChange={(e) => setLaborHours(Number(e.target.value))}
                  className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Hourly Rate (GH₵)</label>
                <input
                  type="number"
                  min={10}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Trims / Zips</label>
                <input
                  type="number"
                  min={0}
                  value={notionsCost}
                  onChange={(e) => setNotionsCost(Number(e.target.value))}
                  className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Target Margin %</label>
                <input
                  type="number"
                  min={10}
                  max={80}
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(Number(e.target.value))}
                  className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Rush Fee (Optional)</label>
                <input
                  type="number"
                  min={0}
                  value={rushFee}
                  onChange={(e) => setRushFee(Number(e.target.value))}
                  className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Calculator size={14} /> Calculate &amp; Generate Proposal
              </>
            )}
          </button>
        </form>

        {/* Right Output: Price Stack & Formatted Client Proposal */}
        <div className="lg:col-span-6 space-y-4">
          {quoteResult ? (
            <>
              {/* Deterministic Financial Breakdown */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-mono uppercase text-slate-400">Recommendation</span>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {quoteResult.pricing.actualMarginPercent}% Net Margin
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Break-Even</span>
                    <p className="text-base sm:text-lg font-bold text-slate-800 font-mono mt-0.5">
                      GH₵{quoteResult.pricing.breakEvenCost.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200/60">
                    <span className="text-[10px] font-mono text-amber-800 uppercase font-semibold">Recommended Quote</span>
                    <p className="text-lg sm:text-xl font-bold text-amber-900 font-mono mt-0.5">
                      GH₵{quoteResult.pricing.recommendedPrice.toLocaleString()}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-sans bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                  {quoteResult.pricing.explanation}
                </p>
              </div>

              {/* Client Proposal Preview (WhatsApp / Email ready) */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-600" />
                    Customer Proposal Message
                  </h3>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-all"
                  >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    {copied ? "Copied!" : "Copy Proposal"}
                  </button>
                </div>

                <div className="bg-[#f0f4f1] text-slate-800 p-3 rounded-lg text-xs font-mono whitespace-pre-line border border-slate-200/60 leading-relaxed">
                  {quoteResult.formattedProposalMessage}
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Human approval required: Review message, then copy and paste directly into WhatsApp or chat.
                </p>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[340px] bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
              <Calculator size={32} className="text-slate-300 stroke-1" />
              <div>
                <p className="text-xs font-semibold text-slate-700">No quote generated yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                  Fill in the client details and direct cost inputs on the left, then click Generate to create an itemized quote and customer message.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
