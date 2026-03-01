'use client';

import { useEffect, useRef, useCallback } from 'react';
import { apiUrl } from '@/lib/api';

type SSEEventHandler = (data: unknown) => void;

interface UseSSEOptions {
  /** Map of event name to handler */
  events: Record<string, SSEEventHandler>;
  /** Whether SSE should be active */
  enabled?: boolean;
}

/**
 * Hook that connects to the SSE event stream and dispatches events to handlers.
 */
export function useSSE({ events, enabled = true }: UseSSEOptions) {
  const handlersRef = useRef(events);
  handlersRef.current = events;

  const connect = useCallback(() => {
    if (!enabled) return null;

    const source = new EventSource(apiUrl('/events/stream'));

    Object.keys(handlersRef.current).forEach((eventName) => {
      source.addEventListener(eventName, (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          handlersRef.current[eventName]?.(data);
        } catch {
          // Ignore parse errors
        }
      });
    });

    return source;
  }, [enabled]);

  useEffect(() => {
    const source = connect();
    if (!source) return;

    source.onerror = () => {
      source.close();
      // Reconnect after 5 seconds
      const timeout = setTimeout(() => {
        const newSource = connect();
        if (newSource) {
          // Store for cleanup - this is a simplified reconnect
          // In production, consider exponential backoff
        }
      }, 5000);
      return () => clearTimeout(timeout);
    };

    return () => {
      source.close();
    };
  }, [connect]);
}
