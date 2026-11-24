"use client";

import React, { useState, useEffect, useMemo, useRef, useId } from "react";
import {
  Star,
  Store,
  X,
  SlidersHorizontal,
  Grid3X3,
  LayoutGrid,
  ChevronDown,
  Search,
  ShoppingBag,
  Clock,
  Flame,
  Percent,
  ArrowUpRight,
  ArrowLeft,
  Check,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/common/ProductCard";

// --- INTERFACES ---
interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  _count: {
    products: number;
  };
}

interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  images: string[];
  videoUrl?: string;
  sizes: string[];
  colors: string[];
  material?: string;
  careInstructions?: string;
  estimatedDelivery?: number;
  isCustomizable: boolean;
  tags: string[];
  viewCount: number;
  soldCount: number;
  stockQuantity: number;
  isPreorder?: boolean;
  categories: {
    id?: string;
    name: string;
    slug: string;
  }[];
  collection?: {
    name: string;
  };
  professional: {
    firstName: string;
    lastName: string;
    professionalProfile?: {
      businessName?: string;
      businessImage?: string;
      rating?: number;
      totalReviews?: number;
      isVerified?: boolean;
    };
  };
  _count: {
    wishlistItems: number;
    cartItems: number;
    orderItems: number;
    reviews: number;
  };
  isNew?: boolean;
  rating?: number;
  views?: number;
  likes?: number;
  effectivePrice?: number;
  isDiscountActive?: boolean;
  discountAmount?: number;
  discountPercentage?: number;
  discountEndDate?: string;
}

interface ProfessionalProfile {
  id: string;
  businessName: string;
  businessImage?: string;
  coverImage?: string;
  bio?: string;
  rating?: number;
  totalReviews?: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  specialization: {
    name: string;
  };
}

interface FilterState {
  priceRange: [number, number];
  colors: string[];
  sizes: string[];
  onSale: boolean;
  inStock: boolean;
  rating: number | null;
}

const theme = {
  "--shop-ink": "#173E35",
  "--shop-paper": "#F6F5EF",
  "--shop-line": "#DFE5D7",
  "--shop-accent": "#DCE99B",
} as React.CSSProperties;
const button =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--shop-line)] bg-white px-3 text-xs font-medium transition hover:bg-[#EAF0DF]";
const filled =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--shop-ink)] px-4 text-xs font-semibold text-white transition hover:bg-[#285548]";
const label =
  "text-[10px] font-semibold uppercase tracking-[0.15em] text-[#75836B]";
const defaultFilters = (range: [number, number]): FilterState => ({
  priceRange: [...range],
  colors: [],
  sizes: [],
  onSale: false,
  inStock: false,
  rating: null,
});
const priceOf = (product: Product) => product.effectivePrice ?? product.price;
const boundsFor = (products: Product[]): [number, number] => {
  const prices = products.map(priceOf).filter(Number.isFinite);
  return prices.length
    ? [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]
    : [0, 0];
};
const countFilters = (filters: FilterState, range: [number, number]) =>
  [
    filters.colors.length > 0,
    filters.sizes.length > 0,
    filters.onSale,
    filters.inStock,
    filters.rating !== null,
    filters.priceRange[0] !== range[0] || filters.priceRange[1] !== range[1],
  ].filter(Boolean).length;
const sortOptions = [
  ["featured", "Featured"],
  ["price-low", "Price: low to high"],
  ["price-high", "Price: high to low"],
  ["newest", "New arrivals first"],
  ["rating", "Highest rated seller"],
  ["popular", "Most popular"],
];
const quickOptions = [
  { key: "all", title: "All pieces", icon: ShoppingBag },
  { key: "new", title: "New in", icon: Clock },
  { key: "sale", title: "On sale", icon: Percent },
  { key: "trending", title: "Popular", icon: Flame },
] as const;
const colorValues: Record<string, string> = {
  black: "#242424",
  white: "#FFFFFF",
  navy: "#233A52",
  red: "#BE5552",
  pink: "#E4A3B3",
  blue: "#668FB4",
  green: "#5F815B",
  yellow: "#E3C467",
  purple: "#A087AF",
  orange: "#D59863",
  brown: "#886444",
  gray: "#939793",
  grey: "#939793",
};

function FilterPanel({
  filters,
  range,
  currencies,
  colors,
  sizes,
  onApply,
  onClose,
}: {
  filters: FilterState;
  range: [number, number];
  currencies: string[];
  colors: string[];
  sizes: string[];
  onApply: (filters: FilterState) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<FilterState>(() => ({
    ...filters,
    colors: [...filters.colors],
    sizes: [...filters.sizes],
    priceRange: [...filters.priceRange],
  }));
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const element = dialog.current;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  const toggle = (key: "colors" | "sizes", value: string) =>
    setDraft((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-y-0 left-auto right-0 m-0 h-[100dvh] max-h-none w-full max-w-[380px] border-0 bg-[var(--shop-paper)] p-0 text-[var(--shop-ink)] shadow-2xl sm:rounded-l-2xl"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onApply(draft);
          onClose();
        }}
        className="flex h-full flex-col"
      >
        <div className="flex items-center justify-between border-b border-[var(--shop-line)] p-5">
          <div>
            <p className={label}>Make it yours</p>
            <h2 id={`${id}-title`} className="mt-1 font-serif text-2xl">
              Refine your selection
            </h2>
          </div>
          <button
            autoFocus
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className={cn(button, "h-10 w-10 px-0")}
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          <fieldset>
            <legend className="mb-3 text-xs font-semibold">
              Price range{" "}
              {currencies.length === 1 && (
                <span className="font-normal text-[#75836B]">
                  · {currencies[0]}
                </span>
              )}
            </legend>
            {currencies.length > 1 && (
              <p className="mb-3 text-xs leading-5 text-[#75836B]">
                Amounts use each product’s listed currency. No currency
                conversion is applied.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {(["Minimum", "Maximum"] as const).map((text, index) => (
                <label
                  key={text}
                  className="rounded-xl border border-[var(--shop-line)] bg-white px-3 py-2"
                >
                  <span className="block text-[10px] text-[#75836B]">
                    {text}
                  </span>
                  <input
                    aria-label={`${text} price`}
                    type="number"
                    step="any"
                    required
                    min={index === 0 ? range[0] : draft.priceRange[0]}
                    max={index === 0 ? draft.priceRange[1] : range[1]}
                    value={draft.priceRange[index]}
                    onChange={(e) => {
                      const value = e.target.valueAsNumber;
                      if (Number.isFinite(value))
                        setDraft((prev) => ({
                          ...prev,
                          priceRange:
                            index === 0
                              ? [
                                Math.max(
                                  range[0],
                                  Math.min(value, prev.priceRange[1]),
                                ),
                                prev.priceRange[1],
                              ]
                              : [
                                prev.priceRange[0],
                                Math.min(
                                  range[1],
                                  Math.max(value, prev.priceRange[0]),
                                ),
                              ],
                        }));
                    }}
                    className="mt-1 w-full bg-transparent py-1 text-sm font-medium"
                  />
                </label>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[#75836B]">
              Available range: {range[0].toLocaleString()} –{" "}
              {range[1].toLocaleString()}
            </p>
          </fieldset>
          {colors.length > 0 && (
            <fieldset>
              <legend className="mb-3 text-xs font-semibold">Colors</legend>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-pressed={draft.colors.includes(color)}
                    onClick={() => toggle("colors", color)}
                    className={cn(
                      button,
                      "gap-1.5 px-2.5",
                      draft.colors.includes(color) &&
                      "border-[#173E35] bg-[#EAF0DF]",
                    )}
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-black/15"
                      style={{
                        backgroundColor:
                          colorValues[color.toLowerCase()] || "#E1E6D7",
                      }}
                    />
                    {color}
                    {draft.colors.includes(color) && <Check size={12} />}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          {sizes.length > 0 && (
            <fieldset>
              <legend className="mb-3 text-xs font-semibold">Sizes</legend>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={draft.sizes.includes(size)}
                    onClick={() => toggle("sizes", size)}
                    className={cn(
                      button,
                      "min-w-10",
                      draft.sizes.includes(size) &&
                      "border-[#173E35] bg-[#173E35] text-white hover:bg-[#285548]",
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset>
            <legend className="mb-3 text-xs font-semibold">
              Availability & offers
            </legend>
            <div className="space-y-2">
              {(
                [
                  { key: "inStock", text: "In stock only", icon: ShoppingBag },
                  { key: "onSale", text: "On sale only", icon: Percent },
                ] as const
              ).map(({ key, text, icon: Icon }) => (
                <label
                  key={key}
                  className="flex min-h-12 cursor-pointer items-center justify-between rounded-xl border border-[var(--shop-line)] bg-white px-3"
                >
                  <span className="flex items-center gap-2 text-xs">
                    <Icon size={15} />
                    {text}
                  </span>
                  <input
                    type="checkbox"
                    checked={draft[key]}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="h-4 w-4 accent-[#173E35]"
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-3 text-xs font-semibold">
              Minimum seller rating
            </legend>
            <div className="grid grid-cols-4 gap-2">
              {[null, 4, 3, 2].map((rating) => (
                <button
                  key={rating ?? "all"}
                  type="button"
                  aria-pressed={draft.rating === rating}
                  onClick={() => setDraft((prev) => ({ ...prev, rating }))}
                  className={cn(
                    button,
                    "px-1",
                    draft.rating === rating && "border-[#173E35] bg-[#EAF0DF]",
                  )}
                >
                  {rating ? (
                    <>
                      <Star size={12} />
                      {rating}+
                    </>
                  ) : (
                    "Any"
                  )}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="flex gap-2 border-t border-[var(--shop-line)] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setDraft(defaultFilters(range))}
            className={button}
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button type="submit" className={cn(filled, "flex-1")}>
            Apply filters
            {countFilters(draft, range) > 0 &&
              ` (${countFilters(draft, range)})`}
          </button>
        </div>
      </form>
    </dialog>
  );
}

const ShopPage = ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = React.use(params);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "large">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [quickFilter, setQuickFilter] = useState<
    "all" | "new" | "sale" | "trending"
  >("all");
  const [filters, setFilters] = useState<FilterState>(() =>
    defaultFilters([0, 0]),
  );
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setProfile(null);
    setShowFilters(false);
    setActiveCategory(null);
    setSearchQuery("");
    setQuickFilter("all");
    setSortOption("featured");
    async function load() {
      try {
        const response = await fetch(
          `/api/professional-profiles/slug/${encodeURIComponent(slug)}/shop`,
          { signal: controller.signal },
        );
        if (!response.ok)
          throw new Error(
            response.status === 404
              ? "This shop could not be found."
              : "We couldn’t load the shop. Please try again.",
          );
        const data: {
          profile: ProfessionalProfile;
          products: Product[];
          categories: {
            id: string;
            name: string;
            slug: string;
            imageUrl: string | null;
            productCount: number;
          }[];
        } = await response.json();
        if (!data.profile?.user)
          throw new Error("This shop is currently unavailable.");
        if (controller.signal.aborted) return;
        const items = (data.products || []).map((product) => ({
          ...product,
          isNew: product.isNew || product.tags?.includes("NEW") || false,
          rating: product.professional.professionalProfile?.rating ?? 0,
          views: product.viewCount,
          likes: product._count.wishlistItems,
        }));
        setProfile(data.profile);
        setProducts(items);
        setFilters(defaultFilters(boundsFor(items)));
        setCategories(
          (data.categories || []).map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            imageUrl: category.imageUrl || undefined,
            _count: { products: category.productCount },
          })),
        );
      } catch (err) {
        if (!controller.signal.aborted)
          setError(
            err instanceof Error ? err.message : "Unable to load this shop.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [slug, retry]);
  const range = useMemo(() => boundsFor(products), [products]);
  const currencies = useMemo(
    () => [...new Set(products.map((p) => p.currency))],
    [products],
  );
  const colors = useMemo(
    () => [...new Set(products.flatMap((p) => p.colors || []))].sort(),
    [products],
  );
  const sizes = useMemo(
    () => [...new Set(products.flatMap((p) => p.sizes || []))],
    [products],
  );
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = products.filter((product) => {
      if (
        activeCategory &&
        !product.categories?.some(
          (c) =>
            c.slug === activeCategory ||
            c.id === activeCategory ||
            (c.slug && c.slug.toLowerCase() === activeCategory.toLowerCase()) ||
            (c.name && c.name.toLowerCase() === activeCategory.toLowerCase()),
        )
      )
        return false;
      if (
        query &&
        ![
          product.name,
          product.description,
          ...(product.categories || []).map((c) => c.name),
        ].some((value) => value?.toLowerCase().includes(query))
      )
        return false;
      if (quickFilter === "new" && !product.isNew) return false;
      if (
        (quickFilter === "sale" || filters.onSale) &&
        !product.isDiscountActive
      )
        return false;
      if (
        quickFilter === "trending" &&
        !(product.viewCount > 50 || product.soldCount > 10)
      )
        return false;
      if (filters.inStock && !(product.stockQuantity > 0)) return false;
      if (
        filters.colors.length &&
        !product.colors?.some((color) =>
          filters.colors.some((c) => c.toLowerCase() === color.toLowerCase()),
        )
      )
        return false;
      if (
        filters.sizes.length &&
        !product.sizes?.some((size) => filters.sizes.includes(size))
      )
        return false;
      if (
        filters.rating !== null &&
        (product.professional.professionalProfile?.rating ?? 0) < filters.rating
      )
        return false;
      return (
        priceOf(product) >= filters.priceRange[0] &&
        priceOf(product) <= filters.priceRange[1]
      );
    });
    switch (sortOption) {
      case "price-low":
        result.sort((a, b) => priceOf(a) - priceOf(b));
        break;
      case "price-high":
        result.sort((a, b) => priceOf(b) - priceOf(a));
        break;
      case "newest":
        result.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
        break;
      case "rating":
        result.sort(
          (a, b) =>
            (b.professional.professionalProfile?.rating ?? 0) -
            (a.professional.professionalProfile?.rating ?? 0),
        );
        break;
      case "popular":
        result.sort(
          (a, b) =>
            (b.viewCount || 0) +
            (b.soldCount || 0) -
            ((a.viewCount || 0) + (a.soldCount || 0)),
        );
        break;
    }
    return result;
  }, [products, activeCategory, searchQuery, quickFilter, filters, sortOption]);
  const reset = () => {
    setActiveCategory(null);
    setSearchQuery("");
    setQuickFilter("all");
    setFilters(defaultFilters(range));
  };
  const activeCount = countFilters(filters, range);
  const activeCategoryName = categories.find(
    (category) =>
      category.slug === activeCategory ||
      category.id === activeCategory ||
      (category.slug && category.slug.toLowerCase() === activeCategory?.toLowerCase()),
  )?.name;
  const hasFilters =
    !!activeCategory ||
    !!searchQuery.trim() ||
    quickFilter !== "all" ||
    activeCount > 0;
  const chips: { text: string; remove: () => void }[] = [];
  if (activeCategory)
    chips.push({
      text: activeCategoryName || activeCategory,
      remove: () => setActiveCategory(null),
    });
  if (searchQuery.trim())
    chips.push({
      text: `“${searchQuery.trim()}”`,
      remove: () => setSearchQuery(""),
    });
  if (quickFilter !== "all")
    chips.push({
      text: quickOptions.find((q) => q.key === quickFilter)!.title,
      remove: () => setQuickFilter("all"),
    });
  if (filters.onSale)
    chips.push({
      text: "Sale only",
      remove: () => setFilters((f) => ({ ...f, onSale: false })),
    });
  if (filters.inStock)
    chips.push({
      text: "In stock",
      remove: () => setFilters((f) => ({ ...f, inStock: false })),
    });
  filters.colors.forEach((color) =>
    chips.push({
      text: color,
      remove: () =>
        setFilters((f) => ({
          ...f,
          colors: f.colors.filter((c) => c !== color),
        })),
    }),
  );
  filters.sizes.forEach((size) =>
    chips.push({
      text: `Size ${size}`,
      remove: () =>
        setFilters((f) => ({ ...f, sizes: f.sizes.filter((s) => s !== size) })),
    }),
  );
  if (filters.rating !== null)
    chips.push({
      text: `Seller ${filters.rating}★+`,
      remove: () => setFilters((f) => ({ ...f, rating: null })),
    });
  if (filters.priceRange[0] !== range[0] || filters.priceRange[1] !== range[1])
    chips.push({
      text: `${currencies.length === 1 ? currencies[0] + " " : ""}${filters.priceRange[0]}–${filters.priceRange[1]}`,
      remove: () => setFilters((f) => ({ ...f, priceRange: [...range] })),
    });
  const displayName =
    profile?.businessName ||
    `${profile?.user.firstName || ""} ${profile?.user.lastName || ""}`.trim();
  const categoryButton = (category: Category | null, mobile = false) => {
    const selected = category
      ? activeCategory === category.slug || activeCategory === category.id
      : activeCategory === null;
    return (
      <button
        key={category?.id || "all"}
        type="button"
        aria-pressed={selected}
        onClick={() => setActiveCategory(category ? (category.slug || category.id) : null)}
        className={cn(
          "flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-left text-xs font-medium transition",
          mobile ? "shrink-0 border" : "w-full",
          selected
            ? "border-[#173E35] bg-[#173E35] text-white"
            : "border-[var(--shop-line)] bg-white text-[#63745C] hover:bg-[#EAF0DF]",
        )}
      >
        {category?.imageUrl ? (
          <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={category.imageUrl}
              alt=""
              fill
              sizes="28px"
              className="object-cover"
            />
          </span>
        ) : (
          <Grid3X3 size={15} className="shrink-0" />
        )}
        <span className={cn("min-w-0", !mobile && "flex-1")}>
          {category?.name || "All pieces"}
        </span>
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px]",
            selected
              ? "bg-white/10 text-[#DCE99B]"
              : "bg-[#EFF2E8] text-[#75836B]",
          )}
        >
          {category?._count.products ?? products.length}
        </span>
      </button>
    );
  };
  return (
    <div
      style={theme}
      className="seller-shop min-h-screen bg-[var(--shop-paper)] font-sans text-[var(--shop-ink)] selection:bg-[#DCE99B]"
    >
      <style>{`.seller-shop :is(a,button,input,select):focus-visible{outline:3px solid #8AA65A;outline-offset:3px}.seller-shop dialog::backdrop{background:rgba(14,36,29,.45);backdrop-filter:blur(4px)}`}</style>
      <main className="mx-auto max-w-[1440px] px-3 pb-12 pt-4 sm:px-5 lg:px-8">
        {loading ? (
          <div role="status" aria-label="Loading shop" className="space-y-6">
            <span className="sr-only">Loading the shop</span>
            <div className="h-44 animate-pulse rounded-2xl bg-[#E6ECD9] motion-reduce:animate-none" />
            <div className="h-11 animate-pulse rounded-xl bg-[#E6ECD9] motion-reduce:animate-none" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-2xl bg-[#E6ECD9] motion-reduce:animate-none"
                />
              ))}
            </div>
          </div>
        ) : error || !profile ? (
          <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center text-center">
            <Store size={32} className="mb-4 text-[#7B8E67]" />
            <h1 className="font-serif text-2xl">The shop isn’t available</h1>
            <p role="alert" className="mt-3 text-sm leading-6 text-[#75836B]">
              {error || "We couldn’t find this seller’s shop."}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className={filled}
                onClick={() => setRetry((r) => r + 1)}
              >
                Try again
              </button>
              <Link className={button} href="/">
                Back home
              </Link>
            </div>
          </div>
        ) : (
          <>
            <nav
              aria-label="Breadcrumb"
              className="mb-3 flex items-center gap-2 text-[11px] text-[#75836B]"
            >
              <Link
                href={`/tz/${slug}`}
                className="flex min-h-8 min-w-0 items-center gap-1.5 hover:text-[#173E35]"
              >
                <ArrowLeft size={13} />
                <span className="max-w-[180px] truncate">{displayName}</span>
              </Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="text-[#173E35]">
                Shop
              </span>
            </nav>
            <header className="relative overflow-hidden rounded-[20px] border border-[#D8E1CD] bg-[#E8EEDB]">
              <div className="grid sm:grid-cols-[1.4fr_0.6fr] lg:grid-cols-[1.6fr_0.65fr]">
                <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5 lg:p-6">
                  <div className="relative h-12 w-12 shrink-0 self-start overflow-hidden rounded-xl border-2 border-white bg-white shadow-sm sm:h-14 sm:w-14">
                    <Image
                      src={
                        profile.businessImage ||
                        profile.user.profileImage ||
                        "/placeholder-avatar.jpg"
                      }
                      alt={displayName}
                      fill
                      priority
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={label}>
                      {profile.specialization?.name || "Independent studio"}{" "}
                      <span className="mx-1 text-[#A0B18A]">/</span> The shop
                    </p>
                    <h1 className="mt-1.5 break-words font-serif text-2xl leading-tight tracking-tight sm:text-[30px]">
                      {displayName}
                    </h1>
                    {profile.bio && (
                      <p className="mt-2 line-clamp-2 max-w-lg text-xs leading-5 text-[#64745A]">
                        {profile.bio}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#64745A]">
                      <span>
                        {products.length}{" "}
                        {products.length === 1 ? "piece" : "pieces"} to explore
                      </span>
                      {typeof profile.rating === "number" &&
                        (profile.totalReviews || 0) > 0 && (
                          <Link
                            href={`/tz/${slug}/reviews`}
                            className="flex items-center gap-1.5"
                          >
                            <Star
                              size={12}
                              className="fill-[#829A4B] text-[#829A4B]"
                            />
                            <strong className="text-[#173E35]">
                              {profile.rating.toFixed(1)}
                            </strong>
                            <span>({profile.totalReviews} reviews)</span>
                          </Link>
                        )}
                      <Link
                        className="inline-flex min-h-8 items-center gap-1 font-semibold text-[#173E35]"
                        href={`/tz/${slug}`}
                      >
                        Meet the maker <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="relative hidden min-h-[180px] overflow-hidden bg-[#254D3D] sm:block">
                  {profile.coverImage || profile.businessImage ? (
                    <Image
                      src={profile.coverImage || profile.businessImage!}
                      alt={`${displayName} shop cover`}
                      fill
                      priority
                      sizes="(max-width: 640px) 0px, 30vw"
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <span className="absolute h-44 w-44 rounded-full border border-[#DCE99B]/20" />
                      <span className="font-serif text-7xl italic text-[#DCE99B]">
                        {displayName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#102C23]/60 to-transparent" />
                  <p className="absolute bottom-4 left-4 text-[10px] font-medium uppercase tracking-[0.2em] text-white">
                    The studio collection
                  </p>
                </div>
              </div>
            </header>
            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[185px_minmax(0,1fr)] xl:grid-cols-[205px_minmax(0,1fr)]">
              <aside
                className="sticky top-5 hidden space-y-5 lg:block"
                aria-label="Shop categories"
              >
                <div>
                  <h2 className={cn(label, "mb-3 px-3")}>
                    Browse the collection
                  </h2>
                  <div className="space-y-1.5">
                    {categoryButton(null)}
                    {categories.map((category) => categoryButton(category))}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#D8E1CD] bg-[#EAF0DF] p-4">
                  <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/70">
                    <Store size={16} />
                  </span>
                  <h3 className="font-serif text-lg">Behind the pieces.</h3>
                  <p className="mt-2 text-xs leading-5 text-[#697A5E]">
                    Explore the portfolio and get to know the studio.
                  </p>
                  <Link
                    className="mt-3 inline-flex min-h-9 items-center gap-1 text-xs font-semibold"
                    href={`/tz/${slug}`}
                  >
                    Visit profile <ArrowUpRight size={14} />
                  </Link>
                </div>
              </aside>
              <section className="min-w-0" aria-label="Shop products">
                <div
                  className="mb-4 flex gap-2 overflow-x-auto pb-2 lg:hidden"
                  aria-label="Categories"
                >
                  {categoryButton(null, true)}
                  {categories.map((category) => categoryButton(category, true))}
                </div>
                <div className="rounded-2xl border border-[var(--shop-line)] bg-white p-3">
                  <div className="flex flex-wrap gap-2">
                    <label className="flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg bg-[#F2F4ED] px-3 sm:w-auto sm:flex-1">
                      <Search size={15} className="shrink-0 text-[#7C8B70]" />
                      <span className="sr-only">Search products</span>
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Find your next favourite…"
                        className="min-w-0 flex-1 bg-transparent py-2.5 text-xs placeholder:text-[#7C8B70]"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          aria-label="Clear search"
                          onClick={() => setSearchQuery("")}
                          className="flex h-8 w-8 items-center justify-center"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowFilters(true)}
                      aria-haspopup="dialog"
                      className={cn(
                        button,
                        activeCount > 0 && "border-[#9BAF7D] bg-[#EAF0DF]",
                      )}
                    >
                      <SlidersHorizontal size={14} />
                      Filters
                      {activeCount > 0 && (
                        <span className="rounded bg-[#173E35] px-1.5 py-0.5 text-[10px] text-white">
                          {activeCount}
                        </span>
                      )}
                    </button>
                    <label className="relative min-w-0 flex-1 sm:max-w-[180px]">
                      <span className="sr-only">Sort products</span>
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="h-10 w-full appearance-none rounded-lg border border-[var(--shop-line)] bg-white pl-3 pr-8 text-xs"
                      >
                        {sortOptions.map(([value, text]) => (
                          <option key={value} value={value}>
                            {text}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={13}
                        className="pointer-events-none absolute right-3 top-3.5"
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#EDF0E6] pt-2">
                    <div className="flex min-w-0 gap-1 overflow-x-auto">
                      {quickOptions.map(({ key, title, icon: Icon }) => (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={quickFilter === key}
                          onClick={() => setQuickFilter(key)}
                          className={cn(
                            "flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition sm:px-3",
                            quickFilter === key
                              ? "bg-[#E7EDDA] text-[#173E35]"
                              : "text-[#78846F] hover:bg-[#F2F4ED]",
                          )}
                        >
                          <Icon size={13} />
                          {title}
                        </button>
                      ))}
                    </div>
                    <div
                      className="hidden shrink-0 items-center gap-1 border-l border-[#E7ECDD] pl-2 sm:flex"
                      aria-label="Product density"
                    >
                      {(
                        [
                          { key: "grid", icon: Grid3X3, text: "Compact grid" },
                          {
                            key: "large",
                            icon: LayoutGrid,
                            text: "Larger cards",
                          },
                        ] as const
                      ).map(({ key, icon: Icon, text }) => (
                        <button
                          type="button"
                          key={key}
                          aria-label={text}
                          title={text}
                          aria-pressed={viewMode === key}
                          onClick={() => setViewMode(key)}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg",
                            viewMode === key
                              ? "bg-[#E7EDDA]"
                              : "text-[#8C9683] hover:bg-[#F2F4ED]",
                          )}
                        >
                          <Icon size={15} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {chips.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {chips.map((chip, index) => (
                      <button
                        key={`${chip.text}-${index}`}
                        type="button"
                        onClick={chip.remove}
                        aria-label={`Remove ${chip.text} filter`}
                        className="flex min-h-8 max-w-full items-center gap-1.5 rounded-lg border border-[#DAE3CE] bg-[#EBF0E1] px-2.5 text-[11px]"
                      >
                        <span className="truncate">{chip.text}</span>
                        <X size={11} className="shrink-0" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={reset}
                      className="min-h-8 px-2 text-[11px] font-semibold underline underline-offset-4"
                    >
                      Clear all
                    </button>
                  </div>
                )}
                <div className="mb-4 mt-5 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-serif text-xl sm:text-2xl">
                    {activeCategoryName || "The collection"}
                    <span className="text-[#93AA65]">.</span>
                  </h2>
                  <p
                    role="status"
                    aria-live="polite"
                    className="text-[11px] text-[#7A8771]"
                  >
                    {filteredProducts.length}{" "}
                    {filteredProducts.length === 1 ? "piece" : "pieces"}
                    {hasFilters ? ` of ${products.length}` : ""}
                  </p>
                </div>
                {currencies.length > 1 &&
                  (sortOption === "price-low" ||
                    sortOption === "price-high") && (
                    <p className="mb-3 text-xs text-[#75836B]">
                      Sorted by listed amounts; currencies are not converted.
                    </p>
                  )}
                {filteredProducts.length ? (
                  <div
                    className={cn(
                      "grid grid-cols-2 gap-x-3 gap-y-5",
                      viewMode === "grid"
                        ? "sm:grid-cols-3 xl:grid-cols-4"
                        : "sm:grid-cols-2 xl:grid-cols-3",
                    )}
                  >
                    {filteredProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="min-w-0 overflow-hidden rounded-2xl border border-[var(--shop-line)] bg-white p-1.5 transition-shadow hover:shadow-[0_8px_28px_-16px_rgba(23,62,53,0.35)] sm:p-2"
                      >
                        <ProductCard
                          item={product}
                          index={index}
                          hrefOverride={`/tz/${slug}/shop/${product.slug}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#CFDBC1] bg-white/50 p-6 text-center">
                    <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EEDC]">
                      {products.length ? (
                        <Search size={22} />
                      ) : (
                        <ShoppingBag size={22} />
                      )}
                    </span>
                    <h3 className="font-serif text-xl">
                      {products.length
                        ? activeCategoryName
                          ? `No ${activeCategoryName.toLowerCase()} found.`
                          : "No pieces match your selection."
                        : "This collection is coming soon."}
                    </h3>
                    <p className="mt-2 max-w-xs text-xs leading-6 text-[#75836B]">
                      {products.length
                        ? "Try adjusting your filters or search to explore more styles from this shop."
                        : "New pieces will appear here as soon as they are added to the shop."}
                    </p>
                    {hasFilters ? (
                      <button
                        type="button"
                        onClick={reset}
                        className={cn(filled, "mt-5")}
                      >
                        Clear filters <RotateCcw size={13} />
                      </button>
                    ) : (
                      <Link href={`/tz/${slug}`} className={cn(button, "mt-5")}>
                        Explore the studio <ArrowUpRight size={13} />
                      </Link>
                    )}
                  </div>
                )}
                <footer className="mt-8 flex items-center justify-center border-t border-[var(--shop-line)] pt-5">
                  <Link
                    className="inline-flex min-h-10 items-center gap-2 text-xs text-[#6C7D61] hover:text-[#173E35]"
                    href={`/tz/${slug}`}
                  >
                    <ArrowLeft size={13} />
                    Back to the studio
                  </Link>
                </footer>
              </section>
            </div>
            {showFilters && (
              <FilterPanel
                filters={filters}
                range={range}
                currencies={currencies}
                colors={colors}
                sizes={sizes}
                onApply={setFilters}
                onClose={() => setShowFilters(false)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};
export default ShopPage;
