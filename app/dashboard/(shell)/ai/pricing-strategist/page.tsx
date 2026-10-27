"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Calculator, Loader2,
  Activity, ShoppingBag,
  Search, RefreshCw, Send,
  MessageSquare, Sparkles, TrendingUp
} from "lucide-react";
import { toast } from "sonner";

// --- DATA TYPES & HIGH-RES PRODUCT DEMO DATA ---
interface DBProduct { 
  id: string; 
  name: string; 
  price: number; 
  stockQuantity: number; 
  soldCount: number; 
  imageUrl: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  suggestedStrategy?: {
    hasStrategy: boolean;
    newPrice: number | null;
    newDiscount: number | null;
    newCostPrice: number | null;
    newDeliveryFee: number | null;
    newMarketingCost: number | null;
    buttonLabel: string;
  };
}

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

const INTENT_PROMPTS = [
  "I want to maximize profit on this item.",
  "I want to run a weekend promotional discount.",
  "What is wrong with my current prices?",
  "How can I bundle this to make more money?",
];

// Pre-process raw markdown to ensure headings, numbered lists, and bullets are properly separated
function preprocessChatMarkdown(raw: string): string {
  if (!raw) return "";
  let text = raw.replace(/\r\n/g, "\n");

  // 1. Break inline numbered list items that were bunched onto a single line (e.g. "Pricing 1. **Focus**: ... 2. **Hero**: ...")
  text = text.replace(/([^\n])\s+(\d+\.\s+\*\*)/g, "$1\n\n$2");
  text = text.replace(/([^\n])\s+(\d+\.\s+[A-Z])/g, "$1\n\n$2");

  // 2. Break inline bullet items
  text = text.replace(/([^\n])\s+([-*]\s+\*\*)/g, "$1\n\n$2");
  text = text.replace(/([^\n])\s+([-*]\s+[A-Z])/g, "$1\n\n$2");

  // 3. Ensure headings (#, ##, ###) are preceded by clean line breaks
  text = text.replace(/([^\n])\s+(#{1,6}\s+)/g, "$1\n\n$2");

  // 4. Split common intelligence headers stuck to body text
  const commonHeaders = [
    "Market Context & Customer Demand in [^\\n]+",
    "Strategic Recommendations & Benchmark Pricing",
    "Executive Advisory:[^\\n]+",
    "Tactical 7-Day Implementation Directives",
    "Immediate Reorder Priorities",
    "High-Converting Outfit & Service Bundles",
    "Warehouse Stock Diagnostics",
    "Local Market Pricing Benchmarks",
    "Profit Margin Expansion Tactics",
    "Primary Conversion Bottlenecks",
    "7-Day Revenue Action Plan",
    "Actionable Quality Control Directives",
    "Actionable Quality Control",
    "Executive Summary",
    "Key Directives",
    "Top Viral Recommendation",
  ];
  for (const h of commonHeaders) {
    const regex = new RegExp(`(#{1,6}\\s+${h})\\s+([A-Z0-9])`, "gi");
    text = text.replace(regex, "$1\n\n$2");
  }

  return text.trim();
}

function renderChatInlineFormatting(text: string) {
  if (!text) return null;

  // Split on bold (**...**), markdown links [text](url), hex color (#123456), and currency (GH₵ ...)
  const tokenRegex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|#[A-Fa-f0-9]{6}\b|GH₵\s*\d+(?:,\d{3})*(?:\.\d{2})?)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // 1. Bold text
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={idx} className="font-semibold text-slate-900 bg-emerald-50/90 px-1 py-0.5 rounded text-[0.95em]">
          {boldText}
        </strong>
      );
    }

    // 2. Markdown Links [text](url)
    if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        return (
          <a
            key={idx}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline inline-flex items-center gap-0.5"
          >
            <span>{match[1]}</span>
          </a>
        );
      }
    }

    // 3. Hex Color code
    if (/^#[A-Fa-f0-9]{6}$/i.test(part)) {
      return (
        <span
          key={idx}
          className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold align-middle shadow-2xs mx-0.5"
        >
          <span
            className="w-2.5 h-2.5 rounded-full border border-black/15 shadow-2xs shrink-0 inline-block"
            style={{ backgroundColor: part }}
          />
          {part.toUpperCase()}
        </span>
      );
    }

    // 4. Currency Tag
    if (/^GH₵\s*\d+/i.test(part)) {
      return (
        <span
          key={idx}
          className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-mono text-[11px] font-bold mx-0.5"
        >
          {part}
        </span>
      );
    }

    return part;
  });
}

// Clean Formatted Markdown Renderer for Chat Bubble
function FormattedChatMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const preprocessed = preprocessChatMarkdown(content);
  const blocks = preprocessed.split(/\n\n+/);

  return (
    <div className="space-y-3 text-slate-800 font-sans leading-relaxed text-xs sm:text-sm">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed || /^#+\s*$/.test(trimmed)) return null;

        // Headings
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={bIdx} className="text-sm sm:text-base font-bold text-slate-900 pt-1 pb-1 border-b-2 border-emerald-500">
              {renderChatInlineFormatting(trimmed.replace(/^#\s+/, ""))}
            </h2>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={bIdx} className="text-xs sm:text-sm font-bold text-slate-900 pt-1.5 pb-0.5 border-b border-slate-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              {renderChatInlineFormatting(trimmed.replace(/^##\s+/, ""))}
            </h3>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={bIdx} className="text-xs font-bold text-emerald-900 uppercase tracking-wide pt-1 pb-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {renderChatInlineFormatting(trimmed.replace(/^###\s+/, ""))}
            </h4>
          );
        }
        if (/^#{4,6}\s+/.test(trimmed)) {
          return (
            <h5 key={bIdx} className="text-[11px] font-bold text-slate-700 uppercase tracking-wider pt-1">
              {renderChatInlineFormatting(trimmed.replace(/^#{4,6}\s+/, ""))}
            </h5>
          );
        }

        // Numbered lists (1. ..., 2. ...)
        if (/^\d+\.\s+/.test(trimmed)) {
          const lines = trimmed.split("\n").filter((l) => /^\d+\.\s+/.test(l.trim()));
          return (
            <div key={bIdx} className="space-y-2 my-2">
              {lines.map((line, lIdx) => {
                const match = line.trim().match(/^(\d+)\.\s+([\s\S]*)$/);
                const num = match ? match[1] : `${lIdx + 1}`;
                const body = match ? match[2] : line.replace(/^\d+\.\s+/, "");
                return (
                  <div
                    key={lIdx}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100/70 text-xs sm:text-sm"
                  >
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {num}
                    </span>
                    <div className="flex-1 text-slate-800 leading-relaxed font-normal">
                      {renderChatInlineFormatting(body)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        // Bullet lists (- ..., * ...)
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split("\n").filter((l) => l.trim().startsWith("- ") || l.trim().startsWith("* "));
          return (
            <ul key={bIdx} className="space-y-1.5 my-1.5 pl-1">
              {items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2 text-slate-700 text-xs sm:text-sm leading-relaxed">
                  <div className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <div className="flex-1 font-normal">
                    {renderChatInlineFormatting(item.replace(/^[-*]\s+/, ""))}
                  </div>
                </li>
              ))}
            </ul>
          );
        }

        // Blockquotes (> ...)
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote key={bIdx} className="p-2.5 my-1 border-l-4 border-emerald-500 bg-emerald-50/60 rounded-r-lg text-emerald-950 font-medium text-xs sm:text-sm leading-relaxed">
              {renderChatInlineFormatting(trimmed.replace(/^>\s+/, ""))}
            </blockquote>
          );
        }

        // Regular paragraphs
        const lines = trimmed.split("\n").filter(Boolean);
        return (
          <div key={bIdx} className="text-slate-700 leading-relaxed text-xs sm:text-sm space-y-1">
            {lines.map((l, lineIdx) => (
              <p key={lineIdx}>{renderChatInlineFormatting(l)}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function TrendiChatPricingAndProfitStudioPage() {
  const [dbProducts, setDbProducts] = useState<DBProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [selectedProductId, setSelectedProductId] = useState<string>("demo-1");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Active Product State
  const [productName, setProductName] = useState<string>("Luxury Silk Kaftan & Wrap Set");
  const [productImage, setProductImage] = useState<string>(HIGH_RES_FASHION_DEMOS[0].imageUrl);
  const [stockQuantity, setStockQuantity] = useState<number>(24);
  const [soldCount, setSoldCount] = useState<number>(42);
  
  // Interactive Financial State
  const [currentPrice, setCurrentPrice] = useState<number>(180);
  const [costPrice, setCostPrice] = useState<number>(80);
  const [deliveryFee, setDeliveryFee] = useState<number>(15);
  const [marketingCost, setMarketingCost] = useState<number>(5);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
          handleProductSelect(prods[0].id, prods);
        } else {
          setDbProducts(HIGH_RES_FASHION_DEMOS);
          handleProductSelect(HIGH_RES_FASHION_DEMOS[0].id, HIGH_RES_FASHION_DEMOS);
        }
      })
      .catch(() => {
        setDbProducts(HIGH_RES_FASHION_DEMOS);
        handleProductSelect(HIGH_RES_FASHION_DEMOS[0].id, HIGH_RES_FASHION_DEMOS);
      })
      .finally(() => setLoadingProducts(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Auto-scroll chat
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isTyping]);

  const handleProductSelect = (id: string, products: DBProduct[] = dbProducts) => {
    setSelectedProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setProductName(prod.name);
      setCurrentPrice(prod.price);
      setCostPrice(Math.round(prod.price * 0.45)); // Simulate a cost price
      setDeliveryFee(10);
      setMarketingCost(5);
      setDiscountPercent(0);
      setProductImage(prod.imageUrl || HIGH_RES_FASHION_DEMOS[0].imageUrl);
      setStockQuantity(prod.stockQuantity || 15);
      setSoldCount(prod.soldCount || 8);
      
      // Reset chat
      setChatHistory([
        {
          id: Date.now().toString(),
          role: "ai",
          content: `Hi! I'm your TrendiChat CFO. Let's optimize pricing for the **${prod.name}**. What would you like to achieve?`
        }
      ]);
    }
  };

  // Filtered Products for Live Search
  const filteredProducts = dbProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Math Engine
  const discountAmount = Math.round((currentPrice * discountPercent) / 100);
  const netSellingPrice = currentPrice - discountAmount;
  const totalExpenses = costPrice + deliveryFee + marketingCost;
  const netProfit = netSellingPrice - totalExpenses;
  
  // Clean Margin %
  const marginPercent = netProfit >= 0
    ? (netSellingPrice > 0 ? Math.round((netProfit / netSellingPrice) * 100) : 0)
    : (totalExpenses > 0 ? Math.round((netProfit / totalExpenses) * 100) : 0);
  
  const handleSendChat = async (queryText: string) => {
    if (!queryText.trim() || isTyping) return;
    
    const userMsgId = Date.now().toString();
    setChatHistory(prev => [...prev, { id: userMsgId, role: "user", content: queryText.trim() }]);
    setChatInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/ai/market-intelligence", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "pricing-chat", 
          payload: { 
            productId: selectedProductId, 
            productName, 
            currentPrice: netSellingPrice, 
            costPrice, 
            marginPercent, 
            discountPercent,
            stockQuantity,
            soldCount,
            userQuery: queryText.trim()
          } 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI Analysis failed");
      
      const aiResponse = data.result;
      
      setChatHistory(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: "ai", 
        content: aiResponse.message,
        suggestedStrategy: aiResponse.suggestedStrategy
      }]);
    } catch (err: unknown) {
      toast.error("Could not complete AI analysis");
    } finally {
      setIsTyping(false);
    }
  };

  const applyStrategy = (strategy: NonNullable<ChatMessage["suggestedStrategy"]>) => {
    if (strategy.newPrice !== null && strategy.newPrice !== undefined) setCurrentPrice(strategy.newPrice);
    if (strategy.newDiscount !== null && strategy.newDiscount !== undefined) setDiscountPercent(strategy.newDiscount);
    if (strategy.newCostPrice !== null && strategy.newCostPrice !== undefined) setCostPrice(strategy.newCostPrice);
    if (strategy.newDeliveryFee !== null && strategy.newDeliveryFee !== undefined) setDeliveryFee(strategy.newDeliveryFee);
    if (strategy.newMarketingCost !== null && strategy.newMarketingCost !== undefined) setMarketingCost(strategy.newMarketingCost);
    toast.success("Strategy applied successfully!");
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 p-4 pb-20 font-sans text-slate-900">

      {/* HEADER */}
      <header className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-emerald-500/40 shadow-xs bg-slate-100 flex items-center justify-center shrink-0">
            <Image src="/trendichat.png" alt="TrendiChat AI" width={40} height={40} className="object-cover" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Pricing & Profit Strategist
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200/80 uppercase">
                Conversational CFO
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Chat directly with your AI financial advisor to simulate margins and optimize pricing.
            </p>
          </div>
        </div>
      </header>

      {/* PRODUCT CAROUSEL */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <ShoppingBag size={13} className="text-emerald-600" /> Target Product:
          </label>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search store SKU..."
              className="w-full h-8 pl-8 pr-6 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filteredProducts.map((p) => {
            const isSelected = p.id === selectedProductId;
            return (
              <button
                key={p.id}
                onClick={() => handleProductSelect(p.id)}
                className={`flex items-center gap-3 p-1.5 pr-4 rounded-xl border transition-all shrink-0 ${
                  isSelected ? "bg-slate-900 text-white border-slate-900 shadow-xs" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-900"
                }`}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                  <Image src={p.imageUrl} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                </div>
                <div className="text-left min-w-[120px]">
                  <h4 className="text-[11px] font-bold line-clamp-1">{p.name}</h4>
                  <p className={`text-[10px] font-mono font-semibold ${isSelected ? "text-emerald-400" : "text-emerald-600"}`}>
                    GH₵ {p.price}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* LEFT: INTERACTIVE SIMULATOR */}
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Live Profit Simulator</h2>
            </div>

            {/* Visual Margin Indicator */}
            <div className={`p-4 rounded-xl flex items-center justify-between border ${
              netProfit < 0 ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"
            }`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Projected Net Profit</p>
                <p className={`text-3xl font-black font-mono tracking-tight ${netProfit < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                  {netProfit < 0 ? "-" : "+"}GH₵ {Math.abs(netProfit)}
                </p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Current Margin</p>
                <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-lg font-black font-mono shadow-inner ${
                  netProfit < 0 ? "bg-rose-200 text-rose-900" : "bg-emerald-200 text-emerald-900"
                }`}>
                  {marginPercent}%
                </span>
              </div>
            </div>

            {/* Interactive Sliders */}
            <div className="space-y-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Base Selling Price (GH₵)</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900">{currentPrice}</span>
                </div>
                <input
                  type="range" min="10" max="1500" step="10"
                  value={currentPrice} onChange={e => setCurrentPrice(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Promotional Discount (%)</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-rose-600">{discountPercent}%</span>
                </div>
                <input
                  type="range" min="0" max="80" step="5"
                  value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))}
                  className="w-full accent-rose-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
                  <span>Customer pays: GH₵ {netSellingPrice}</span>
                  {discountAmount > 0 && <span className="text-rose-500">Save GH₵ {discountAmount}</span>}
                </div>
              </div>

            </div>

            <div className="pt-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Cost Breakdown</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500">Unit Cost (GH₵)</label>
                  <input
                    type="number" value={costPrice} onChange={e => setCostPrice(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 transition-colors shadow-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500">Delivery/Shipping (GH₵)</label>
                  <input
                    type="number" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 transition-colors shadow-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500">Marketing (GH₵)</label>
                  <input
                    type="number" value={marketingCost} onChange={e => setMarketingCost(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 transition-colors shadow-xs"
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-end">
                  <div className="h-9 flex items-center justify-between px-3 bg-slate-100 rounded-lg border border-slate-200 border-dashed">
                    <span className="text-[10px] font-bold text-slate-500">Total Exp</span>
                    <span className="text-sm font-bold font-mono text-slate-800">GH₵ {totalExpenses}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT: CONVERSATIONAL CFO CHAT */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden h-[600px] lg:h-auto">
          
          {/* Chat Header */}
          <div className="bg-white px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Talk to Strategy AI</h2>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          {/* Chat History Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  
                  {/* Avatar */}
                  <div className="shrink-0 mt-1">
                    {msg.role === "ai" ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
                        <Image src="/trendichat.png" alt="AI" width={32} height={32} className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                        <span className="text-[10px] font-bold text-slate-500">YOU</span>
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className="space-y-2">
                    <div className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm ${
                      msg.role === "user" 
                        ? "bg-slate-900 text-white rounded-tr-sm shadow-xs" 
                        : "bg-white border border-slate-200/90 text-slate-800 shadow-xs rounded-tl-sm leading-relaxed"
                    }`}>
                      {msg.role === "ai" ? (
                        <FormattedChatMarkdown content={msg.content} />
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                    </div>

                    {/* Action Strategy Payload (If provided by AI) */}
                    {msg.role === "ai" && msg.suggestedStrategy?.hasStrategy && (
                      <button 
                        onClick={() => applyStrategy(msg.suggestedStrategy!)}
                        className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                      >
                        <TrendingUp size={14} />
                        {msg.suggestedStrategy.buttonLabel || "Apply Pricing Strategy"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex w-full justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                    <Image src="/trendichat.png" alt="AI" width={32} height={32} className="object-cover" />
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center h-10">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200">
            {/* Quick Prompts */}
            <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
              {INTENT_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChat(prompt)}
                  disabled={isTyping}
                  className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full text-[11px] font-semibold text-slate-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles size={12} className="text-emerald-500" />
                  {prompt}
                </button>
              ))}
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat(chatInput)}
                placeholder="Ask about margins, discounts, or bundles..."
                disabled={isTyping}
                className="w-full h-11 pl-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors disabled:bg-slate-100"
              />
              <button
                onClick={() => handleSendChat(chatInput)}
                disabled={!chatInput.trim() || isTyping}
                className="absolute right-1.5 top-1.5 bottom-1.5 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:hover:bg-emerald-600"
              >
                <Send size={14} className="ml-0.5" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}