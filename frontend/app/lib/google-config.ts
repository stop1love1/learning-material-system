'use client';
import React from 'react';
import { settingsApi } from '@/app/lib/api';

// Google Client ID + Drive/Picker API Key at RUNTIME. Nguồn chính là Cài đặt (Settings →
// integration, sửa được trong khu quản trị, không cần build lại); nếu chưa cấu hình thì
// fallback về biến môi trường NEXT_PUBLIC_GOOGLE_* (nhúng lúc build). Cache ở mức module +
// pub/sub — giống Brand.tsx — để mọi picker dùng chung một request.
export interface GoogleConfig {
  clientId: string;
  apiKey: string;
}

const ENV: GoogleConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
};

let cache: GoogleConfig | null = null;
let inflight: Promise<void> | null = null;
const subs = new Set<() => void>();

function load(): Promise<void> {
  inflight = settingsApi
    .get()
    .then((s: any) => {
      const i = s?.integration || {};
      cache = {
        clientId: (i.googleClientId || '').trim() || ENV.clientId,
        apiKey: (i.googleApiKey || '').trim() || ENV.apiKey,
      };
    })
    .catch(() => {
      cache = cache || ENV; // API down / logged out → dùng env fallback
    })
    .finally(() => {
      inflight = null;
      subs.forEach((fn) => fn());
    });
  return inflight;
}

/** Re-fetch Google config (gọi sau khi admin lưu ở Cài đặt → Tích hợp). */
export function refreshGoogleConfig(): void {
  cache = null;
  void load();
}

export function useGoogleConfig(): GoogleConfig {
  const [, force] = React.useReducer((n) => n + 1, 0);
  React.useEffect(() => {
    subs.add(force);
    if (!cache && !inflight) void load();
    return () => {
      subs.delete(force);
    };
  }, []);
  return cache || ENV;
}
