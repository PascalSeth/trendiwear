"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  AlertTriangle, CheckCircle2, Clock, RefreshCw, 
  ArrowLeft, Package, Sparkles, ArrowRight, ShieldAlert 
} from "lucide-react";
import type { InventoryAnalyticsData, InventoryRiskItem } from "@/lib/ai/types";

export default function InventoryAdvisorPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [inventoryData, setInventoryData] = useState<InventoryAnalyticsData | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/inventory-advisor");
      if (res.ok) {
        const json = await res.json();
        setInventoryData(json.data);
      }
    } catch (err) {
      console.error("Failed to load inventory data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const getRiskBadge = (level: InventoryRiskItem["riskLevel"]) => {
    switch (level) {
      case "CRITICAL":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-red-100 text-red-700 border border-red-200">Stockout Risk</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-100 text-amber-800 border border-amber-200">Low Stock</span>;
      case "MODERATE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">Monitor</span>;
      case "SLOW_MOVING":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-medium bg-stone-100 text-stone-600 border border-stone-200">Slow Moving</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Healthy</span>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 p-3 sm:p-5 font-sans">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link 
              href="/dashboard/ai-studio" 
              className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft size={13} /> AI Copilot
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-bold">
              Stock Velocity
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Inventory Advisor</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock velocity, stockout prevention, and recommended restock calculations.
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="h-8 sm:h-9 flex items-center gap-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all shrink-0 self-start md:self-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh Stock Status
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-red-600 rounded-full animate-spin" />
          <p className="text-xs font-mono uppercase tracking-widest">Calculating inventory velocity...</p>
        </div>
      ) : (
        <>
          {/* Executive Overview Badges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] text-slate-400 font-mono uppercase">Total SKUs</span>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">{inventoryData?.totalSkus || 0}</p>
            </div>
            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-red-200/80 shadow-xs space-y-1 bg-red-50/20">
              <span className="text-[11px] text-red-600 font-mono uppercase font-semibold">Stockout Risk</span>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-red-700">{inventoryData?.stockoutRiskCount || 0}</p>
            </div>
            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-amber-200/80 shadow-xs space-y-1 bg-amber-50/20">
              <span className="text-[11px] text-amber-700 font-mono uppercase font-semibold">Low Stock</span>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-amber-800">{inventoryData?.lowStockCount || 0}</p>
            </div>
            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] text-slate-400 font-mono uppercase">Slow Moving</span>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-slate-600">{inventoryData?.slowMovingCount || 0}</p>
            </div>
          </div>

          {/* AI Advisor Guidance Box */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider font-semibold">
              <Sparkles size={13} />
              AI Inventory Recommendation
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {(inventoryData?.stockoutRiskCount || 0) > 0
                ? `You have ${inventoryData?.stockoutRiskCount} garment(s) projected to run out of stock within 5 days based on recent customer purchasing velocity. Prioritize sourcing fabric for these pieces to avoid lost sales.`
                : "All active garments maintain adequate inventory cushions based on 30-day verified sales velocity."}
            </p>
          </div>

          {/* SKU Velocity & Restock Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Garment Inventory &amp; Velocity</h3>
              <span className="text-[11px] text-slate-400 font-mono">Sorted by urgency</span>
            </div>

            {(!inventoryData?.items || inventoryData.items.length === 0) ? (
              <div className="p-10 text-center text-xs text-slate-400 font-medium">
                No products found in your catalogue. Add items in Catalogue to begin tracking inventory velocity.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200/60 h-9">
                    <tr>
                      <th className="py-2 px-3 sm:px-4">Product</th>
                      <th className="py-2 px-3">Current Stock</th>
                      <th className="py-2 px-3">30d Velocity</th>
                      <th className="py-2 px-3">Est. Days Left</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 sm:px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventoryData.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2 sm:py-2.5 px-3 sm:px-4 flex items-center gap-2.5">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-8 h-8 object-cover rounded-lg border border-slate-100" />
                          ) : (
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs">🧵</div>
                          )}
                          <span className="font-semibold text-slate-900">{item.name}</span>
                        </td>
                        <td className="py-2 sm:py-2.5 px-3 font-mono font-semibold text-slate-800">
                          {item.currentStock} units
                        </td>
                        <td className="py-2 sm:py-2.5 px-3 text-slate-500 font-mono text-xs">
                          {item.dailyVelocity} / day
                        </td>
                        <td className="py-2 sm:py-2.5 px-3 font-mono text-xs">
                          {item.estimatedDaysRemaining !== null ? (
                            <span className={item.estimatedDaysRemaining <= 5 ? "text-red-600 font-bold" : "text-slate-700"}>
                              {item.estimatedDaysRemaining} days
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2 sm:py-2.5 px-3">
                          {getRiskBadge(item.riskLevel)}
                        </td>
                        <td className="py-2 sm:py-2.5 px-3 sm:px-4 text-right">
                          {item.recommendedRestockUnits > 0 ? (
                            <Link
                              href="/dashboard/catalogue"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition-all"
                            >
                              Restock +{item.recommendedRestockUnits}
                            </Link>
                          ) : (
                            <Link
                              href="/dashboard/catalogue"
                              className="text-xs text-slate-400 hover:text-slate-700"
                            >
                              Edit Stock
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
