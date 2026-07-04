'use client';
import React from 'react';
import { Btn } from '@/app/components/ui';
import { useAiGemUrl } from '@/app/lib/ai-gem';
import { toastSuccess } from '@/app/lib/ui/dialogs';

// Nút deep-link mở Gemini Gem (trợ lý AI góp ý) ở tab mới. Chỉ hiện khi admin đã cấu
// hình link ở Cài đặt → Tích hợp. Nếu có `copyText` (VD bài làm của học sinh) thì copy
// vào clipboard trước khi mở để người dùng dán thẳng vào Gemini — Gem không nhận prompt
// prefill qua URL nên phải dán tay.
export function AskAiButton({
  p,
  copyText,
  label = 'Nhờ AI góp ý',
  className,
}: {
  p: any;
  copyText?: string;
  label?: string;
  className?: string;
}) {
  const url = useAiGemUrl();
  if (!url) return null;

  const onClick = async () => {
    const text = (copyText || '')
      .replace(/<[^>]+>/g, ' ') // bài làm có thể là HTML → lấy phần chữ
      .replace(/\s+/g, ' ')
      .trim();
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        toastSuccess('Đã copy bài làm — dán vào Gemini để nhờ AI góp ý.');
      } catch {
        // clipboard bị chặn (quyền / http) → vẫn mở Gem, người dùng tự dán
      }
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Btn p={p} variant="soft" size="sm" icon="bulb" iconRight="arrowUpRight" className={className} onClick={onClick}>
      {label}
    </Btn>
  );
}
