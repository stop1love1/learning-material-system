'use client';
import { DB } from '@/app/store/store';
import { filesApi, foldersApi, getToken } from '@/app/lib/api';
import { formatRelativeVi } from '@/app/helpers/format-date';

function driveId(url: string): string | null {
  const m = (url || '').match(/\/d\/([A-Za-z0-9_-]{10,})/) || (url || '').match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  return m ? m[1] : null;
}
// lh3.googleusercontent.com — Drive thumbnail redirect target.
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
    // Real hierarchical tree for the sidebar (FolderTree consumes flat {id,name,parentId}).
    DB.DOC_FOLDER_TREE = folders.map((f: Record<string, any>) => ({
      id: String(f._id),
      name: f.name,
      parentId: f.parentId ? String(f.parentId?._id ?? f.parentId) : null,
    }));

    const filesRes: any = await filesApi.list({ pageSize: 200 });
    const files: any[] = filesRes?.records ?? [];
    DB.DOCS = files.map((f: Record<string, any>) => ({
      id: f._id,
      name: f.name,
      type: f.fileType,
      size: f.sizeLabel ?? '',
      // Real folder id (in ADDITION to the name-based `folder` below) so the tree
      // sidebar can filter by id. Null when the file is unfiled.
      folderId: f.folderId != null ? String(f.folderId?._id ?? f.folderId) : null,
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
      views: f.viewCount ?? 0,
      url: f.url ?? '',
      desc: f.description ?? '',
      thumb: f.thumbnailUrl || driveThumb(f.url),
    }));

    if (getToken()) {
      const mine: any[] = (await filesApi.myDownloads()) ?? [];
      DB.DOWNLOADS = mine.map((f: Record<string, any>) => f._id);
    } else {
      DB.DOWNLOADS = [];
    }
  } catch {
    // API off / error → clear so no stale data lingers (no fallback).
    DB.DOCS = [];
    DB.DOC_FOLDERS = ['Tất cả'];
    DB.DOC_FOLDER_TREE = [];
    DB.DOWNLOADS = [];
  }
}
