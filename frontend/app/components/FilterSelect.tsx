'use client';
import React from 'react';
import { Select } from 'antd';

/**
 * A small labelled dropdown for enum filters. Reimplemented on antd `Select`
 * (themed via AntdThemeBridge) while keeping the bespoke labelled-pill look: a
 * bordered wrapper with a mono label on the left and the antd Select (borderless,
 * height 40) on the right. `allowClear` clears to onChange('') — matching the old
 * "Tất cả" behaviour. `value === ''`/undefined shows the placeholder.
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
    <label className={`flex h-10 items-center gap-2 rounded-[10px] border border-lms-line bg-lms-surface pl-[13px] pr-1 ${className || ''}`}>
      {label && <span className="font-mono text-[10.5px] tracking-[0.5px] text-lms-faint">{label}</span>}
      <Select
        value={value ? value : undefined}
        onChange={(v) => onChange(v == null ? '' : String(v))}
        allowClear
        placeholder={placeholder}
        options={options as any}
        variant="borderless"
        style={{ minWidth: 130 }}
      />
    </label>
  );
}
