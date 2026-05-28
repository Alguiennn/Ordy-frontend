import { useEffect, useMemo, useState, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  error: Error | null;
}

interface UseApiOptions {
  retries?: number;
  retryDelay?: number;
  cacheTime?: number;
  timeout?: number;
}

// Global cache for API data
const apiCache = new Map<string, CacheEntry<any>>();

// Track pending requests to avoid duplicates
const pendingRequests = new Map<string, Promise<any>>();

const DEFAULT_OPTIONS: UseApiOptions = {
  retries: 3,
  retryDelay: 500,
  cacheTime: 5 * 60 * 1000, // 5 minutes
  timeout: 30000, // 30 seconds
};

export function useApi<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  options: UseApiOptions = {}
) {
  const opts = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [options?.cacheTime, options?.retryDelay, options?.retries, options?.timeout]
  );
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const fetchWithRetry = useCallback(
    async (attemptNumber = 0): Promise<T> => {
      try {
        // Check cache first
        const cached = apiCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < opts.cacheTime!) {
          return cached.data;
        }

        // Check if request is already in flight
        if (pendingRequests.has(cacheKey)) {
          return pendingRequests.get(cacheKey)!;
        }

        // Execute fetch with timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Request timeout')),
            opts.timeout!
          )
        );

        const fetchPromise = Promise.race([
          fetchFnRef.current(),
          timeoutPromise,
        ]);

        pendingRequests.set(cacheKey, fetchPromise);

        const result = await fetchPromise;

        // Cache successful result
        apiCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          error: null,
        });

        pendingRequests.delete(cacheKey);
        return fetchPromise;
      } catch (err) {
        pendingRequests.delete(cacheKey);

        const error = err instanceof Error ? err : new Error(String(err));

        if (attemptNumber < opts.retries!) {
          await new Promise((resolve) =>
            setTimeout(resolve, opts.retryDelay! * Math.pow(2, attemptNumber))
          );
          return fetchWithRetry(attemptNumber + 1);
        }

        // Cache error for future reference
        apiCache.set(cacheKey, {
          data: null as any,
          timestamp: Date.now(),
          error,
        });

        throw error;
      }
    },
    [cacheKey, opts]
  );

  useEffect(() => {
    isMountedRef.current = true;
    let isCancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchWithRetry();

        if (isMountedRef.current && !isCancelled) {
          setData(result);
        }
      } catch (err) {
        if (isMountedRef.current && !isCancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMountedRef.current && !isCancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
      isMountedRef.current = false;
    };
  }, [fetchWithRetry]);

  const refetch = useCallback(async () => {
    // Clear cache to force fresh fetch
    apiCache.delete(cacheKey);
    
    try {
      setLoading(true);
      setError(null);
      const result = await fetchWithRetry();
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchWithRetry, cacheKey]);

  return { data, loading, error, refetch };
}

// Utility to clear cache
export function clearApiCache(cacheKey?: string) {
  if (cacheKey) {
    apiCache.delete(cacheKey);
  } else {
    apiCache.clear();
  }
}

// Utility to preload data
export async function preloadApi<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  options: UseApiOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < opts.cacheTime!) {
    return cached.data;
  }

  // Fetch and cache
  const data = await fetchFn();
  apiCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    error: null,
  });

  return data;
}
