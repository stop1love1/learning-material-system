import React from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Input, Select as AntSelect, Segmented as AntSegmented, Button as AntButton } from 'antd';
import type { Palette } from '@/app/types';
import { hexA } from '@/app/theme/palette';
import { ICONS } from '@/app/theme/icons';

export function Icon({
  name,
  size = 18,
  stroke = 'currentColor',
  sw = 1.7,
  className,
  style,
}: {
  name: string;
  size?: number;
  stroke?: string;
  sw?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className || ''}`}
      style={style}
    >
      <path d={ICONS[name] || ICONS.overview} />
    </svg>
  );
}

export function Tag({
  children,
  color,
  p,
  soft = true,
  className,
  style,
}: {
  children?: ReactNode;
  color?: string;
  p?: Palette;
  soft?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const c = color || (p && p.accent) || '#888';
  return (
    <span
      className={`inline-flex items-center gap-[5px] rounded-md px-[9px] py-[3px] text-[11px] font-semibold tracking-[0.1px] ${className || ''}`}
      style={{
        color: c,
        background: soft ? hexA(c, p && p.dark ? 0.18 : 0.1) : 'transparent',
        border: soft ? 'none' : `1px solid ${hexA(c, 0.4)}`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Pill({
  children,
  p,
  active,
  onClick,
  icon,
}: {
  children?: ReactNode;
  p: Palette;
  active?: boolean;
  onClick?: () => void;
  icon?: string;
}) {
  return (
    <AntButton
      onClick={onClick}
      icon={icon ? <Icon name={icon} size={15} stroke={active ? p.accent : p.faint} /> : undefined}
      style={{
        height: 34,
        borderRadius: 10,
        paddingInline: 15,
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        whiteSpace: 'nowrap',
        ...(active
          ? { background: p.accentSoft, borderColor: p.accent, color: p.accent }
          : { color: p.sub }),
      }}
    >
      {children}
    </AntButton>
  );
}

export function Avatar({
  name,
  p,
  size = 38,
  color,
  accent,
}: {
  name?: string;
  p: Palette;
  size?: number;
  color?: string;
  accent?: boolean;
}) {
  const initials = (name || '?')
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const c = color || (accent ? p.accent : p.sub);
  return (
    <div
      className="flex shrink-0 items-center justify-center font-lms-heading font-bold tracking-[-0.3px]"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: hexA(c, p.dark ? 0.22 : 0.12),
        color: c,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}

type BtnVariant = 'primary' | 'accent' | 'dark' | 'ghost' | 'soft' | 'quiet' | 'danger';
const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: 'bg-lms-accent text-white border-0 shadow-[0_2px_0_var(--lms-glow)]',
  accent: 'bg-lms-accent text-white border-0 shadow-[0_2px_0_var(--lms-glow)]',
  dark: 'bg-lms-contrast text-lms-contrast-text border-0',
  ghost: 'bg-lms-surface text-lms-ink border border-lms-line',
  soft: 'bg-lms-accent-soft text-lms-accent border-0',
  quiet: 'bg-transparent text-lms-sub border-0',
  danger: 'bg-transparent text-lms-danger border border-[color:var(--lms-danger-border)]',
};
const BTN_SIZE: Record<string, string> = {
  sm: 'h-[34px] px-3.5 text-[12.5px]',
  md: 'h-10 px-[18px] text-[13.5px]',
  lg: 'h-[46px] px-[18px] text-[13.5px]',
};

export function Btn({
  children,
  p,
  variant = 'primary',
  icon,
  iconRight,
  onClick,
  size = 'md',
  type = 'button',
  className,
  style,
  full,
}: {
  children?: ReactNode;
  p: Palette;
  variant?: BtnVariant;
  icon?: string;
  iconRight?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: CSSProperties;
  full?: boolean;
}) {
  const sc =
    variant === 'primary' || variant === 'accent'
      ? '#fff'
      : variant === 'dark'
        ? p.contrastText
        : variant === 'soft'
          ? p.accent
          : variant === 'danger'
            ? p.danger
            : variant === 'ghost'
              ? p.ink
              : p.sub;
  return (
    <button
      type={type}
      onClick={onClick}
      className={`lms-btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[11px] font-sans font-semibold transition-all duration-150 ${BTN_SIZE[size]} ${BTN_VARIANT[variant]} ${full ? 'w-full' : ''} ${className || ''}`}
      style={style}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 16} stroke={sc} sw={1.9} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 15 : 16} stroke={sc} sw={1.9} />}
    </button>
  );
}

type IconBtnVariant = 'outline' | 'filled';
const ICON_BTN_VARIANT: Record<IconBtnVariant, { base: string; active: string }> = {
  outline: {
    base: 'border border-lms-line bg-lms-surface text-lms-sub',
    active: 'border border-lms-accent bg-lms-accent-soft text-lms-accent',
  },
  filled: {
    base: 'border-0 bg-lms-sink text-lms-sub',
    active: 'border-0 bg-lms-accent-soft text-lms-accent',
  },
};

export function IconBtn({
  name,
  p,
  onClick,
  active,
  badge,
  size = 38,
  title,
  variant = 'outline',
  className,
}: {
  name: string;
  p: Palette;
  onClick?: () => void;
  active?: boolean;
  badge?: number | null;
  size?: number;
  title?: string;
  variant?: IconBtnVariant;
  className?: string;
}) {
  const v = ICON_BTN_VARIANT[variant];
  return (
    <button
      onClick={onClick}
      title={title}
      className={`lms-btn lms-row relative flex cursor-pointer items-center justify-center rounded-lg ${
        active ? v.active : v.base
      } ${className || ''}`}
      style={{ width: size, height: size }}
    >
      <Icon name={name} size={17} stroke={active ? p.accent : p.sub} />
      {badge != null && (
        <span className="absolute top-[-5px] right-[-5px] flex h-4 min-w-4 items-center justify-center rounded-lg border-2 border-lms-bg bg-lms-accent px-1 font-mono text-[9.5px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

export function Field({
  p,
  value,
  onChange,
  placeholder,
  icon,
  name,
  className,
  style,
  type = 'text',
  mono,
}: {
  p: Palette;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  icon?: string;
  name?: string;
  className?: string;
  style?: CSSProperties;
  type?: string;
  mono?: boolean;
}) {
  const prefix = icon ? <Icon name={icon} size={16} stroke={p.faint} /> : undefined;
  const inputStyle: CSSProperties = mono ? { fontFamily: "var(--font-dmmono), monospace" } : {};
  const common = {
    name,
    value: value ?? '',
    placeholder,
    prefix,
    className,
    style,
    styles: { input: inputStyle },
  } as const;
  if (type === 'password') {
    return (
      <Input.Password
        {...common}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    );
  }
  return (
    <Input
      {...common}
      type={type}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  );
}

export function Select({
  p,
  value,
  onChange,
  options,
  className,
  style,
}: {
  p: Palette;
  value?: string | number;
  onChange?: (value: string) => void;
  options: Array<{ value?: string | number; label?: ReactNode } | string>;
  className?: string;
  style?: CSSProperties;
}) {
  const normalized = options.map((o) => {
    if (typeof o === 'object') return { value: o.value, label: o.label ?? String(o.value) };
    return { value: o, label: o };
  });
  return (
    <AntSelect
      value={value as any}
      onChange={(v) => onChange && onChange(String(v))}
      options={normalized as any}
      className={`w-full ${className || ''}`}
      style={style}
    />
  );
}

export function Progress({
  p,
  value,
  color,
  height = 7,
  track,
}: {
  p: Palette;
  value: number;
  color?: string;
  height?: number;
  track?: string;
}) {
  return (
    <div className="w-full overflow-hidden" style={{ height, borderRadius: height / 2, background: track || p.sink }}>
      <div
        className="h-full transition-[width] duration-400"
        style={{ width: `${Math.min(100, value)}%`, borderRadius: height / 2, background: color || p.accent }}
      />
    </div>
  );
}

export function Ring({
  value,
  size = 64,
  thickness = 7,
  color,
  track,
  p,
  label,
}: {
  value: number;
  size?: number;
  thickness?: number;
  color?: string;
  track?: string;
  p: Palette;
  label?: ReactNode;
}) {
  const r = (size - thickness) / 2,
    c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track || p.sink} strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color || p.accent}
          strokeWidth={thickness}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      {label && (
        <div
          className="absolute inset-0 flex items-center justify-center font-lms-heading font-bold tracking-[-0.5px] text-lms-ink"
          style={{ fontSize: size * 0.28 }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

export function Spark({
  data,
  w = 96,
  h = 30,
  stroke = '#888',
  fill,
  sw = 2,
}: {
  data: number[];
  w?: number;
  h?: number;
  stroke?: string;
  fill?: string;
  sw?: number;
}) {
  const max = Math.max(...data),
    min = Math.min(...data),
    rng = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / rng) * (h - 4) - 2]);
  const line = pts.map((pt, i) => `${i ? 'L' : 'M'}${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block overflow-visible">
      {fill && <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={fill} stroke="none" />}
      <path d={line} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Bars({
  data,
  w = 260,
  h = 120,
  color = '#888',
  track = '#eee',
  max,
  gap = 10,
  radius = 5,
  labelColor = '#9b9b9b',
}: {
  data: Array<{ label: string; value: number; color?: string }>;
  w?: number;
  h?: number;
  color?: string;
  track?: string;
  max?: number;
  gap?: number;
  radius?: number;
  labelColor?: string;
}) {
  const mx = max || Math.max(...data.map((d) => d.value)) || 1;
  const bw = (w - gap * (data.length - 1)) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: w }} className="block h-auto max-w-full">
      {data.map((d, i) => {
        const bh = (d.value / mx) * (h - 22);
        const x = i * (bw + gap);
        return (
          <g key={i}>
            <rect x={x} y={0} width={bw} height={h - 22} rx={radius} fill={track} />
            <rect x={x} y={h - 22 - bh} width={bw} height={bh} rx={radius} fill={d.color || color} />
            <text x={x + bw / 2} y={h - 6} fontSize="10.5" fill={labelColor} textAnchor="middle" className="font-mono">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function EmptyState({
  label,
  sub,
  p,
  icon = 'folder',
  action,
}: {
  label: ReactNode;
  sub?: ReactNode;
  p: Palette;
  icon?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-lms-sink">
        <Icon name={icon} size={26} stroke={p.faint} sw={1.5} />
      </div>
      <div className="text-sm font-semibold text-lms-sub">{label}</div>
      {sub && <div className="max-w-[300px] text-[12.5px] leading-normal text-lms-faint">{sub}</div>}
      {action}
    </div>
  );
}

export function Segmented({
  p,
  options,
  value,
  onChange,
}: {
  p: Palette;
  options: Array<{ value?: any; label?: ReactNode; icon?: string } | string>;
  value: any;
  onChange: (value: any) => void;
}) {
  // antd Segmented values are string|number; encode booleans for LMS callers.
  const enc = (v: any) => (typeof v === 'boolean' ? `b:${v}` : `v:${String(v)}`);
  const map = new Map<string, any>();
  const antOptions = options.map((o) => {
    const opt = o as { value?: any; label?: ReactNode; icon?: string };
    const v = typeof o === 'object' ? opt.value : o;
    const key = enc(v);
    map.set(key, v);
    const ic = typeof o === 'object' ? opt.icon : undefined;
    const lab = typeof o === 'object' ? (opt.label != null ? opt.label : opt.icon ? null : o) : o;
    const active = v === value;
    const node = (
      <span className="inline-flex items-center gap-1.5">
        {ic && <Icon name={ic} size={15} stroke={active ? p.accent : p.faint} />}
        {lab as ReactNode}
      </span>
    );
    return { value: key, label: node };
  });
  return (
    <AntSegmented
      options={antOptions as any}
      value={enc(value)}
      onChange={(key) => onChange(map.get(String(key)))}
    />
  );
}

export function Stat({
  p,
  label,
  value,
  unit,
  delta,
  up,
  spark,
}: {
  p: Palette;
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  delta?: ReactNode;
  up?: boolean;
  spark?: number[];
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2.5 text-[12.5px] font-medium text-lms-sub">{label}</div>
      <div className="flex items-baseline gap-[5px]">
        <span className="font-lms-heading text-[34px] leading-none font-bold tracking-[-1px] text-lms-ink">{value}</span>
        {unit && <span className="text-[13.5px] font-semibold text-lms-sub">{unit}</span>}
      </div>
      {(delta || spark) && (
        <div className="mt-3 flex items-center justify-between">
          {delta && (
            <span className={`font-mono text-[11.5px] ${up ? 'text-lms-ok' : 'text-lms-faint'}`}>
              {up ? '↑' : '↓'} {delta}
            </span>
          )}
          {spark && <Spark data={spark} w={64} h={24} stroke={p.accent} sw={2} />}
        </div>
      )}
    </div>
  );
}

export const fmt = (n: number | string): string =>
  typeof n === 'number' ? n.toLocaleString('vi-VN') : n;
