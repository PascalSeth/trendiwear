'use client'
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowUpRight, 
  Layers, 
  Heart, 
  Shirt,
  Pause,
  Play
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

// --- Types ---
interface OutfitInspirationItem {
  id: string;
  title: string;
  description: string | null;
  outfitImageUrl: string;
  totalPrice: number | null;
  tags: string[];
  likes: number;
  views: number;
  createdAt: string;
}

interface TrendEvent {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  seasonality: string[];
  dressCodes: string[];
  searchKeywords?: string[];
  outfitInspirations?: OutfitInspirationItem[];
  _count: {
    outfitInspirations: number;
  };
}

export default function FashionInspo() {
  const [events, setEvents] = useState<TrendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalEvent, setModalEvent] = useState<TrendEvent | null>(null);
  const [isPausedByUser, setIsPausedByUser] = useState(false);

  // Drag & Touch interaction state
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);

  const row1Interacting = useRef(false);
  const row2Interacting = useRef(false);
  const isPausedByUserRef = useRef(false);

  const row1ResumeTimer = useRef<NodeJS.Timeout | null>(null);
  const row2ResumeTimer = useRef<NodeJS.Timeout | null>(null);

  // Gesture tracking to distinguish click/tap from drag/swipe
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const hasSwiped = useRef(false);

  // Mouse drag tracking for desktop
  const isMouseDown = useRef(false);
  const mouseStartX = useRef(0);
  const mouseStartScroll = useRef(0);
  const activeMouseRow = useRef<1 | 2 | null>(null);

  useEffect(() => {
    isPausedByUserRef.current = isPausedByUser;
  }, [isPausedByUser]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          const eventsArray: TrendEvent[] = Array.isArray(data) ? data : [];
          setEvents(eventsArray);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Split events into two rows with minimum items for smooth continuous wrap
  const { row1Events, row2Events } = useMemo(() => {
    if (events.length === 0) return { row1Events: [], row2Events: [] };
    const r1: TrendEvent[] = [];
    const r2: TrendEvent[] = [];
    events.forEach((ev, idx) => {
      if (idx % 2 === 0) {
        r1.push(ev);
      } else {
        r2.push(ev);
      }
    });

    const ensureLength = (arr: TrendEvent[]) => {
      if (arr.length === 0) return [];
      let result = [...arr];
      while (result.length < 8) {
        result = [...result, ...arr];
      }
      return result;
    };

    return {
      row1Events: ensureLength(r1),
      row2Events: ensureLength(r2),
    };
  }, [events]);

  // Set initial scroll offset for Row 2 so it can scroll backwards seamlessly
  useEffect(() => {
    if (row2Ref.current && row2Events.length > 0) {
      const oneThird = row2Ref.current.scrollWidth / 3;
      row2Ref.current.scrollLeft = oneThird;
    }
  }, [row2Events]);

  // Wrap-around boundary helper
  const checkWrap = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const oneThird = el.scrollWidth / 3;
    if (oneThird <= 0) return;

    if (el.scrollLeft >= oneThird * 2) {
      el.scrollLeft -= oneThird;
    } else if (el.scrollLeft <= 0) {
      el.scrollLeft += oneThird;
    }
  }, []);

  // Smooth 60fps RequestAnimationFrame Continuous Auto-Scroll
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    const speed = 0.55; // pixels per frame at 60fps

    const loop = (now: number) => {
      const delta = Math.min((now - lastTime) / 16.67, 2.5);
      lastTime = now;

      if (!isPausedByUserRef.current) {
        // Row 1: moves forward (scrollLeft increases)
        if (row1Ref.current && !row1Interacting.current) {
          const el = row1Ref.current;
          el.scrollLeft += speed * delta;
          checkWrap(el);
        }

        // Row 2: moves backward (scrollLeft decreases)
        if (row2Ref.current && !row2Interacting.current) {
          const el = row2Ref.current;
          el.scrollLeft -= speed * delta;
          checkWrap(el);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [checkWrap]);

  // Handle Touch Start (Mobile Drag)
  const handleTouchStart = (rowNum: 1 | 2, e: React.TouchEvent) => {
    if (rowNum === 1) {
      if (row1ResumeTimer.current) clearTimeout(row1ResumeTimer.current);
      row1Interacting.current = true;
    } else {
      if (row2ResumeTimer.current) clearTimeout(row2ResumeTimer.current);
      row2Interacting.current = true;
    }

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    hasSwiped.current = false;
  };

  // Handle Touch Move (Detect horizontal swipe)
  const handleTouchMove = (rowNum: 1 | 2, e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);

    if (dx > 7 || dy > 7) {
      hasSwiped.current = true;
    }

    const el = rowNum === 1 ? row1Ref.current : row2Ref.current;
    if (el) checkWrap(el);
  };

  // Handle Touch End (User finishes drag, keep paused for 2.5s to view new position)
  const handleTouchEnd = (rowNum: 1 | 2) => {
    if (rowNum === 1) {
      if (row1ResumeTimer.current) clearTimeout(row1ResumeTimer.current);
      row1ResumeTimer.current = setTimeout(() => {
        row1Interacting.current = false;
      }, 2500);
    } else {
      if (row2ResumeTimer.current) clearTimeout(row2ResumeTimer.current);
      row2ResumeTimer.current = setTimeout(() => {
        row2Interacting.current = false;
      }, 2500);
    }
  };

  // Mouse Drag Support (Desktop click-and-drag)
  const handleMouseDown = (rowNum: 1 | 2, e: React.MouseEvent) => {
    isMouseDown.current = true;
    activeMouseRow.current = rowNum;
    mouseStartX.current = e.clientX;
    hasSwiped.current = false;

    const el = rowNum === 1 ? row1Ref.current : row2Ref.current;
    if (el) {
      mouseStartScroll.current = el.scrollLeft;
    }

    if (rowNum === 1) {
      if (row1ResumeTimer.current) clearTimeout(row1ResumeTimer.current);
      row1Interacting.current = true;
    } else {
      if (row2ResumeTimer.current) clearTimeout(row2ResumeTimer.current);
      row2Interacting.current = true;
    }
  };

  const handleMouseMove = (rowNum: 1 | 2, e: React.MouseEvent) => {
    if (!isMouseDown.current || activeMouseRow.current !== rowNum) return;
    const diff = e.clientX - mouseStartX.current;
    if (Math.abs(diff) > 5) {
      hasSwiped.current = true;
    }

    const el = rowNum === 1 ? row1Ref.current : row2Ref.current;
    if (el) {
      el.scrollLeft = mouseStartScroll.current - diff;
      checkWrap(el);
    }
  };

  const handleMouseUp = () => {
    isMouseDown.current = false;
    activeMouseRow.current = null;
    handleTouchEnd(1);
    handleTouchEnd(2);
  };

  // Fallback image resolver
  const getEventImage = (event: TrendEvent) => {
    if (event.imageUrl) return event.imageUrl;
    if (event.outfitInspirations && event.outfitInspirations.length > 0 && event.outfitInspirations[0].outfitImageUrl) {
      return event.outfitInspirations[0].outfitImageUrl;
    }
    return null;
  };

  // Render a clean, professional editorial card
  const renderCard = (event: TrendEvent, key: string) => {
    const img = getEventImage(event);
    const looksCount = event._count?.outfitInspirations || 0;
    const seasonLabel = event.seasonality?.[0]?.replace('_', ' ') || 'All Season';
    const primaryDressCode = event.dressCodes?.[0];

    return (
      <div
        key={key}
        onClick={(e) => {
          if (hasSwiped.current) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          setModalEvent(event);
        }}
        className="group relative shrink-0 w-[240px] sm:w-[270px] h-[140px] sm:h-[155px] rounded-xl overflow-hidden bg-white border border-stone-200 shadow-xs hover:border-stone-400 hover:shadow-md transition-all duration-200 cursor-pointer select-none flex"
      >
        {/* Left: Photography */}
        <div className="relative w-[44%] h-full shrink-0 overflow-hidden bg-stone-100 pointer-events-none">
          {img ? (
            <Image
              src={img}
              alt={event.name}
              fill
              unoptimized
              sizes="(max-width: 640px) 120px, 140px"
              className="object-cover object-[50%_25%] transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-stone-100 flex flex-col items-center justify-center p-2 text-center">
              <Shirt className="w-6 h-6 text-stone-400 mb-1" />
              <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider truncate max-w-[90%]">
                {event.name}
              </span>
            </div>
          )}

          {/* Look Count Badge on Photo */}
          <div className="absolute bottom-2 left-2 z-10">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-stone-950/80 text-white backdrop-blur-xs flex items-center gap-1">
              <Layers size={9} className="text-stone-300 shrink-0" />
              <span>{looksCount}</span>
            </span>
          </div>
        </div>

        {/* Right: Details */}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0 bg-white pointer-events-none">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 truncate">
                {seasonLabel}
              </span>
              {primaryDressCode && (
                <span className="text-[9px] text-stone-500 truncate max-w-[55%]">
                  {primaryDressCode}
                </span>
              )}
            </div>

            <h3 className="font-serif text-sm sm:text-base font-medium text-stone-900 group-hover:text-stone-600 transition-colors leading-snug truncate">
              {event.name}
            </h3>

            {event.description && (
              <p className="text-[11px] text-stone-500 font-light line-clamp-1 leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          {/* Card Footer */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-500">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
              Explore
            </span>
            <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-stone-700" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <section 
      className="bg-[#FAFAF9] text-stone-900 py-10 sm:py-14 border-t border-stone-200/80"
      onMouseUp={handleMouseUp}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8">
        
        {/* Editorial Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-stone-400 block mb-1">
              Inspirations
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-stone-900 tracking-tight">
              Trending Styles
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-lg font-light">
              Popular style guides and custom fashion tips from skilled tailors.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-end">
            <button
              onClick={() => setIsPausedByUser(!isPausedByUser)}
              aria-label={isPausedByUser ? "Resume moving cards" : "Pause moving cards"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:border-stone-400 transition-colors"
            >
              {isPausedByUser ? <Play size={11} className="fill-current" /> : <Pause size={11} />}
              <span>{isPausedByUser ? "Resume" : "Pause"}</span>
            </button>

            <Link
              href="/fashion-trends"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider text-stone-900 border border-stone-900 hover:bg-stone-900 hover:text-white transition-colors"
            >
              <span>View All</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

      </div>

      {/* 2-Row Marquee Tracks */}
      {loading ? (
        <div className="space-y-3 px-4 max-w-7xl mx-auto">
          <div className="flex gap-3 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-[240px] sm:w-[270px] h-[140px] sm:h-[155px] rounded-xl bg-stone-200/60 shrink-0 animate-pulse" />
            ))}
          </div>
          <div className="flex gap-3 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-[240px] sm:w-[270px] h-[140px] sm:h-[155px] rounded-xl bg-stone-200/60 shrink-0 animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 overflow-hidden w-full relative">
          
          {/* Edge fades */}
          <div className="absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-[#FAFAF9] to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-[#FAFAF9] to-transparent z-20 pointer-events-none" />

          {/* Row 1 */}
          <div
            ref={row1Ref}
            onScroll={() => checkWrap(row1Ref.current)}
            onTouchStart={(e) => handleTouchStart(1, e)}
            onTouchMove={(e) => handleTouchMove(1, e)}
            onTouchEnd={() => handleTouchEnd(1)}
            onMouseDown={(e) => handleMouseDown(1, e)}
            onMouseMove={(e) => handleMouseMove(1, e)}
            onMouseEnter={() => {
              row1Interacting.current = true;
            }}
            onMouseLeave={() => {
              if (!isMouseDown.current) {
                row1Interacting.current = false;
              }
            }}
            className="flex gap-3 sm:gap-4 overflow-x-auto select-none w-full cursor-grab active:cursor-grabbing no-scrollbar"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {row1Events.map((event, i) => renderCard(event, `r1-a-${event.id}-${i}`))}
            {row1Events.map((event, i) => renderCard(event, `r1-b-${event.id}-${i}`))}
            {row1Events.map((event, i) => renderCard(event, `r1-c-${event.id}-${i}`))}
          </div>

          {/* Row 2 */}
          <div
            ref={row2Ref}
            onScroll={() => checkWrap(row2Ref.current)}
            onTouchStart={(e) => handleTouchStart(2, e)}
            onTouchMove={(e) => handleTouchMove(2, e)}
            onTouchEnd={() => handleTouchEnd(2)}
            onMouseDown={(e) => handleMouseDown(2, e)}
            onMouseMove={(e) => handleMouseMove(2, e)}
            onMouseEnter={() => {
              row2Interacting.current = true;
            }}
            onMouseLeave={() => {
              if (!isMouseDown.current) {
                row2Interacting.current = false;
              }
            }}
            className="flex gap-3 sm:gap-4 overflow-x-auto select-none w-full cursor-grab active:cursor-grabbing no-scrollbar"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {row2Events.map((event, i) => renderCard(event, `r2-a-${event.id}-${i}`))}
            {row2Events.map((event, i) => renderCard(event, `r2-b-${event.id}-${i}`))}
            {row2Events.map((event, i) => renderCard(event, `r2-c-${event.id}-${i}`))}
          </div>

        </div>
      )}

      {/* Lookbook Dialog */}
      <Dialog open={!!modalEvent} onOpenChange={(open) => !open && setModalEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-stone-900 border border-stone-200 p-6 sm:p-8 rounded-2xl shadow-xl w-[94vw] sm:w-full">
          {modalEvent && (
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-stone-200 pb-4 gap-4">
                <div className="min-w-0 pr-8">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block mb-1">
                    Occasion Guide
                  </span>
                  <DialogTitle className="text-xl sm:text-2xl font-serif text-stone-900 font-medium truncate">
                    {modalEvent.name}
                  </DialogTitle>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1 font-light leading-relaxed">
                    {modalEvent.description || "Discover popular custom outfits made for this occasion."}
                  </p>
                </div>

                <Link
                  href={`/fashion-trends/${modalEvent.id}`}
                  className="px-3.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider bg-stone-900 text-white hover:bg-stone-800 font-medium shrink-0 flex items-center gap-1 shadow-xs mr-6 sm:mr-8"
                >
                  <span>Full View</span>
                  <ArrowUpRight size={12} />
                </Link>
              </div>

              {/* Outfits Grid */}
              {modalEvent.outfitInspirations && modalEvent.outfitInspirations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {modalEvent.outfitInspirations.map((outfit) => (
                    <div 
                      key={outfit.id}
                      className="group relative rounded-xl overflow-hidden border border-stone-200 bg-white flex flex-col justify-between"
                    >
                      <div className="relative aspect-[4/5] w-full bg-stone-100">
                        <Image
                          src={outfit.outfitImageUrl}
                          alt={outfit.title}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-mono bg-white/90 text-stone-900 backdrop-blur-xs flex items-center gap-1 shadow-xs">
                          <Heart size={10} className="text-rose-600 fill-rose-600" />
                          <span>{outfit.likes}</span>
                        </div>
                      </div>

                      <div className="p-3 space-y-1">
                        <h5 className="font-serif text-sm font-medium text-stone-900 line-clamp-1">
                          {outfit.title}
                        </h5>
                        {outfit.description && (
                          <p className="text-[11px] text-stone-500 line-clamp-2 font-light">
                            {outfit.description}
                          </p>
                        )}
                        {outfit.tags && outfit.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {outfit.tags.slice(0, 2).map((tag, tIdx) => (
                              <span key={tIdx} className="text-[9px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center border border-dashed border-stone-200 rounded-xl p-4">
                  <Shirt className="h-8 w-8 text-stone-400 mx-auto mb-2" />
                  <p className="text-stone-700 font-serif text-sm font-medium">No published looks yet</p>
                  <p className="text-stone-400 text-xs mt-0.5">Explore tailoring services to create custom garments for this occasion.</p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs font-mono text-stone-500">
                <span className="truncate max-w-[60%]">{modalEvent.dressCodes?.slice(0, 2).join(' • ') || 'All Occasions'}</span>
                <Link
                  href={`/fashion-trends/${modalEvent.id}`}
                  className="text-stone-900 hover:text-stone-600 underline uppercase tracking-wider shrink-0"
                >
                  Event Details ↗
                </Link>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

    </section>
  );
}