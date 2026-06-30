'use client';
import React from 'react';
import { Icon } from '@/app/components/ui';

/**
 * A small labelled dropdown for enum filters, styled inline to match the existing
 * Field/Select primitives. Always prepends an "Tất cả" option (value '') that
 * clears the filter. `value === ''`/undefined selects "Tất cả".
 */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Tất cả',
  p,
  className,
}: {
  label?: string;
  value?: string;
  options: { value: string; label: React.ReactNode }[];
  onChange: (value: string) => void;
  placeholder?: string;
  p?: any;
  className?: string;
}) {
  return (
    <label className={`flex h-10 items-center gap-2 rounded-[10px] border border-lms-line bg-lms-surface pl-[13px] pr-2 ${className || ''}`}>
      {label && <span className="font-mono text-[10.5px] tracking-[0.5px] text-lms-faint">{label}</span>}
      <div className="relative flex items-center">
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 cursor-pointer appearance-none border-0 bg-transparent pr-6 font-sans text-[13px] font-medium text-lms-ink outline-none"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label as any}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" size={14} stroke={p?.faint} className="pointer-events-none absolute right-1" />
      </div>
    </label>
  );
}
