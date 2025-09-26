'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface RealTimeEvent {
  type: string;
  data: unknown;
  familyId: string;
  timestamp: string;
}

export interface RealTimeContextValue {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  events: RealTimeEvent[];
  connect: () => void;
  disconnect: () => void;
  clearEvents: () => void;
}

const RealTimeContext = createContext<RealTimeContextValue | null>(null);

interface RealTimeProviderProps {
  children: ReactNode;
  token?: string;
}

const MAX_EVENTS = 100; // Limit event history to prevent memory issues
const RECONNECT_DELAY = 5000; // 5 seconds
const HEARTBEAT_TIMEOUT = 30000; // 30 seconds

export function RealTimeProvider({ children, token }: RealTimeProviderProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Get token from localStorage if not provided
  const getToken = useCallback(() => {
    if (token) return token;
    try {
      const authData = localStorage.getItem('chorequest-auth');
      if (authData) {
        return JSON.parse(authData).token;
      }
    } catch (error) {
      console.error('Failed to get token from localStorage:', error);
    }
    return null;
  }, [token]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }

    if (mountedRef.current) {
      setConnectionStatus('disconnected');
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const authToken = getToken();
    if (!authToken) {
      setConnectionStatus('disconnected');
      return;
    }

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('connecting');

    try {
      const eventSource = new EventSource('/api/events', {
        withCredentials: false
      });

      eventSource.onopen = () => {
        if (mountedRef.current) {
          setConnectionStatus('connected');
          // Reset heartbeat timeout
          if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current);
          }
          heartbeatTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && eventSourceRef.current) {
              console.warn('SSE heartbeat timeout - reconnecting');
              disconnect();
              setTimeout(() => {
                if (mountedRef.current) connect();
              }, 1000);
            }
          }, HEARTBEAT_TIMEOUT);
        }
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;

        // Reset heartbeat timeout on any message
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current);
        }
        heartbeatTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && eventSourceRef.current) {
            console.warn('SSE heartbeat timeout - reconnecting');
            disconnect();
            setTimeout(() => {
              if (mountedRef.current) connect();
            }, 1000);
          }
        }, HEARTBEAT_TIMEOUT);

        try {
          const eventData: RealTimeEvent = JSON.parse(event.data);

          // Skip connection events - they're not application events
          if (eventData.type === 'connected') {
            return;
          }

          // Validate event structure
          if (eventData.type && eventData.familyId && eventData.timestamp) {
            setEvents(prev => {
              const newEvents = [...prev, eventData];
              // Keep only the latest MAX_EVENTS
              return newEvents.slice(-MAX_EVENTS);
            });
          }
        } catch (error) {
          console.error('Failed to parse SSE event:', error);
        }
      };

      eventSource.onerror = () => {
        if (mountedRef.current) {
          setConnectionStatus('error');

          // Clear heartbeat timeout
          if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current);
          }

          // Attempt to reconnect after delay
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, RECONNECT_DELAY);
        }
      };

      eventSourceRef.current = eventSource;

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setConnectionStatus('error');
    }
  }, [getToken, disconnect]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Connect on mount if token is available
  useEffect(() => {
    const authToken = getToken();
    if (authToken) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [getToken, connect, disconnect]);

  // Reconnect when token changes
  useEffect(() => {
    if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
      disconnect();
      setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, 100);
    }
  }, [token, connectionStatus, connect, disconnect]);

  const value: RealTimeContextValue = {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    events,
    connect,
    disconnect,
    clearEvents
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTime(): RealTimeContextValue {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
}