'use client';
// Client-only wrapper for the CKEditor rich-text component (CKEditor touches
// window/document, so it must not run during SSR).
import dynamic from 'next/dynamic';

const RichEditor = dynamic(() => import('./RichText'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13, border: '1px solid rgba(0,0,0,.12)', borderRadius: 8 }}>
      Đang tải trình soạn thảo…
    </div>
  ),
});

export default RichEditor;
