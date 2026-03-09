'use client';
import { useMemo } from 'react';

/**
 * Firebase сілтемелері мен сұраныстарын (Query) есте сақтауға (memoization) арналған хук.
 * Бұл useCollection және useDoc хугтарында шексіз рендерингтің алдын алу үшін қажет.
 */
export function useMemoFirebase<T>(factory: () => T, dependencies: any[]): T {
  return useMemo(() => {
    const result = factory();
    if (result && typeof result === 'object') {
      (result as any).__memo = true;
    }
    return result;
  }, dependencies);
}
