import { useCallback, useEffect, useState } from 'react';

import { ApiError, getTransmission, isValidId } from '@/services/api';
import type { Transmission } from '@/types/transmission';

type Result = { key: string; item: Transmission | null; error: ApiError | null };

export function useTransmission(id: unknown) {
  const validId = isValidId(id) ? id : null;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const requestKey = validId ? `${validId}:${attempt}` : null;

  useEffect(() => {
    if (!validId || !requestKey) return;
    const controller = new AbortController();
    getTransmission(validId, controller.signal)
      .then((item) => setResult({ key: requestKey, item, error: null }))
      .catch((caught) => {
        if (controller.signal.aborted) return;
        const error =
          caught instanceof ApiError ? caught : new ApiError('network', 'Something went wrong');
        setResult({ key: requestKey, item: null, error });
      });
    return () => controller.abort();
  }, [validId, requestKey]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const current = result?.key === requestKey ? result : null;
  const error = current?.error ?? null;

  return {
    item: current?.item ?? null,
    loading: requestKey !== null && current === null,
    error,
    notFound: !validId || error?.status === 404,
    retry,
  };
}
