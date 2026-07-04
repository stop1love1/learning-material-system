'use client';
import React from 'react';
import { Icon } from '@/app/components/ui';
import { useAiGemUrl, openGemWindow } from '@/app/lib/ai-gem';

// Bong bóng "Nhờ AI góp ý" nổi cố định góc phải-dưới, hiện ở MỌI trang (kể cả khu quản trị).
// Bấm → mở Gemini Gem trong cửa sổ popup nhỏ canh góc phải. Chỉ hiện khi admin đã cấu hình
// link ở Cài đặt → Tích hợp. Icon sparkles = biểu tượng AI.
export function AiGemFab() {
  const url = useAiGemUrl();
  if (!url) return null;
  return (
    <button
      onClick={() => openGemWindow(url)}
      title="Nhờ AI góp ý"
      aria-label="Nhờ AI góp ý"
      className="lms-btn fixed bottom-[72px] right-4 z-40 inline-flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-full bg-lms-accent text-white shadow-[0_6px_20px_-6px_var(--lms-glow)] transition-[transform,box-shadow] duration-300 ease-out hover:scale-110 hover:shadow-[0_12px_30px_-6px_var(--lms-glow)] active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100"
    >
      <Icon name="sparkles" size={20} stroke="#fff" />
    </button>
  );
}
