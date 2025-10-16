'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';

interface NetworkReadyContextType {
  isReady: boolean;
  waitForReady: () => Promise<void>;
}

const NetworkReadyContext = createContext<NetworkReadyContextType | undefined>(undefined);

/**
 * NetworkReadyProvider manages network stack initialization delays for mobile browsers.
 *
 * Android Chrome has a known issue where HTTP requests made immediately after page reload
 * will hang indefinitely, even though the network stack appears ready. This affects both
 * REST API calls and database queries through Supabase.
 *
 * This provider implements a centralized delay mechanism that:
 * 1. Detects mobile browsers (Android, iOS)
 * 2. Waits for initial page load to complete (document.readyState === 'complete')
 * 3. Adds a 2-second stabilization delay on mobile only
 * 4. Provides a promise-based API for contexts to wait before making network requests
 *
 * All contexts that make Supabase calls (HTTP or WebSocket) should use waitForReady()
 * before their first network operation.
 */
export function NetworkReadyProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const readyPromiseRef = useRef<Promise<void> | null>(null);
  const resolveReadyRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Create the ready promise immediately
    readyPromiseRef.current = new Promise<void>((resolve) => {
      resolveReadyRef.current = resolve;
    });

    // Detect if we're on a mobile browser
    const isMobile = typeof window !== 'undefined' &&
      /android|iphone|ipad|ipod/i.test(navigator.userAgent || navigator.vendor || '');

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] NetworkReady: Mobile=${isMobile}, ReadyState=${document.readyState}`);

    const initializeNetwork = async () => {
      // Wait for document to be fully loaded
      if (document.readyState !== 'complete') {
        console.log(`[${timestamp}] NetworkReady: Waiting for document.readyState=complete...`);
        await new Promise<void>((resolve) => {
          const handler = () => {
            if (document.readyState === 'complete') {
              document.removeEventListener('readystatechange', handler);
              resolve();
            }
          };
          document.addEventListener('readystatechange', handler);
          // Also check immediately in case we missed the event
          if (document.readyState === 'complete') {
            document.removeEventListener('readystatechange', handler);
            resolve();
          }
        });
      }

      // On mobile browsers, add additional delay to let network stack stabilize
      if (isMobile) {
        const delayStart = new Date().toISOString();
        console.log(`[${delayStart}] NetworkReady: Mobile browser detected, waiting 2s for network stack stabilization...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const delayEnd = new Date().toISOString();
        console.log(`[${delayEnd}] NetworkReady: Stabilization delay complete, network ready`);
      }

      // Mark network as ready
      setIsReady(true);
      if (resolveReadyRef.current) {
        resolveReadyRef.current();
      }
      console.log(`[${new Date().toISOString()}] NetworkReady: Network initialization complete`);
    };

    initializeNetwork();
  }, []);

  const waitForReady = async () => {
    if (isReady) {
      return;
    }
    if (readyPromiseRef.current) {
      await readyPromiseRef.current;
    }
  };

  return (
    <NetworkReadyContext.Provider value={{ isReady, waitForReady }}>
      {children}
    </NetworkReadyContext.Provider>
  );
}

export function useNetworkReady() {
  const context = useContext(NetworkReadyContext);
  if (context === undefined) {
    throw new Error('useNetworkReady must be used within a NetworkReadyProvider');
  }
  return context;
}
