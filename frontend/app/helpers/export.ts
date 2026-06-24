'use client';
// Tiện ích xuất dữ liệu phía client: CSV (mở được bằng Excel) + JSON (sao lưu).

function csvCell(v: any): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function triggerDownload(filename: string, content: string, mime: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Xuất mảng object ra CSV (kèm BOM để Excel đọc đúng tiếng Việt). */
export function downloadCsv(filename: string, columns: { key: string; label: string }[], rows: any[]): void {
  const header = columns.map((c) => csvCell(c.label)).join(',');
  const body = (rows || []).map((r) => columns.map((c) => csvCell(r?.[c.key])).join(',')).join('\n');
  triggerDownload(filename, '﻿' + header + '\n' + body, 'text/csv;charset=utf-8');
}

/** Xuất một object/JSON (dùng cho sao lưu dữ liệu). */
export function downloadJson(filename: string, data: any): void {
  triggerDownload(filename, JSON.stringify(data, null, 2), 'application/json');
}
