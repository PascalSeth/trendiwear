'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, X, Package, ShoppingBag, Sparkles, 
  Loader2, ChevronRight
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMac?: boolean;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'product' | 'order' | 'tool' | 'customer' | 'service';
  url: string;
  badge?: string;
  image?: string;
}

const QUICK_NAV_ITEMS: SearchItem[] = [
  { id: 'ai-studio', title: 'AI Generative Studio', subtitle: 'Garment color transformer & multi-engine generator', type: 'tool', url: '/dashboard/ai-studio', badge: 'AI Studio' },
  { id: 'outfits', title: 'Outfit Inspirations', subtitle: 'Curated editorial lookbooks & event trends', type: 'tool', url: '/dashboard/trends/outfit-inspirations', badge: 'Trends' },
  { id: 'analytics', title: 'Analytics & Insights', subtitle: 'Platform sales revenue and conversion rates', type: 'tool', url: '/dashboard/analytics', badge: 'Metrics' },
  { id: 'products', title: 'Product Inventory', subtitle: 'View and manage all active products', type: 'tool', url: '/dashboard/catalogue/products', badge: 'Catalogue' },
  { id: 'orders', title: 'Order Fulfillment', subtitle: 'Manage active customer orders & shipments', type: 'tool', url: '/dashboard/orders', badge: 'Orders' },
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search fetch across products and orders API
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [prodRes, orderRes] = await Promise.all([
          fetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`),
          fetch(`/api/orders?search=${encodeURIComponent(query)}&limit=5`)
        ]);

        const prodData = prodRes.ok ? await prodRes.json() : { products: [] };
        const orderData = orderRes.ok ? await orderRes.json() : { orders: [] };

        const products: SearchItem[] = (prodData.products || []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          title: p.name as string,
          subtitle: `GH₵${(p.price as number)?.toLocaleString()} • Stock: ${p.stockQuantity ?? 'N/A'}`,
          type: 'product',
          url: `/dashboard/catalogue/products?search=${encodeURIComponent(p.name as string)}`,
          badge: p.isActive ? 'Active Product' : 'Draft',
          image: (p.images as string[])?.[0]
        }));

        const orders: SearchItem[] = (orderData.orders || []).map((o: Record<string, unknown>) => ({
          id: o.id as string,
          title: `Order #${(o.id as string).slice(-8).toUpperCase()}`,
          subtitle: `Customer: ${(o.customer as Record<string, string>)?.firstName || ''} ${(o.customer as Record<string, string>)?.lastName || ''} • GH₵${(o.totalPrice as number)?.toLocaleString()}`,
          type: 'order',
          url: `/dashboard/orders?id=${o.id}`,
          badge: o.status
        }));

        setResults([...products, ...orders]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation inside search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const totalItems = query.trim() ? results.length : QUICK_NAV_ITEMS.length;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeList = query.trim() ? results : QUICK_NAV_ITEMS;
        if (activeList[selectedIndex]) {
          router.push(activeList[selectedIndex].url);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, query, results, selectedIndex, onClose]);

  if (!isOpen) return null;

  const displayList = query.trim() ? results : QUICK_NAV_ITEMS;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Backdrop Click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10 space-y-0 animate-in zoom-in-95 duration-150">
        
        {/* INPUT BAR */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="h-5 w-5 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, orders, AI Studio, or page tools..."
            className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
          />

          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600 shrink-0" />
          ) : query ? (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}

          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400">
            Esc
          </kbd>
        </div>

        {/* RESULTS / QUICK SUGGESTIONS BODY */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1 scrollbar-hide">
          
          {!query.trim() && (
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Quick Navigation Suggestions</span>
              <span className="flex items-center gap-1 font-mono text-[9px] text-slate-300">
                <span>Use</span>
                <span className="text-slate-400">↑↓</span>
                <span>to navigate</span>
              </span>
            </div>
          )}

          {query.trim() && results.length === 0 && !loading && (
            <div className="p-8 text-center space-y-2">
              <Search className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No matching results found for &quot;{query}&quot;</p>
              <p className="text-[11px] text-slate-400">Try searching for a product name, order ID, or section name.</p>
            </div>
          )}

          {displayList.map((item, index) => {
            const isSelected = selectedIndex === index;
            return (
              <div
                key={item.id}
                onClick={() => {
                  router.push(item.url);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-indigo-50/80 border border-indigo-200/80 text-indigo-950 shadow-2xs' 
                    : 'hover:bg-slate-50 border border-transparent text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.image ? (
                    <div className="relative h-9 w-9 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className={`p-2 rounded-xl shrink-0 ${
                      item.type === 'product' ? 'bg-indigo-100 text-indigo-600' :
                      item.type === 'order' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {item.type === 'product' ? <Package className="h-4 w-4" /> :
                       item.type === 'order' ? <ShoppingBag className="h-4 w-4" /> :
                       <Sparkles className="h-4 w-4" />}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER BAR */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[9px] font-mono font-bold text-slate-500">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[9px] font-mono font-bold text-slate-500">↑↓</kbd>
              <span>to navigate</span>
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px]">
            <span>TrendiZip Search</span>
          </div>
        </div>

      </div>

    </div>
  );
};
