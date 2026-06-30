'use client';
import React from 'react';
import { Pagination as AntPagination } from 'antd';

/**
 * Page bar reimplemented on antd `Pagination` (themed via AntdThemeBridge). The
 * paged hook owns `pageSize` and computes `pages`; antd derives the page count
 * from `total`/`pageSize`, so we pass `total` + `pageSize` + `current` and map
 * `onChange(page)`. The size changer is disabled (the hook owns pageSize).
 * Hidden when there are no results. Shows the "tổng X kết quả" total label.
 */
export function Pagination({
  current,
  pages,
  total,
  pageSize,
  onChange,
  p,
}: {
  current: number;
  pages: number;
  total: number;
  pageSize?: number;
  onChange: (page: number) => void;
  p?: any;
}) {
  if (!total) return null;

  return (
    <div className="mt-6 flex justify-end">
      <AntPagination
        current={current}
        pageSize={pageSize || 12}
        total={total}
        onChange={(page) => onChange(page)}
        showSizeChanger={false}
        showTotal={(t) => `tổng ${t.toLocaleString('vi-VN')} kết quả`}
      />
    </div>
  );
}
