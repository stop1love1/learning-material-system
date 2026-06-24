'use client';
import React from 'react';
import { Icon } from '@/app/components/ui';
import { useServerOnline } from '@/app/lib/api/connection';

export function ServerStatusBanner() {
  const online = useServerOnline();
  if (online) return null;
  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-0 z-100 flex items-center justify-center gap-2.5 border-t border-[#d98a7a] bg-[#b35338] px-4 py-2.5 text-white shadow-[0_-2px_12px_rgba(0,0,0,0.18)]"
    >
      <Icon name="notify" size={16} stroke="#fff" />
      <span className="text-[13px] font-semibold">
        Mất kết nối đến máy chủ — đang hiển thị dữ liệu trống. Vui lòng kiểm tra kết nối.
      </span>
    </div>
  );
}
