"use client";

import { useEffect, useRef, useCallback } from "react";

export type TelemetryEventType =
  | "IMPRESSION"
  | "DWELL"
  | "GALLERY_SWIPE"
  | "SIZE_GUIDE_OPENED"
  | "BESPOKE_TOGGLED"
  | "ADD_TO_CART"
  | "CHECKOUT_DROP"
  | "SEARCH_QUERY";

export interface TelemetryEventPayload {
  type: TelemetryEventType;
  productId?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

// Generate or retrieve persistent browser session ID
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = sessionStorage.getItem("tz_session_id");
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
    sessionStorage.setItem("tz_session_id", sessionId);
  }
  return sessionId;
}

export function useFashionTelemetry(productId?: string) {
  const queueRef = useRef<TelemetryEventPayload[]>([]);
  const dwellStartRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Send batch to server endpoint
  const flushQueue = useCallback(() => {
    if (queueRef.current.length === 0) return;
    const eventsToSend = [...queueRef.current];
    queueRef.current = [];

    const payload = JSON.stringify({
      sessionId: getSessionId(),
      events: eventsToSend,
    });

    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        const success = navigator.sendBeacon("/api/analytics/collect", blob);
        if (!success) {
          fetch("/api/analytics/collect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } else {
        fetch("/api/analytics/collect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Non-blocking telemetry
    }
  }, []);

  const pushEvent = useCallback((event: Omit<TelemetryEventPayload, "timestamp">) => {
    queueRef.current.push({
      ...event,
      timestamp: Date.now(),
    });

    if (queueRef.current.length >= 8) {
      flushQueue();
    }
  }, [flushQueue]);

  // Specific fashion micro-interaction trackers
  const trackImpression = useCallback((pId?: string, meta?: Record<string, unknown>) => {
    const target = pId || productId;
    if (!target) return;
    pushEvent({
      type: "IMPRESSION",
      productId: target,
      targetId: target,
      metadata: meta,
    });
  }, [productId, pushEvent]);

  const trackDwell = useCallback((pId?: string, seconds?: number) => {
    const target = pId || productId;
    if (!target) return;
    const dwellTime = seconds !== undefined ? seconds : Math.round((Date.now() - dwellStartRef.current) / 1000);
    if (dwellTime < 2) return; // ignore sub-2 second glances
    pushEvent({
      type: "DWELL",
      productId: target,
      targetId: target,
      metadata: { dwellSeconds: dwellTime },
    });
  }, [productId, pushEvent]);

  const trackSizeGuideOpened = useCallback((pId?: string) => {
    const target = pId || productId;
    if (!target) return;
    pushEvent({
      type: "SIZE_GUIDE_OPENED",
      productId: target,
      targetId: target,
      metadata: { action: "size_guide_opened" },
    });
  }, [productId, pushEvent]);

  const trackBespokeToggled = useCallback((isBespoke: boolean, pId?: string) => {
    const target = pId || productId;
    if (!target) return;
    pushEvent({
      type: "BESPOKE_TOGGLED",
      productId: target,
      targetId: target,
      metadata: { isBespoke },
    });
  }, [productId, pushEvent]);

  const trackGallerySwiped = useCallback((index: number, pId?: string) => {
    const target = pId || productId;
    if (!target) return;
    pushEvent({
      type: "GALLERY_SWIPE",
      productId: target,
      targetId: target,
      metadata: { imageIndex: index },
    });
  }, [productId, pushEvent]);

  const trackAddToCart = useCallback((price?: number, isBespoke?: boolean, pId?: string) => {
    const target = pId || productId;
    if (!target) return;
    pushEvent({
      type: "ADD_TO_CART",
      productId: target,
      targetId: target,
      metadata: { price, isBespoke },
    });
  }, [productId, pushEvent]);

  const trackCheckoutDrop = useCallback((step: "address" | "measurements" | "payment", cartTotal?: number) => {
    pushEvent({
      type: "CHECKOUT_DROP",
      metadata: { step, cartTotal },
    });
    flushQueue(); // flush immediately on critical drop-off
  }, [pushEvent, flushQueue]);

  // Periodic flush & unload listener
  useEffect(() => {
    dwellStartRef.current = Date.now();

    timerRef.current = setInterval(() => {
      flushQueue();
    }, 15000); // flush every 15 seconds

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        trackDwell();
        flushQueue();
      }
    };

    const handleBeforeUnload = () => {
      trackDwell();
      flushQueue();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      trackDwell();
      flushQueue();
    };
  }, [flushQueue, trackDwell]);

  return {
    trackImpression,
    trackDwell,
    trackSizeGuideOpened,
    trackBespokeToggled,
    trackGallerySwiped,
    trackAddToCart,
    trackCheckoutDrop,
    flushQueue,
  };
}
