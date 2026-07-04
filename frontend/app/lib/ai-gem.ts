'use client';
import React from 'react';
import { settingsApi } from '@/app/lib/api';

// Link tới Gemini Gem (trợ lý AI góp ý bài viết) đọc ở RUNTIME từ Cài đặt
// (settings.integration.aiGemUrl, admin sửa được, không cần build lại). Trống → không có
// Gem nào cấu hình → nút "Nhờ AI góp ý" tự ẩn. Cache mức module + pub/sub — giống
// google-config.ts — để mọi nút dùng chung một request.
let cache: string | null = null;
let loaded = false;
let inflight: Promise<void> | null = null;
const subs = new Set<() => void>();

function load(): Promise<void> {
  inflight = settingsApi
    .get()
    .then((s: any) => {
      cache = ((s?.integration?.aiGemUrl as string) || '').trim() || null;
    })
    .catch(() => {
      // API down / logged out → giữ cache cũ (hoặc null)
    })
    .finally(() => {
      loaded = true;
      inflight = null;
      subs.forEach((fn) => fn());
    });
  return inflight;
}

/** Nạp lại link Gem (gọi sau khi admin lưu ở Cài đặt → Tích hợp). */
export function refreshAiGemUrl(): void {
  cache = null;
  loaded = false;
  void load();
}

export function useAiGemUrl(): string | null {
  const [, force] = React.useReducer((n) => n + 1, 0);
  React.useEffect(() => {
    subs.add(force);
    if (!loaded && !inflight) void load();
    return () => {
      subs.delete(force);
    };
  }, []);
  return cache;
}

/**
 * Mở link Gem trong cửa sổ popup nhỏ, canh GÓC PHẢI-DƯỚI màn hình. Phải gọi ĐỒNG BỘ ngay
 * trong cú click (trước mọi await) để giữ "user activation" → tránh bị chặn popup. Không
 * nhúng iframe được vì Gemini chặn framing (X-Frame-Options).
 */
export function openGemWindow(url: string): void {
  if (!url || typeof window === 'undefined') return;
  const w = 460;
  const h = 680;
  // Canh đúng MÀN HÌNH đang mở trình duyệt: phải cộng offset availLeft/availTop, nếu không
  // với màn hình đôi popup sẽ nhảy sang màn hình bên trái.
  const scr = window.screen as any;
  const availLeft = typeof scr.availLeft === 'number' ? scr.availLeft : 0;
  const availTop = typeof scr.availTop === 'number' ? scr.availTop : 0;
  const availW = scr.availWidth || scr.width;
  const availH = scr.availHeight || scr.height;
  const left = Math.round(availLeft + availW - w - 24);
  const top = Math.round(availTop + availH - h - 24);
  const win = window.open(url, 'gemini-gem', `popup=1,width=${w},height=${h},left=${left},top=${top}`);
  if (win) {
    win.opener = null; // chống reverse-tabnabbing (không dùng noopener để giữ được popup)
    try { win.focus(); } catch {}
  } else {
    window.open(url, '_blank', 'noopener,noreferrer'); // popup bị chặn → fallback mở tab
  }
}
