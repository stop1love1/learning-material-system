// primitives.tsx — the LMS design-system primitives, ported from theme.jsx.
// Inline-styled, palette-driven components: Icon, Tag, Pill, Avatar, Btn,
// IconBtn, Field, Select, Progress, Ring, Spark, Bars, EmptyState, Segmented,
// Stat, plus the `fmt` number formatter.
import React from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Palette } from '@/app/types';
import { hexA } from '@/app/theme/palette';
import { FONTS } from '@/app/theme/fonts';
import { ICONS } from '@/app/theme/icons';

// ── Icon (24×24 stroke) ──────────────────────────────────────────────────────
export function Icon({
  name,
  size = 18,
  stroke = 'currentColor',
  sw = 1.7,
  style,
}: {
  name: string;
  size?: number;
  stroke?: string;
  sw?: number;
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
      style={{ flexShrink: 0, ...style }}
    >
      <path d={ICONS[name] || ICONS.overview} />
    </svg>
  );
}

// ── Tag ──────────────────────────────────────────────────────────────────────
export function Tag({
  children,
  color,
  p,
  soft = true,
  style,
}: {
  children?: ReactNode;
  color?: string;
  p?: Palette;
  soft?: boolean;
  style?: CSSProperties;
}) {
  const c = color || (p && p.accent) || '#888';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: FONTS.sans,
        fontSize: 11,
        letterSpacing: 0.1,
        fontWeight: 600,
        padding: '3px 9px',
        borderRadius: 6,
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

// ── Pill ─────────────────────────────────────────────────────────────────────
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
    <button
      onClick={onClick}
      className="lms-btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        height: 34,
        padding: '0 15px',
        borderRadius: 10,
        cursor: 'pointer',
        fontFamily: FONTS.sans,
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        whiteSpace: 'nowrap',
        border: `1px solid ${active ? p.accent : p.line}`,
        background: active ? p.accentSoft : p.surface,
        color: active ? p.accent : p.sub,
      }}
    >
      {icon && <Icon name={icon} size={15} stroke={active ? p.accent : p.faint} />}
      {children}
    </button>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
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
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        flexShrink: 0,
        background: hexA(c, p.dark ? 0.22 : 0.12),
        color: c,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONTS.display,
        fontWeight: 700,
        fontSize: size * 0.38,
        letterSpacing: -0.3,
      }}
    >
      {initials}
    </div>
  );
}

// ── Btn ──────────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'accent' | 'dark' | 'ghost' | 'soft' | 'quiet' | 'danger';
export function Btn({
  children,
  p,
  variant = 'primary',
  icon,
  iconRight,
  onClick,
  size = 'md',
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
  style?: CSSProperties;
  full?: boolean;
}) {
  const h = size === 'sm' ? 34 : size === 'lg' ? 46 : 40;
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: h,
    padding: size === 'sm' ? '0 14px' : '0 18px',
    borderRadius: 11,
    cursor: 'pointer',
    fontFamily: FONTS.sans,
    fontSize: size === 'sm' ? 12.5 : 13.5,
    fontWeight: 600,
    width: full ? '100%' : undefined,
    whiteSpace: 'nowrap',
    transition: 'all .15s',
    ...style,
  };
  const variants: Record<BtnVariant, CSSProperties> = {
    primary: { background: p.accent, color: '#fff', border: 'none', boxShadow: `0 2px 0 ${p.glow}` },
    accent: { background: p.accent, color: '#fff', border: 'none', boxShadow: `0 2px 0 ${p.glow}` },
    dark: { background: p.ink, color: p.surface, border: 'none' },
    ghost: { background: p.surface, color: p.ink, border: `1px solid ${p.line}` },
    soft: { background: p.accentSoft, color: p.accent, border: 'none' },
    quiet: { background: 'transparent', color: p.sub, border: 'none' },
    danger: { background: 'transparent', color: p.danger, border: `1px solid ${hexA(p.danger, 0.35)}` },
  };
  const sc =
    variant === 'primary' || variant === 'accent'
      ? '#fff'
      : variant === 'dark'
        ? p.surface
        : (variants[variant].color as string);
  return (
    <button onClick={onClick} className="lms-btn" style={{ ...base, ...variants[variant] }}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 16} stroke={sc} sw={1.9} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 15 : 16} stroke={sc} sw={1.9} />}
    </button>
  );
}

// ── IconBtn ──────────────────────────────────────────────────────────────────
export function IconBtn({
  name,
  p,
  onClick,
  active,
  badge,
  size = 38,
  title,
}: {
  name: string;
  p: Palette;
  onClick?: () => void;
  active?: boolean;
  badge?: number | null;
  size?: number;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="lms-btn"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 8,
        cursor: 'pointer',
        border: `1px solid ${active ? p.accent : p.line}`,
        background: active ? p.accentSoft : p.surface,
        color: active ? p.accent : p.sub,
      }}
    >
      <Icon name={name} size={17} stroke={active ? p.accent : p.sub} />
      {badge != null && (
        <span
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            borderRadius: 8,
            background: p.accent,
            color: '#fff',
            fontSize: 9.5,
            fontWeight: 700,
            fontFamily: FONTS.mono,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${p.bg}`,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ── Field ────────────────────────────────────────────────────────────────────
export function Field({
  p,
  value,
  onChange,
  placeholder,
  icon,
  style,
  type = 'text',
  mono,
}: {
  p: Palette;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  icon?: string;
  style?: CSSProperties;
  type?: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        height: 40,
        padding: '0 13px',
        borderRadius: 10,
        border: `1px solid ${p.line}`,
        background: p.surface,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={16} stroke={p.faint} />}
      <input
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: p.ink,
          fontFamily: mono ? FONTS.mono : FONTS.sans,
          fontSize: 13.5,
        }}
      />
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────────────────────
export function Select({
  p,
  value,
  onChange,
  options,
  style,
}: {
  p: Palette;
  value?: string | number;
  onChange?: (value: string) => void;
  options: Array<{ value?: string | number; label?: ReactNode } | string>;
  style?: CSSProperties;
}) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <select
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        style={{
          appearance: 'none',
          height: 40,
          padding: '0 36px 0 13px',
          borderRadius: 8,
          border: `1px solid ${p.line}`,
          background: p.surface,
          color: p.ink,
          fontFamily: FONTS.sans,
          fontSize: 13.5,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        {options.map((o, i) => {
          const opt = o as { value?: string | number; label?: ReactNode };
          return (
            <option key={i} value={(typeof o === 'object' ? opt.value : o) as string | number}>
              {(typeof o === 'object' ? opt.label : o) as ReactNode}
            </option>
          );
        })}
      </select>
      <Icon
        name="chevronDown"
        size={15}
        stroke={p.faint}
        style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none' }}
      />
    </div>
  );
}

// ── Progress ─────────────────────────────────────────────────────────────────
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
    <div
      style={{
        height,
        borderRadius: height / 2,
        background: track || p.sink,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <div
        style={{
          width: `${Math.min(100, value)}%`,
          height: '100%',
          borderRadius: height / 2,
          background: color || p.accent,
          transition: 'width .4s',
        }}
      />
    </div>
  );
}

// ── Ring ─────────────────────────────────────────────────────────────────────
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
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
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
          style={{ transition: 'stroke-dashoffset .5s' }}
        />
      </svg>
      {label && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.display,
            fontSize: size * 0.28,
            fontWeight: 700,
            color: p.ink,
            letterSpacing: -0.5,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

// ── Spark ────────────────────────────────────────────────────────────────────
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
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
      {fill && <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={fill} stroke="none" />}
      <path d={line} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Bars ─────────────────────────────────────────────────────────────────────
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
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {data.map((d, i) => {
        const bh = (d.value / mx) * (h - 22);
        const x = i * (bw + gap);
        return (
          <g key={i}>
            <rect x={x} y={0} width={bw} height={h - 22} rx={radius} fill={track} />
            <rect x={x} y={h - 22 - bh} width={bw} height={bh} rx={radius} fill={d.color || color} />
            <text
              x={x + bw / 2}
              y={h - 6}
              fontSize="10.5"
              fill={labelColor}
              textAnchor="middle"
              fontFamily={FONTS.mono}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── EmptyState ───────────────────────────────────────────────────────────────
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '48px 0',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: p.sink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={26} stroke={p.faint} sw={1.5} />
      </div>
      <div style={{ color: p.sub, fontSize: 14, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ color: p.faint, fontSize: 12.5, maxWidth: 300, lineHeight: 1.5 }}>{sub}</div>}
      {action}
    </div>
  );
}

// ── Segmented ────────────────────────────────────────────────────────────────
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
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 3,
        padding: 3,
        borderRadius: 10,
        background: p.sink,
        border: `1px solid ${p.line}`,
      }}
    >
      {options.map((o) => {
        const opt = o as { value?: any; label?: ReactNode; icon?: string };
        const v = typeof o === 'object' ? opt.value : o;
        const lab = typeof o === 'object' ? (opt.label != null ? opt.label : opt.icon ? null : o) : o;
        const ic = typeof o === 'object' ? opt.icon : undefined;
        const on = v === value;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 30,
              padding: ic && !lab ? '0 9px' : '0 13px',
              borderRadius: 7,
              border: 'none',
              cursor: 'pointer',
              fontFamily: FONTS.sans,
              fontSize: 12.5,
              fontWeight: on ? 600 : 500,
              background: on ? p.surface : 'transparent',
              color: on ? p.ink : p.sub,
              boxShadow: on ? `0 1px 2px ${hexA('#0f1726', 0.12)}` : 'none',
            }}
          >
            {ic && <Icon name={ic} size={15} stroke={on ? p.accent : p.faint} />}
            {lab as ReactNode}
          </button>
        );
      })}
    </div>
  );
}

// ── Stat ─────────────────────────────────────────────────────────────────────
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
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12.5, color: p.sub, marginBottom: 10, fontWeight: 500 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span
          style={{
            fontFamily: FONTS.display,
            fontSize: 34,
            fontWeight: 700,
            color: p.ink,
            lineHeight: 1,
            letterSpacing: -1,
          }}
        >
          {value}
        </span>
        {unit && <span style={{ fontSize: 13.5, color: p.sub, fontWeight: 600 }}>{unit}</span>}
      </div>
      {(delta || spark) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          {delta && (
            <span style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: up ? p.ok : p.faint }}>
              {up ? '↑' : '↓'} {delta}
            </span>
          )}
          {spark && <Spark data={spark} w={64} h={24} stroke={p.accent} sw={2} />}
        </div>
      )}
    </div>
  );
}

// ── fmt ──────────────────────────────────────────────────────────────────────
export const fmt = (n: number | string): string =>
  typeof n === 'number' ? n.toLocaleString('vi-VN') : n;
