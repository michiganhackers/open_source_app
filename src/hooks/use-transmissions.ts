import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, listTransmissions } from '@/services/api';
import type { HistoryFilter, Transmission } from '@/types/transmission';

type LoadMode = 'initial' | 'refresh' | 'more';

export function useTransmissions(filter: HistoryFilter) {
  const [items, setItems] = useState<Transmission[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (mode: LoadMode, targetPage: number) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'more') setLoadingMore(true);

      try {
        const result = await listTransmissions({ filter, page: targetPage, signal: controller.signal });
        setItems((previous) => {
          if (mode !== 'more') return result.items;
          const known = new Set(previous.map((item) => item.id));
          return [...previous, ...result.items.filter((item) => !known.has(item.id))];
        });
        setPage(targetPage);
        setHasMore(result.hasMore);
        setError(null);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof ApiError ? caught : new ApiError('network', 'Something went wrong'));
      } finally {
        if (controllerRef.current === controller) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [filter],
  );

  // Full loading state on first focus or a filter change; quiet refresh when returning to the tab.
  const loadedFilter = useRef<HistoryFilter | null>(null);
  useFocusEffect(
    useCallback(() => {
      load(loadedFilter.current === filter ? 'refresh' : 'initial', 1);
      loadedFilter.current = filter;
    }, [filter, load]),
  );

  useEffect(() => () => controllerRef.current?.abort(), []);

  const refresh = useCallback(() => load('refresh', 1), [load]);
  const retry = useCallback(() => load('initial', 1), [load]);
  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading && !refreshing) load('more', page + 1);
  }, [hasMore, load, loading, loadingMore, page, refreshing]);

  return { items, loading, refreshing, loadingMore, error, hasMore, refresh, retry, loadMore };
}
