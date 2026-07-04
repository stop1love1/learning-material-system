'use client';
import React from 'react';
import { Btn } from '@/app/components/ui';
import { useAiGemUrl, openGemWindow } from '@/app/lib/ai-gem';
import { toastSuccess } from '@/app/lib/ui/dialogs';

// Nút mở Gemini Gem (trợ lý AI góp ý) trong một cửa sổ popup nhỏ canh giữa màn hình.
// Chỉ hiện khi admin đã cấu hình link ở Cài đặt → Tích hợp. Nếu có `copyText` (VD bài làm)
// thì copy vào clipboard để người dùng dán thẳng vào Gemini — Gem không nhận prompt prefill
// qua URL nên phải dán tay. (Không nhúng iframe được: Gemini chặn framing qua X-Frame-Options.)
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
    openGemWindow(url); // mở popup góc phải-dưới NGAY (đồng bộ) để không bị chặn

    // Copy bài làm (nếu có) để dán thẳng vào Gemini.
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
  };

  return (
    <Btn p={p} variant="soft" size="sm" icon="sparkles" iconRight="arrowUpRight" className={className} onClick={onClick}>
      {label}
    </Btn>
  );
}
