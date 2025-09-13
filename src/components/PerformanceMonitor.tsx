// src/components/PerformanceMonitor.tsx
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface PerformanceMonitorProps {
  enabled?: boolean;
}

export function PerformanceMonitor({ enabled = process.env.NODE_ENV === 'development' }: PerformanceMonitorProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    // Monitor query cache size
    const monitorCache = () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      
      console.log('🔍 React Query Cache Stats:', {
        totalQueries: queries.length,
        activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
        staleQueries: queries.filter(q => q.isStale()).length,
        cachedData: queries.filter(q => q.state.data).length,
      });
    };

    // Monitor every 30 seconds in development
    const interval = setInterval(monitorCache, 30000);

    // Monitor page load performance
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      console.log('📊 Page Load Performance:', {
        domContentLoaded: `${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`,
        loadComplete: `${navigation.loadEventEnd - navigation.loadEventStart}ms`,
        totalLoadTime: `${navigation.loadEventEnd - navigation.fetchStart}ms`,
      });
    }

    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, [enabled, queryClient]);

  // Monitor slow queries
  useEffect(() => {
    if (!enabled) return;

    const cache = queryClient.getQueryCache();
    
    const unsubscribe = cache.subscribe((event) => {
      if (event.type === 'updated' && event.query.state.status === 'success') {
        const queryTime = Date.now() - (event.query.state.dataUpdatedAt || 0);
        
        if (queryTime > 3000) { // Warn for queries taking longer than 3 seconds
          console.warn('🐌 Slow Query Detected:', {
            queryKey: event.query.queryKey,
            loadTime: `${queryTime}ms`,
            suggestion: 'Consider optimizing this query or adding better caching'
          });
        }
      }
    });

    return unsubscribe;
  }, [enabled, queryClient]);

  return null; // This component doesn't render anything
}

// Hook for manual performance tracking
export function usePerformanceTracker() {
  const startTime = Date.now();

  return {
    track: (operationName: string) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${operationName}: ${duration}ms`);
      }
      
      return duration;
    }
  };
}
