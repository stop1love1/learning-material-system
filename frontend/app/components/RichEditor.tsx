'use client';
// CKEditor touches window/document — must not run during SSR.
import dynamic from 'next/dynamic';

const RichEditor = dynamic(() => import('./RichText'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-black/12 text-[13px] text-neutral-400">
      Đang tải trình soạn thảo…
    </div>
  ),
});

export default RichEditor;
