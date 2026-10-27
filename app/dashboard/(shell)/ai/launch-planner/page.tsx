"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Rocket, Calendar, Video, Mail, Loader2,
  BarChart3, Users, Gift, PackageCheck, CheckSquare, MessageSquare,
  Layers, Target, Copy, Check, ArrowRight, Share2, MessageCircle, Sparkles,
  ShoppingBag, DollarSign, Clock, ChevronRight, AlertTriangle, Eye, ShieldCheck,
  TrendingUp, RefreshCw, CheckCircle2, Circle, Edit3, ExternalLink,
  Smartphone, Volume2, Heart, Bookmark, Filter, Sliders,
  Wand2, ChevronLeft, ArrowUpRight, Info, CheckCheck, HelpCircle, Tag,
  ChevronDown, ChevronUp, Zap, Flame, PieChart, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  CollectionLaunchPlan,
  LaunchHeroProduct,
  LaunchContentCalendarItem,
  LaunchVideoBrief,
  LaunchChecklistItem,
  LaunchDecisionRule
} from "@/app/api/ai/launch-planner/route";

interface ProductCatalogItem {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  images: string[];
  isPreorder: boolean;
  categories: { id: string; name: string }[];
}

interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  _count?: { products: number };
}

// Quick target presets for 1-click goal adjustments
const TARGET_PRESETS = [3500, 5000, 7500, 10000, 15000];

function buildInitialPlan(
  products: ProductCatalogItem[],
  collectionName: string,
  targetRevenue: number,
  brandHandle: string
): CollectionLaunchPlan {
  const heroes: LaunchHeroProduct[] = products.slice(0, 4).map((p, idx) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stockQuantity: p.stockQuantity,
    isPreorder: p.isPreorder,
    imageUrl: p.images?.[0],
    role: idx === 0 ? "LEAD_ANCHOR" : idx === 1 ? "PROFIT_DRIVER" : "VIRAL_HOOK",
    roleLabel: idx === 0 ? "Lead Anchor Piece" : idx === 1 ? "Profit Driver" : "Viral Contender",
    reasoning: idx === 0
      ? "Signature silhouette that sets the commercial identity of your drop."
      : idx === 1
      ? "Strong retail margin driver designed for multi-item cart conversion."
      : "Highly shareable styling piece ideal for 3-second short-form hooks.",
    stockStatus: p.isPreorder ? "PREORDER_AVAILABLE" : p.stockQuantity <= 3 ? "LOW_STOCK" : "HEALTHY",
    stockWarning: p.stockQuantity <= 3 && !p.isPreorder ? "Only few units remaining—highlight exclusivity!" : undefined,
  }));

  return {
    id: `plan-init-${Date.now()}`,
    collectionName,
    mainGoal: "Sell as many products as possible",
    targetLaunchDate: "Within 14 Days",
    budgetGHS: 650,
    revenueTargetGHS: targetRevenue,
    channels: ["TikTok & Instagram", "Trendizip Showcase", "WhatsApp VIP Broadcast"],
    strategy: {
      campaignTitle: `${collectionName} Drop`,
      theme: "Modern African Elegance & Precision Tailoring",
      targetCustomerProfile: {
        demographic: "Fashion-conscious women & men in Accra, Kumasi & diaspora",
        styleAesthetic: "Contemporary African luxury with sleek cuts",
        lifestyleAndOccasion: "Weekend celebrations, brunches, and evening galas",
        buyingMotivation: "High perceived quality, artisanal drape, ready-to-wear convenience",
      },
      positioningStatement: `Elevate your wardrobe with the ${collectionName} collection—crafted in limited batches for standout presence.`,
      pricingAndPromoAdvice: "Protect individual piece margins. Offer complimentary express delivery on orders over GH₵ 600.",
      budgetAllocation: {
        creatorGiftingGHS: 260,
        socialAdsGHS: 230,
        showcaseAndMarketplaceGHS: 100,
        packagingAndExperienceGHS: 60,
      },
    },
    heroProducts: heroes,
    inventoryAudit: {
      totalPieces: products.reduce((acc, p) => acc + (p.stockQuantity || 1), 0),
      totalCatalogueValueGHS: products.reduce((acc, p) => acc + (p.price * (p.stockQuantity || 1)), 0),
      preorderEligibleCount: products.filter(p => p.isPreorder).length,
      lowStockWarningsCount: products.filter(p => !p.isPreorder && p.stockQuantity <= 3).length,
    },
    marketingAssets: {
      instagramCaption: `The wait is over ✨ Introducing the **${collectionName}**.\n\nEvery piece in this drop was crafted with premium breathable fabrics and clean silhouette tailoring.\n\n🛍️ Handcrafted in limited batches\n📍 Nationwide delivery across Ghana & worldwide shipping\n\nTap the link in bio to shop your size before pieces sell out! 👇\n\n#TrendiZip #GhanaFashion #${brandHandle.replace(/[^a-zA-Z0-9]/g, '')}`,
      tiktokHookScript: `[3-Second Hook]: "Stop scrolling if you’re tired of outfits that look good online but feel uncomfortable in person."\n\n[Visual]: Style the lead ${heroes[0]?.name || "collection piece"} with gold accessories.\n\n[Voiceover]: "This is our brand new ${collectionName} drop. Cut in limited batches so you never bump into someone wearing your same outfit."\n\n[CTA]: "Available right now on TrendiZip—link in bio!"`,
      whatsappBroadcast: `Hello Gorgeous! ✨\n\nBecause you are one of our VIP clients, we’re giving you a **24-hour private head start** to shop our new **${collectionName}** before the public drop tonight.\n\nPieces are limited to maintain exclusivity. Reply here with your size to secure yours! 💛`,
      promotionalOfferAnnouncement: `Launch Week Perk: Complimentary Priority Delivery across Accra on all collection orders placed within the first 48 hours.`,
      videoBriefs: [
        {
          title: "The 'Styling 1 Piece 3 Ways' Transition Reel",
          channel: "Instagram Reel",
          hook3s: "Show 3 completely different footwear pairs hitting the floor in 1 second.",
          scenes: [
            { sceneNumber: 1, description: "Style piece with white sneakers and tote bag for brunch", visualCue: "Natural sunlight, dynamic walk towards camera" },
            { sceneNumber: 2, description: "Quick snap transition to block heels and clutch for evening", visualCue: "Golden hour lighting, 360-degree twirl" },
            { sceneNumber: 3, description: "Macro shot of neat seam finish and inner lining", visualCue: "Hands running across fabric texture" },
          ],
          audioVibe: "Warm upbeat Amapiano log-drum groove",
          callToAction: "Which look are you wearing? Drop 1, 2, or 3 below!",
        },
        {
          title: "Behind the Seams: Cutting & Tailoring the Lead Piece",
          channel: "TikTok",
          hook3s: "Sound of tailor scissors cutting crisp linen fabric directly by the mic (ASMR).",
          scenes: [
            { sceneNumber: 1, description: "Close-up of pattern tracing and chalk lines on the cutting table", visualCue: "Sharp focus on tailor hands" },
            { sceneNumber: 2, description: "Sewing machine running smooth stitch lines down the side seam", visualCue: "Satisfying rhythmic sewing sound" },
            { sceneNumber: 3, description: "Steaming the finished piece on the mannequin", visualCue: "Crisp transformation from flat to dimensional" },
          ],
          audioVibe: "Raw workshop ASMR with subtle lo-fi chill beat in background",
          callToAction: "Handcrafted right here in Ghana. Claim yours via link in bio.",
        },
      ],
    },
    calendar: [
      {
        day: 1,
        phase: "TEASE",
        channel: "INSTAGRAM_REEL",
        contentType: "Fabric & Color Moodboard Teaser",
        hook: "Something special is dropping this week...",
        audioVibe: "Chill Afrobeats Instrumental",
        creativeBrief: "Show close-ups of fabric rolls, thread spools, and sketches. Never show full piece yet.",
        suggestedPostingTime: "12:30 PM",
      },
      {
        day: 3,
        phase: "TEASE",
        channel: "TIKTOK",
        contentType: "Behind the Seams Studio Vlog",
        hook: "How we crafted the lead piece for our new drop",
        audioVibe: "Trending TikTok Voiceover + Upbeat Lo-Fi",
        creativeBrief: "Document pattern cutting and garment press. End on fitting room mirror glimpse.",
        suggestedPostingTime: "7:00 PM",
      },
      {
        day: 5,
        phase: "DROP",
        channel: "WHATSAPP_VIP",
        contentType: "VIP 24-Hour Early Access Broadcast",
        hook: "Private Link for VIP Clients Only",
        creativeBrief: "Send lookbook photos with direct checkout links 24h before public drop.",
        suggestedPostingTime: "9:00 AM",
      },
      {
        day: 6,
        phase: "DROP",
        channel: "INSTAGRAM_FEED",
        contentType: "Official Collection Launch Announcement",
        hook: "The Collection is LIVE: Shop Your Size Now",
        creativeBrief: "Editorial carousel of top looks with price tags and styling notes in caption.",
        suggestedPostingTime: "12:00 PM",
      },
      {
        day: 8,
        phase: "MOMENTUM",
        channel: "INSTAGRAM_REEL",
        contentType: "1 Piece Styled 3 Ways Transition",
        hook: "How to style the lead piece for brunch vs weddings",
        audioVibe: "Amapiano Dance Beat",
        creativeBrief: "Fast transition showing versatility for work, brunch, and night events.",
        suggestedPostingTime: "6:30 PM",
      },
      {
        day: 12,
        phase: "MOMENTUM",
        channel: "TIKTOK",
        contentType: "Stock Alert & Customer Unboxing",
        hook: "Only limited pieces remaining in stock!",
        creativeBrief: "Real customer packaging box, ribbon tie, thank you card, and urgent stock notice.",
        suggestedPostingTime: "8:00 PM",
      },
    ],
    checklist: [
      { id: "chk-1", phase: "Preparation", task: "Confirm sizing matrix and stock quantities for all pieces", isCompleted: true, tip: "Add inch measurements to product descriptions" },
      { id: "chk-2", phase: "Preparation", task: "Upload high-res flat lay and mannequin photos to TrendiZip", isCompleted: true, tip: "Use natural sunlight for truest fabric colors" },
      { id: "chk-3", phase: "Creative Production", task: "Film 3 vertical video try-on clips showcasing drape and movement", isCompleted: false, tip: "Include a 3-second hook showing the final styled look first" },
      { id: "chk-4", phase: "Creative Production", task: "Draft WhatsApp VIP early-access announcement", isCompleted: false, tip: "Offer loyal clients 24-hour head start" },
      { id: "chk-5", phase: "Launch Day", task: "Publish TrendiZip collection and feature in Marketplace Showcase", isCompleted: false, tip: "Post initial launch reel at peak noon browsing hour" },
      { id: "chk-6", phase: "Launch Day", task: "Send VIP WhatsApp broadcast with direct checkout links", isCompleted: false, tip: "Direct them directly to checkout to minimize drop-off" },
      { id: "chk-7", phase: "Post-Launch Push", task: "Review first 48h view-to-order ratio and restock fast-selling sizes", isCompleted: false, tip: "Switch sellout items to pre-order if demand spikes" },
    ],
    decisionMatrix: [
      {
        triggerMetric: "High Views (>150), Low Cart Adds (<5%)",
        observation: "Shoppers love the aesthetic but hesitate on fit, sizing, or perceived price.",
        recommendedAction: "Add clear bust/waist measurement specs and state whether fabric stretches.",
        urgency: "HIGH",
      },
      {
        triggerMetric: "High Cart Adds (>20), Low Checkout (<30%)",
        observation: "Shoppers have purchase intent but drop off during delivery or final price review.",
        recommendedAction: "Offer a 24-hour flash delivery subsidy (e.g. Free delivery on orders over GH₵ 500).",
        urgency: "HIGH",
      },
      {
        triggerMetric: "Rapid Sellout (<48 hours) on specific size/color",
        observation: "High organic product-market fit with imminent stock-out risk.",
        recommendedAction: "Immediately toggle 'Pre-order Mode' with a 10-14 day lead time to capture remaining orders.",
        urgency: "OPPORTUNITY",
      },
      {
        triggerMetric: "Slow Momentum (<50 views in 72 hours)",
        observation: "Organic social reach is suppressed or hook is not grabbing attention.",
        recommendedAction: "Repackage the video hook into a styling dilemma: 'How to style X for a Saturday wedding'.",
        urgency: "MEDIUM",
      },
    ],
    engineUsed: "TrendiBot Instant Engine",
    generatedAt: new Date().toISOString(),
  };
}

export default function LaunchPlannerPage() {
  // Active Tab for the Visual Displays Cockpit
  const [activeTab, setActiveTab] = useState<"simulator" | "runway" | "calendar" | "checklist" | "telemetry">("simulator");

  // Catalogue data from Trendizip API
  const [sellerProducts, setSellerProducts] = useState<ProductCatalogItem[]>([]);
  const [sellerCollections, setSellerCollections] = useState<CollectionItem[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [brandName, setBrandName] = useState<string>("My Brand");
  const [brandHandle, setBrandHandle] = useState<string>("mybrand.gh");
  const [storeTelemetry, setStoreTelemetry] = useState<{
    totalOrdersPlaced: number;
    totalCartIntent: number;
    totalWishlistSaves: number;
    totalGrossRevenue: number;
  }>({
    totalOrdersPlaced: 0,
    totalCartIntent: 0,
    totalWishlistSaves: 0,
    totalGrossRevenue: 0,
  });

  // Active Plan & Configuration state (null initially until generated with real products)
  const [activePlan, setActivePlan] = useState<CollectionLaunchPlan | null>(null);
  const [collectionName, setCollectionName] = useState<string>("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [salesTargetGHS, setSalesTargetGHS] = useState<number>(0);
  const [budgetGHS, setBudgetGHS] = useState<number>(650);
  const [launchWindow, setLaunchWindow] = useState<string>("Within 14 Days");
  const [mainGoal, setMainGoal] = useState<string>("Sell as many products as possible");
  const [generating, setGenerating] = useState<boolean>(false);
  const [showSkuTable, setShowSkuTable] = useState<boolean>(false);

  // Phone Simulator state
  const [phonePlatform, setPhonePlatform] = useState<"instagram" | "tiktok" | "whatsapp">("instagram");
  const [activeHeroIdx, setActiveHeroIdx] = useState<number>(0);
  const [editableInstagramCaption, setEditableInstagramCaption] = useState<string>("");
  const [editableTiktokHook, setEditableTiktokHook] = useState<string>("");
  const [editableWhatsappBroadcast, setEditableWhatsappBroadcast] = useState<string>("");

  // Calendar & Checklist state
  const [calendarFilter, setCalendarFilter] = useState<string>("ALL");
  const [checklistTasks, setChecklistTasks] = useState<LaunchChecklistItem[]>([]);

  // Core function to generate strategy with real catalogue data
  const runGenerate = async (
    targetColName: string,
    targetColId: string,
    targetPIds: string[],
    targetRevenueVal: number
  ) => {
    setGenerating(true);
    try {
      const budgetTier = budgetGHS === 0 ? "No paid advertising" :
        budgetGHS < 500 ? "Under GH₵500" :
        budgetGHS <= 1500 ? "GH₵500–1,500" : "GH₵1,500–5,000";

      const res = await fetch("/api/ai/launch-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionName: targetColName,
          collectionId: targetColId,
          selectedProductIds: targetPIds,
          goal: mainGoal,
          channels: ["TikTok & Instagram", "Trendizip Showcase", "WhatsApp VIP Broadcast"],
          budgetTier,
          launchWindow,
          customSalesTarget: targetRevenueVal,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate strategy");

      const plan: CollectionLaunchPlan = data.plan;
      setActivePlan(plan);
      setEditableInstagramCaption(plan.marketingAssets?.instagramCaption || "");
      setEditableTiktokHook(plan.marketingAssets?.tiktokHookScript || "");
      setEditableWhatsappBroadcast(plan.marketingAssets?.whatsappBroadcast || "");
      setChecklistTasks(plan.checklist || []);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      console.error("Strategy error:", errorObj);
      toast.error(errorObj.message || "Failed to calculate strategy");
    } finally {
      setGenerating(false);
    }
  };

  // Fetch real catalogue data on mount
  useEffect(() => {
    async function loadCatalogue() {
      setDataLoading(true);
      try {
        const res = await fetch("/api/ai/launch-planner");
        if (res.ok) {
          const data = await res.json();
          const prods: ProductCatalogItem[] = data.products || [];
          const colls: CollectionItem[] = data.collections || [];
          setSellerProducts(prods);
          setSellerCollections(colls);
          if (data.brandName) setBrandName(data.brandName);
          if (data.brandHandle) setBrandHandle(data.brandHandle);
          if (data.telemetry) setStoreTelemetry(data.telemetry);

          if (prods.length > 0) {
            const initColName = colls.length > 0
              ? colls[0].name
              : (prods[0].categories?.[0]?.name ? `${prods[0].categories[0].name} Drop` : "Signature Drop");
            const initColId = colls.length > 0 ? colls[0].id : "";
            setCollectionName(initColName);
            setSelectedCollectionId(initColId);

            const initialIds = prods.slice(0, 4).map(p => p.id);
            setSelectedProductIds(initialIds);

            const initialVal = prods.slice(0, 4).reduce((acc, p) => acc + (p.price * (p.stockQuantity || 1)), 0);
            const initialTarget = Math.max(1000, Math.round(initialVal * 0.75));
            setSalesTargetGHS(initialTarget);

            // Immediately instantiate real baseline plan so UI renders in <500ms
            const initPlan = buildInitialPlan(prods, initColName, initialTarget, data.brandHandle || "brand.gh");
            setActivePlan(initPlan);
            setEditableInstagramCaption(initPlan.marketingAssets.instagramCaption);
            setEditableTiktokHook(initPlan.marketingAssets.tiktokHookScript);
            setEditableWhatsappBroadcast(initPlan.marketingAssets.whatsappBroadcast);
            setChecklistTasks(initPlan.checklist);

            // Release loading state immediately so the user sees the full cockpit instantly
            setDataLoading(false);

            // Deep AI analysis runs asynchronously in background to enrich strategy
            runGenerate(initColName, initColId, initialIds, initialTarget);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load seller catalogue:", err);
      } finally {
        setDataLoading(false);
      }
    }
    loadCatalogue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute live commercial math grounded in real inventory
  const liveMath = useMemo(() => {
    const selectedProds = sellerProducts.filter(p => selectedProductIds.includes(p.id));
    const effectiveItems = selectedProds.length > 0 ? selectedProds : sellerProducts;

    const totalStockUnits = effectiveItems.reduce((acc, p) => acc + (p.stockQuantity || 1), 0);
    const catalogueValueGHS = effectiveItems.reduce((acc, p) => acc + (p.price * (p.stockQuantity || 1)), 0);
    const avgSkuPrice = effectiveItems.length > 0
      ? Math.round(effectiveItems.reduce((acc, p) => acc + p.price, 0) / effectiveItems.length)
      : 0;

    const targetRevenue = salesTargetGHS > 0 ? salesTargetGHS : Math.max(1000, Math.round(catalogueValueGHS * 0.75));
    const requiredOrders = avgSkuPrice > 0 ? Math.ceil(targetRevenue / avgSkuPrice) : 0;
    const sellThroughRate = totalStockUnits > 0
      ? Math.min(100, Math.round((requiredOrders / totalStockUnits) * 100))
      : 0;

    const sessionsNeeded = Math.round(requiredOrders / 0.032);
    const socialImpressionsNeeded = Math.round(sessionsNeeded / 0.08);

    const adImpressions = budgetGHS > 0 ? Math.round((budgetGHS / 22.5) * 1000) : 0;
    const adCoveragePct = socialImpressionsNeeded > 0
      ? Math.min(100, Math.round((adImpressions / socialImpressionsNeeded) * 100))
      : 0;

    return {
      effectiveItems,
      totalStockUnits,
      catalogueValueGHS,
      avgSkuPrice,
      targetRevenue,
      requiredOrders,
      sellThroughRate,
      sessionsNeeded,
      socialImpressionsNeeded,
      adImpressions,
      adCoveragePct,
    };
  }, [sellerProducts, selectedProductIds, salesTargetGHS, budgetGHS]);

  // Toggle SKU selection
  const toggleProductSelect = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const selectAllProducts = () => {
    setSelectedProductIds(liveMath.effectiveItems.map(p => p.id));
    toast.success("Included all collection styles in drop");
  };

  const deselectAllProducts = () => {
    setSelectedProductIds([]);
    toast.info("Cleared custom SKU selection (using baseline styles)");
  };

  // Trigger AI Strategy Generation
  const handleRegenerateStrategy = async () => {
    if (sellerProducts.length === 0) {
      toast.error("No products in catalogue to generate a plan");
      return;
    }
    await runGenerate(collectionName, selectedCollectionId, selectedProductIds, salesTargetGHS);
    toast.success("Launch Strategy & Creative Briefs Updated!");
  };

  // Copy helper
  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  // Toggle checklist item
  const toggleChecklistTask = (taskId: string) => {
    setChecklistTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t))
    );
  };

  const completedTasksCount = useMemo(() => {
    return checklistTasks.filter(t => t.isCompleted).length;
  }, [checklistTasks]);

  const readinessScore = useMemo(() => {
    if (checklistTasks.length === 0) return 60;
    return Math.round((completedTasksCount / checklistTasks.length) * 100);
  }, [completedTasksCount, checklistTasks]);

  const filteredCalendar = useMemo(() => {
    if (!activePlan?.calendar) return [];
    if (calendarFilter === "ALL") return activePlan.calendar;
    return activePlan.calendar.filter(c => c.phase === calendarFilter);
  }, [activePlan, calendarFilter]);

  const currentHero = useMemo(() => {
    if (!activePlan?.heroProducts || activePlan.heroProducts.length === 0) return null;
    return activePlan.heroProducts[activeHeroIdx] || activePlan.heroProducts[0];
  }, [activePlan, activeHeroIdx]);

  if (dataLoading) {
    return (
      <div className="w-full min-h-[500px] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="relative w-20 h-20 animate-bounce">
          <Image
            src="/trendibot.png"
            alt="TrendiBot AI"
            fill
            className="object-contain drop-shadow-xl"
            priority
          />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">Connecting to Real Catalogue</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            TrendiBot is fetching your live inventory, stock levels, and store telemetry...
          </p>
        </div>
        <Loader2 size={20} className="animate-spin text-amber-500" />
      </div>
    );
  }

  if (!dataLoading && sellerProducts.length === 0) {
    return (
      <div className="w-full min-h-[460px] flex flex-col items-center justify-center p-8 text-center space-y-4 bg-white rounded-2xl border border-slate-200">
        <div className="w-16 h-16 relative">
          <Image
            src="/trendibot.png"
            alt="TrendiBot AI"
            fill
            className="object-contain drop-shadow-md opacity-80"
          />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h2 className="text-lg font-bold text-slate-900">No Products in Your Catalogue</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The Collection Launch Planner is powered by your live inventory, real stock quantities, and authentic store telemetry. Add your collection styles to get started with TrendiBot.
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Link href="/dashboard/catalogue/products/new">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 px-4 rounded-xl cursor-pointer">
              Add First Product
            </Button>
          </Link>
          <Link href="/dashboard/catalogue/products">
            <Button variant="outline" className="border-slate-200 text-xs font-semibold h-9 px-4 rounded-xl cursor-pointer">
              View Catalogue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3.5 sm:space-y-4 pb-12 font-sans text-slate-800">

      {/* ========================================================================= */}
      {/* 1. DROP COMMAND HERO HEADER (Featuring TrendiBot AI Fashion Director) */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl p-4 sm:p-6">
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-amber-500/20 via-indigo-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-emerald-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* TrendiBot Robot + Titles + Dialogue Balloon */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
            {/* Robot Mascot Frame with Glowing Ring */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 opacity-60 blur-xs group-hover:opacity-100 transition-opacity animate-pulse" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shadow-2xl overflow-hidden">
                <Image
                  src="/trendibot.png"
                  alt="TrendiBot AI Fashion Director"
                  width={80}
                  height={80}
                  className="object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                  priority
                />
                {/* Active status pulse */}
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-950" />
                </span>
              </div>
            </div>

            {/* Title & Live Metadata */}
            <div className="space-y-1.5 min-w-0">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/dashboard/ai-studio"
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-semibold"
                >
                  <ChevronLeft size={13} /> Trendi AI Studio
                </Link>
                <span className="text-slate-700">/</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tracking-wide">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Catalogue Grounded
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 text-[10px] font-medium backdrop-blur-xs">
                  <PackageCheck size={11} className="text-amber-400" />
                  {liveMath.totalStockUnits} Units in Flight
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-medium">
                  @{brandHandle || "brand.gh"}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Collection Launch Planner
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 text-[10px] font-extrabold border border-amber-400/30 uppercase tracking-wider">
                  <Sparkles size={11} className="text-amber-400" /> AI Co-Pilot
                </span>
              </h1>

              {/* TrendiBot Dialogue Assessment Bubble */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-xs text-slate-300 max-w-xl">
                <Sparkles size={13} className="text-amber-400 shrink-0" />
                <p className="truncate text-[11px] sm:text-xs">
                  <strong className="text-white font-bold">TrendiBot:</strong> Drop strategy calibrated for{" "}
                  <span className="text-amber-300 font-bold">{collectionName || "New Capsule"}</span> — targeting{" "}
                  <span className="text-emerald-400 font-bold">GH₵ {liveMath.targetRevenue.toLocaleString()}</span> across{" "}
                  <span className="text-white font-semibold">{liveMath.requiredOrders} orders</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Cluster & Readiness */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 lg:self-center">
            {/* Launch Readiness Circular Meter */}
            <div className="px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 shadow-inner">
              <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={readinessScore >= 80 ? "text-emerald-400" : readinessScore >= 50 ? "text-amber-400" : "text-blue-400"}
                    strokeDasharray={`${readinessScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[11px] font-black text-white">{readinessScore}%</span>
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none">Drop Readiness</span>
                <span className="text-xs font-bold text-white mt-0.5 block">
                  {completedTasksCount} of {checklistTasks.length} Milestones
                </span>
              </div>
            </div>

            {/* Recalculate AI Strategy Button */}
            <Button
              type="button"
              onClick={handleRegenerateStrategy}
              disabled={generating}
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs h-11 px-5 rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-98 border border-amber-300/40"
            >
              {generating ? (
                <>
                  <Loader2 size={15} className="animate-spin text-slate-950" />
                  Calibrating...
                </>
              ) : (
                <>
                  <Wand2 size={15} className="text-slate-950" />
                  Recalculate AI Strategy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STRATEGIC LAUNCH CONTROLS (Mission Parameters Deck) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* LEFT PANEL: Drop Identity & Target Revenue (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
              <Target size={14} className="text-amber-600" />
              Drop Identity &amp; Revenue Target
            </span>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/60">
              Auto-synced with live inventory
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Collection Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>Collection Title</span>
                {sellerCollections.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    {sellerCollections.length} saved
                  </span>
                )}
              </label>
              {sellerCollections.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedCollectionId}
                    onChange={(e) => {
                      setSelectedCollectionId(e.target.value);
                      const c = sellerCollections.find(col => col.id === e.target.value);
                      if (c) setCollectionName(c.name);
                    }}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="">{collectionName || "Choose Collection"}</option>
                    {sellerCollections.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c._count?.products || 0} styles)</option>
                    ))}
                  </select>
                </div>
              ) : (
                <Input
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g. Summer Capsule Drop"
                  className="h-10 text-xs font-semibold border-slate-200 bg-slate-50 rounded-xl focus:bg-white shadow-2xs"
                />
              )}
            </div>

            {/* Sales Target Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">Gross Sales Target</label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-mono">
                  GH₵ {salesTargetGHS.toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">GH₵</span>
                <Input
                  type="number"
                  min="500"
                  step="500"
                  value={salesTargetGHS}
                  onChange={(e) => setSalesTargetGHS(Number(e.target.value))}
                  className="h-10 pl-12 text-xs font-bold border-slate-200 bg-slate-50 rounded-xl focus:bg-white text-slate-900 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Quick Preset Chips for Target */}
          <div className="pt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Quick Target:</span>
            {TARGET_PRESETS.map((preset) => {
              const isActive = salesTargetGHS === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSalesTargetGHS(preset)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10 scale-102"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 border border-slate-200/60"
                  )}
                >
                  GH₵ {(preset / 1000).toFixed(preset % 1000 === 0 ? 0 : 1)}K
                </button>
              );
            })}
            {liveMath.catalogueValueGHS > 0 && (
              <button
                type="button"
                onClick={() => setSalesTargetGHS(Math.round(liveMath.catalogueValueGHS * 0.75))}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 transition-all cursor-pointer"
              >
                ⚡ 75% Sell-Through (GH₵ {Math.round(liveMath.catalogueValueGHS * 0.75 / 1000)}K)
              </button>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Flight Parameters & Objectives (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
              <Sliders size={14} className="text-indigo-600" />
              Flight Parameters &amp; Goal
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
              Active Drop
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5">
            {/* Launch Timeline */}
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-bold text-slate-700 shrink-0">Timeline</label>
              <select
                value={launchWindow}
                onChange={(e) => setLaunchWindow(e.target.value)}
                className="h-8.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all cursor-pointer w-48 shadow-2xs"
              >
                <option value="Within 7 Days">⚡ 7 Days (Flash Drop)</option>
                <option value="Within 14 Days">🚀 14 Days (Standard)</option>
                <option value="Within 30 Days">📅 30 Days (Editorial)</option>
              </select>
            </div>

            {/* Paid Marketing Ad Budget */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-bold text-slate-700">Ad Budget</label>
                <span className="text-[9px] font-bold text-amber-700">GH₵ {budgetGHS}</span>
              </div>
              <select
                value={budgetGHS}
                onChange={(e) => setBudgetGHS(Number(e.target.value))}
                className="h-8.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all cursor-pointer w-48 shadow-2xs"
              >
                <option value={0}>GH₵ 0 (100% Organic)</option>
                <option value={350}>GH₵ 350 (Boosted Reels)</option>
                <option value={650}>GH₵ 650 (Balanced Seeding)</option>
                <option value={1500}>GH₵ 1,500 (Aggressive)</option>
              </select>
            </div>

            {/* Primary Campaign Goal */}
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-bold text-slate-700 shrink-0">Objective</label>
              <select
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value)}
                className="h-8.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all cursor-pointer w-48 shadow-2xs"
              >
                <option value="Sell as many products as possible">🎯 Maximize Volume</option>
                <option value="Build brand awareness">✨ Brand Awareness</option>
                <option value="Introduce a new brand or collection">💎 High-Margin Exclusivity</option>
                <option value="Clear existing stock">⚡ Fast Liquidation</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FINANCIAL FEASIBILITY & SKU ACCORDION (The Grounded Engine) */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-600" />
              Commercial Feasibility Model (Verifiable Store Arithmetic)
            </h2>
            <p className="text-[11px] text-slate-500 font-normal">
              Formulas grounded in physical inventory and verified West African mobile drop benchmarks (~3.2% checkout conversion).
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 shrink-0">
            Avg SKU Retail: <strong className="text-slate-900 font-bold">GH₵ {liveMath.avgSkuPrice}</strong>
          </span>
        </div>

        {/* 4 Rich High-Impact Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Tile 1: Stock Inventory */}
          <div className="p-3.5 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <PackageCheck size={12} className="text-emerald-600" /> Available Stock
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300/60">
                Grounded
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <strong className="text-xl sm:text-2xl font-black text-slate-900">{liveMath.totalStockUnits}</strong>
              <span className="text-xs text-slate-500 font-medium">units</span>
            </div>
            <p className="text-[10px] text-slate-600 font-medium truncate">
              Catalogue: <strong className="text-slate-900 font-bold">GH₵ {liveMath.catalogueValueGHS.toLocaleString()}</strong>
            </p>
          </div>

          {/* Tile 2: Orders Required */}
          <div className="p-3.5 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                <ShoppingBag size={12} className="text-blue-600" /> Orders to Target
              </span>
              <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full border border-blue-300/60">
                Target ÷ Price
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <strong className="text-xl sm:text-2xl font-black text-slate-900">{liveMath.requiredOrders}</strong>
              <span className="text-xs text-slate-500 font-medium">orders</span>
            </div>
            <p className="text-[10px] text-slate-600 font-medium truncate">
              Avg Basket: <strong className="text-slate-900 font-bold">GH₵ {liveMath.avgSkuPrice}</strong>
            </p>
          </div>

          {/* Tile 3: Sell-Through Rate */}
          <div className="p-3.5 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 space-y-1.5 shadow-2xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Flame size={12} className="text-amber-600" /> Sell-Through
              </span>
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-full border",
                liveMath.sellThroughRate > 90 ? "bg-rose-100 text-rose-800 border-rose-300/60" : "bg-amber-100 text-amber-800 border-amber-300/60"
              )}>
                {liveMath.sellThroughRate}%
              </span>
            </div>
            <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden my-1">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  liveMath.sellThroughRate > 90 ? "bg-gradient-to-r from-amber-500 to-rose-500" : "bg-gradient-to-r from-emerald-500 to-amber-500"
                )}
                style={{ width: `${Math.min(100, liveMath.sellThroughRate)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-600 font-medium truncate">
              {liveMath.sellThroughRate <= 100
                ? `${liveMath.totalStockUnits - liveMath.requiredOrders} buffer units safe`
                : "⚠️ Exceeds current stock!"}
            </p>
          </div>

          {/* Tile 4: Funnel Traffic */}
          <div className="p-3.5 rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/70 via-white to-purple-50/30 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                <Users size={12} className="text-purple-600" /> Funnel Visits
              </span>
              <span className="text-[9px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full border border-purple-300/60">
                ~3.2% Conv
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <strong className="text-xl sm:text-2xl font-black text-slate-900">{liveMath.sessionsNeeded.toLocaleString()}</strong>
              <span className="text-xs text-slate-500 font-medium">visits</span>
            </div>
            <p className="text-[10px] text-slate-600 font-medium truncate">
              ~{liveMath.socialImpressionsNeeded.toLocaleString()} social impressions
            </p>
          </div>
        </div>

        {/* CURATED STYLES ACCORDION / DRAWER STRIP */}
        <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-slate-50/50">
          {/* Header Preview Bar */}
          <div className="p-2.5 sm:px-3 sm:py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Overlapping Product Thumbnails */}
              <div className="flex -space-x-2 shrink-0">
                {liveMath.effectiveItems.slice(0, 4).map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden relative shadow-2xs"
                  >
                    {p.images?.[0] ? (
                      <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[7px] text-slate-400">SKU</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                  <span>{liveMath.effectiveItems.length} Styles Included in Launch</span>
                  <span className="hidden sm:inline-block text-[10px] font-normal text-slate-400">•</span>
                  <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500">
                    GH₵ {liveMath.catalogueValueGHS.toLocaleString()} Stock Value
                  </span>
                </span>
                <p className="text-[10px] text-slate-400 font-normal truncate">
                  {selectedProductIds.length > 0 ? `${selectedProductIds.length} custom SKUs filtered` : "All collection styles active in algorithm"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSkuTable(!showSkuTable)}
                className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Tag size={12} className="text-slate-500" />
                <span>{showSkuTable ? "Hide Styles" : "Curate Styles"}</span>
                {showSkuTable ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </Button>
            </div>
          </div>

          {/* Expandable SKU Allocation Table */}
          {showSkuTable && (
            <div className="border-t border-slate-200 bg-white">
              <div className="bg-slate-50/80 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span>Select styles to include or exclude from this campaign drop:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllProducts}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAllProducts}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {liveMath.effectiveItems.map((prod, idx) => {
                  const isSelected = selectedProductIds.length === 0 || selectedProductIds.includes(prod.id);
                  const heroMatch = activePlan?.heroProducts && activePlan.heroProducts.length > 0
                    ? activePlan.heroProducts[idx % activePlan.heroProducts.length]
                    : null;
                  const targetUnits = Math.max(1, Math.round((prod.stockQuantity || 1) * (liveMath.sellThroughRate / 100)));
                  const targetRevenue = targetUnits * prod.price;

                  return (
                    <div
                      key={prod.id}
                      className={cn(
                        "px-3 py-2 flex items-center justify-between gap-3 text-xs transition-colors",
                        isSelected ? "bg-white hover:bg-slate-50/70" : "bg-slate-50/40 opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProductSelect(prod.id)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                        />
                        <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
                          {prod.images?.[0] ? (
                            <Image src={prod.images[0]} alt={prod.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">Photo</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-xs truncate">{prod.name}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <span>Price: <strong className="text-slate-800">GH₵ {prod.price}</strong></span>
                            <span>•</span>
                            <span>Stock: <strong className="text-slate-800">{prod.stockQuantity} units</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {heroMatch?.roleLabel || "Supporting Style"}
                        </span>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Target Sales</span>
                          <strong className="text-xs text-slate-900 font-bold">{targetUnits} pcs (GH₵ {targetRevenue.toLocaleString()})</strong>
                        </div>
                        <div className="w-16 hidden md:block">
                          {prod.stockQuantity <= 5 ? (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">Low Stock</span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">Healthy</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VISUAL DISPLAYS COCKPIT (Tabbed Clean Layout) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {/* Navigation Tabs */}
        <div className="bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {[
            { id: "simulator", label: "Social Content Simulator", icon: Smartphone },
            { id: "runway", label: "Hero Products Runway", icon: Sparkles },
            { id: "calendar", label: "30-Day Launch Calendar", icon: Calendar },
            { id: "checklist", label: `Readiness Checklist (${readinessScore}%)`, icon: CheckSquare },
            { id: "telemetry", label: "Live Telemetry & Triggers", icon: BarChart3 },
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0",
                  isSel
                    ? "bg-slate-900 text-white shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Icon size={13} className={isSel ? "text-amber-400" : "text-slate-400"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: SOCIAL CONTENT SIMULATOR (Interactive Compact Smartphone) */}
        {/* ===================================================================== */}
        {activeTab === "simulator" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
            
            {/* LEFT: COMPACT LIGHT SMARTPHONE (5 COLS) */}
            <div className="lg:col-span-5 bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col items-center">
              
              {/* Platform Toggle Pills */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 mb-3 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setPhonePlatform("instagram")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all",
                    phonePlatform === "instagram" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Instagram Post
                </button>
                <button
                  type="button"
                  onClick={() => setPhonePlatform("tiktok")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all",
                    phonePlatform === "tiktok" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  TikTok Reel
                </button>
                <button
                  type="button"
                  onClick={() => setPhonePlatform("whatsapp")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all",
                    phonePlatform === "whatsapp" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  WhatsApp VIP
                </button>
              </div>

              {/* White Minimalist Smartphone Frame */}
              <div className="w-full max-w-[275px] aspect-[9/18.5] rounded-[32px] bg-slate-50 border-2 border-slate-300 shadow-sm p-2 flex flex-col justify-between">
                
                {/* Dynamic Island Notch */}
                <div className="w-16 h-3 bg-slate-900 rounded-full mx-auto shrink-0 mb-1" />

                {/* Smartphone Display Screen */}
                <div className="flex-1 rounded-[22px] overflow-hidden bg-white text-slate-900 text-xs flex flex-col justify-between border border-slate-200/60 shadow-2xs">

                  {/* INSTAGRAM VIEW */}
                  {phonePlatform === "instagram" && (
                    <div className="h-full flex flex-col justify-between">
                      {/* IG Profile Bar */}
                      <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px] font-bold">
                            {brandName ? brandName.charAt(0).toUpperCase() : "T"}
                          </div>
                          <span className="font-bold text-[10px] text-slate-900">{brandHandle || "brand.gh"}</span>
                        </div>
                        <span className="text-[9px] text-slate-400">Sponsored</span>
                      </div>

                      {/* Image Area with Price Tag */}
                      <div className="aspect-[4/4.5] relative bg-slate-100">
                        {currentHero?.imageUrl ? (
                          <Image src={currentHero.imageUrl} alt={currentHero.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Hero Piece</div>
                        )}
                        <span className="absolute bottom-2 left-2 bg-slate-900/90 text-white px-2 py-0.5 rounded text-[9px] font-bold shadow-xs">
                          GH₵ {currentHero?.price ?? (liveMath.avgSkuPrice || 0)}
                        </span>
                        <span className="absolute top-2 right-2 bg-emerald-600/90 text-white px-1.5 py-0.5 rounded text-[8px] font-bold">
                          In Stock: {currentHero?.stockQuantity ?? 0}
                        </span>
                      </div>

                      {/* Interactive Engagement & Live Caption */}
                      <div className="p-2 space-y-1 overflow-y-auto flex-1 scrollbar-hide">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Heart size={12} className="text-rose-500 fill-rose-500" />
                          <MessageCircle size={12} />
                          <Bookmark size={12} className="ml-auto" />
                        </div>
                        <p className="text-[9px] font-bold text-slate-900">
                          {storeTelemetry.totalWishlistSaves > 0
                            ? `${storeTelemetry.totalWishlistSaves} saves`
                            : `${liveMath.requiredOrders * 3} interested`}
                        </p>
                        <p className="text-[9px] text-slate-700 leading-relaxed line-clamp-3">
                          <strong className="text-slate-900 mr-1">{brandHandle || "brand.gh"}</strong>
                          {editableInstagramCaption}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TIKTOK VIEW */}
                  {phonePlatform === "tiktok" && (
                    <div className="h-full bg-slate-950 text-white p-2.5 relative flex flex-col justify-between">
                      {currentHero?.imageUrl && (
                        <Image src={currentHero.imageUrl} alt={currentHero.name} fill className="object-cover opacity-60" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                      <div className="relative z-10 text-center text-[10px] font-bold text-white/90 pt-0.5">
                        For You
                      </div>

                      <div className="relative z-10 space-y-1 max-w-[88%] pb-1">
                        <p className="font-bold text-[11px] text-white">@{brandHandle || "brand.gh"}</p>
                        <p className="text-[9px] text-slate-200 line-clamp-3 leading-snug">
                          {editableTiktokHook}
                        </p>
                        <div className="flex items-center gap-1 text-[8px] text-amber-300 font-bold">
                          <Volume2 size={9} /> <span>Trending Afrobeats sound</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WHATSAPP VIP VIEW */}
                  {phonePlatform === "whatsapp" && (
                    <div className="h-full bg-slate-100 p-2 flex flex-col justify-between">
                      <div className="p-1.5 bg-emerald-700 text-white rounded-md text-[9px] font-bold flex items-center justify-between">
                        <span>VIP Drop Broadcast</span>
                        <span className="text-[8px] opacity-80">
                          {storeTelemetry.totalOrdersPlaced > 0
                            ? `${storeTelemetry.totalOrdersPlaced} VIP Clients`
                            : `${liveMath.requiredOrders} VIP Targets`}
                        </span>
                      </div>

                      <div className="my-auto bg-white p-2 rounded-lg border border-slate-200 shadow-2xs space-y-1">
                        <span className="text-[8px] font-bold text-emerald-700 uppercase block">Private Drop Access</span>
                        <p className="text-[9px] text-slate-800 leading-relaxed whitespace-pre-line font-medium line-clamp-6">
                          {editableWhatsappBroadcast}
                        </p>
                        <div className="flex justify-end text-[7px] text-slate-400 gap-0.5 items-center">
                          <span>10:04 AM</span>
                          <CheckCheck size={9} className="text-emerald-600" />
                        </div>
                      </div>

                      <div className="text-[8px] text-slate-400 text-center font-medium">
                        Verified Trendizip Storefront Checkout Attached
                      </div>
                    </div>
                  )}

                </div>

                {/* Bottom Home Indicator Bar */}
                <div className="w-20 h-1 bg-slate-300 rounded-full mx-auto mt-1 shrink-0" />
              </div>
            </div>

            {/* RIGHT: EDITABLE MARKETING BRIEFS & VIDEO SCRIPTS (7 COLS) */}
            <div className="lg:col-span-7 space-y-3">
              
              {/* Copywriting Card */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Live Editable Marketing Copy ({phonePlatform.toUpperCase()})
                  </h3>
                  <Button
                    type="button"
                    onClick={() => {
                      const textToCopy = phonePlatform === "instagram" ? editableInstagramCaption :
                        phonePlatform === "tiktok" ? editableTiktokHook : editableWhatsappBroadcast;
                      copyText(textToCopy, `${phonePlatform} copy`);
                    }}
                    className="h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded-md flex items-center gap-1 transition-colors"
                  >
                    <Copy size={11} /> Copy
                  </Button>
                </div>

                {phonePlatform === "instagram" && (
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Instagram Feed &amp; Carousel Caption</Label>
                    <textarea
                      rows={5}
                      value={editableInstagramCaption}
                      onChange={(e) => setEditableInstagramCaption(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 font-medium leading-relaxed outline-none focus:border-slate-400 bg-slate-50/50 resize-none"
                    />
                  </div>
                )}

                {phonePlatform === "tiktok" && (
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">TikTok 3-Second Spoken Hook</Label>
                    <textarea
                      rows={5}
                      value={editableTiktokHook}
                      onChange={(e) => setEditableTiktokHook(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 font-medium leading-relaxed outline-none focus:border-slate-400 bg-slate-50/50 resize-none"
                    />
                  </div>
                )}

                {phonePlatform === "whatsapp" && (
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">WhatsApp VIP Broadcast Message</Label>
                    <textarea
                      rows={5}
                      value={editableWhatsappBroadcast}
                      onChange={(e) => setEditableWhatsappBroadcast(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 font-medium leading-relaxed outline-none focus:border-slate-400 bg-slate-50/50 resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Video Creative Briefs */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Video size={13} className="text-slate-500" />
                    Structured 15-Second Video Briefs for Reels &amp; TikTok
                  </h4>
                  <span className="text-[10px] text-slate-400">High-converting formulas</span>
                </div>

                <div className="space-y-2">
                  {activePlan?.marketingAssets?.videoBriefs?.map((brief, bIdx) => (
                    <div key={bIdx} className="p-2.5 bg-slate-50/60 rounded-lg border border-slate-200/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 text-xs font-bold">{brief.title}</strong>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {brief.channel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700">
                        <strong className="text-slate-900">0–3s Hook:</strong> &ldquo;{brief.hook3s}&rdquo;
                      </p>
                      <p className="text-[11px] text-slate-500">
                        <strong className="text-slate-700">Audio Vibe:</strong> {brief.audioVibe} • <strong className="text-slate-700">CTA:</strong> {brief.callToAction}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: HERO PRODUCTS RUNWAY */}
        {/* ===================================================================== */}
        {activeTab === "runway" && (
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Commercial Product Hierarchy (Hero Allocation)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Prioritized by unit margin, visual impact, and stock velocity to maximize sell-through.
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {activePlan?.heroProducts?.length || 0} Hero Styles Assigned
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {activePlan?.heroProducts?.map((hero, idx) => (
                <div
                  key={hero.id || idx}
                  onClick={() => {
                    setActiveHeroIdx(idx);
                    setActiveTab("simulator");
                  }}
                  className={cn(
                    "p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2",
                    activeHeroIdx === idx
                      ? "bg-amber-50/40 border-amber-300 ring-1 ring-amber-400/40"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="aspect-[4/3] relative rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                      {hero.imageUrl ? (
                        <Image src={hero.imageUrl} alt={hero.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Photo</div>
                      )}
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/90 text-white font-bold text-[8px] uppercase tracking-wider">
                        {hero.roleLabel}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate">{hero.name}</p>
                      <div className="flex items-center justify-between text-[11px] mt-0.5">
                        <span className="font-bold text-amber-700">GH₵ {hero.price}</span>
                        <span className="text-slate-500 text-[10px]">{hero.stockQuantity} in stock</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-md border border-slate-100">
                      {hero.reasoning}
                    </p>
                  </div>

                  {hero.stockWarning && (
                    <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-[9px] text-rose-700 font-bold flex items-center gap-1">
                      <AlertTriangle size={10} className="shrink-0" />
                      <span>{hero.stockWarning}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: 30-DAY SEQUENTIAL LAUNCH CALENDAR */}
        {/* ===================================================================== */}
        {activeTab === "calendar" && (
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Sequential 30-Day Campaign Calendar
                </h3>
                <p className="text-[11px] text-slate-500">
                  Detailed day-by-day release schedule across Tease, Drop, and Momentum phases.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                {["ALL", "TEASE", "CRAFT", "DROP", "MOMENTUM"].map(ph => (
                  <button
                    key={ph}
                    type="button"
                    onClick={() => setCalendarFilter(ph)}
                    className={cn(
                      "px-2 py-0.5 rounded-md transition-all text-[11px]",
                      calendarFilter === ph ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {ph}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {filteredCalendar.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex flex-col items-center justify-center shrink-0">
                      <span className="text-[7px] font-bold text-slate-400 uppercase">Day</span>
                      <span className="text-xs font-bold">{item.day}</span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
                          item.phase === "TEASE" ? "bg-purple-100 text-purple-800" :
                          item.phase === "CRAFT" ? "bg-blue-100 text-blue-800" :
                          item.phase === "DROP" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"
                        )}>
                          {item.phase}
                        </span>
                        <strong className="text-slate-900 text-xs">{item.contentType}</strong>
                        <span className="text-slate-400 text-[10px]">• {item.channel.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-slate-800 font-medium text-[11px]">&ldquo;{item.hook}&rdquo;</p>
                      <p className="text-[10px] text-slate-500">{item.creativeBrief}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-slate-400 block font-semibold">Post Time</span>
                    <strong className="text-slate-800 text-xs">{item.suggestedPostingTime}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: READINESS CHECKLIST */}
        {/* ===================================================================== */}
        {activeTab === "checklist" && (
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Launch Execution Milestones
                </h3>
                <p className="text-[11px] text-slate-500">
                  Verify stock, creative photography, and payment testing before unveiling the drop.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${readinessScore}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-900">{readinessScore}% Ready</span>
              </div>
            </div>

            <div className="space-y-1.5">
              {checklistTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => toggleChecklistTask(task.id)}
                  className={cn(
                    "p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2 text-xs",
                    task.isCompleted ? "bg-emerald-50/40 border-emerald-200" : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="mt-0.5">
                    {task.isCompleted ? (
                      <CheckCircle2 size={15} className="text-emerald-600" />
                    ) : (
                      <Circle size={15} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">{task.phase}</span>
                    <p className={cn("font-semibold text-xs", task.isCompleted ? "line-through text-slate-400" : "text-slate-900")}>
                      {task.task}
                    </p>
                    {task.tip && <p className="text-[10px] text-slate-500 mt-0.5">💡 {task.tip}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 5: LIVE TELEMETRY & DECISION RULES */}
        {/* ===================================================================== */}
        {activeTab === "telemetry" && (
          <div className="space-y-3">
            {/* Real-time KPI Overview */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2.5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Storefront Drop Telemetry (Simulated Early Indicators)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Live buyer engagement signals to guide your daily campaign adjustments.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-slate-400 font-semibold block text-[10px]">Collection Wishlist Saves</span>
                  <strong className="text-base font-bold text-slate-900">{storeTelemetry.totalWishlistSaves}</strong>
                  <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Live store saves</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-slate-400 font-semibold block text-[10px]">Active Cart Intent</span>
                  <strong className="text-base font-bold text-slate-900">{storeTelemetry.totalCartIntent}</strong>
                  <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">High intent buyers</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-slate-400 font-semibold block text-[10px]">Orders Placed</span>
                  <strong className="text-base font-bold text-slate-900">{storeTelemetry.totalOrdersPlaced}</strong>
                  <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Verified sales</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-slate-400 font-semibold block text-[10px]">Gross Revenue</span>
                  <strong className="text-base font-bold text-amber-700">GH₵ {storeTelemetry.totalGrossRevenue.toLocaleString()}</strong>
                  <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">
                    {salesTargetGHS > 0
                      ? `${Math.round((storeTelemetry.totalGrossRevenue / salesTargetGHS) * 100)}% of sales goal`
                      : "Tracked revenue"}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Diagnostic Rules Matrix */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Operational Triggers &amp; Drop Decision Matrix
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activePlan?.decisionMatrix?.map((rule, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/70 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
                        rule.urgency === "HIGH" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-900"
                      )}>
                        {rule.urgency} Priority
                      </span>
                      <span className="text-slate-400 text-[10px]">Signal #{idx + 1}</span>
                    </div>
                    <strong className="text-slate-900 text-xs block">{rule.triggerMetric}</strong>
                    <p className="text-slate-600 text-[11px]">{rule.observation}</p>
                    <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-800 font-semibold text-[11px]">
                      ⚡ Action: {rule.recommendedAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
