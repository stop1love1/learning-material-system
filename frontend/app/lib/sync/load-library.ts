'use client';
// Live-data loader: fills DB.DOCS, DB.DOC_FOLDERS, DB.DOWNLOADS from the backend library endpoints.
import { DB } from '@/app/data/db';
import { filesApi, foldersApi, getToken } from '@/app/lib/api';

export async function loadLibrary(): Promise<void> {
  try {
    const filesRes: any = await filesApi.list({ pageSize: 200 });
    const files: any[] = filesRes?.records ?? [];
    DB.DOCS = files.map((f: Record<string, any>) => ({
      id: f._id,
      name: f.name,
      type: f.fileType,
      size: f.sizeLabel ?? '',
      // Backend file has no `category`; fall back to the first tag (the list
      // endpoint filters "category" against `tags`) then `subject`, else default.
      folder: f.category ?? (Array.isArray(f.tags) ? f.tags[0] : undefined) ?? f.subject ?? 'Tư liệu',
      updated: f.updatedAt ?? '',
      by: '—',
      downloads: f.downloadCount ?? 0,
      url: f.url ?? '',
    }));

    const foldersRes: any = await foldersApi.list();
    const folders: any[] = Array.isArray(foldersRes) ? foldersRes : (foldersRes?.records ?? []);
    DB.DOC_FOLDERS = ['Tất cả', ...folders.map((x: Record<string, any>) => x.name)];

    if (getToken()) {
      const mine: any[] = (await filesApi.myDownloads()) ?? [];
      DB.DOWNLOADS = mine.map((f: Record<string, any>) => f._id);
    } else {
      DB.DOWNLOADS = [];
    }
  } catch {
    return;
  }
}
