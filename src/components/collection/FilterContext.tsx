'use client';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { filtersToSearch, type FilterKey, type Filters } from '@/lib/filters';

type Ctx = {
  filters: Filters;
  basePath: string;
  pending: boolean;
  navigate: (next: Partial<Filters>) => void;
  toggle: (key: FilterKey, value: string) => void;
  set: (key: FilterKey, values: string[]) => void;
  clearAll: () => void;
  hrefFor: (next: Partial<Filters>) => string;
};

const FilterCtx = createContext<Ctx | null>(null);

/** Client-side filter state backed by the URL — every change is a shareable, crawlable link. */
export function FilterProvider({ filters: serverFilters, basePath, children }: { filters: Filters; basePath: string; children: ReactNode }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  // optimistic copy so rapid successive clicks build on each other before the server responds
  const [filters, setFilters] = useState(serverFilters);
  const latest = useRef(serverFilters);
  useEffect(() => {
    latest.current = serverFilters;
    setFilters(serverFilters);
  }, [serverFilters]);

  const hrefFor = useCallback((next: Partial<Filters>) => `${basePath}${filtersToSearch({ ...filters, page: 1, ...next })}`, [filters, basePath]);

  const navigate = useCallback(
    (next: Partial<Filters>) => {
      const merged = { ...latest.current, page: 1, ...next } as Filters;
      latest.current = merged;
      setFilters(merged);
      const href = `${basePath}${filtersToSearch(merged)}`;
      start(() => router.push(href, { scroll: false }));
    },
    [basePath, router],
  );

  const toggle = useCallback(
    (key: FilterKey, value: string) => {
      const cur = latest.current[key];
      navigate({ [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] } as Partial<Filters>);
    },
    [navigate],
  );

  const set = useCallback((key: FilterKey, values: string[]) => navigate({ [key]: values } as Partial<Filters>), [navigate]);

  const clearAll = useCallback(
    () =>
      navigate({ q: '', price: [], metal: [], purity: [], shape: [], center: [], total: [], setting: [], style: [], collection: [] }),
    [navigate],
  );

  return <FilterCtx.Provider value={{ filters, basePath, pending, navigate, toggle, set, clearAll, hrefFor }}>{children}</FilterCtx.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterCtx);
  if (!ctx) throw new Error('useFilters must be used inside <FilterProvider>');
  return ctx;
}
