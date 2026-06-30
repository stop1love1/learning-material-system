'use client';
import React from 'react';

// Standard paginated list envelope returned by the backend list endpoints.
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
 * Generic server-side paginated list hook. Fetches on mount and whenever the
 * page, debounced keyword, or any filter changes; changing keyword/filters resets
 * the page to 1. Best-effort: on error it clears records and flags `error` (the
 * connection banner + empty state cover the UI) — it never throws. Out-of-order
 * responses are dropped via a per-request sequence guard.
 */
export function usePagedResource<T, R = any>({
  fetcher,
  mapper,
  pageSize = 12,
  initialFilters = {},
  debounceMs = 300,
}: UsePagedResourceArgs<T, R>): UsePagedResource<T> {
  const [records, setRecords] = React.useState<T[]>([]);
  const [total, setTotal] = React.useState(0);
  const [pages, setPages] = React.useState(1);
  const [current, setCurrent] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const [keyword, setKeywordState] = React.useState('');
  const [debouncedKw, setDebouncedKw] = React.useState('');
  const [filters, setFilters] = React.useState<Params>(initialFilters);
  const [reloadTick, setReloadTick] = React.useState(0);

  // Keep the latest fetcher/mapper without re-triggering the fetch effect.
  const fetcherRef = React.useRef(fetcher);
  const mapperRef = React.useRef(mapper);
  fetcherRef.current = fetcher;
  mapperRef.current = mapper;

  // Debounce keyword → typing does not fire a request per keystroke.
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

  // Serialise filters so the effect dep is stable by value, not reference.
  const filterKey = JSON.stringify(filters);

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
        if (!alive || seq !== seqRef.current) return; // stale response — ignore
        const recs = res?.records ?? [];
        setRecords(recs.map((r) => mapperRef.current(r)));
        setTotal(res?.total ?? 0);
        setPages(res?.pages ?? 1);
        // `current` is client-authoritative (driven by setPage); don't echo the
        // server's value back into state — that would fire a redundant fetch if a
        // backend ever clamped an out-of-range page.
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
