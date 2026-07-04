'use client';
import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type PagedEnvelope<R = any> = {
  records?: R[];
  total?: number;
  pages?: number;
  pageSize?: number;
  current?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
};

type Params = Record<string, any>;

export type UsePagedResourceArgs<T, R = any> = {
  /** (params) => Promise<envelope>, e.g. (p) => filesApi.list(p). */
  fetcher: (params: Params) => Promise<PagedEnvelope<R>>;
  /** Map one API record into the screen's shape. */
  mapper: (record: R) => T;
  /** Page size (default 12). */
  pageSize?: number;
  /** Extra query params merged into every request (folderId, type, …). */
  initialFilters?: Params;
  /** Debounce (ms) for keyword typing. */
  debounceMs?: number;
};

export type UsePagedResource<T> = {
  records: T[];
  total: number;
  pages: number;
  current: number;
  pageSize: number;
  loading: boolean;
  error: boolean;
  keyword: string;
  setKeyword: (v: string) => void;
  filters: Params;
  setFilter: (key: string, value: any) => void;
  setPage: (n: number) => void;
  reload: () => void;
};

/**
 * Server-side paginated list hook. Drops stale responses via a sequence guard;
 * on error clears records and sets `error` (never throws).
 */
export function usePagedResource<T, R = any>({
  fetcher,
  mapper,
  pageSize = 20,
  initialFilters = {},
  debounceMs = 300,
}: UsePagedResourceArgs<T, R>): UsePagedResource<T> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [records, setRecords] = React.useState<T[]>([]);
  const [total, setTotal] = React.useState(0);
  const [pages, setPages] = React.useState(1);
  // Initialise page + keyword from the URL so a reload restores them.
  const [current, setCurrent] = React.useState(() => {
    const pg = parseInt(searchParams?.get('page') || '1', 10);
    return pg > 0 ? pg : 1;
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const [keyword, setKeywordState] = React.useState(() => searchParams?.get('q') || '');
  const [debouncedKw, setDebouncedKw] = React.useState(() => searchParams?.get('q') || '');
  // Init filters from the URL (f_<key>=…) merged over initialFilters so a reload restores them.
  const [filters, setFilters] = React.useState<Params>(() => {
    const out: Params = { ...initialFilters };
    if (searchParams) {
      searchParams.forEach((v, k) => {
        if (k.startsWith('f_') && v !== '' && v !== 'all') out[k.slice(2)] = v;
      });
    }
    return out;
  });
  const filterKey = JSON.stringify(filters);
  const [reloadTick, setReloadTick] = React.useState(0);

  // Persist page + debounced keyword to the URL (?page=, ?q=) so reload/back
  // restores them. Reads live window.location so it merges with any other params
  // a screen may own (e.g. ?activeTab=).
  const syncUrl = React.useCallback(
    (page: number, q: string, flt: Params) => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      if (page <= 1) params.delete('page');
      else params.set('page', String(page));
      const kw = (q || '').trim();
      if (!kw) params.delete('q');
      else params.set('q', kw);
      // Filters go in as f_<key>= so a reload/back restores them; the f_ prefix keeps them
      // from clashing with screen-owned params (e.g. ?activeTab). Clear stale f_ first.
      for (const key of Array.from(params.keys())) {
        if (key.startsWith('f_')) params.delete(key);
      }
      for (const [k, v] of Object.entries(flt)) {
        if (v == null || v === '' || v === 'all') continue;
        params.set(`f_${k}`, String(v));
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );
  React.useEffect(() => {
    syncUrl(current, debouncedKw, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, debouncedKw, filterKey]);

  const fetcherRef = React.useRef(fetcher);
  const mapperRef = React.useRef(mapper);
  fetcherRef.current = fetcher;
  mapperRef.current = mapper;

  React.useEffect(() => {
    const id = setTimeout(() => setDebouncedKw(keyword), debounceMs);
    return () => clearTimeout(id);
  }, [keyword, debounceMs]);

  const setKeyword = React.useCallback((v: string) => {
    setKeywordState(v);
    setCurrent(1);
  }, []);

  const setFilter = React.useCallback((key: string, value: any) => {
    setFilters((f) => {
      const next = { ...f };
      if (value == null || value === '' || value === 'all') delete next[key];
      else next[key] = value;
      return next;
    });
    setCurrent(1);
  }, []);

  const setPage = React.useCallback((n: number) => setCurrent(Math.max(1, n)), []);
  const reload = React.useCallback(() => setReloadTick((n) => n + 1), []);

  const seqRef = React.useRef(0);
  React.useEffect(() => {
    const seq = ++seqRef.current;
    let alive = true;
    setLoading(true);
    const params: Params = { ...filters, page: current, pageSize };
    const kw = debouncedKw.trim();
    if (kw) params.keyword = kw;
    (async () => {
      try {
        const res = await fetcherRef.current(params);
        if (!alive || seq !== seqRef.current) return;
        const recs = res?.records ?? [];
        setRecords(recs.map((r) => mapperRef.current(r)));
        setTotal(res?.total ?? 0);
        setPages(res?.pages ?? 1);
        setError(false);
      } catch {
        if (!alive || seq !== seqRef.current) return;
        setRecords([]);
        setTotal(0);
        setPages(1);
        setError(true);
      } finally {
        if (alive && seq === seqRef.current) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, pageSize, debouncedKw, filterKey, reloadTick]);

  return {
    records,
    total,
    pages,
    current,
    pageSize,
    loading,
    error,
    keyword,
    setKeyword,
    filters,
    setFilter,
    setPage,
    reload,
  };
}
