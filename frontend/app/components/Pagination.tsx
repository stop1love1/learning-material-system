'use client';
import React from 'react';
import { Icon } from '@/app/components/ui';

/**
 * Numbered page bar matching the inline-style design system. Prev/Next buttons
 * (disabled at the ends), a sliding window of numbered pages with the current one
 * highlighted (accent-soft), and a "tổng X kết quả" total label. Hides the page
 * controls when there is a single page, still showing the total when present.
 */
export function Pagination({
  current,
  pages,
  total,
  pageSize,
  onChange,
  p,
}: {
  current: number;
  pages: number;
  total: number;
  pageSize?: number;
  onChange: (page: number) => void;
  p?: any;
}) {
  if ((!pages || pages <= 1) && !total) return null;

  // Sliding window of up to 5 numbered pages centred on the current page.
  const window = 5;
  let start = Math.max(1, current - Math.floor(window / 2));
  let end = Math.min(pages, start + window - 1);
  start = Math.max(1, Math.min(start, end - window + 1));
  const nums: number[] = [];
  for (let i = start; i <= end; i++) nums.push(i);

  const btnBase =
    'lms-btn flex h-9 min-w-9 items-center justify-center rounded-[10px] px-2.5 font-sans text-[13px] font-medium';

  const navBtn = (label: React.ReactNode, to: number, disabled: boolean, key: string) => (
    <button
      key={key}
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(to)}
      className={`${btnBase} border border-lms-line bg-lms-surface text-lms-sub ${
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <span className="font-mono text-[11.5px] text-lms-faint">tổng {total.toLocaleString('vi-VN')} kết quả</span>
      {pages > 1 && (
        <div className="flex items-center gap-1.5">
          {navBtn(<Icon name="arrowLeft" size={15} stroke={p?.sub} />, current - 1, current <= 1, 'prev')}
          {start > 1 && (
            <>
              {navBtn(1, 1, false, 'first')}
              {start > 2 && <span className="px-1 font-mono text-[12px] text-lms-faint">…</span>}
            </>
          )}
          {nums.map((n) => {
            const on = n === current;
            return (
              <button
                key={n}
                type="button"
                aria-current={on ? 'page' : undefined}
                onClick={() => onChange(n)}
                className={`${btnBase} cursor-pointer ${
                  on
                    ? 'border border-lms-accent bg-lms-accent-soft font-semibold text-lms-accent'
                    : 'border border-lms-line bg-lms-surface text-lms-sub'
                }`}
              >
                {n}
              </button>
            );
          })}
          {end < pages && (
            <>
              {end < pages - 1 && <span className="px-1 font-mono text-[12px] text-lms-faint">…</span>}
              {navBtn(pages, pages, false, 'last')}
            </>
          )}
          {navBtn(<Icon name="arrowRight" size={15} stroke={p?.sub} />, current + 1, current >= pages, 'next')}
        </div>
      )}
    </div>
  );
}
