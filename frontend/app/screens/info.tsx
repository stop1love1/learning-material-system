'use client';
import React from 'react';
import { settingsApi } from '@/app/lib/api';
import { cardClass } from '@/app/helpers/shared';

// Static footer pages (Giới thiệu / Hướng dẫn / Liên hệ / Điều khoản). Content is
// admin-editable from Cài đặt → Trang nội dung and stored in settings.pages.<key>.
type PageKey = 'about' | 'guide' | 'contact' | 'terms';
const FALLBACK: Record<PageKey, string> = {
  about: 'Giới thiệu',
  guide: 'Hướng dẫn sử dụng',
  contact: 'Liên hệ',
  terms: 'Điều khoản',
};

export function InfoPage({ ctx }: any) {
  const key: PageKey = (ctx?.page as PageKey) || 'about';
  const [page, setPage] = React.useState<{ title?: string; content?: string } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    settingsApi
      .get()
      .then((s: any) => { if (alive) setPage(s?.pages?.[key] ?? null); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [key]);

  const title = page?.title || FALLBACK[key];
  const content = page?.content || '';

  return (
    <div className="mx-auto max-w-[860px] px-[30px] pt-8 pb-16 max-sm:px-4">
      <h1 className="m-0 font-lms-heading text-[clamp(26px,4vw,34px)] font-extrabold tracking-[-0.6px] text-lms-ink">{title}</h1>
      <div className={`${cardClass(30)} mt-6`}>
        {loading ? (
          <div className="py-10 text-center text-[13px] text-lms-faint">Đang tải…</div>
        ) : content ? (
          <div className="lms-rich text-[15.5px] leading-[1.9] text-lms-ink" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p className="m-0 text-[15px] text-lms-sub">Nội dung đang được cập nhật.</p>
        )}
      </div>
    </div>
  );
}
