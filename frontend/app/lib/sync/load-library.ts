'use client';
// Live-data loader: fills DB.DOCS, DB.DOC_FOLDERS, DB.DOWNLOADS from the backend library endpoints.
import { DB } from '@/app/data/db';
import { filesApi, foldersApi, getToken } from '@/app/lib/api';
import { formatRelativeVi } from '@/app/helpers/format-date';

// Extract a Google Drive file id from a /file/d/<id>/view or ?id=<id> URL.
function driveId(url: string): string | null {
  const m = (url || '').match(/\/d\/([A-Za-z0-9_-]{10,})/) || (url || '').match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  return m ? m[1] : null;
}
// Drive thumbnail (PDF first page / image / video poster). lh3 is where Drive redirects.
function driveThumb(url: string, size = 480): string | null {
  const id = driveId(url);
  return id ? `https://lh3.googleusercontent.com/d/${id}=w${size}` : null;
}

export async function loadLibrary(): Promise<void> {
  try {
    // Fetch folders FIRST so files can be grouped by their real folder name
    // (file.folderId → folder.name), matching the sidebar/chip labels that the
    // screens group by (d.folder === <folderName>).
    const foldersRes: any = await foldersApi.list();
    const folders: any[] = Array.isArray(foldersRes) ? foldersRes : (foldersRes?.records ?? []);
    const folderMap: Record<string, string> = {};
    folders.forEach((x: Record<string, any>) => { folderMap[String(x._id)] = x.name; });
    DB.DOC_FOLDERS = ['Tất cả', ...folders.map((x: Record<string, any>) => x.name)];

    const filesRes: any = await filesApi.list({ pageSize: 200 });
    const files: any[] = filesRes?.records ?? [];
    DB.DOCS = files.map((f: Record<string, any>) => ({
      id: f._id,
      name: f.name,
      type: f.fileType,
      size: f.sizeLabel ?? '',
      // Prefer the real folder name resolved from folderId; fall back to the
      // backend-populated folderName, then tag/subject, else default. This keeps
      // file grouping in sync with the real DB.DOC_FOLDERS names.
      folder:
        (f.folderId != null ? folderMap[String(f.folderId?._id ?? f.folderId)] : undefined) ??
        f.folderName ??
        (Array.isArray(f.tags) ? f.tags[0] : undefined) ??
        f.subject ??
        'Tư liệu',
      updated: formatRelativeVi(f.updatedAt),
      // userId is a raw ObjectId today; if the backend populates it to { name },
      // we read the name. Falls back to '—' otherwise.
      by: (f.userId && typeof f.userId === 'object' ? f.userId.name : undefined) ?? '—',
      downloads: f.downloadCount ?? 0,
      url: f.url ?? '',
      desc: f.description ?? '', // HTML description (per-file), rendered in the reader.
      thumb: f.thumbnailUrl || driveThumb(f.url), // Drive thumbnail (falls back to icon on error).
    }));

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
