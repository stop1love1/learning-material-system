'use client';
// Format backend ISO timestamps into Vietnamese-friendly strings.
// Loaders feed these into DB date fields that the design-ported screens print
// verbatim, so formatting must happen at the loader boundary (screens untouched).
// Empty/invalid input is returned as '' / unchanged so already-formatted mock
// values (e.g. '2 ngày trước') pass through safely.

export function formatDateVi(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso); // not an ISO date → leave as-is
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

export function formatRelativeVi(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  if (days < 7) return days + ' ngày trước';
  if (days < 30) return Math.floor(days / 7) + ' tuần trước';
  return formatDateVi(iso);
}
