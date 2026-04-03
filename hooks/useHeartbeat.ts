'use client';

import { useEffect } from 'react';

/**
 * useHeartbeat hook
 * Periodic ping to /api/user/heartbeat to maintain 'Online' status.
 */
export const useHeartbeat = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;
    
    const sendHeartbeat = () => {
      fetch('/api/user/heartbeat', { method: 'POST' }).catch(() => {
          // silently fail to avoid console noise or interrupting UX
      });
    };

    // Initial heartbeat
    sendHeartbeat();
    
    // Once a minute (most serverless functions have a 30-60s timeout, 
    // so this is a safe frequency for 'Near' realtime presence)
    const interval = setInterval(sendHeartbeat, 60000); 
    
    return () => clearInterval(interval);
  }, [enabled]);
};
