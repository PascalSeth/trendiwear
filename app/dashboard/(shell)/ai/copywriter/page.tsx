"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  FileText, Loader2, Sparkles, Copy, Check, Feather, Tag,
  Globe, Search, Sliders,
  Repeat, Image as ImageIcon, Volume2, ShoppingCart, Send,
  Sparkle, Smartphone, ShoppingBag, MessageSquare
} from "lucide-react";
import { toast } from "sonner";

// --- LIGHT THEME RICH MARKDOWN RENDERER ---
function FormattedLightMarkdown({ content }: { content: string }) {
  if (!content) return null;
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-4 text-slate-700 font-sans leading-relaxed text-xs sm:text-sm selection:bg-purple-100 selection:text-purple-900">
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
                        <tr key={i} className={i % 2 === 0 ? "bg-white hover:bg-purple-50/30" : "bg-slate-50/50 hover:bg-purple-50/40"}>
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
        if (trimmed.startsWith("### ")) return <h3 key={bIdx} className="text-xs sm:text-sm font-bold text-slate-900 pt-2 pb-0.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-600" />{renderInline(trimmed.replace(/^###\s+/, ""))}</h3>;
        if (trimmed.startsWith("## ")) return <h2 key={bIdx} className="text-sm sm:text-base font-extrabold text-slate-900 pt-3 pb-1 border-b border-slate-200 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-purple-600" />{renderInline(trimmed.replace(/^##\s+/, ""))}</h2>;
        if (trimmed.startsWith("# ")) return <h1 key={bIdx} className="text-base sm:text-lg font-black tracking-tight text-slate-900 pt-4 pb-1 border-b-2 border-purple-600">{renderInline(trimmed.replace(/^#\s+/, ""))}</h1>;

        // 3. BULLETS
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split("\n").filter(l => l.trim().startsWith("- ") || l.trim().startsWith("* "));
          return (
            <ul key={bIdx} className="space-y-1.5 my-2 pl-1">
              {items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2 text-slate-700 text-xs sm:text-sm">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-600 shrink-0" />
                  <div className="flex-1 leading-relaxed">{renderInline(item.replace(/^[-*]\s+/, ""))}</div>
                </li>
              ))}
            </ul>
          );
        }

        // 4. CALLOUTS
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote key={bIdx} className="p-3.5 my-3 border-l-4 border-purple-600 bg-purple-50/70 rounded-r-2xl text-purple-950 font-medium text-xs sm:text-sm leading-relaxed">
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
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={idx} className="font-extrabold text-slate-900 bg-purple-50 px-1 py-0.5 rounded text-[0.95em]">{part.slice(2, -2)}</strong>;
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((cPart, cIdx) => {
      if (cPart.startsWith("`") && cPart.endsWith("`")) return <code key={cIdx} className="font-mono bg-slate-100 text-purple-900 px-1.5 py-0.5 rounded-md text-[0.85em] border border-slate-200 font-semibold">{cPart.slice(1, -1)}</code>;
      return cPart;
    });
  });
}

// --- COPYWRITER TOOLS SPECIFICATIONS ---
type CopywriterTool = 
  | "description-gen"
  | "title-optimizer"
  | "social-captions"
  | "seo-keywords"
  | "marketing-copy"
  | "feature-benefit"
  | "multi-lang"
  | "size-guide"
  | "alt-text"
  | "tone-customizer"
  | "marketplace-opt"
  | "ab-copy"
  | "brand-voice";

const COPYWRITER_TOOLS: { id: CopywriterTool; title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "description-gen", title: "✍️ Description Generator", subtitle: "Compelling, high-converting product descriptions with CTAs.", icon: FileText },
  { id: "title-optimizer", title: "🏷️ Title Optimizer", subtitle: "Turn plain titles into SEO-optimized, high-click titles.", icon: Tag },
  { id: "social-captions", title: "📱 Social Media Captions", subtitle: "Engaging captions & hashtags for IG, TikTok, FB, X, & Pinterest.", icon: Smartphone },
  { id: "seo-keywords", title: "🎯 SEO Keyword Generator", subtitle: "Primary keywords, long-tail terms, and search tags.", icon: Search },
  { id: "marketing-copy", title: "📢 Marketing & Email Copy", subtitle: "Email campaigns, promo banners, flash sale text, and headlines.", icon: Send },
  { id: "feature-benefit", title: "🛍️ Feature-to-Benefit", subtitle: "Turns technical specs ('100% Cotton') into emotional buyer benefits.", icon: Sparkle },
  { id: "multi-lang", title: "🌍 Multi-Language Translation", subtitle: "Translate into French, Arabic, Spanish while keeping marketing tone.", icon: Globe },
  { id: "size-guide", title: "📏 Size Guide Writer", subtitle: "Readable model dimensions and fit recommendations for customers.", icon: Sliders },
  { id: "alt-text", title: "📸 Image Alt Text Generator", subtitle: "SEO & accessibility image alt tags for product photos.", icon: ImageIcon },
  { id: "tone-customizer", title: "⭐ Tone Swapper", subtitle: "Switch brand voice (Luxury, Streetwear, Gen Z, Minimal, Premium).", icon: Volume2 },
  { id: "marketplace-opt", title: "🛒 Marketplace Formatter", subtitle: "Optimized formats for Shopify, Amazon, Etsy, WooCommerce, & TrendiZip.", icon: ShoppingCart },
  { id: "ab-copy", title: "🔥 A/B Copy Generator", subtitle: "Create 3 copy variations (Comfort vs Quality vs Style) to test.", icon: Repeat },
  { id: "brand-voice", title: "💬 Saved AI Brand Voice", subtitle: "Save your brand persona so all future copy matches your voice.", icon: MessageSquare },
];

const BRAND_VOICE_PRESETS = [
  { id: "luxury", label: "👑 Luxury Boutique", desc: "Sophisticated, elegant, high-end tone" },
  { id: "streetwear", label: "🔥 Urban Streetwear", desc: "Bold, edgy, youthful street style" },
  { id: "heritage", label: "🌍 African Heritage", desc: "Rich cultural storytelling & artisanal pride" },
  { id: "minimal", label: "🌿 Sustainable & Minimal", desc: "Clean, conscious, timeless luxury" },
  { id: "genz", label: "✨ Gen Z & Trendy", desc: "Vibrant, conversational, trend-first" },
  { id: "professional", label: "💼 Corporate & Executive", desc: "Polished, authoritative, structured" },
];

interface DBProduct { 
  id: string; 
  name: string; 
  category?: string;
  material?: string;
  imageUrl: string;
}

const DEMO_PRODUCTS: DBProduct[] = [
  { id: "demo-1", name: "Premium Oversized Black Cotton Hoodie", category: "Streetwear & Hoodies", material: "450GSM Heavyweight Fleece Cotton", imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80" },
  { id: "demo-2", name: "Embroidered Royal Silk Kaftan Set", category: "Traditional Luxury", material: "Handwoven Mulberry Silk & Gold Thread", imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80" },
  { id: "demo-3", name: "Ankara Corset Midi Party Dress", category: "Womenswear / Evening", material: "Wax Print Cotton & Satin Lining", imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80" },
];

export default function ProductCopywriterPage() {
  const [dbProducts, setDbProducts] = useState<DBProduct[]>(DEMO_PRODUCTS);
  const [selectedProductId, setSelectedProductId] = useState<string>("demo-1");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Input State
  const [productName, setProductName] = useState<string>("Premium Oversized Black Cotton Hoodie");
  const [category, setCategory] = useState<string>("Streetwear & Hoodies");
  const [material, setMaterial] = useState<string>("450GSM Heavyweight Fleece Cotton");
  const [features, setFeatures] = useState<string>("Double-lined hood, dropped shoulders, kangaroo pocket, preshrunk fabric");
  const [targetAudience] = useState<string>("Men & Women (18-35) interested in streetwear & comfort");
  const [brandVoice, setBrandVoice] = useState<string>("luxury");
  const [targetLanguage, setTargetLanguage] = useState<string>("English");
  const [targetMarketplace, setTargetMarketplace] = useState<string>("TrendiZip Marketplace");

  // Active Tool State
  const [activeTool, setActiveTool] = useState<CopywriterTool>("description-gen");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [engineUsed, setEngineUsed] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectProduct = (id: string, products: DBProduct[] = dbProducts) => {
    setSelectedProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setProductName(prod.name);
      if (prod.category) setCategory(prod.category);
      if (prod.material) setMaterial(prod.material);
      setResult(null);
    }
  };

  // Load products from DB
  useEffect(() => {
    fetch("/api/ai/market-intelligence", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "seller-health" }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.telemetry?.products && data.telemetry.products.length > 0) {
          const prods: DBProduct[] = data.telemetry.products.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            name: p.name as string,
            category: (p.category as string) || "Fashion & Apparel",
            material: (p.material as string) || "Premium Fabric",
            imageUrl: (p.images as string[])?.[0] || DEMO_PRODUCTS[0].imageUrl,
          }));
          setDbProducts(prods);
          setSelectedProductId(prods[0].id);
          setProductName(prods[0].name);
          if (prods[0].category) setCategory(prods[0].category);
          if (prods[0].material) setMaterial(prods[0].material);
        }
      })
      .catch(() => {});
  }, []);

  const handleGenerateCopy = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai/market-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "copywriter",
          payload: {
            tool: activeTool,
            productName,
            category,
            material,
            features,
            targetAudience,
            brandVoice,
            targetLanguage,
            targetMarketplace,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate copy");

      setResult(data.result);
      if (data.engineUsed) setEngineUsed(data.engineUsed);
      toast.success("High-Converting Copy Generated!");
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      toast.error(errObj.message || "Failed to generate copy");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredProducts = dbProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="w-full flex-1 flex flex-col bg-slate-50 text-slate-900 font-sans p-4 sm:p-6 space-y-6 overflow-y-auto">

      {/* HEADER BANNER WITH TRENDICHAT AVATAR */}
      <header className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative group shrink-0">
            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-purple-500/40 shadow-md shadow-purple-500/10 bg-slate-100 flex items-center justify-center">
              <Image 
                src="/trendichat.png" 
                alt="TrendiChat Avatar" 
                width={48} 
                height={48} 
                className="object-cover w-full h-full"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-purple-500 border-2 border-white rounded-full animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">AI Product Copywriter & Storyteller</h1>
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-extrabold rounded-full border border-purple-200 uppercase tracking-widest">
                Content Suite
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Strictly focused on high-converting product descriptions, SEO titles, social captions, & brand storytelling.
            </p>
          </div>
        </div>

        {/* SAVED BRAND VOICE SELECTOR */}
        <div className="flex items-center gap-2 shrink-0 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 pl-2">Brand Voice:</span>
          <select
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            className="bg-white text-xs font-extrabold text-slate-900 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-purple-500"
          >
            {BRAND_VOICE_PRESETS.map((bv) => (
              <option key={bv.id} value={bv.id}>{bv.label}</option>
            ))}
          </select>
        </div>
      </header>

      {/* STORE PRODUCT SELECTOR & SEARCH */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <ShoppingBag size={14} className="text-purple-600" /> Select Store Garment to Write Copy For:
          </label>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search store catalog..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* THUMBNAILS CAROUSEL */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 hide-scrollbar">
          {filteredProducts.map((p) => {
            const isSelected = p.id === selectedProductId;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectProduct(p.id)}
                className={`group relative flex-none w-44 p-2 rounded-2xl border transition-all text-left overflow-hidden ${
                  isSelected 
                    ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-purple-500" 
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-900"
                }`}
              >
                <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2 bg-slate-200">
                  <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-extrabold line-clamp-1">{p.name}</h4>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: 13 SPECIALIZED COPYWRITING TOOLS & INPUTS (LG: 5 COLS) */}
        <div className="lg:col-span-5 space-y-6">

          {/* COPYWRITER TOOLS GRID */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Feather size={14} className="text-purple-600" /> Select Copywriting Tool:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COPYWRITER_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;

                return (
                  <button
                    key={tool.id}
                    onClick={() => { setActiveTool(tool.id); setResult(null); }}
                    className={`p-3 rounded-2xl border text-left transition-all duration-200 flex items-start gap-2.5 ${
                      isActive
                        ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-800"
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl shrink-0 ${isActive ? "bg-purple-500 text-white font-bold" : "bg-slate-200/80 text-slate-700"}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-extrabold tracking-tight line-clamp-1">{tool.title}</h3>
                      <p className={`text-[10px] mt-0.5 line-clamp-1 ${isActive ? "text-slate-300" : "text-slate-500"}`}>{tool.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* INPUT FORM PANEL */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Garment Copy Specifications</span>
              <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                {activeTool}
              </span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Product Title</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Material / Fabric</label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Key Product Features</label>
                <textarea
                  rows={2}
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-purple-500"
                />
              </div>

              {/* DYNAMIC TOOL FIELDS */}
              {activeTool === "multi-lang" && (
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Target Language</label>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  >
                    <option value="French">French 🇫🇷 (Français)</option>
                    <option value="Arabic">Arabic 🇦🇪 (العربية)</option>
                    <option value="Spanish">Spanish 🇪🇸 (Español)</option>
                    <option value="English">English 🇬🇧 (Standard)</option>
                  </select>
                </div>
              )}

              {activeTool === "marketplace-opt" && (
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Target Marketplace</label>
                  <select
                    value={targetMarketplace}
                    onChange={(e) => setTargetMarketplace(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  >
                    <option value="TrendiZip Marketplace">TrendiZip Marketplace</option>
                    <option value="Shopify Store">Shopify Store</option>
                    <option value="Amazon Fashion">Amazon Fashion</option>
                    <option value="Etsy Vintage & Handcrafted">Etsy Handcrafted</option>
                    <option value="WooCommerce">WooCommerce</option>
                  </select>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI COPY OUTPUT CANVAS (LG: 7 COLS) */}
        <div className="lg:col-span-7 space-y-6">

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5 min-h-[520px] flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl overflow-hidden ring-1 ring-purple-500/40 shrink-0 bg-slate-100">
                    <Image src="/trendichat.png" alt="TrendiChat Avatar" width={28} height={28} className="object-cover w-full h-full" />
                  </div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    TrendiChat Copywriter Output
                  </h3>
                </div>

                {result && (
                  <button
                    onClick={handleCopyText}
                    className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs rounded-xl border border-purple-200 flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copied ? "Copied!" : "Copy Text"}</span>
                  </button>
                )}
              </div>

              {/* GENERATE ACTION BUTTON */}
              <button
                onClick={handleGenerateCopy}
                disabled={loading}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-4"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                <span>{loading ? "Writing High-Converting Copy..." : `✨ Generate Copy for "${productName}"`}</span>
              </button>

              {/* REPORT RESULT */}
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3 text-center">
                  <Loader2 className="w-9 h-9 text-purple-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-700">TrendiChat Writing High-Converting Content for {productName}...</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">Optimizing tone, SEO keywords, formatting, and persuasive buyer benefits.</p>
                </div>
              ) : result ? (
                <div className="animate-in fade-in">
                  <FormattedLightMarkdown content={result} />
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
                  <Feather size={44} className="text-purple-600 opacity-20" />
                  <h4 className="text-xs font-bold text-slate-700">Select any copy tool on the left and click generate</h4>
                  <p className="text-xs text-slate-400 max-w-xs">Generate SEO titles, descriptions, social media captions, A/B test variations, and size guides.</p>
                </div>
              )}
            </div>

            {engineUsed && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Model Engine: {engineUsed}</span>
                <span>Tone: {brandVoice.toUpperCase()}</span>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
