"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Calculator, Loader2, Sparkles, TrendingUp,
  Tag, Percent, PackageCheck, Zap, Scale,
  Coins, Activity,
  Flame, ShoppingBag,
  Check, Search, Truck
} from "lucide-react";
import { toast } from "sonner";

// --- LIGHT THEME RICH MARKDOWN RENDERER ---
function FormattedLightMarkdown({ content }: { content: string }) {
  if (!content) return null;
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-4 text-slate-700 font-sans leading-relaxed text-xs sm:text-sm selection:bg-emerald-100 selection:text-emerald-900">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();

        // 1. TABLES
        if (trimmed.includes("|") && trimmed.split("\n").length >= 2) {
          const lines = trimmed.split("\n").filter(l => l.trim().startsWith("|"));
          if (lines.length >= 2) {
            const parseRow = (str: string) => str.split("|").filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
            const headers = parseRow(lines[0]);
            const dataRows = lines.slice(1).filter(l => !/^[:\s-|+]+$/.test(l)).map(parseRow);

            return (
              <div key={bIdx} className="my-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold tracking-wider uppercase text-[10px]">
                        {headers.map((h, i) => <th key={i} className="py-3 px-4 border-b border-slate-800">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dataRows.map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white hover:bg-emerald-50/30" : "bg-slate-50/50 hover:bg-emerald-50/40"}>
                          {r.map((cell, cIdx) => <td key={cIdx} className="py-2.5 px-4 font-medium text-slate-700">{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }
        }

        // 2. HEADINGS
        if (trimmed.startsWith("### ")) return <h3 key={bIdx} className="text-xs sm:text-sm font-bold text-slate-900 pt-2 pb-0.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />{renderInline(trimmed.replace(/^###\s+/, ""))}</h3>;
        if (trimmed.startsWith("## ")) return <h2 key={bIdx} className="text-sm sm:text-base font-extrabold text-slate-900 pt-3 pb-1 border-b border-slate-200 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-emerald-600" />{renderInline(trimmed.replace(/^##\s+/, ""))}</h2>;
        if (trimmed.startsWith("# ")) return <h1 key={bIdx} className="text-base sm:text-lg font-black tracking-tight text-slate-900 pt-4 pb-1 border-b-2 border-emerald-600">{renderInline(trimmed.replace(/^#\s+/, ""))}</h1>;

        // 3. BULLETS
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split("\n").filter(l => l.trim().startsWith("- ") || l.trim().startsWith("* "));
          return (
            <ul key={bIdx} className="space-y-1.5 my-2 pl-1">
              {items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2 text-slate-700 text-xs sm:text-sm">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                  <div className="flex-1 leading-relaxed">{renderInline(item.replace(/^[-*]\s+/, ""))}</div>
                </li>
              ))}
            </ul>
          );
        }

        // 4. CALLOUTS
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote key={bIdx} className="p-3.5 my-3 border-l-4 border-emerald-600 bg-emerald-50/70 rounded-r-2xl text-emerald-950 font-medium text-xs sm:text-sm leading-relaxed">
              {renderInline(trimmed.replace(/^>\s+/, ""))}
            </blockquote>
          );
        }

        // 5. PARAGRAPHS
        return <p key={bIdx} className="leading-relaxed text-xs sm:text-sm text-slate-700">{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  if (!text) return null;
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  return boldParts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={idx} className="font-extrabold text-slate-900 bg-emerald-50 px-1 py-0.5 rounded text-[0.95em]">{part.slice(2, -2)}</strong>;
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((cPart, cIdx) => {
      if (cPart.startsWith("`") && cPart.endsWith("`")) return <code key={cIdx} className="font-mono bg-slate-100 text-emerald-900 px-1.5 py-0.5 rounded-md text-[0.85em] border border-slate-200 font-semibold">{cPart.slice(1, -1)}</code>;
      return cPart;
    });
  });
}

// --- DATA TYPES & HIGH-RES PRODUCT DEMO DATA ---
interface DBProduct { 
  id: string; 
  name: string; 
  price: number; 
  stockQuantity: number; 
  soldCount: number; 
  imageUrl: string;
}

type PricingModule = "smart-pricing" | "margin-calc" | "discount-sim" | "psych-pricing" | "bundles" | "flash-sale" | "dynamic" | "breakeven";

const EASY_MODULES: { id: PricingModule; title: string; subtitle: string; icon: React.ElementType; color: string }[] = [
  { 
    id: "smart-pricing", 
    title: "💰 1. What Should I Charge?", 
    subtitle: "Tells you the perfect selling price so you don't lose money or underprice.", 
    icon: Sparkles, 
    color: "text-emerald-600" 
  },
  { 
    id: "margin-calc", 
    title: "📊 2. My Actual Profit", 
    subtitle: "Shows how much real cash stays in your pocket after delivery & fees.", 
    icon: Calculator, 
    color: "text-indigo-600" 
  },
  { 
    id: "discount-sim", 
    title: "📉 3. Will a Discount Hurt Me?", 
    subtitle: "Test discounts before running a sale to make sure you stay profitable.", 
    icon: Percent, 
    color: "text-rose-600" 
  },
  { 
    id: "psych-pricing", 
    title: "🏷️ 4. The .99 Pricing Trick", 
    subtitle: "Turns prices like GH₵200 into GH₵199.99 so customers buy faster.", 
    icon: Tag, 
    color: "text-violet-600" 
  },
  { 
    id: "bundles", 
    title: "📦 5. Sell 2 Items Together", 
    subtitle: "Combine two products into one outfit bundle for higher sales.", 
    icon: PackageCheck, 
    color: "text-purple-600" 
  },
  { 
    id: "flash-sale", 
    title: "⚡ 6. Best Time for a Sale", 
    subtitle: "AI tells you the exact day & discount % for maximum sales.", 
    icon: Zap, 
    color: "text-amber-600" 
  },
  { 
    id: "dynamic", 
    title: "💹 7. Auto Price Changes", 
    subtitle: "Automatically increases price during high demand or clears old stock.", 
    icon: TrendingUp, 
    color: "text-blue-600" 
  },
  { 
    id: "breakeven", 
    title: "📈 8. How Many Must I Sell?", 
    subtitle: "Calculates the exact number of sales needed to cover your monthly bills.", 
    icon: Scale, 
    color: "text-cyan-600" 
  },
];

const HIGH_RES_FASHION_DEMOS: DBProduct[] = [
  { 
    id: "demo-1", 
    name: "Luxury Silk Kaftan & Wrap Set", 
    price: 180, 
    stockQuantity: 24, 
    soldCount: 42, 
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80" 
  },
  { 
    id: "demo-2", 
    name: "Ankara Print Corset Midi Dress", 
    price: 140, 
    stockQuantity: 18, 
    soldCount: 35, 
    imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80" 
  },
  { 
    id: "demo-3", 
    name: "Embroidered Senator Suit (2-Piece)", 
    price: 260, 
    stockQuantity: 12, 
    soldCount: 19, 
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80" 
  },
  { 
    id: "demo-4", 
    name: "Velvet Agbada Royalty Robe", 
    price: 320, 
    stockQuantity: 8, 
    soldCount: 14, 
    imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80" 
  },
];

export default function TrendiChatPricingAndProfitStudioPage() {
  const [dbProducts, setDbProducts] = useState<DBProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [selectedProductId, setSelectedProductId] = useState<string>("demo-1");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Active Product State
  const [productName, setProductName] = useState<string>("Luxury Silk Kaftan & Wrap Set");
  const [currentPrice, setCurrentPrice] = useState<number>(180);
  const [costPrice, setCostPrice] = useState<number>(80);
  const [inboundShippingCost, setInboundShippingCost] = useState<number>(10);
  const [productImage, setProductImage] = useState<string>(HIGH_RES_FASHION_DEMOS[0].imageUrl);
  const [deliveryFee, setDeliveryFee] = useState<number>(15);
  const [discountPercent] = useState<number>(0);
  const [taxPercent] = useState<number>(3);
  const [, setStockQuantity] = useState<number>(24);
  const [, setSoldCount] = useState<number>(42);

  // Delivery Fee Payer Toggle State
  const [sellerPaysDelivery, setSellerPaysDelivery] = useState<boolean>(false);

  // App State
  const [activeModule, setActiveModule] = useState<PricingModule>("smart-pricing");
  const [loading, setLoading] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [engineUsed, setEngineUsed] = useState<string | null>(null);

  // Fetch DB Products on Mount
  useEffect(() => {
    fetch("/api/ai/market-intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seller-health" }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.telemetry?.products && data.telemetry.products.length > 0) {
          const prods: DBProduct[] = data.telemetry.products.map((p: Record<string, unknown>, idx: number) => ({
            id: p.id as string,
            name: p.name as string,
            price: (p.price as number) || 150,
            stockQuantity: (p.stockQuantity as number) || 15,
            soldCount: (p.soldCount as number) || 10,
            imageUrl: (p.images as string[])?.[0] || HIGH_RES_FASHION_DEMOS[idx % HIGH_RES_FASHION_DEMOS.length].imageUrl,
          }));
          setDbProducts(prods);
          setSelectedProductId(prods[0].id);
          setProductName(prods[0].name);
          setCurrentPrice(prods[0].price);
          setProductImage(prods[0].imageUrl);
        } else {
          setDbProducts(HIGH_RES_FASHION_DEMOS);
          setSelectedProductId(HIGH_RES_FASHION_DEMOS[0].id);
          setProductName(HIGH_RES_FASHION_DEMOS[0].name);
          setCurrentPrice(HIGH_RES_FASHION_DEMOS[0].price);
          setProductImage(HIGH_RES_FASHION_DEMOS[0].imageUrl);
        }
      })
      .catch(() => {
        setDbProducts(HIGH_RES_FASHION_DEMOS);
        setSelectedProductId(HIGH_RES_FASHION_DEMOS[0].id);
        setProductName(HIGH_RES_FASHION_DEMOS[0].name);
        setCurrentPrice(HIGH_RES_FASHION_DEMOS[0].price);
        setProductImage(HIGH_RES_FASHION_DEMOS[0].imageUrl);
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleProductSelect = (id: string, products: DBProduct[] = dbProducts) => {
    setSelectedProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setProductName(prod.name);
      setCurrentPrice(prod.price);
      setCostPrice(Math.round(prod.price * 0.45));
      setStockQuantity(prod.stockQuantity || 15);
      setSoldCount(prod.soldCount || 8);
      setProductImage(prod.imageUrl || HIGH_RES_FASHION_DEMOS[0].imageUrl);
      setAiReport(null);
    }
  };

  // Filtered Products for Live Search
  const filteredProducts = dbProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Math Engine
  const taxFee = (currentPrice * taxPercent) / 100;
  const discountAmount = (currentPrice * discountPercent) / 100;
  const netSellingPrice = currentPrice - discountAmount;
  const effectiveDeliveryExpense = sellerPaysDelivery ? deliveryFee : 0; // 0 if customer pays!
  const totalExpenses = costPrice + inboundShippingCost + effectiveDeliveryExpense + taxFee;
  const netProfit = netSellingPrice - totalExpenses;
  
  // Clean Margin %: Revenue Margin when profitable, % Loss relative to Cost when negative
  const marginPercent = netProfit >= 0
    ? (netSellingPrice > 0 ? Math.round((netProfit / netSellingPrice) * 100) : 0)
    : (totalExpenses > 0 ? Math.round((netProfit / totalExpenses) * 100) : 0);
  
  // Smart AI Target Price (guarantees a healthy 30% margin over total cost if currently selling at a loss)
  const targetProfitablePrice = Math.max(
    Math.round(currentPrice * 1.083), 
    Math.round(totalExpenses * 1.30)
  );
  const suggestedPrice = targetProfitablePrice > currentPrice ? targetProfitablePrice : currentPrice + 15;
  const targetProfit = suggestedPrice - totalExpenses;
  const extraProfitPerUnit = targetProfit - netProfit;

  const runAIProfitAnalysis = async () => {
    setLoading(true); setAiReport(null);
    try {
      const res = await fetch("/api/ai/market-intelligence", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "pricing-strategy", 
          payload: { 
            productId: selectedProductId, 
            productName, 
            currentPrice, 
            costPrice, 
            inboundShippingCost,
            deliveryFee: effectiveDeliveryExpense,
            netProfit, 
            marginPercent, 
            actionType: activeModule 
          } 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI Analysis failed");
      setAiReport(data.result);
      if (data.engineUsed) setEngineUsed(data.engineUsed);
      toast.success("AI Profit Advice ready!");
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      toast.error(errObj.message || "Could not complete AI analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-slate-50 text-slate-900 font-sans p-4 sm:p-6 space-y-6 overflow-y-auto">

      {/* TOP HEADER WITH TRENDICHAT AVATAR */}
      <header className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* TrendiChat Avatar */}
          <div className="relative group shrink-0">
            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-emerald-500/40 shadow-md shadow-emerald-500/10 bg-slate-100 flex items-center justify-center">
              <Image 
                src="/trendichat.png" 
                alt="TrendiChat AI Avatar" 
                width={48} 
                height={48} 
                className="object-cover w-full h-full"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">TrendiChat AI Profit Strategist</h1>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-full border border-emerald-200/80 uppercase tracking-widest">
                Prisma DB
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Visual pricing assistant powered by TrendiChat AI & live store catalog telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 bg-slate-100 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Catalog Products</span>
            <span className="text-sm font-black text-slate-900 font-mono">{loadingProducts ? "..." : `${dbProducts.length} Items`}</span>
          </div>
          <div className="px-3.5 py-2 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
            <span className="text-[10px] font-extrabold uppercase text-emerald-700 block">Current Profit Margin</span>
            <span className={`text-sm font-black font-mono ${marginPercent < 0 ? "text-rose-600" : "text-emerald-700"}`}>
              {marginPercent}% Margin
            </span>
          </div>
        </div>
      </header>

      {/* CREATIVE VISUAL PRODUCT CAROUSEL WITH LIVE SEARCH BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        
        {/* SEARCH & TITLE BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <ShoppingBag size={14} className="text-emerald-600" /> Select Store Product Image:
          </label>

          {/* LIVE PRODUCT SEARCH INPUT */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search store SKU by name..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 text-xs">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* THUMBNAIL PHOTO CAROUSEL */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 hide-scrollbar">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => {
              const isSelected = p.id === selectedProductId;
              return (
                <button
                  key={p.id}
                  onClick={() => handleProductSelect(p.id)}
                  className={`group relative flex-none w-44 p-2 rounded-2xl border transition-all text-left overflow-hidden ${
                    isSelected 
                      ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500" 
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-900"
                  }`}
                >
                  <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2 bg-slate-200">
                    <Image 
                      src={p.imageUrl} 
                      alt={p.name} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                        <Check size={12} />
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-extrabold line-clamp-1">{p.name}</h4>
                  <p className={`text-[10px] font-mono font-bold mt-0.5 ${isSelected ? "text-emerald-400" : "text-emerald-700"}`}>
                    GH₵ {p.price}
                  </p>
                </button>
              );
            })
          ) : (
            <div className="py-4 text-center text-xs text-slate-400 w-full">
              No products found matching &quot;{searchQuery}&quot;.
            </div>
          )}
        </div>
      </div>

      {/* MAIN RESPONSIVE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: HERO PRODUCT PREVIEW & PRICING METRICS (LG: 5 COLS) */}
        <div className="lg:col-span-5 space-y-6">

          {/* HIGH-RES PRODUCT CARD WITH BEFORE & AFTER PRICING */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            
            {/* HERO PRODUCT IMAGE */}
            <div className="relative w-full h-56 sm:h-64 bg-slate-900">
              <Image 
                src={productImage} 
                alt={productName} 
                fill 
                className="object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
              
              {/* IMAGE BADGES */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold rounded-full border border-white/20 uppercase tracking-wider flex items-center gap-1">
                  <Flame size={11} className="text-amber-400 fill-amber-400" /> Bestseller SKU
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Selected Product</span>
                <h2 className="text-base font-black leading-tight drop-shadow-sm line-clamp-1">{productName}</h2>
              </div>
            </div>

            {/* RESTRUCTURED PERFECTLY ALIGNED PRICING & EXPENSES CARD */}
            <div className="p-5 space-y-5">
              
              {/* BEFORE VS AFTER PRICING TILES */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3.5 border rounded-2xl flex flex-col justify-between transition-all ${
                  netProfit < 0 ? "bg-rose-50/50 border-rose-200" : "bg-slate-50 border-slate-200/80"
                }`}>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Current Price</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">GH₵ {currentPrice}</span>
                  <div className="mt-1.5 space-y-0.5">
                    <span className={`text-[10px] font-extrabold block ${netProfit < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                      {netProfit < 0 ? `Loss: -GH₵ ${Math.abs(netProfit)}` : `Net Cash: +GH₵ ${netProfit}`}
                    </span>
                    <span className={`text-[9px] font-bold block ${netProfit < 0 ? "text-rose-500" : "text-slate-500"}`}>
                      {netProfit < 0 ? `${marginPercent}% Loss of Cost` : `${marginPercent}% Margin`}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-700">AI Target Price</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">GH₵ {suggestedPrice}</span>
                  <div className="mt-1.5 space-y-0.5">
                    <span className="text-[10px] font-extrabold text-emerald-800 block">
                      Target Profit: +GH₵ {targetProfit}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 block">
                      +GH₵ {extraProfitPerUnit} extra profit / sale
                    </span>
                  </div>
                </div>
              </div>

              {/* CLEAN STRUCTURED COST BREAKDOWN FORM */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Item Cost Breakdown</span>
                  <span className="text-[10px] font-mono text-slate-400">Total Expenses: GH₵ {totalExpenses}</span>
                </h3>

                <div className="space-y-2 text-xs">
                  {/* SELLING PRICE */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <span className="font-bold text-slate-700">1. Selling Price</span>
                    <div className="flex items-center w-28 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus-within:border-emerald-500">
                      <span className="text-slate-400 font-bold text-xs mr-1">GH₵</span>
                      <input
                        type="number"
                        value={currentPrice}
                        onChange={(e) => setCurrentPrice(Number(e.target.value))}
                        className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* ITEM COST */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <span className="font-bold text-slate-700">2. Base Garment Cost</span>
                    <div className="flex items-center w-28 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus-within:border-emerald-500">
                      <span className="text-slate-400 font-bold text-xs mr-1">GH₵</span>
                      <input
                        type="number"
                        value={costPrice}
                        onChange={(e) => setCostPrice(Number(e.target.value))}
                        className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* INBOUND FREIGHT */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div>
                      <span className="font-bold text-slate-700 block">3. Inbound Supplier Freight</span>
                      <span className="text-[9px] text-slate-400">Shipping paid to receive stock</span>
                    </div>
                    <div className="flex items-center w-28 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus-within:border-emerald-500">
                      <span className="text-slate-400 font-bold text-xs mr-1">GH₵</span>
                      <input
                        type="number"
                        value={inboundShippingCost}
                        onChange={(e) => setInboundShippingCost(Number(e.target.value))}
                        className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* DELIVERY FEE & PAYER TOGGLE CARD */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Truck size={14} className="text-emerald-600" /> Customer Delivery Settings:
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {sellerPaysDelivery ? "Seller Pays Delivery" : "Customer Pays Delivery"}
              </span>
            </div>

            {/* 2-WAY TOGGLE SWITCH */}
            <div className="p-1 bg-slate-100 rounded-2xl border border-slate-200/80 grid grid-cols-2 gap-1 text-center">
              <button
                type="button"
                onClick={() => setSellerPaysDelivery(false)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  !sellerPaysDelivery 
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>📦 Customer Pays</span>
              </button>

              <button
                type="button"
                onClick={() => setSellerPaysDelivery(true)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  sellerPaysDelivery 
                    ? "bg-emerald-600 text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>🚚 Free Delivery (Seller Pays)</span>
              </button>
            </div>

            {/* SLIDER OR CUSTOMER PAYS BADGE */}
            {sellerPaysDelivery ? (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Seller Delivery Expense</span>
                  <span className="font-mono text-emerald-700 font-extrabold">GH₵ {deliveryFee}</span>
                </div>
                <input
                  type="range" min="0" max="100"
                  value={deliveryFee}
                  onChange={e => setDeliveryFee(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-center space-y-0.5 animate-in fade-in">
                <span className="text-xs font-extrabold text-emerald-800">✨ GH₵ 0 Seller Delivery Expense</span>
                <p className="text-[10px] text-emerald-700">The customer pays the delivery fee directly at checkout.</p>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: CREATIVE TOOL CARDS & AI ANSWER CANVAS (LG: 7 COLS) */}
        <div className="lg:col-span-7 space-y-6">

          {/* 8 CREATIVE PLAIN ENGLISH TOOL CARDS GRID */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-600" /> Select Profit Tool for {productName}:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EASY_MODULES.map((mod) => {
                const Icon = mod.icon;
                const isActive = activeModule === mod.id;

                return (
                  <button
                    key={mod.id}
                    onClick={() => { setActiveModule(mod.id); setAiReport(null); }}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 ${
                      isActive
                        ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]"
                        : "bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 text-slate-800"
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isActive ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-200/80 text-slate-700"}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-extrabold tracking-tight">{mod.title}</h3>
                      <p className={`text-[10px] mt-0.5 line-clamp-1 ${isActive ? "text-slate-300" : "text-slate-500"}`}>{mod.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI ADVICE CANVAS WITH TRENDICHAT AVATAR HEADER */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5 min-h-[360px] flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl overflow-hidden ring-1 ring-emerald-500/40 shrink-0 bg-slate-100">
                    <Image src="/trendichat.png" alt="TrendiChat Avatar" width={28} height={28} className="object-cover w-full h-full" />
                  </div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    TrendiChat Profit Recommendation
                  </h3>
                </div>
                {engineUsed && <span className="text-[10px] font-mono text-slate-400">{engineUsed}</span>}
              </div>

              {/* ACTION BUTTON */}
              <button
                onClick={runAIProfitAnalysis}
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-4"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                <span>{loading ? "Computing Profit Strategy..." : `✨ Calculate Optimal Profit for "${productName}"`}</span>
              </button>

              {/* REPORT TEXT */}
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-700">TrendiChat Analyzing Product Image & Market Data for {productName}...</p>
                </div>
              ) : aiReport ? (
                <div className="animate-in fade-in">
                  <FormattedLightMarkdown content={aiReport} />
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
                  <Coins size={40} className="text-emerald-600 opacity-20" />
                  <h4 className="text-xs font-bold text-slate-700">Click the green button to compute AI profit strategy</h4>
                  <p className="text-xs text-slate-400 max-w-xs">Select any tool above to get customized plain-English recommendations.</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}