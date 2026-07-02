/**
 * Build a list-page href that pre-filters by a keyword via `?q=`.
 *
 * The public list screens (`SDocs` /kho-hoc-lieu, `STasks` /luyen-tap) use
 * `usePagedResource`, which seeds its keyword from `?q=` on mount and sends it
 * to the API as `keyword` (files → name/tags, exercises → title). So a
 * "liên quan" CTA that links here with `?q=<tag>` lands on a pre-filtered list
 * instead of the full result set.
 *
 * When no keyword is available we return the bare route — never `?q=undefined`.
 */
export function withKeyword(base: string, keyword?: string | null): string {
  const kw = (keyword ?? '').trim();
  return kw ? `${base}?q=${encodeURIComponent(kw)}` : base;
}
