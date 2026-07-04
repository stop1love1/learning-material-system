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
